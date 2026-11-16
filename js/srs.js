// Spaced repetition แบบ SM-2
import { addDays, todayISO } from './dates.js';
import { uid } from './ui.js';

export const GRADES = [
  { q: 1, label: 'จำไม่ได้' },
  { q: 3, label: 'ยาก' },
  { q: 4, label: 'ได้' },
  { q: 5, label: 'ง่าย' },
];

export function newCard({ chunk, cue = '', example = '', level = '', source = '' }) {
  return {
    id: uid(), type: 'chunk', chunk: chunk.trim(), cue: cue.trim(), example: example.trim(), level, source,
    ef: 2.5, interval: 0, reps: 0, lapses: 0, due: todayISO(), lastReviewed: null, createdAt: new Date().toISOString(),
  };
}

/** q: 0–5 (ต่ำกว่า 3 = ลืม) คืนการ์ดใหม่ ไม่แก้ของเดิม */
export function review(card, q, today = todayISO()) {
  let { ef, interval, reps, lapses } = card;
  if (q < 3) { reps = 0; interval = 1; lapses += 1; }
  else {
    reps += 1;
    interval = reps === 1 ? 1 : reps === 2 ? 6 : Math.round(interval * ef);
  }
  ef = Math.max(1.3, +(ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))).toFixed(2));
  return { ...card, ef, interval, reps, lapses, due: addDays(today, interval), lastReviewed: today };
}

export const isDue = (card, today = todayISO()) => card.due <= today;
