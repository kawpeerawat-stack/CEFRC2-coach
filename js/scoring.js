// กฎการให้คะแนนที่ "บังคับด้วยโค้ด" — ใช้กับผลจากทุก provider (ไม่พึ่ง prompt อย่างเดียว)
import { SCALE } from './data/rubrics.js';

export const DISCLAIMER = 'คะแนนจาก AI เป็นการประเมินเพื่อพัฒนา (formative) ไม่ใช่ใบรับรองทางการ';
export const C2_TOTAL = 85;
export const C2_MIN = 4;

export const bandOf = (score) => SCALE.find((x) => x.score === score)?.band ?? '—';
const sum = (arr, f) => arr.reduce((a, x) => a + f(x), 0);
const norm = (t) => String(t || '').toLowerCase().replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim();
const str = (v) => (typeof v === 'string' ? v : '');

/**
 * แปลงผลดิบจาก provider ให้เป็นผลสุดท้ายตามกฎ:
 * 1) ทุกคะแนนต้องมีหลักฐานที่ "พบจริง" ในข้อความ ไม่มี = ประเมินไม่ได้
 * 2) เกณฑ์ที่ไม่เกี่ยวกับงาน (N/A) ถูกตัดออกและกระจายน้ำหนักใหม่
 * 3) ระดับรวมสูงกว่าเกณฑ์ย่อยต่ำสุดได้ไม่เกิน 1 ขั้น
 * 4) จุดอ่อนแสดงเฉพาะที่มีหลักฐาน ไม่บังคับจำนวน
 */
export function finalizeResult(raw, rubric, { task, text, provider, model = '', targetPhrases = [], hasAcoustic = false }) {
  const hay = norm(text);
  const quoteOk = (q) => { const n = norm(q); return n.length >= 3 && hay.includes(n); };
  const rawById = new Map((Array.isArray(raw?.criteria) ? raw.criteria : []).map((c) => [c.id, c]));

  const criteria = rubric.criteria.map((def) => {
    const base = { id: def.id, label: def.th, en: def.en, weight: def.weight, score: null, evidence: [], comment: '' };
    if (def.requires === 'sources' && !(task.sources?.length)) return { ...base, status: 'na', reason: 'งานนี้ไม่มีแหล่งข้อมูลให้สังเคราะห์' };
    if (def.requires === 'interaction' && task.mode !== 'interaction') return { ...base, status: 'na', reason: 'งานนี้เป็นการพูดเดี่ยว ไม่มีการโต้ตอบ' };
    if (def.requires === 'acoustic' && !hasAcoustic) return { ...base, status: 'cannot_assess', reason: 'ต้องใช้ข้อมูลเสียง ประเมินจาก transcript ไม่ได้ (จะเพิ่มในเฟส 3)' };
    const r = rawById.get(def.id);
    const n = Number(r?.score);
    if (!r || r.score == null || !Number.isFinite(n)) return { ...base, status: 'cannot_assess', reason: str(r?.comment) || 'ผู้ประเมินไม่ได้ให้คะแนนเกณฑ์นี้' };
    const evidence = (Array.isArray(r.evidence) ? r.evidence : [])
      .filter((e) => e && (quoteOk(e.quote) || (def.requires === 'acoustic' && e.timestamp)))
      .map((e) => ({ quote: str(e.quote), timestamp: str(e.timestamp), comment: str(e.comment) }));
    if (!evidence.length) return { ...base, status: 'cannot_assess', comment: str(r.comment), reason: 'ไม่พบหลักฐานที่ยกมาในข้อความจริง จึงไม่นับคะแนนเกณฑ์นี้' };
    const score = Math.max(0, Math.min(5, Math.round(n)));
    return { ...base, status: 'scored', score, band: bandOf(score), comment: str(r.comment), evidence };
  });

  const applicable = criteria.filter((c) => c.status !== 'na');
  const scored = applicable.filter((c) => c.status === 'scored');
  const wApp = sum(applicable, (c) => c.weight);
  const wScored = sum(scored, (c) => c.weight);
  applicable.forEach((c) => { c.effWeight = +(c.weight / wApp * 100).toFixed(1); });

  const complete = scored.length > 0 && scored.length === applicable.length;
  const total = wScored ? Math.round(sum(scored, (c) => c.weight * c.score / 5) / wScored * 100) : null;
  const minScore = scored.length ? Math.min(...scored.map((c) => c.score)) : null;
  const uncapped = total == null ? null : Math.round(total / 20);
  const overall = uncapped == null ? null : Math.min(uncapped, minScore + 1);
  const isMock = provider === 'mock';

  return {
    rubricId: rubric.id, provider, model, isMock, formative: true, disclaimer: DISCLAIMER, ratedAt: new Date().toISOString(),
    criteria, total, minScore, overall, overallLabel: overall == null ? 'ประเมินไม่ได้' : bandOf(overall),
    ceilingApplied: uncapped != null && overall < uncapped, complete,
    // ผ่านเกณฑ์ C2 ของ "งานชิ้นนี้" (ผลจากโหมดจำลองไม่นับเด็ดขาด)
    pass: !isMock && complete && total >= C2_TOTAL && minScore >= C2_MIN,
    strengths: (raw?.strengths || []).filter((x) => x && quoteOk(x.evidence)).map((x) => ({ point: str(x.point), evidence: str(x.evidence) })),
    weaknesses: (raw?.weaknesses || []).filter((x) => x && quoteOk(x.evidence)).map((x) => ({ point: str(x.point), evidence: str(x.evidence), fix: str(x.fix) })),
    flags: {
      overEngineered: (raw?.flags?.overEngineered || []).filter(quoteOk).map(str),
      cliches: (raw?.flags?.cliches || []).filter(quoteOk).map(str),
    },
    targetPhrases: targetPhrases.map((phrase) => {
      const r = (raw?.targetPhrases || []).find((x) => norm(x?.phrase) === norm(phrase));
      const used = hay.includes(norm(phrase));
      const natural = used && r?.natural === true;
      return { phrase, used, natural, passed: used && natural, comment: str(r?.comment) };
    }),
    reformulations: (raw?.reformulations || []).filter((x) => x && quoteOk(x.original) && str(x.rewrite)).slice(0, 6)
      .map((x) => ({ original: str(x.original), why: str(x.why), rewrite: str(x.rewrite), chunk: str(x.chunk) })),
    errors: (raw?.errors || []).filter((x) => x && quoteOk(x.wrong)).slice(0, 8)
      .map((x) => ({ category: str(x.category) || 'other', wrong: str(x.wrong), correct: str(x.correct), note: str(x.note) })),
    nextAction: str(raw?.nextAction),
  };
}

