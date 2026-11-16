// Rubric ภายในแอป (ไม่ใช่ rubric ทางการของ IELTS/Cambridge) — สเกล 0–5 ทุกเกณฑ์ น้ำหนักรวม 100
// requires: 'sources'  → ใช้เฉพาะงานที่มีแหล่งข้อมูล (ไม่มี = N/A แล้วกระจายน้ำหนักใหม่)
// requires: 'interaction' → ใช้เฉพาะงานพูดแบบโต้ตอบ (task.mode === 'interaction')
// requires: 'acoustic' → ต้องมีข้อมูลเสียง ประเมินจาก transcript ไม่ได้ (เฟส 3)
export const SCALE = [
  { score: 5, band: 'C2', th: 'แสดงสมรรถนะ C2 สม่ำเสมอ มีหลักฐานชัด' },
  { score: 4, band: 'C1+', th: 'C1+ แตะ C2 แต่ยังไม่สม่ำเสมอ' },
  { score: 3, band: 'C1', th: 'C1 ที่มั่นคง' },
  { score: 2, band: 'B2', th: 'B2' },
  { score: 1, band: 'ต่ำกว่า B2', th: 'ต่ำกว่า B2 หรือหลักฐานไม่พอ' },
  { score: 0, band: 'ประเมินไม่ได้', th: 'ไม่ตอบโจทย์ / ประเมินไม่ได้' },
];

export const RUBRICS = {
  writing: {
    id: 'writing', kind: 'writing', label: 'Writing rubric',
    criteria: [
      { id: 'task', th: 'ตอบโจทย์และผลต่อผู้อ่าน', en: 'Task fulfilment', weight: 15, c2: 'Fully meets every requirement and foregrounds what matters for the intended reader.' },
      { id: 'argument', th: 'ข้อโต้แย้งและการคิดเชิงวิพากษ์', en: 'Argument & criticality', weight: 15, c2: 'Develops a complex argument and weighs evidence and limitations critically.' },
      { id: 'cohesion', th: 'การจัดระเบียบและการเชื่อมความ', en: 'Organisation & cohesion', weight: 15, c2: 'Logical structure helps the reader find and remember the key points; cohesion is unobtrusive.' },
      { id: 'lexis', th: 'คำศัพท์: ความกว้างและความแม่นยำ', en: 'Lexical range & precision', weight: 15, c2: 'Wide, precise, natural vocabulary; conveys fine shades of meaning without strain or ornament.' },
      { id: 'grammar', th: 'ไวยากรณ์: ความหลากหลายและความถูกต้อง', en: 'Grammatical range & accuracy', weight: 15, c2: 'Sustained control of complex structures; errors are rare and hard to spot.' },
      { id: 'register', th: 'ระดับภาษาและสไตล์', en: 'Register & style', weight: 10, c2: 'Formality, tone and genre conventions fit the task throughout.' },
      { id: 'source', th: 'การสังเคราะห์แหล่งข้อมูล', en: 'Source synthesis', weight: 10, requires: 'sources', c2: 'Synthesises the sources in the writer\'s own words and keeps own view distinct from theirs.' },
      { id: 'mechanics', th: 'การสะกดและวรรคตอน', en: 'Mechanics', weight: 5, c2: 'Spelling, punctuation and layout virtually never distract.' },
    ],
  },
  speaking: {
    id: 'speaking', kind: 'speaking', label: 'Speaking rubric',
    criteria: [
      { id: 'task', th: 'ตอบโจทย์และเนื้อหา', en: 'Task & content', weight: 15, c2: 'Answers directly and in depth, adapting content to the listener.' },
      { id: 'coherence', th: 'การเรียบเรียงความคิด', en: 'Coherence & discourse', weight: 15, c2: 'Clear line of argument; highlights key points and links stretches of speech naturally.' },
      { id: 'lexis', th: 'คำศัพท์: ความกว้างและความแม่นยำ', en: 'Lexical range & precision', weight: 15, c2: 'Idiomatic, precise word choice and collocation; uses modifiers to qualify meaning.' },
      { id: 'grammar', th: 'ไวยากรณ์', en: 'Grammatical range & accuracy', weight: 15, c2: 'Maintains control of complex language even while planning what to say.' },
      { id: 'fluency', th: 'ความคล่อง', en: 'Fluency', weight: 15, c2: 'Speaks at length naturally; pauses to choose meaning, not for lack of language.' },
      { id: 'pronunciation', th: 'การออกเสียงและทำนองเสียง', en: 'Pronunciation & prosody', weight: 15, requires: 'acoustic', c2: 'Easy to follow; stress, rhythm and intonation carry finer shades of meaning. Accent is irrelevant.' },
      { id: 'interaction', th: 'การโต้ตอบและการแก้ถ้อยคำ', en: 'Interaction & repair', weight: 10, requires: 'interaction', c2: 'Takes turns, concedes, rebuts and rephrases smoothly under pressure.' },
    ],
  },
};
