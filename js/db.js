// IndexedDB wrapper พร้อม migration แบบมีเวอร์ชัน
// เพิ่ม migration ใหม่: ต่อท้ายอาร์เรย์ MIGRATIONS เท่านั้น ห้ามแก้ของเดิม (DB_VERSION = จำนวน migration)
const DB_NAME = 'c2-coach';

const MIGRATIONS = [
  // v1 — โครงสร้างเริ่มต้น
  (db) => {
    db.createObjectStore('settings', { keyPath: 'key' });
    db.createObjectStore('sessions', { keyPath: 'id' }).createIndex('date', 'date');
    const sub = db.createObjectStore('submissions', { keyPath: 'id' });
    sub.createIndex('module', 'module');
    sub.createIndex('taskId', 'taskId');
    db.createObjectStore('vault', { keyPath: 'id' }).createIndex('due', 'due');
    db.createObjectStore('errors', { keyPath: 'id' }).createIndex('category', 'category');
    db.createObjectStore('cando', { keyPath: 'id' });
    db.createObjectStore('checkpoints', { keyPath: 'id' }).createIndex('date', 'date');
    db.createObjectStore('attempts', { keyPath: 'id' }).createIndex('module', 'module');
  },
  // v2 — ตัวอย่าง: (db, tx) => { tx.objectStore('vault').createIndex('level', 'level'); },
];

export const DB_VERSION = MIGRATIONS.length;
export const STORES = ['settings', 'sessions', 'submissions', 'vault', 'errors', 'cando', 'checkpoints', 'attempts'];

let dbPromise;
export function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (!('indexedDB' in globalThis)) return reject(new Error('เบราว์เซอร์นี้ไม่รองรับ IndexedDB'));
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      for (let v = e.oldVersion; v < DB_VERSION; v++) MIGRATIONS[v](req.result, req.transaction);
    };
    req.onsuccess = () => {
      const db = req.result;
      db.onversionchange = () => db.close();
      resolve(db);
    };
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error('ฐานข้อมูลถูกเปิดค้างในแท็บอื่น กรุณาปิดแท็บอื่นแล้วลองใหม่'));
  });
  return dbPromise;
}

async function run(stores, mode, fn) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(stores, mode);
    let out;
    try { out = fn(tx); } catch (err) { reject(err); return; }
    tx.oncomplete = () => resolve(out instanceof IDBRequest ? out.result : out);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error('transaction aborted'));
  });
}

export const getAll = (store) => run(store, 'readonly', (tx) => tx.objectStore(store).getAll());
export const get = (store, key) => run(store, 'readonly', (tx) => tx.objectStore(store).get(key));
export const put = (store, value) => run(store, 'readwrite', (tx) => { tx.objectStore(store).put(value); return value; });
export const del = (store, key) => run(store, 'readwrite', (tx) => { tx.objectStore(store).delete(key); });
export const bulkPut = (store, values) => run(store, 'readwrite', (tx) => { const os = tx.objectStore(store); values.forEach((v) => os.put(v)); });

/** แทนที่ข้อมูลทุก store ใน transaction เดียว (ใช้ตอน import / ล้างข้อมูล) */
export const replaceAll = (data) => run(STORES, 'readwrite', (tx) => {
  for (const name of STORES) {
    const os = tx.objectStore(name);
    os.clear();
    for (const row of data[name] || []) os.put(row);
  }
});

export async function getSetting(key, fallback) {
  const row = await get('settings', key);
  return row === undefined ? fallback : row.value;
}
export const setSetting = (key, value) => put('settings', { key, value });
