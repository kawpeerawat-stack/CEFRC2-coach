// Provider จำลอง: ให้แอปทำงานครบวงจรได้โดยไม่ต้องมี API key
// คะแนนมาจากการนับคำแบบหยาบ ๆ เท่านั้น "ไม่ใช่การประเมินภาษา" และไม่ถูกนับเป็นหลักฐานระดับ
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const sentencesOf = (t) => (t.match(/[^.!?\n]+[.!?]*/g) || []).map((x) => x.trim()).filter((x) => x.split(/\s+/).length >= 3);
const head = (sentence, n = 18) => sentence.split(/\s+/).slice(0, n).join(' ');
const esc = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const CLICHES = ['in conclusion', 'moreover', 'furthermore', 'a plethora of', 'myriad', 'double-edged sword', 'every coin has two sides', 'in a nutshell', 'last but not least', 'nowadays'];
const WEAK = [
  ['very important', 'crucial'], ['a lot of', 'a great deal of'], ['big problem', 'serious problem'], ['i think', 'in my view'],
  ['good for', 'beneficial to'], ['bad for', 'harmful to'], ['more and more', 'increasingly'], ['very good', 'excellent'],
];
const SLIPS = [
  { re: /\bdiscuss about\b/i, category: 'collocation', correct: 'discuss', note: 'discuss ไม่ต้องตามด้วย about' },
  { re: /\baccording to me\b/i, category: 'collocation', correct: 'in my view', note: 'according to ใช้อ้างคนอื่น ไม่ใช้กับตัวเอง' },
  { re: /\b(informations|advices|equipments|homeworks|furnitures)\b/i, category: 'grammar', correct: '(คำนามนับไม่ได้ ไม่เติม -s)', note: 'คำนามนับไม่ได้' },
];
const CHALLENGES = [
  'Isn\'t that an oversimplification? What would you say to a colleague who has seen the opposite happen?',
  'You say it works — but what evidence would actually change your mind?',
  'That may hold in a well-resourced school. How does your argument survive in a small rural one?',
  'Suppose the director agrees with you. What is the first thing that goes wrong?',
];

