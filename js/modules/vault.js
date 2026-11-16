// โมดูล 6 — Vault: (ก) คลังวลีพร้อมทบทวนแบบเว้นระยะ SM-2  (ข) คลังข้อผิดพลาดส่วนตัว
import { h, card, btn, field, select, badge, toast, empty, add, fill, confirmDialog } from '../ui.js';
import { getAll, put, del } from '../db.js';
import { LEVELS } from '../config.js';
import { review, isDue, GRADES } from '../srs.js';
import { addCard, addError, ERROR_CATEGORIES } from '../vault-api.js';
import { logSession } from '../sessions.js';
import { fmtDate } from '../dates.js';
import { refresh } from '../router.js';

export const title = 'คลังวลีและข้อผิดพลาด';
const catLabel = (id) => (ERROR_CATEGORIES.find(([k]) => k === id) || [id, id])[1];

function reviewBox(due) {
  const box = h('div');
  let i = 0;
  let done = 0;
  const started = Date.now();
  async function show() {
    if (i >= due.length) {
      if (done) await logSession({ minutes: Math.max(1, (Date.now() - started) / 60000), skill: 'mixed', module: 'vault', kind: 'review', note: `ทบทวน ${done} วลี` });
      fill(box, h('p', {}, done ? `ทบทวนครบ ${done} วลีแล้ว 👍` : 'ไม่มีวลีที่ถึงกำหนดทบทวนวันนี้'));
      return;
    }
    const c = due[i];
    const answer = h('div', { hidden: true },
      h('blockquote', { lang: 'en' }, h('strong', {}, c.chunk)),
      c.example && h('p', { lang: 'en', class: 'en' }, c.example),
      h('p', {}, 'จำได้แค่ไหน?'),
      h('div', { class: 'row' }, GRADES.map((g) => btn(g.label, async () => { await put('vault', review(c, g.q)); i += 1; done += 1; show(); }))));
    const reveal = btn('ดูคำตอบ', () => { answer.hidden = false; reveal.hidden = true; }, 'primary');
    fill(box,
      h('p', { class: 'muted' }, `วลีที่ ${i + 1} จาก ${due.length}`),
      h('p', {}, h('strong', {}, 'นึกวลีภาษาอังกฤษจากคำใบ้นี้: '), c.cue || '(ไม่มีคำใบ้ — นึกจากตัวอย่างประโยค)'),
      reveal, answer);
  }
  show();
  return box;
}

function addCardForm() {
  const chunk = h('input', { type: 'text', lang: 'en', required: true, placeholder: 'เช่น put something to use' });
  const cue = h('input', { type: 'text', required: true, placeholder: 'เช่น นำไปใช้ประโยชน์ / ใช้แทน use' });
  const example = h('textarea', { lang: 'en', style: 'min-height:4.5rem', placeholder: 'ประโยคตัวอย่างที่เจอจริง' });
  const level = select([['', 'ไม่ระบุ'], ...LEVELS], '');
  return h('form', { onsubmit: async (e) => {
    e.preventDefault();
    const { duplicate } = await addCard({ chunk: chunk.value, cue: cue.value, example: example.value, level: level.value, source: 'manual' });
    toast(duplicate ? 'มีวลีนี้ในคลังอยู่แล้ว' : 'เพิ่มวลีแล้ว');
    if (!duplicate) refresh();
  } },
    field('วลี (ภาษาอังกฤษ)', chunk), field('คำใบ้ / ความหมาย', cue, 'ใช้เป็นโจทย์ตอนทบทวน'),
    field('ตัวอย่างประโยค', example), field('ระดับ', level),
    h('button', { type: 'submit', class: 'btn primary' }, 'เพิ่มเข้าคลัง'));
}

