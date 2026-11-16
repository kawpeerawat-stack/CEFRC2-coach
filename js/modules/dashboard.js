// โมดูล 1 — Dashboard: ชั่วโมงจริงเทียบแผน, streak, เรดาร์รายทักษะ, จุดตรวจถัดไป
import { h, card, btn, field, select, badge, notice, toast, uid, add, fmtNum, confirmDialog } from '../ui.js';
import { getAll, put, del } from '../db.js';
import { loadConfig, SKILLS, skillName } from '../config.js';
import { computePlan } from '../planner.js';
import { hoursChart, radarChart } from '../charts.js';
import { c2Ready, selfLevel, evidenceLevel, attemptLevel, levelLabel } from '../scoring.js';
import { CANDO } from '../data/cando.js';
import { isDue } from '../srs.js';
import { logSession } from '../sessions.js';
import { todayISO, fmtDate, diffDays } from '../dates.js';
import { refresh } from '../router.js';

export const title = 'แดชบอร์ด';
const EXAMS = ['EF SET', 'Aptis Advanced', 'IELTS Academic', 'Cambridge C2 Proficiency', 'ผู้ตรวจจริง (Human rater)', 'อื่น ๆ'];
const CEFR = ['', 'A2', 'B1', 'B1+', 'B2', 'B2+', 'C1', 'C1+', 'C2'];
const EXAM_SKILLS = [['listening', 'ฟัง'], ['reading', 'อ่าน'], ['speaking', 'พูด'], ['writing', 'เขียน']];

const tile = (label, value, sub) => h('div', { class: 'tile' }, h('dt', {}, label), h('dd', {}, value, sub && h('small', {}, ' ' + sub)));

function quickLog() {
  const date = h('input', { type: 'date', value: todayISO(), max: todayISO() });
  const minutes = h('input', { type: 'number', min: '1', max: '600', inputmode: 'numeric', value: '60' });
  const skill = select([['mixed', 'หลายทักษะ'], ...SKILLS.map((x) => [x.id, x.th])], 'mixed');
  const note = h('input', { type: 'text', placeholder: 'เช่น อ่านบทความ / คุยกับครูต่างชาติ' });
  return h('form', { onsubmit: async (e) => {
    e.preventDefault();
    if (!(Number(minutes.value) > 0)) { toast('ใส่จำนวนนาที'); return; }
    await logSession({ date: date.value || todayISO(), minutes: minutes.value, skill: skill.value, module: 'manual', kind: 'manual', note: note.value.trim() });
    toast('บันทึกเวลาฝึกแล้ว');
    refresh();
  } },
    h('div', { class: 'grid' }, field('วันที่', date), field('นาที', minutes), field('ทักษะ', skill)),
    field('ทำอะไร', note),
    h('button', { type: 'submit', class: 'btn primary' }, 'บันทึกเวลาฝึก'));
}

function checkpointForm(plan) {
  const date = h('input', { type: 'date', value: todayISO(), max: todayISO() });
  const exam = select(EXAMS, EXAMS[0]);
  const month = select([['', 'ไม่ผูกกับจุดตรวจ'], ...plan.checkpoints.map((c) => [String(c.month), `เดือนที่ ${c.month} — ${c.target}`])], plan.nextCheckpoint ? String(plan.nextCheckpoint.month) : '');
  const overall = h('input', { type: 'text', placeholder: 'เช่น 58 หรือ 6.5' });
  const cefr = select(CEFR.map((c) => [c, c || 'ไม่ระบุ']), '');
  const per = EXAM_SKILLS.map(([id, th]) => ({ id, th, input: h('input', { type: 'text', placeholder: 'คะแนนหรือระดับ' }) }));
  const note = h('input', { type: 'text' });
  return h('form', { onsubmit: async (e) => {
    e.preventDefault();
    await put('checkpoints', {
      id: uid(), date: date.value || todayISO(), exam: exam.value, planMonth: month.value === '' ? null : Number(month.value),
      overall: overall.value.trim(), cefr: cefr.value, skills: Object.fromEntries(per.map((p) => [p.id, p.input.value.trim()])), note: note.value.trim(), createdAt: new Date().toISOString(),
    });
    toast('บันทึกผลสอบภายนอกแล้ว');
    refresh();
  } },
    h('div', { class: 'grid' }, field('วันที่สอบ', date), field('ข้อสอบ', exam), field('จุดตรวจตามแผน', month)),
    h('div', { class: 'grid' }, field('คะแนนรวม', overall), field('ระดับ CEFR รวม', cefr)),
    h('div', { class: 'grid' }, per.map((p) => field(p.th, p.input))),
    field('หมายเหตุ', note),
    h('button', { type: 'submit', class: 'btn primary' }, 'บันทึกผลสอบ'));
}