export async function rate({ task, input, rubric }) {
  await wait(300);
  const text = input.text || '';
  const sents = sentencesOf(text);
  const words = text.match(/[A-Za-z']+/g) || [];
  const wc = words.length;
  const ttr = wc ? new Set(words.map((w) => w.toLowerCase())).size / wc : 0;
  const avg = wc / Math.max(1, sents.length);
  const long = words.filter((w) => w.length >= 8).length / Math.max(1, wc);
  const min = task.minWords || 60;

  let base = 1;
  if (wc >= min * 0.6) base = 2;
  if (wc >= min && avg >= 13 && ttr >= 0.42) base = 3;
  if (wc >= min && avg >= 17 && ttr >= 0.5 && long >= 0.18) base = 4; // โหมดจำลองไม่ให้ 5

  const longest = [...sents].sort((a, b) => b.length - a.length)[0];
  const pick = (i) => sents[Math.min(i, sents.length - 1)];
  const lower = text.toLowerCase();
  const foundCliches = CLICHES.filter((c) => lower.includes(c));
  const spanOf = (phrase) => { const m = text.match(new RegExp(esc(phrase), 'i')); return m ? m[0] : null; };
  const sentenceWith = (phrase) => sents.find((x) => x.toLowerCase().includes(phrase.toLowerCase()));

  const criteria = rubric.criteria.filter((c) => c.requires !== 'acoustic').map((c, i) => {
    if (!sents.length) return { id: c.id, score: null, comment: '[จำลอง] ข้อความสั้นเกินกว่าจะหาหลักฐานได้', evidence: [] };
    const src = c.id === 'grammar' || c.id === 'cohesion' || c.id === 'coherence' ? longest : pick(i);
    let score = base;
    if (c.id === 'lexis' && foundCliches.length > 1) score = Math.max(1, base - 1);
    return { id: c.id, score, comment: `[จำลอง] คะแนนตัวอย่างจากความยาวและความหลากหลายของคำ ไม่ใช่การประเมินจริง`, evidence: [{ quote: head(src), comment: 'ตัวอย่างประโยคจากงาน' }] };
  });

  const weak = WEAK.map(([w, r]) => ({ w, r, span: spanOf(w) })).filter((x) => x.span);
  const errors = SLIPS.map((x) => { const m = text.match(x.re); return m && { category: x.category, wrong: m[0], correct: x.correct, note: x.note }; }).filter(Boolean);

  return {
    criteria,
    strengths: sents.length ? [{ point: '[จำลอง] เปิดประเด็นได้ชัด', evidence: head(sents[0]) }] : [],
    weaknesses: [
      ...foundCliches.map((c) => ({ point: `ใช้วลีสำเร็จรูป "${c}"`, evidence: head(sentenceWith(c) || c), fix: 'ลองเชื่อมความด้วยเนื้อหาแทนคำเชื่อมสำเร็จรูป' })),
      ...weak.slice(0, 2).map((x) => ({ point: `คำกว้างเกินไป: "${x.span}"`, evidence: x.span, fix: 'เลือกคำที่ระบุความหมายได้ตรงกว่า' })),
    ],
    flags: { overEngineered: [], cliches: foundCliches.map(spanOf).filter(Boolean) },
    targetPhrases: (input.targetPhrases || []).map((phrase) => ({ phrase, used: lower.includes(phrase.toLowerCase()), natural: lower.includes(phrase.toLowerCase()), comment: '[จำลอง] ตรวจได้เพียงว่ามีวลีนี้ในงานหรือไม่' })),
    reformulations: weak.slice(0, 4).map((x) => {
      const sentence = sentenceWith(x.w) || x.span;
      return { original: sentence, why: `"${x.span}" กว้างเกินไป`, rewrite: sentence.replace(new RegExp(esc(x.w), 'i'), x.r), chunk: x.r };
    }),
    errors,
    nextAction: wc < min ? `[จำลอง] งานยังสั้นกว่าที่โจทย์กำหนด (${wc}/${min} คำ) ลองขยายเหตุผลและตัวอย่าง` : '[จำลอง] ลองแก้ประโยคที่ถูกยกมา แล้วส่งฉบับแก้ไข',
  };
}

export async function generate({ kind, payload }) {
  await wait(250);
  if (kind === 'reformulate') {
    const sentence = payload.sentence || '';
    const hits = WEAK.filter(([w]) => sentence.toLowerCase().includes(w));
    let precise = sentence;
    hits.forEach(([w, r]) => { precise = precise.replace(new RegExp(esc(w), 'i'), r); });
    const spoken = precise.replace(/\bdo not\b/gi, "don't").replace(/\bit is\b/gi, "it's").replace(/\bcannot\b/gi, "can't").replace(/\bI am\b/g, "I'm");
    return {
      issues: hits.map(([w]) => ({ span: w, why: 'คำกว้างเกินไป ยังไม่ระบุความหมายที่ต้องการ' })),
      precise, spoken,
      chunks: hits.map(([w, r]) => ({ chunk: r, cue: `ใช้แทน "${w}"` })),
      note: hits.length ? '[จำลอง] แทนคำจากรายการตัวอย่างเท่านั้น' : '[จำลอง] ไม่พบคำในรายการตัวอย่าง — เชื่อมต่อ Claude ในหน้าตั้งค่าเพื่อให้เกลาประโยคได้จริง',
    };
  }
  if (kind === 'challenge') {
    const n = (payload.turns || []).filter((t) => t.role === 'examiner').length;
    return { question: CHALLENGES[n % CHALLENGES.length] };
  }
  throw new Error('ยังไม่รองรับ ai.generate ชนิด: ' + kind);
}
