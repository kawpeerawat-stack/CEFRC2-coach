// บันทึกเวลาฝึก (study session) — ทุกโมดูลเรียกผ่านฟังก์ชันนี้
import { put } from './db.js';
import { uid } from './ui.js';
import { todayISO } from './dates.js';

export const SESSION_KINDS = { loop: 'วงจรประจำวัน', extensive: 'ฟัง/อ่านนอกเวลา', mock: 'ข้อสอบจำลอง', review: 'ทบทวนคลัง', manual: 'บันทึกเอง' };

export function logSession({ date = todayISO(), minutes, skill = 'mixed', module = 'manual', kind = 'manual', note = '' }) {
  const m = Math.max(1, Math.round(Number(minutes) || 0));
  return put('sessions', { id: uid(), date, minutes: m, skill, module, kind, note, createdAt: new Date().toISOString() });
}