export async function render(root) {
  const [cfg, sessions, checkpoints, cando, subs, vault, attempts] = await Promise.all(
    [loadConfig(), getAll('sessions'), getAll('checkpoints'), getAll('cando'), getAll('submissions'), getAll('vault'), getAll('attempts')]);
  const plan = computePlan(cfg, sessions, checkpoints);
  const states = new Map(cando.map((r) => [r.id, r.state]));
  const hasData = sessions.length + subs.length + vault.length + cando.length > 0;
  const backupAge = cfg.lastBackupAt ? diffDays(cfg.lastBackupAt.slice(0, 10), todayISO()) : null;
  const dueCount = vault.filter((c) => isDue(c)).length;
  const behind = plan.gap < -3;

  const self = SKILLS.map((x) => selfLevel(x.id, CANDO, states));
  const evidence = SKILLS.map((x) => (x.id === 'listening' || x.id === 'reading' ? attemptLevel(attempts, x.id) : evidenceLevel(subs, x.id)));
  const next = plan.nextCheckpoint;
  const tpl = plan.todayTemplate;

  add(root,
    h('h1', {}, 'แดชบอร์ด'),
    h('p', { class: 'muted' }, `เดือนที่ ${plan.month} จาก 24 · เฟส ${plan.phase.label} · เริ่มแผน ${fmtDate(plan.start)} · ครบกำหนด ${fmtDate(plan.end)}`),
    cfg.provider !== 'claude' && notice('', h('strong', {}, 'โหมดจำลอง (Mock AI): '), 'ผลประเมินงานเขียน/พูดยังไม่ใช่ของจริง ', h('a', { href: '#/settings' }, 'เชื่อมต่อ Claude ในหน้าตั้งค่า')),
    hasData && (backupAge == null || backupAge >= 7) && notice('', backupAge == null ? 'ยังไม่เคยสำรองข้อมูล ' : `สำรองข้อมูลล่าสุดเมื่อ ${backupAge} วันก่อน `, h('a', { href: '#/settings' }, 'สำรองข้อมูลตอนนี้')),

    h('dl', { class: 'tiles' },
      tile('ชั่วโมงฝึกสะสม', fmtNum(plan.actual, 1), `จาก ${fmtNum(plan.total)} ชม.`),
      tile('ควรได้ตามแผน ณ วันนี้', fmtNum(plan.plannedToDate, 1), 'ชม.'),
      tile('ส่วนต่างจากแผน', (plan.gap >= 0 ? '+' : '−') + fmtNum(Math.abs(plan.gap), 1), 'ชม.'),
      tile('ฝึกต่อเนื่อง', fmtNum(plan.streak), 'วัน'),
      tile('เฉลี่ย 4 สัปดาห์ล่าสุด', fmtNum(plan.avgWeekly, 1), 'ชม./สัปดาห์'),
      tile('ต้องทำต่อจากนี้', plan.requiredWeekly == null ? '—' : fmtNum(plan.requiredWeekly, 1), 'ชม./สัปดาห์')),
    behind
      ? notice('bad', `ช้ากว่าแผน ${fmtNum(-plan.gap, 1)} ชั่วโมง ถ้ารักษาอัตราเฉลี่ยปัจจุบัน จะได้ประมาณ ${fmtNum(plan.projectedTotal)} ชั่วโมงเมื่อครบ 24 เดือน (แผน ${fmtNum(plan.total)} ชั่วโมง)`)
      : null,
    h('p', { class: 'muted' }, 'ชั่วโมงฝึกบอกปริมาณความพยายาม ไม่ได้รับประกันระดับ การไปถึง C2 ยืนยันได้ด้วยผลสอบภายนอกเท่านั้น'),

    tpl && card('วันนี้ทำอะไร — ' + tpl.label,
      h('ol', {}, tpl.steps.map((st) => h('li', {}, h('a', { href: st.href }, st.label), ` (${st.min} นาที)`))),
      dueCount > 0 && h('p', {}, h('a', { href: '#/vault' }, `มีวลีถึงกำหนดทบทวน ${dueCount} รายการ`)),
      h('p', { class: 'muted' }, 'จุดเน้นของเฟสนี้: ' + plan.phase.focus.join(' · '))),

    card('ชั่วโมงฝึกสะสมเทียบแผน 24 เดือน', hoursChart(plan.series)),

    card('ระดับรายทักษะ',
      radarChart({ axes: SKILLS.map((x) => x.short), self, evidence, rings: [{ v: 1, label: 'B1' }, { v: 2, label: 'B2' }, { v: 3, label: 'C1' }, { v: 4, label: 'C1+' }, { v: 5, label: 'C2' }] }),
      h('div', { class: 'table-wrap' }, h('table', {},
        h('thead', {}, h('tr', {}, ['ทักษะ', 'ประเมินตนเอง', 'หลักฐานจากงาน', 'เป้าหมาย'].map((t) => h('th', { scope: 'col' }, t)))),
        h('tbody', {}, SKILLS.map((x, i) => h('tr', {}, h('th', { scope: 'row' }, x.th), h('td', {}, levelLabel(self[i])), h('td', {}, levelLabel(evidence[i])), h('td', {}, cfg.targets[x.id] || 'C2')))))),
      h('p', { class: 'muted' }, 'หลักฐานจากงานนับเฉพาะงานที่ประเมินด้วย AI จริง (ไม่นับโหมดจำลอง) และการส่งครั้งแรกของแต่ละงาน ', h('a', { href: '#/diagnostic' }, 'ไปประเมินตนเอง'))),

    card('สถานะ C2-ready',
      h('p', { class: 'muted' }, 'ต้องผ่าน 3 ครั้งติดกัน ในงาน 3 ประเภท โดยรวม ≥ 85 และไม่มีเกณฑ์ใดต่ำกว่า 4'),
      h('ul', { class: 'list' }, ['writing', 'spoken-production', 'spoken-interaction', 'mediation'].map((id) => {
        const r = c2Ready(subs, id);
        return h('li', { class: 'row' }, h('strong', {}, skillName(id)), r.ready ? badge('C2-ready', 'good') : badge(`ผ่านติดต่อกัน ${r.streak}/3`), h('small', { class: 'muted' }, `งานที่นับได้ ${r.counted} ชิ้น`));
      }))),

    card('จุดตรวจภายนอก',
      next
        ? h('p', {}, h('strong', {}, `ถัดไป: เดือนที่ ${next.month} (${fmtDate(next.date)}) — เป้า ${next.target}`), h('br'),
          next.daysLeft < 0 ? badge(`เลยกำหนด ${-next.daysLeft} วัน`, 'bad') : badge(`อีก ${next.daysLeft} วัน`), ' แนะนำ: ' + next.suggested)
        : h('p', {}, 'บันทึกผลครบทุกจุดตรวจแล้ว'),
      checkpoints.length > 0 && h('div', { class: 'table-wrap' }, h('table', {},
        h('thead', {}, h('tr', {}, ['วันที่', 'ข้อสอบ', 'รวม', 'CEFR', 'ฟัง/อ่าน/พูด/เขียน', ''].map((t) => h('th', { scope: 'col' }, t)))),
        h('tbody', {}, [...checkpoints].sort((a, b) => b.date.localeCompare(a.date)).map((c) => h('tr', {},
          h('td', {}, fmtDate(c.date)), h('td', {}, c.exam), h('td', {}, c.overall || '—'), h('td', {}, c.cefr || '—'),
          h('td', {}, EXAM_SKILLS.map(([id]) => c.skills?.[id] || '—').join(' / ')),
          h('td', {}, btn('ลบ', async () => { if (await confirmDialog('ลบผลสอบนี้?', 'ลบ')) { await del('checkpoints', c.id); refresh(); } }, 'small danger', { 'aria-label': `ลบผลสอบ ${c.exam}` }))))))),
      h('details', {}, h('summary', {}, 'บันทึกผลสอบภายนอก'), checkpointForm(plan))),

    card('บันทึกเวลาฝึก', h('p', { class: 'muted' }, 'งานในแอปบันทึกเวลาให้อัตโนมัติ ใช้ฟอร์มนี้สำหรับการฝึกนอกแอป'), quickLog()));
}