function addErrorForm() {
  const category = select(ERROR_CATEGORIES, 'article');
  const wrong = h('input', { type: 'text', lang: 'en', required: true, placeholder: 'ที่เขียน/พูดผิด' });
  const correct = h('input', { type: 'text', lang: 'en', placeholder: 'ที่ถูกต้อง' });
  const note = h('input', { type: 'text', placeholder: 'กฎหรือข้อสังเกตสั้น ๆ' });
  return h('form', { onsubmit: async (e) => {
    e.preventDefault();
    const { repeated } = await addError({ category: category.value, wrong: wrong.value, correct: correct.value, note: note.value });
    toast(repeated ? 'พบข้อผิดพลาดเดิม นับเพิ่ม 1 ครั้ง' : 'บันทึกแล้ว');
    refresh();
  } },
    field('หมวด', category), field('ที่ผิด', wrong), field('ที่ถูก', correct), field('หมายเหตุ', note),
    h('button', { type: 'submit', class: 'btn primary' }, 'บันทึกข้อผิดพลาด'));
}

export async function render(root) {
  const cards = (await getAll('vault')).sort((a, b) => a.due.localeCompare(b.due));
  const errors = (await getAll('errors')).sort((a, b) => Number(a.resolved) - Number(b.resolved) || b.count - a.count);
  const due = cards.filter((c) => isDue(c));
  const open = errors.filter((e) => !e.resolved);

  add(root,
    h('h1', {}, 'คลังวลีและข้อผิดพลาด'),
    h('p', { class: 'muted' }, `วลี ${cards.length} รายการ (ถึงกำหนดทบทวน ${due.length}) · ข้อผิดพลาดที่ยังต้องแก้ ${open.length} รายการ`),
    card(`ทบทวนวันนี้ (${due.length})`, reviewBox(due)),
    card('คลังข้อผิดพลาดส่วนตัว',
      h('p', { class: 'muted' }, 'ข้อผิดพลาดที่เกิดซ้ำ เรียงตามจำนวนครั้งที่พบ ก่อนส่งงานทุกครั้งให้ดูรายการนี้'),
      errors.length ? h('ul', { class: 'list' }, errors.map((e) => h('li', {},
        badge(catLabel(e.category)), ' ', badge(`พบ ${e.count} ครั้ง`, e.count >= 3 ? 'bad' : ''), e.resolved && badge('แก้ได้แล้ว', 'good'),
        h('div', {}, h('span', { lang: 'en', class: 'en' }, e.wrong), e.correct && h('span', {}, ' → ', h('strong', { lang: 'en', class: 'en' }, e.correct))),
        e.note && h('div', { class: 'muted' }, e.note),
        h('div', { class: 'row' },
          btn('เจออีกครั้ง +1', async () => { await addError(e); refresh(); }, 'small'),
          btn(e.resolved ? 'ยังไม่หาย' : 'แก้ได้แล้ว', async () => { await put('errors', { ...e, resolved: !e.resolved }); refresh(); }, 'small'),
          btn('ลบ', async () => { if (await confirmDialog('ลบข้อผิดพลาดนี้ออกจากคลัง?', 'ลบ')) { await del('errors', e.id); refresh(); } }, 'small danger')))))
        : empty('ยังไม่มีข้อผิดพลาดในคลัง — เก็บได้จากผลประเมินงานเขียน/พูด หรือเพิ่มเองด้านล่าง'),
      h('details', {}, h('summary', {}, 'เพิ่มข้อผิดพลาดเอง'), addErrorForm())),
    card('เพิ่มวลีใหม่', h('p', { class: 'muted' }, 'เก็บวลีที่เจอจากการอ่าน/ฟังจริง วันละ 1–2 วลีก็พอ'), addCardForm()),
    card(`วลีทั้งหมด (${cards.length})`,
      cards.length ? h('ul', { class: 'list' }, cards.map((c) => h('li', {},
        h('strong', { lang: 'en', class: 'en' }, c.chunk), ' ', c.level && badge(c.level),
        h('div', { class: 'muted' }, `${c.cue || '—'} · ทบทวนครั้งถัดไป ${fmtDate(c.due)} · ทบทวนแล้ว ${c.reps} ครั้ง`),
        btn('ลบ', async () => { if (await confirmDialog(`ลบ "${c.chunk}" ออกจากคลัง?`, 'ลบ')) { await del('vault', c.id); refresh(); } }, 'small danger'))))
        : empty('ยังไม่มีวลีในคลัง')));
}
