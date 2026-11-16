// UI helpers — สร้าง DOM โดยไม่ใช้ innerHTML กับข้อมูลผู้ใช้ (กัน XSS)
const SVG_NS = 'http://www.w3.org/2000/svg';
const PROPS = new Set(['value', 'checked', 'disabled', 'selected', 'hidden', 'open', 'textContent']);

function append(el, kids) {
  for (const k of kids.flat(Infinity)) {
    if (k == null || k === false || k === true) continue;
    el.append(k instanceof Node ? k : document.createTextNode(String(k)));
  }
}

function apply(el, attrs, svg) {
  let deferredValue;
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') { svg ? el.setAttribute('class', v) : (el.className = v); }
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'value') deferredValue = v;
    else if (!svg && PROPS.has(k)) el[k] = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  return deferredValue;
}

/** h('div', {class:'x', onclick}, child, ...) */
export function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  const value = apply(el, attrs, false);
  append(el, kids);
  if (value !== undefined) el.value = value; // ตั้งค่าหลังใส่ <option> แล้ว
  return el;
}

/** SVG element */
export function s(tag, attrs, ...kids) {
  const el = document.createElementNS(SVG_NS, tag);
  apply(el, attrs, true);
  append(el, kids);
  return el;
}

/** แทนที่ลูกทั้งหมดของ el (ข้ามค่า null/false ได้ ต่างจาก replaceChildren) */
export function fill(el, ...kids) {
  el.replaceChildren();
  append(el, kids);
  return el;
}

/** ต่อท้ายลูกให้ el (ข้ามค่า null/false ได้ ต่างจาก Element.append) */
export function add(el, ...kids) {
  append(el, kids);
  return el;
}

export const uid = () => (crypto.randomUUID ? crypto.randomUUID() : 'id-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10));

let seq = 0;
/** label + control + hint (ผูก label กับ control อัตโนมัติ) */
export function field(label, control, hint) {
  if (!control.id) control.id = 'f' + (++seq);
  return h('label', { class: 'field', for: control.id }, label, hint && h('span', { class: 'hint' }, hint), control);
}

export const card = (title, ...kids) => h('section', { class: 'card' }, title && h('h2', {}, title), ...kids);
export const btn = (label, onclick, cls = '', attrs = {}) => h('button', { type: 'button', class: 'btn ' + cls, onclick, ...attrs }, label);
export const link = (label, href, cls = '') => h('a', { href, class: cls }, label);
export const badge = (text, cls = '') => h('span', { class: 'badge ' + cls }, text);
export const notice = (cls, ...kids) => h('div', { class: 'notice ' + cls, role: 'note' }, ...kids);
export const empty = (text) => h('p', { class: 'empty' }, text);

export function select(options, value, attrs = {}) {
  return h('select', { ...attrs, value }, options.map((o) => {
    const [v, l] = Array.isArray(o) ? o : [o, o];
    return h('option', { value: v }, l);
  }));
}

let toastTimer;
export function toast(msg, ms = 3200) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), ms);
}

/** กล่องยืนยันแบบ in-page (คืนค่า Promise<boolean>) */
export function confirmDialog(message, okLabel = 'ยืนยัน') {
  return new Promise((resolve) => {
    if (typeof HTMLDialogElement === 'undefined') return resolve(window.confirm(message));
    const dlg = h('dialog', { 'aria-label': 'ยืนยันการทำรายการ' },
      h('p', {}, message),
      h('div', { class: 'row end' },
        btn('ยกเลิก', () => dlg.close('no')),
        btn(okLabel, () => dlg.close('yes'), 'primary')));
    dlg.addEventListener('close', () => { resolve(dlg.returnValue === 'yes'); dlg.remove(); });
    document.body.append(dlg);
    dlg.showModal();
  });
}

export function download(filename, text, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = h('a', { href: url, download: filename });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const countWords = (t) => (t.trim().match(/\S+/g) || []).length;
export const fmtClock = (sec) => `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;
export const fmtNum = (n, d = 0) => Number(n).toLocaleString('th-TH', { maximumFractionDigits: d, minimumFractionDigits: d });
