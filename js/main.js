// จุดเริ่มแอป: เปิดฐานข้อมูล → ลงทะเบียนเส้นทาง → เริ่ม router
import { openDB } from './db.js';
import { ensureConfig, loadConfig } from './config.js';
import { route, startRouter, buildNav } from './router.js';
import { h } from './ui.js';
import * as dashboard from './modules/dashboard.js';
import * as diagnostic from './modules/diagnostic.js';
import * as writing from './modules/writing.js';
import * as speaking from './modules/speaking.js';
import * as reading from './modules/reading.js';
import * as listening from './modules/listening.js';
import * as vault from './modules/vault.js';
import * as reformulator from './modules/reformulator.js';
import * as mediation from './modules/mediation.js';
import * as mockexam from './modules/mockexam.js';
import * as settings from './modules/settings.js';
import * as menu from './modules/menu.js';

async function paintBadge() {
  const cfg = await loadConfig();
  document.getElementById('mode-badge').textContent = cfg.provider === 'claude' ? 'AI: Claude' : 'AI: จำลอง';
}

async function boot() {
  const main = document.getElementById('main');
  try {
    await openDB();
    await ensureConfig();
  } catch (err) {
    main.replaceChildren(h('h1', {}, 'เปิดฐานข้อมูลไม่ได้'),
      h('div', { class: 'notice bad' }, String(err?.message || err), ' — ลองปิดโหมดไม่ระบุตัวตน (private/incognito) หรือใช้เบราว์เซอร์รุ่นใหม่'));
    return;
  }

  route('/', dashboard);
  route('/menu', menu);
  route('/diagnostic', diagnostic);
  route('/writing', writing);
  route('/writing/:id', writing);
  route('/speaking', speaking);
  route('/speaking/:id', speaking);
  route('/reading', reading);
  route('/reading/:id', reading);
  route('/listening', listening);
  route('/listening/:id', listening);
  route('/vault', vault);
  route('/reformulator', reformulator);
  route('/mediation', mediation);
  route('/mediation/:id', mediation);
  route('/mock', mockexam);
  route('/mock/:format/:section', mockexam);
  route('/settings', settings);

  buildNav();
  window.addEventListener('c2:config', paintBadge);
  await paintBadge();
  startRouter(main);

  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    navigator.serviceWorker.register('./sw.js').catch((e) => console.warn('service worker', e));
  }
}

boot();
