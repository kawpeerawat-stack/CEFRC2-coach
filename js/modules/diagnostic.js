// โมดูล 2 — Diagnostic + Can-do tracker
import { h, card, badge, add, fill } from '../ui.js';
import { getAll, put } from '../db.js';
import { SKILLS, LEVELS, loadConfig } from '../config.js';
import { CANDO, CANDO_STATES } from '../data/cando.js';
import { selfLevel, levelLabel } from '../scoring.js';

export const title = 'วัดระดับ';

export async function render(root) {
  const cfg = await loadConfig();
  const states = new Map((await getAll('cando')).map((r) => [r.id, r.state]));
  const summary = h('div');

  function drawSummary() {
    fill(summary, h('div', { class: 'table-wrap' }, h('table', {},
      h('thead', {}, h('tr', {}, ['ทักษะ', 'ระดับจากการประเมินตนเอง', 'ประเมินแล้ว', 'เป้าหมาย'].map((t) => h('th', { scope: 'col' }, t)))),
      h('tbody', {}, SKILLS.map((sk) => {
        const items = CANDO.filter((c) => c.skill === sk.id);
        const rated = items.filter((c) => states.has(c.id)).length;
        return h('tr', {}, h('th', { scope: 'row' }, sk.th), h('td', {}, levelLabel(selfLevel(sk.id, CANDO, states))), h('td', {}, `${rated}/${items.length} ข้อ`), h('td', {}, cfg.targets[sk.id] || 'C2'));
      })))));
  }

  function statement(c) {
    return h('fieldset', {},
      h('legend', { lang: 'en' }, c.text),
      h('div', { class: 'row' }, CANDO_STATES.map((st) => h('label', { class: 'choice' },
        h('input', { type: 'radio', name: 'cando-' + c.id, value: String(st.value), checked: states.get(c.id) === st.value,
          onchange: async () => { states.set(c.id, st.value); await put('cando', { id: c.id, state: st.value, updatedAt: new Date().toISOString() }); drawSummary(); } }),
        h('span', {}, st.label)))));
  }

  drawSummary();
  add(root,
    h('h1', {}, 'วัดระดับ (Diagnostic)'),
    h('p', { class: 'muted' }, 'ใช้สองทางประกอบกัน: ประเมินตนเองด้วย Can-do และทำงานจริงให้มีหลักฐาน ระดับที่แท้จริงต้องยืนยันด้วยข้อสอบภายนอก'),
    card('สรุประดับรายทักษะ', summary,
      h('p', { class: 'muted' }, 'ได้ระดับใดเมื่อเลือก "ทำได้มั่นใจ" ครบทุกข้อของระดับนั้นและระดับที่ต่ำกว่า')),
    card('งานวัดระดับ (Placement)',
      h('ul', { class: 'list' },
        h('li', {}, h('a', { class: 'item-link', href: '#/writing/diag-writing' }, h('strong', {}, 'งานเขียนวัดระดับ'), h('br'), h('small', { class: 'muted' }, '150 คำขึ้นไป · 25 นาที · ต้องเชื่อมต่อ Claude จึงจะได้ผลประเมินจริง'))),
        h('li', {}, h('a', { class: 'item-link', href: '#/reading' }, h('strong', {}, 'แบบฝึกอ่านจับเวลา'), h('br'), h('small', { class: 'muted' }, 'เริ่มที่ระดับ B2 ถ้าได้ 70% ขึ้นไปให้ทำระดับ C1 ต่อ'))),
        h('li', {}, h('a', { class: 'item-link', href: '#/listening' }, h('strong', {}, 'แบบฝึกฟังจับเวลา'), h('br'), h('small', { class: 'muted' }, 'ตรวจด้วยเฉลยในเครื่อง'))),
        h('li', {}, h('a', { class: 'item-link', href: '#/' }, h('strong', {}, 'บันทึกผลสอบภายนอก'), h('br'), h('small', { class: 'muted' }, 'เช่น EF SET เป็นจุดตั้งต้น (Baseline) ที่หน้าแดชบอร์ด'))))),
    h('h2', {}, 'Can-do checklist'),
    SKILLS.map((sk) => h('details', { class: 'card' },
      h('summary', {}, `${sk.th} (${sk.en})`),
      LEVELS.map((lv) => {
        const items = CANDO.filter((c) => c.skill === sk.id && c.level === lv);
        return items.length ? h('div', {}, h('h3', {}, badge(lv)), items.map(statement)) : null;
      }))));
}
