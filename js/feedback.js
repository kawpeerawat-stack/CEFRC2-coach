// แสดงผลการประเมิน (ใช้ร่วมกันทั้งงานเขียน งานพูด และ Mediation)
import { h, btn, badge, notice, toast } from './ui.js';
import { addCard, addError, ERROR_CATEGORIES } from './vault-api.js';
import { C2_TOTAL, C2_MIN } from './scoring.js';

const catLabel = (id) => (ERROR_CATEGORIES.find(([k]) => k === id) || [id, id])[1];

function criterion(c) {
  const head = h('div', { class: 'score' },
    h('strong', {}, c.label, ' ', h('small', { class: 'muted' }, `(${c.en} · น้ำหนัก ${c.weight})`)),
    c.status === 'scored' ? h('span', {}, `${c.score}/5 · ${c.band}`)
      : badge(c.status === 'na' ? 'ไม่ใช้กับงานนี้' : 'ประเมินไม่ได้', c.status === 'na' ? '' : 'warn'));
  return h('div', { class: 'crit' }, head,
    c.status === 'scored' && h('div', { class: 'bar', role: 'presentation' }, h('span', { style: `width:${c.score / 5 * 100}%` })),
    c.comment && h('p', {}, c.comment),
    c.reason && h('p', { class: 'muted' }, c.reason),
    (c.evidence || []).map((e) => h('div', {},
      h('blockquote', { lang: 'en' }, e.timestamp ? `[${e.timestamp}] ` : '', e.quote),
      e.comment && h('small', { class: 'muted' }, e.comment))));
}

