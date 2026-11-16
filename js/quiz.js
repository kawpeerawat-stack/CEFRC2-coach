// แบบฝึกปรนัยจับเวลา ตรวจด้วยเฉลยในเครื่อง (ใช้ร่วมกันโดย Reading Lab และ Listening Lab)
import { h, card, btn, badge, toast, uid, fill } from './ui.js';
import { put } from './db.js';
import { createTimer } from './timer.js';
import { logSession } from './sessions.js';

const TAGS = { detail: 'รายละเอียด', inference: 'อนุมาน', purpose: 'จุดประสงค์', tone: 'น้ำเสียง', vocab: 'คำศัพท์' };

/**
 * @param opts { item, module, skill, stimulus: Node (บทอ่านหรือเครื่องเล่นเสียง), afterSubmit?: Node }
 * @returns cleanup function
 */
export function renderQuiz(root, { item, module, skill, stimulus, afterSubmit }) {
  const timer = createTimer({ mode: 'down', seconds: item.minutes * 60, onEnd: () => toast('หมดเวลาแล้ว ส่งคำตอบได้เลย') });
  const result = h('div', { role: 'status' });
  const stage = h('div');

  const start = btn('เริ่มทำ (เริ่มจับเวลา)', () => {
    timer.start();
    const groups = item.questions.map((q, qi) => {
      const name = `${item.id}-${q.id}`;
      const note = h('div');
      const fs = h('fieldset', {},
        h('legend', {}, `${qi + 1}. `, h('span', { lang: 'en' }, q.stem), ' ', badge(TAGS[q.tag] || q.tag)),
        q.options.map((opt, oi) => h('label', { class: 'choice' }, h('input', { type: 'radio', name, value: String(oi) }), h('span', { lang: 'en' }, opt))),
        note);
      return { q, fs, note, name };
    });

    const submit = btn('ส่งคำตอบ', async () => {
      const answers = groups.map((g) => { const c = g.fs.querySelector('input:checked'); return c ? Number(c.value) : null; });
      if (answers.includes(null)) { toast('ยังตอบไม่ครบทุกข้อ'); return; }
      timer.pause();
      submit.disabled = true;
      let score = 0;
      groups.forEach((g, i) => {
        const ok = answers[i] === g.q.answer;
        if (ok) score += 1;
        g.fs.querySelectorAll('input').forEach((el) => { el.disabled = true; });
        fill(g.note,
          badge(ok ? 'ถูก' : 'ผิด', ok ? 'good' : 'bad'),
          !ok && h('span', {}, ' คำตอบที่ถูก: ', h('strong', { lang: 'en' }, g.q.options[g.q.answer])),
          h('p', { class: 'muted' }, g.q.explanation));
      });
      const total = groups.length;
      await put('attempts', { id: uid(), module, itemId: item.id, level: item.level, score, total, answers, durationSec: timer.elapsed(), createdAt: new Date().toISOString() });
      await logSession({ minutes: Math.max(1, timer.elapsed() / 60), skill, module, kind: 'loop', note: item.title });
      result.replaceChildren(card('ผลแบบฝึก',
        h('p', { class: 'headline' }, `${score}/${total} ข้อ (${Math.round(score / total * 100)}%)`),
        h('p', { class: 'muted' }, `ข้อสอบระดับ ${item.level} · ถือว่าผ่านระดับนี้เมื่อได้ 70% ขึ้นไป`),
        afterSubmit));
      result.scrollIntoView({ block: 'nearest' });
    }, 'primary');

    stage.replaceChildren(
      card(null, h('div', { class: 'row' }, h('strong', {}, 'เวลาที่เหลือ'), timer.el)),
      stimulus,
      card('คำถาม', groups.map((g) => g.fs), submit),
      result);
  }, 'primary');

  stage.append(card(null,
    h('p', {}, `${item.questions.length} ข้อ · ${item.minutes} นาที · เนื้อหาจะแสดงเมื่อกดเริ่ม`), start));
  root.append(stage);
  return () => timer.destroy();
}
