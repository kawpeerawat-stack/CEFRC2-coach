// Workbench งานเขียน: โจทย์ → เขียน → ประเมิน → แก้ (Redo) → ปลดล็อกตัวอย่าง
// ใช้ร่วมกันโดย Writing Studio, Mediation Lab และ placement task
import { h, card, btn, link, badge, notice, toast, uid, countWords, field } from './ui.js';
import { getAll, put, getSetting, setSetting } from './db.js';
import { LEVELS } from './config.js';
import { ai } from './ai/index.js';
import { createTimer } from './timer.js';
import { logSession } from './sessions.js';
import { pickTargetPhrases } from './vault-api.js';
import { renderResult } from './feedback.js';
import { fmtDate } from './dates.js';

const byCreated = (a, b) => a.createdAt.localeCompare(b.createdAt);
const summary = (x) => (x.result ? `${x.result.total ?? '—'}/100 · ${x.result.overallLabel}${x.result.isMock ? ' (จำลอง)' : ''}` : 'ยังไม่ประเมิน');

export async function renderTaskList(root, { heading, intro, tasks, base, module, workLevel }) {
  const latest = new Map();
  (await getAll('submissions')).filter((x) => x.module === module).sort(byCreated).forEach((x) => latest.set(x.taskId, x));
  root.append(h('h1', {}, heading), h('p', { class: 'muted' }, intro || ''));
  for (const level of LEVELS) {
    const list = tasks.filter((t) => t.level === level && !t.diagnostic);
    if (!list.length) continue;
    root.append(card(`ระดับ ${level}${level === workLevel ? ' — ระดับที่ควรฝึกในเฟสนี้' : ''}`,
      h('ul', { class: 'list' }, list.map((t) => {
        const last = latest.get(t.id);
        return h('li', {}, h('a', { class: 'item-link', href: `#${base}/${t.id}` },
          h('strong', { lang: 'en' }, t.title), h('br'),
          h('small', { class: 'muted' }, [t.type, t.minWords && `≥ ${t.minWords} คำ`, t.minutes && `${t.minutes} นาที`].filter(Boolean).join(' · ')),
          last && h('div', {}, h('small', {}, `ล่าสุด: ฉบับที่ ${last.version} · ${summary(last)}`))));
      }))));
  }
}