/** @param result ผลจาก ai.rate()  @param opts { locked, level, sourceId } */
export function renderResult(result, { locked = false, level = '', sourceId = null } = {}) {
  const root = h('section', { class: 'card', 'aria-label': 'ผลการประเมิน' });
  root.append(h('h2', { tabindex: '-1', id: 'result-heading' }, 'ผลการประเมิน'));

  if (result.isMock) root.append(notice('', h('strong', {}, 'โหมดจำลอง: '), 'คะแนนนี้คำนวณจากความยาวและการนับคำเท่านั้น ไม่ใช่การประเมินภาษาจริง และไม่ถูกนับเป็นหลักฐานระดับ'));
  root.append(
    h('p', { class: 'headline' }, `ระดับโดยประมาณ: ${result.overallLabel}`, result.total != null && ` · ${result.total}/100`),
    h('p', { class: 'muted' }, result.disclaimer));
  if (!result.complete) root.append(notice('', 'ประเมินได้ไม่ครบทุกเกณฑ์ คะแนนรวมคิดจากเกณฑ์ที่มีหลักฐานเท่านั้น งานชิ้นนี้จึงยังไม่นับเป็นหลักฐาน C2'));
  if (result.ceilingApplied) root.append(notice('', 'ระดับรวมถูกจำกัดไว้ไม่เกิน 1 ขั้นเหนือเกณฑ์ที่ได้คะแนนต่ำที่สุด'));
  if (result.pass) root.append(notice('good', `งานชิ้นนี้ผ่านเกณฑ์ C2 (รวม ≥ ${C2_TOTAL} และทุกเกณฑ์ ≥ ${C2_MIN}) — ต้องทำได้ 3 ครั้งติดกันในงาน 3 ประเภทจึงจะถือว่า C2-ready`));

  root.append(h('h3', {}, 'คะแนนรายเกณฑ์และหลักฐาน'), ...result.criteria.map(criterion));

  if (result.strengths.length) {
    root.append(h('h3', {}, 'จุดแข็ง'), h('ul', {}, result.strengths.map((x) => h('li', {}, x.point, h('blockquote', { lang: 'en' }, x.evidence)))));
  }
  root.append(h('h3', {}, 'จุดที่ควรแก้'));
  root.append(result.weaknesses.length
    ? h('ul', {}, result.weaknesses.map((x) => h('li', {}, x.point, h('blockquote', { lang: 'en' }, x.evidence), x.fix && h('small', {}, 'แนวทาง: ' + x.fix))))
    : h('p', { class: 'muted' }, 'ไม่พบจุดอ่อนที่มีหลักฐานชัดเจนในงานชิ้นนี้'));

  const flagged = [...result.flags.overEngineered.map((q) => ['ฝืนธรรมชาติ/ศัพท์หรูเกิน', q]), ...result.flags.cliches.map((q) => ['วลีสำเร็จรูป', q])];
  if (flagged.length) root.append(h('h3', {}, 'ภาษาที่ควรระวัง'), h('ul', {}, flagged.map(([t, q]) => h('li', {}, badge(t, 'warn'), ' ', h('span', { lang: 'en', class: 'en' }, q)))));

  if (result.targetPhrases.length) {
    root.append(h('h3', {}, 'วลีเป้าหมาย'), h('ul', {}, result.targetPhrases.map((p) => h('li', {},
      h('span', { lang: 'en', class: 'en' }, p.phrase), ' ',
      badge(p.passed ? 'ใช้ได้เป็นธรรมชาติ' : p.used ? 'ใช้แล้ว แต่ยังไม่เป็นธรรมชาติ' : 'ยังไม่ได้ใช้', p.passed ? 'good' : ''),
      p.comment && h('small', { class: 'muted' }, ' ' + p.comment)))));
  }

  if (result.errors.length) {
    root.append(h('h3', {}, 'ข้อผิดพลาดที่ควรติดตาม'), h('ul', { class: 'list' }, result.errors.map((e) => h('li', {},
      badge(catLabel(e.category)), ' ', h('span', { lang: 'en', class: 'en' }, e.wrong),
      !locked && e.correct && h('span', {}, ' → ', h('strong', { lang: 'en', class: 'en' }, e.correct)),
      e.note && h('div', { class: 'muted' }, e.note),
      h('div', {}, btn('เก็บลงคลังข้อผิดพลาด', async (ev) => {
        const { repeated } = await addError({ ...e, sourceId });
        ev.target.disabled = true;
        toast(repeated ? 'เคยพบข้อผิดพลาดนี้แล้ว นับเพิ่มอีก 1 ครั้ง' : 'เก็บลงคลังข้อผิดพลาดแล้ว');
      }, 'small'))))));
  }

  root.append(h('h3', {}, 'ตัวอย่างการเขียนใหม่'));
  if (locked) {
    root.append(h('div', { class: 'locked' }, h('strong', {}, '🔒 ยังไม่แสดงตัวอย่าง'), h('p', {}, 'แก้งานด้วยตนเองก่อน แล้วส่งฉบับแก้ไข จึงจะเห็นตัวอย่างการเขียนใหม่และคำเฉลยของข้อผิดพลาด (Redo loop)')));
  } else if (!result.reformulations.length) {
    root.append(h('p', { class: 'muted' }, 'ไม่มีประโยคที่ต้องเขียนใหม่'));
  } else {
    root.append(h('ul', { class: 'list' }, result.reformulations.map((r) => h('li', {},
      h('div', { class: 'muted' }, 'ของเดิม'), h('blockquote', { lang: 'en' }, r.original),
      r.why && h('p', {}, r.why),
      h('div', { class: 'muted' }, 'แม่นยำและเป็นธรรมชาติขึ้น'), h('blockquote', { lang: 'en' }, r.rewrite),
      btn(`ส่งเข้าคลัง: ${r.chunk || 'วลีนี้'}`, async (ev) => {
        const { duplicate } = await addCard({ chunk: r.chunk || r.rewrite, cue: 'ใช้แทน: ' + r.original.slice(0, 80), example: r.rewrite, level, source: 'feedback' });
        ev.target.disabled = true;
        toast(duplicate ? 'มีวลีนี้ในคลังอยู่แล้ว' : 'ส่งเข้าคลังแล้ว');
      }, 'small')))));
  }

  if (result.nextAction) root.append(h('h3', {}, 'ขั้นต่อไป'), h('p', {}, result.nextAction));
  return root;
}