/** งานที่นับเป็นหลักฐาน: ส่งครั้งแรก (ไม่ใช่ redo) และไม่ได้มาจากโหมดจำลอง */
export const countable = (subs, skill) => subs
  .filter((x) => x.skill === skill && x.version === 1 && x.result && !x.result.isMock)
  .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

/**
 * C2-ready = งานนับได้ 3 ชิ้นล่าสุด "ผ่านติดต่อกันทั้ง 3 ชิ้น" และเป็นงาน 3 ประเภทที่ต่างกัน
 * (คะแนนครั้งเดียวไม่ใช้ตัดสินระดับ)
 */
export function c2Ready(subs, skill) {
  const list = countable(subs, skill);
  let streak = 0;
  for (let i = list.length - 1; i >= 0 && list[i].result.pass; i--) streak += 1;
  const last3 = list.slice(-3);
  const types = new Set(last3.filter((x) => x.result.pass).map((x) => x.taskType));
  return { ready: last3.length === 3 && streak >= 3 && types.size === 3, streak: Math.min(streak, 3), distinctTypes: types.size, counted: list.length };
}

/** ระดับจากหลักฐาน: เฉลี่ย overall ของงานนับได้ 3 ชิ้นล่าสุด (0–5) หรือ null */
export function evidenceLevel(subs, skill) {
  const last = countable(subs, skill).slice(-3).map((x) => x.result.overall).filter((v) => v != null);
  return last.length ? +(last.reduce((a, b) => a + b, 0) / last.length).toFixed(1) : null;
}

const LEVEL_VALUE = { B1: 1, B2: 2, C1: 3, C2: 5 };
const HALF_STEP = { 0: 0.5, 1: 1.5, 2: 2.5, 3: 4 };
const VALUE_LABEL = { 0: 'ยังไม่ถึง B1', 0.5: 'เกือบ B1', 1: 'B1', 1.5: 'B1+', 2: 'B2', 2.5: 'B2+', 3: 'C1', 4: 'C1+', 5: 'C2' };
export const levelLabel = (v) => (v == null ? '—' : VALUE_LABEL[v] ?? VALUE_LABEL[Math.round(v)] ?? String(v));

/**
 * ระดับจากการประเมินตนเอง (Can-do): ต้อง "ทำได้มั่นใจ" ครบทุกข้อของระดับนั้นและระดับที่ต่ำกว่า
 * ถ้าทำระดับถัดไปได้มั่นใจอย่างน้อยครึ่งหนึ่ง จะได้ระดับบวก (เช่น B2+)
 * states: Map(id → 0|1|2) คืนค่า null ถ้ายังไม่เคยประเมินทักษะนั้น
 */
export function selfLevel(skillId, cando, states) {
  const items = cando.filter((c) => c.skill === skillId);
  if (!items.some((c) => states.has(c.id))) return null;
  let value = 0;
  const levels = ['B1', 'B2', 'C1', 'C2'];
  for (let i = 0; i < levels.length; i++) {
    const at = items.filter((c) => c.level === levels[i]);
    const sure = at.filter((c) => states.get(c.id) === 2).length;
    if (at.length && sure === at.length) { value = LEVEL_VALUE[levels[i]]; continue; }
    if (at.length && sure / at.length >= 0.5) value = HALF_STEP[value] ?? value;
    break;
  }
  return value;
}

/** ระดับจากแบบฝึกอ่าน/ฟัง: ระดับสูงสุดที่ทำได้ >= 70% ในครั้งล่าสุดของข้อสอบระดับนั้น */
export function attemptLevel(attempts, module) {
  const latest = new Map();
  for (const a of attempts.filter((x) => x.module === module).sort((x, y) => x.createdAt.localeCompare(y.createdAt))) latest.set(a.level, a);
  let best = null;
  for (const [level, a] of latest) {
    if (a.total && a.score / a.total >= 0.7 && (best == null || LEVEL_VALUE[level] > best)) best = LEVEL_VALUE[level];
  }
  return best;
}
