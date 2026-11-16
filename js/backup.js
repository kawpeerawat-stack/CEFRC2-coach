// สำรอง/กู้คืนข้อมูลทั้งหมดเป็น JSON ไฟล์เดียว
import { STORES, DB_VERSION, getAll, get, replaceAll, setSetting } from './db.js';
import { download } from './ui.js';
import { todayISO } from './dates.js';

const APP = 'c2-coach';
const FORMAT = 1;

export async function exportData() {
  const stores = {};
  for (const name of STORES) stores[name] = await getAll(name);
  // ไม่ส่งออก API key เพื่อความปลอดภัย
  stores.settings = stores.settings.filter((r) => r.key !== 'apiKey');
  return { app: APP, format: FORMAT, dbVersion: DB_VERSION, exportedAt: new Date().toISOString(), stores };
}

export async function downloadBackup() {
  await setSetting('lastBackupAt', new Date().toISOString());
  const data = await exportData();
  download(`c2-coach-backup-${todayISO()}.json`, JSON.stringify(data, null, 2));
  return data;
}

export function validateBackup(obj) {
  if (!obj || obj.app !== APP || typeof obj.stores !== 'object') throw new Error('ไฟล์นี้ไม่ใช่ไฟล์สำรองของ C2 Coach');
  if (obj.format > FORMAT || obj.dbVersion > DB_VERSION) throw new Error('ไฟล์สำรองมาจากแอปเวอร์ชันใหม่กว่า กรุณาอัปเดตแอปก่อน');
  for (const name of Object.keys(obj.stores)) {
    if (!Array.isArray(obj.stores[name])) throw new Error(`ข้อมูลส่วน "${name}" ผิดรูปแบบ`);
  }
  return true;
}

/** แทนที่ข้อมูลทั้งหมดด้วยไฟล์สำรอง (คง API key ของเครื่องนี้ไว้) */
export async function importData(obj) {
  validateBackup(obj);
  const key = await get('settings', 'apiKey');
  const data = {};
  for (const name of STORES) data[name] = obj.stores[name] || [];
  data.settings = data.settings.filter((r) => r.key !== 'apiKey');
  if (key) data.settings.push(key);
  await replaceAll(data);
  const counts = Object.fromEntries(STORES.map((n) => [n, data[n].length]));
  window.dispatchEvent(new Event('c2:config'));
  return counts;
}

export async function wipeAll() {
  await replaceAll({});
  window.dispatchEvent(new Event('c2:config'));
}