export async function renderWorkbench(root, { module, skill, task, rubric, base }) {
  const all = (await getAll('submissions')).filter((x) => x.module === module && x.taskId === task.id).sort(byCreated);
  const lastRoot = all.length ? all[all.length - 1].rootId : null;
  const state = {
    versions: all.filter((x) => x.rootId === lastRoot),
    older: all.filter((x) => x.rootId !== lastRoot),
    phrases: [],
  };
  const draftKey = `draft:${module}:${task.id}`;
  const timer = createTimer({ mode: 'up', seconds: (task.minutes || 0) * 60 });
  const info = await ai.info();
  const body = h('div');
  let saveTimer;

  root.append(
    h('p', {}, link('← กลับไปรายการโจทย์', '#' + base)),
    h('h1', { lang: 'en' }, task.title),
    h('p', { class: 'row' }, badge(task.level), badge(task.type), task.minWords && h('small', {}, `อย่างน้อย ${task.minWords} คำ`), task.minutes && h('small', {}, `เวลาแนะนำ ${task.minutes} นาที`)),
    card('โจทย์',
      h('p', { lang: 'en', class: 'en' }, task.prompt),
      task.audience && h('p', {}, h('strong', {}, 'ผู้อ่านเป้าหมาย: '), h('span', { lang: 'en' }, task.audience)),
      (task.sources || []).map((x) => h('div', {}, h('h3', { lang: 'en' }, x.title), h('blockquote', { lang: 'en' }, x.text)))),
    body);

  async function draw(focusResult = false) {
    const last = state.versions[state.versions.length - 1];
    const version = state.versions.length + 1;
    state.phrases = state.versions.length ? (state.versions[0].targetPhrases || []) : (await pickTargetPhrases(2)).map((c) => c.chunk);
    const draft = await getSetting(draftKey, '');

    const count = h('span', { class: 'muted', 'aria-live': 'off' });
    const status = h('span', { role: 'status', class: 'muted' });
    const ta = h('textarea', { class: 'editor', lang: 'en', spellcheck: 'true', value: draft || last?.text || '' });
    const paint = () => { const n = countWords(ta.value); count.textContent = `${n} คำ${task.minWords ? ` / อย่างน้อย ${task.minWords}` : ''}`; };
    ta.addEventListener('input', () => {
      if (!timer.running()) timer.start();
      paint();
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => setSetting(draftKey, ta.value), 700);
    });
    paint();

    const submit = btn(version === 1 ? 'ส่งตรวจ' : `ส่งฉบับแก้ไข (ฉบับที่ ${version})`, async () => {
      const text = ta.value.trim();
      if (countWords(text) < 20) { toast('เขียนอย่างน้อย 20 คำก่อนส่งตรวจ'); return; }
      if (last && text === last.text) { toast('ยังไม่ได้แก้ไขข้อความ ลองแก้ตาม feedback ก่อนส่งอีกครั้ง'); return; }
      submit.disabled = true;
      timer.pause();
      status.textContent = 'กำลังประเมิน…';
      let result;
      try {
        result = await ai.rate(task, { text, targetPhrases: state.phrases, version }, rubric);
      } catch (err) {
        status.textContent = '';
        submit.disabled = false;
        toast(err.message, 6000);
        return;
      }
      const id = uid();
      const sub = {
        id, rootId: last ? last.rootId : id, version, module, skill, taskId: task.id, taskType: task.type, level: task.level,
        text, wordCount: countWords(text), durationSec: timer.elapsed(), targetPhrases: state.phrases, result, createdAt: new Date().toISOString(),
      };
      await put('submissions', sub);
      await logSession({ minutes: Math.max(1, timer.elapsed() / 60), skill, module, kind: 'loop', note: task.title });
      clearTimeout(saveTimer);
      await setSetting(draftKey, '');
      state.versions.push(sub);
      timer.reset();
      await draw(true);
    }, 'primary');

    const progress = state.versions.length > 0 && h('p', {}, h('strong', {}, 'ความคืบหน้าในรอบนี้: '),
      state.versions.map((x) => `ฉบับที่ ${x.version}: ${summary(x)}`).join(' → '));

    const history = [...state.older, ...state.versions];
    body.replaceChildren(
      info.isMock ? notice('', 'กำลังใช้โหมดจำลอง (Mock AI) — ใช้ทดสอบขั้นตอนได้ แต่คะแนนไม่ใช่การประเมินจริง เปลี่ยนได้ในหน้าตั้งค่า') : '',
      state.phrases.length ? card('วลีเป้าหมายของงานนี้ (ไม่เกิน 2 วลี)',
        h('ul', {}, state.phrases.map((p) => h('li', { lang: 'en', class: 'en' }, p))),
        h('p', { class: 'muted' }, 'ใช้เมื่อเข้ากับเนื้อหาจริงเท่านั้น ถ้าต้องฝืนใส่ ไม่นับว่าผ่าน')) : '',
      last ? renderResult(last.result, { locked: state.versions.length === 1, level: task.level, sourceId: last.id }) : '',
      card(version === 1 ? 'เขียนคำตอบ' : 'แก้ไขงาน (Redo)',
        version > 1 && h('p', {}, state.versions.length === 1
          ? 'แก้ข้อความด้านล่างตามจุดที่ถูกยกมา แล้วส่งฉบับแก้ไขเพื่อปลดล็อกตัวอย่าง'
          : 'แก้ต่อได้อีก หรือเริ่มรอบใหม่เมื่อพอใจแล้ว'),
        progress,
        h('div', { class: 'row' }, timer.el, btn('เริ่ม/หยุดเวลา', () => (timer.running() ? timer.pause() : timer.start()), 'small'), count),
        field('คำตอบของคุณครู (ภาษาอังกฤษ)', ta, 'ระบบบันทึกร่างอัตโนมัติในเครื่องนี้'),
        h('div', { class: 'row' }, submit, status,
          state.versions.length > 0 && btn('เริ่มรอบใหม่', async () => {
            state.older.push(...state.versions);
            state.versions = [];
            await setSetting(draftKey, '');
            timer.reset();
            await draw();
          }))),
      history.length ? card('ประวัติทุกฉบับ', history.map((x) => h('details', {},
        h('summary', {}, `${fmtDate(x.createdAt)} · ฉบับที่ ${x.version} · ${summary(x)} · ${x.wordCount} คำ`),
        h('blockquote', { lang: 'en', style: 'white-space:pre-wrap' }, x.text)))) : '');

    if (focusResult) document.getElementById('result-heading')?.focus();
  }

  await draw();
  return () => { clearTimeout(saveTimer); timer.destroy(); };
}
