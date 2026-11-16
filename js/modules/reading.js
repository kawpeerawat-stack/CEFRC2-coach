// โมดูล 5a — Reading Lab (จับเวลา + ตรวจด้วยเฉลยในเครื่อง)
import { h, card, add } from '../ui.js';
import { getAll } from '../db.js';
import { READING_ITEMS } from '../data/reading.js';
import { renderQuiz } from '../quiz.js';

export const title = 'Reading Lab';
const BASE = '/reading';

export async function itemList(items, base, module) {
  const latest = new Map();
  (await getAll('attempts')).filter((a) => a.module === module).sort((a, b) => a.createdAt.localeCompare(b.createdAt)).forEach((a) => latest.set(a.itemId, a));
  return h('ul', { class: 'list' }, items.map((it) => {
    const last = latest.get(it.id);
    return h('li', {}, h('a', { class: 'item-link', href: `#${base}/${it.id}` },
      h('strong', { lang: 'en' }, it.title), h('br'),
      h('small', { class: 'muted' }, `ระดับ ${it.level} · ${it.questions.length} ข้อ · ${it.minutes} นาที`),
      last && h('div', {}, h('small', {}, `ล่าสุด: ${last.score}/${last.total}`))));
  }));
}

export async function render(root, params) {
  if (params.id) {
    const item = READING_ITEMS.find((x) => x.id === params.id);
    if (!item) { root.append(h('h1', {}, 'ไม่พบบทอ่านนี้'), h('a', { href: '#' + BASE }, 'กลับ')); return; }
    add(root, h('p', {}, h('a', { href: '#' + BASE }, '← กลับไปรายการบทอ่าน')), h('h1', { lang: 'en' }, item.title));
    const passage = card('บทอ่าน', h('div', { class: 'passage', lang: 'en' }, item.passage.map((p) => h('p', {}, p))));
    return renderQuiz(root, { item, module: 'reading', skill: 'reading', stimulus: passage });
  }
  add(root,
    h('h1', {}, 'Reading Lab'),
    h('p', { class: 'muted' }, 'อ่านแบบจับเวลา เน้นคำถามจับนัย น้ำเสียง และจุดประสงค์ของผู้เขียน'),
    card('บทอ่านจับเวลา', await itemList(READING_ITEMS, BASE, 'reading')),
    card('อ่านนอกเวลา (Extensive reading)',
      h('p', {}, 'การอ่านปริมาณมากนอกแอปนับเป็นชั่วโมงฝึกด้วย บันทึกเวลาได้ที่หน้าแดชบอร์ด หัวข้อ "บันทึกเวลาฝึก"'),
      h('a', { class: 'btn', href: '#/' }, 'ไปหน้าแดชบอร์ด')));
}
