// Service worker: network-first (ออนไลน์ได้ไฟล์ล่าสุดเสมอ ออฟไลน์ใช้สำเนาในแคช)
// เมื่อเพิ่ม/ลบไฟล์ ให้เปลี่ยนเลข CACHE เพื่อล้างแคชเก่า
const CACHE = 'c2-coach-v1';
const SHELL = [
  './', './index.html', './css/app.css', './manifest.webmanifest', './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png',
  './js/main.js', './js/db.js', './js/config.js', './js/router.js', './js/ui.js', './js/dates.js', './js/backup.js', './js/timer.js',
  './js/sessions.js', './js/srs.js', './js/vault-api.js', './js/planner.js', './js/scoring.js', './js/charts.js', './js/feedback.js',
  './js/workbench.js', './js/quiz.js',
  './js/ai/index.js', './js/ai/mock.js', './js/ai/claude.js', './js/ai/prompts.js',
  './js/data/plan.js', './js/data/rubrics.js', './js/data/tasks.js', './js/data/cando.js', './js/data/reading.js', './js/data/listening.js', './js/data/mocks.js',
  './js/modules/dashboard.js', './js/modules/diagnostic.js', './js/modules/writing.js', './js/modules/speaking.js', './js/modules/reading.js',
  './js/modules/listening.js', './js/modules/vault.js', './js/modules/reformulator.js', './js/modules/mediation.js', './js/modules/mockexam.js',
  './js/modules/settings.js', './js/modules/menu.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return; // ไม่ยุ่งกับคำขอไป API ภายนอก
  e.respondWith(
    fetch(e.request).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); }
      return res;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || caches.match('./index.html'))));
});
