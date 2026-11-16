// ฟังก์ชันกลางของคลัง — ปุ่ม "ส่งเข้าคลัง" ทุกหน้าเรียกผ่านที่นี่
import { getAll, put } from './db.js';
import { newCard, isDue } from './srs.js';
import { uid } from './ui.js';
import { todayISO } from './dates.js';

export const ERROR_CATEGORIES = [
  ['article', 'Article (a/an/the)'],
  ['preposition', 'Preposition'],
  ['collocation', 'Collocation'],
  ['register', 'Register / ระดับภาษา'],
  ['cohesion', 'Cohesion / การเชื่อมความ'],
  ['stress', 'Word stress / การออกเสียง'],
  ['grammar', 'Grammar อื่น ๆ'],
  ['other', 'อื่น ๆ'],
];

const norm = (t) => t.trim().toLowerCase().replace(/\s+/g, ' ');

/** เพิ่มวลีเข้าคลัง (ถ้ามีอยู่แล้วจะไม่เพิ่มซ้ำ) → { card, duplicate } */
export async function addCard(fields) {
  const all = await getAll('vault');
  const dup = all.find((c) => norm(c.chunk) === norm(fields.chunk));
  if (dup) return { card: dup, duplicate: true };
  const card = newCard(fields);
  await put('vault', card);
  return { card, duplicate: false };
}

/** เพิ่มข้อผิดพลาด (ถ้าซ้ำหมวดและข้อความเดิม จะนับเพิ่ม) → { entry, repeated } */
export async function addError({ category = 'other', wrong, correct = '', note = '', sourceId = null }) {
  const all = await getAll('errors');
  const hit = all.find((e) => e.category === category && norm(e.wrong) === norm(wrong));
  if (hit) {
    const entry = { ...hit, count: hit.count + 1, lastSeen: todayISO(), resolved: false };
    await put('errors', entry);
    return { entry, repeated: true };
  }
  const entry = { id: uid(), category, wrong: wrong.trim(), correct: correct.trim(), note: note.trim(), count: 1, resolved: false, sourceId, lastSeen: todayISO(), createdAt: new Date().toISOString() };
  await put('errors', entry);
  return { entry, repeated: false };
}

export async function dueCards(today = todayISO()) {
  return (await getAll('vault')).filter((c) => isDue(c, today)).sort((a, b) => a.due.localeCompare(b.due));
}

/** เลือกวลีเป้าหมายสำหรับงานหนึ่งชิ้น — สูงสุด 2 วลี (ถึงกำหนดทบทวนก่อน) */
export async function pickTargetPhrases(n = 2) {
  const all = await getAll('vault');
  return all.sort((a, b) => a.due.localeCompare(b.due) || a.reps - b.reps).slice(0, Math.min(n, 2));
}
