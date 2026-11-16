// Hash router: #/writing/w-b2-01  → modules/writing.js render(view, {id})
import { h } from './ui.js';

export const NAV = [
  { href: '#/', label: 'แดชบอร์ด', icon: '🏠', primary: true },
  { href: '#/diagnostic', label: 'วัดระดับ', icon: '🧭' },
  { href: '#/writing', label: 'เขียน', icon: '✍️', primary: true },
  { href: '#/speaking', label: 'พูด', icon: '🎙️', primary: true },
  { href: '#/reading', label: 'อ่าน', icon: '📖' },
  { href: '#/listening', label: 'ฟัง', icon: '🎧' },
  { href: '#/vault', label: 'คลัง', icon: '🗂️', primary: true },
  { href: '#/reformulator', label: 'เกลาประโยค', icon: '🔧' },
  { href: '#/mediation', label: 'Mediation', icon: '🔁' },
  { href: '#/mock', label: 'ข้อสอบจำลอง', icon: '⏱️' },
  { href: '#/settings', label: 'ตั้งค่า', icon: '⚙️' },
];

const routes = [];
let mainEl;
let cleanup = null;
let token = 0;

export function route(pattern, mod) {
  const keys = [];
  const re = new RegExp('^' + pattern.replace(/:[^/]+/g, (m) => { keys.push(m.slice(1)); return '([^/]+)'; }) + '$');
  routes.push({ re, keys, mod });
}

export const navigate = (path) => { location.hash = '#' + path; };
export const currentPath = () => (location.hash.replace(/^#/, '') || '/').split('?')[0];
/** วาดหน้าปัจจุบันใหม่ (ใช้หลังบันทึกข้อมูล) */
export const refresh = () => handle(false);

function markActive(path) {
  const section = '#/' + (path.split('/')[1] || '');
  document.querySelectorAll('#sidenav a, #tabbar a').forEach((a) => {
    const on = a.getAttribute('href') === section;
    on ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current');
  });
}

async function handle(moveFocus = true) {
  const path = currentPath();
  const my = ++token;
  if (typeof cleanup === 'function') { try { cleanup(); } catch (e) { console.warn(e); } }
  cleanup = null;

  // แต่ละครั้งวาดลง view ใหม่ เพื่อไม่ให้ render ที่ค้างอยู่เขียนทับหน้าปัจจุบัน
  const view = h('div', { class: 'view' });
  mainEl.replaceChildren(view);
  markActive(path);

  let found = null;
  for (const r of routes) {
    const m = path.match(r.re);
    if (m) { found = { mod: r.mod, params: Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])])) }; break; }
  }
  if (!found) {
    view.append(h('h1', {}, 'ไม่พบหน้านี้'), h('p', {}, h('a', { href: '#/' }, 'กลับหน้าแดชบอร์ด')));
    return;
  }
  try {
    const c = await found.mod.render(view, found.params);
    if (my !== token) { if (typeof c === 'function') c(); return; }
    cleanup = c;
    document.title = (found.mod.title ? found.mod.title + ' · ' : '') + 'C2 Coach';
  } catch (err) {
    console.error(err);
    view.replaceChildren(h('h1', {}, 'เกิดข้อผิดพลาด'), h('div', { class: 'notice bad' }, String(err?.message || err)));
  }
  if (moveFocus) { mainEl.focus({ preventScroll: true }); window.scrollTo(0, 0); }
}

export function startRouter(main) {
  mainEl = main;
  window.addEventListener('hashchange', () => handle(true));
  handle(false);
}

export function buildNav() {
  const item = (n) => h('a', { href: n.href }, h('span', { class: 'ico', 'aria-hidden': 'true' }, n.icon), h('span', {}, n.label));
  document.getElementById('sidenav').replaceChildren(...NAV.map(item));
  document.getElementById('tabbar').replaceChildren(
    ...NAV.filter((n) => n.primary).map(item),
    item({ href: '#/menu', label: 'เมนู', icon: '☰' }));
}
