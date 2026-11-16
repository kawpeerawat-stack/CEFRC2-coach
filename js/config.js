// ค่าตั้งของผู้ใช้ (เก็บใน store "settings")
import { getAll, setSetting, getSetting } from './db.js';
import { todayISO } from './dates.js';

export const SKILLS = [
  { id: 'listening', th: 'การฟัง', short: 'ฟัง', en: 'Listening' },
  { id: 'reading', th: 'การอ่าน', short: 'อ่าน', en: 'Reading' },
  { id: 'spoken-interaction', th: 'พูดโต้ตอบ', short: 'พูดโต้ตอบ', en: 'Spoken Interaction' },
  { id: 'spoken-production', th: 'พูดนำเสนอ', short: 'พูดนำเสนอ', en: 'Spoken Production' },
  { id: 'writing', th: 'การเขียน', short: 'เขียน', en: 'Writing' },
  { id: 'mediation', th: 'การถ่ายทอดสาร', short: 'ถ่ายทอดสาร', en: 'Mediation' },
];
export const LEVELS = ['B1', 'B2', 'C1', 'C2'];
export const skillName = (id) => SKILLS.find((x) => x.id === id)?.th || id;

export const DEFAULTS = {
  provider: 'mock',            // 'mock' | 'claude'
  apiKey: '',                  // เก็บเฉพาะในเบราว์เซอร์นี้ และไม่ถูกส่งออกไปกับไฟล์สำรอง
  model: 'claude-sonnet-5-5',  // แก้ได้ในหน้าตั้งค่า
  speechLang: 'en-GB',
  planStart: null,             // ตั้งเป็นวันที่เปิดแอปครั้งแรก
  weeklyHours: 9,
  startLevel: 'B1',
  targets: Object.fromEntries(SKILLS.map((x) => [x.id, 'C2'])),
  lastBackupAt: null,
};

export async function loadConfig() {
  const rows = await getAll('settings');
  const saved = Object.fromEntries(rows.filter((r) => r.key in DEFAULTS).map((r) => [r.key, r.value]));
  return { ...DEFAULTS, ...saved };
}

export async function saveConfig(patch) {
  for (const [k, v] of Object.entries(patch)) await setSetting(k, v);
  window.dispatchEvent(new Event('c2:config'));
}

/** เรียกครั้งเดียวตอนเปิดแอป: กำหนดวันเริ่มแผนถ้ายังไม่มี */
export async function ensureConfig() {
  if (!(await getSetting('planStart'))) await setSetting('planStart', todayISO());
}
