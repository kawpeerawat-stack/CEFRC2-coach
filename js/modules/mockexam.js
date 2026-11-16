// โมดูล 9 — Mock Exams: จับเวลาตามรูปแบบข้อสอบจริง (ใช้คู่กับข้อสอบตัวอย่างทางการที่ผู้ใช้เตรียมเอง)
import { h, card, btn, field, notice, toast, uid, add, fill } from '../ui.js';
import { getAll, put } from '../db.js';
import { MOCK_FORMATS } from '../data/mocks.js';
import { createTimer } from '../timer.js';
import { logSession } from '../sessions.js';
import { fmtDate } from '../dates.js';
import { navigate } from '../router.js';

export const title = 'ข้อสอบจำลอง';
const BASE = '/mock';

export async function render(root, params) {
  if (params.format && params.section) return run(root, params);
  const attempts = (await getAll('attempts')).filter((a) => a.module === 'mock').sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  add(root,
    h('h1', {}, 'ข้อสอบจำลอง'),
    notice('', 'แอปนี้มีเฉพาะรูปแบบและตัวจับเวลา ไม่มีตัวข้อสอบ ให้ใช้ข้อสอบตัวอย่างที่ผู้จัดสอบเผยแพร่อย่างเป็นทางการ แล้วบันทึกคะแนนที่นี่'),
    MOCK_FORMATS.map((f) => card(f.name,
      h('p', { class: 'muted' }, f.c2Note, ' · ', h('a', { href: f.official, target: '_blank', rel: 'noopener' }, 'เว็บไซต์ผู้จัดสอบ')),
      h('ul', { class: 'list' }, f.sections.map((x) => h('li', {}, h('a', { class: 'item-link', href: `#${BASE}/${f.id}/${x.id}` },
        h('strong', {}, x.name), h('br'), h('small', { class: 'muted' }, `${x.minutes} นาที · ${x.detail}`))))))),
    card('ผลที่บันทึกไว้', attempts.length
      ? h('div', { class: 'table-wrap' }, h('table', {},
        h('thead', {}, h('tr', {}, ['วันที่', 'ข้อสอบ', 'ส่วน', 'คะแนน', 'หมายเหตุ'].map((t) => h('th', { scope: 'col' }, t)))),
        h('tbody', {}, attempts.map((a) => h('tr', {}, [fmtDate(a.createdAt), a.formatName, a.sectionName, a.scoreText || '—', a.note || ''].map((t) => h('td', {}, t)))))))
      : h('p', { class: 'empty' }, 'ยังไม่มีผลข้อสอบจำลอง')));
}

function run(root, params) {
  const format = MOCK_FORMATS.find((f) => f.id === params.format);
  const section = format?.sections.find((x) => x.id === params.section);
  if (!section) { root.append(h('h1', {}, 'ไม่พบข้อสอบส่วนนี้'), h('a', { href: '#' + BASE }, 'กลับ')); return; }

  const timer = createTimer({ mode: 'down', seconds: section.minutes * 60, onEnd: () => { toast('หมดเวลา — วางปากกา', 6000); finish(); } });
  const stage = h('div');
  const toggle = btn('เริ่มจับเวลา', () => {
    if (timer.running()) { timer.pause(); toggle.textContent = 'ทำต่อ'; } else { timer.start(); toggle.textContent = 'หยุดชั่วคราว'; }
  }, 'primary');

  function finish() {
    timer.pause();
    const score = h('input', { type: 'text', inputmode: 'decimal', placeholder: format.scoreLabel });
    const note = h('input', { type: 'text', placeholder: 'เช่น ชุดข้อสอบที่ใช้ จุดที่พลาด' });
    fill(stage, card('บันทึกผล',
      h('p', {}, `ใช้เวลา ${Math.round(timer.elapsed() / 60)} นาที จาก ${section.minutes} นาที`),
      field(`คะแนน (${format.scoreLabel})`, score, 'ตรวจด้วยเฉลยทางการ งานเขียน/พูดให้ผู้ตรวจจริงหรือเกณฑ์ทางการประเมิน'),
      field('หมายเหตุ', note),
      btn('บันทึก', async () => {
        await put('attempts', { id: uid(), module: 'mock', itemId: `${format.id}/${section.id}`, formatName: format.name, sectionName: section.name, level: 'C2', score: null, total: null, scoreText: score.value.trim(), note: note.value.trim(), durationSec: timer.elapsed(), createdAt: new Date().toISOString() });
        await logSession({ minutes: Math.max(1, timer.elapsed() / 60), skill: section.skill, module: 'mock', kind: 'mock', note: `${format.name} — ${section.name}` });
        toast('บันทึกผลแล้ว');
        navigate(BASE);
      }, 'primary')));
  }

  stage.append(card('โหมดสอบ',
    h('p', {}, 'เตรียมข้อสอบตัวอย่างทางการให้พร้อม ปิดพจนานุกรมและเครื่องมือช่วยทั้งหมด แล้วเริ่มจับเวลา'),
    h('div', { class: 'row' }, h('strong', {}, 'เวลาที่เหลือ'), timer.el),
    h('div', { class: 'row' }, toggle, btn('ส่งข้อสอบ / จบ', finish))));
  add(root,
    h('p', {}, h('a', { href: '#' + BASE }, '← กลับ')),
    h('h1', {}, `${format.name} — ${section.name}`),
    h('p', { class: 'muted' }, `${section.minutes} นาที · ${section.detail}`),
    stage);
  return () => timer.destroy();
}
