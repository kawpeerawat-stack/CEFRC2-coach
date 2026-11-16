// โมดูล 5b — Listening Lab: แบบฝึกจับเวลา + ปรับความเร็ว + บันทึกชั่วโมงฟังนอกเวลา
import { h, card, btn, field, select, notice, toast, add, fill, fmtNum } from '../ui.js';
import { getAll, del } from '../db.js';
import { loadConfig } from '../config.js';
import { LISTENING_ITEMS } from '../data/listening.js';
import { renderQuiz } from '../quiz.js';
import { itemList } from './reading.js';
import { logSession } from '../sessions.js';
import { todayISO, fmtDate } from '../dates.js';
import { refresh } from '../router.js';

export const title = 'Listening Lab';
const BASE = '/listening';
const SPEEDS = [['0.75', '0.75×'], ['1', '1× (ปกติ)'], ['1.25', '1.25×']];

/** เครื่องเล่น: ใช้ไฟล์เสียงถ้ามี audioUrl ไม่เช่นนั้นใช้เสียงสังเคราะห์ของเบราว์เซอร์ */
function player(item, lang) {
  const speed = select(SPEEDS, '1');
  if (item.audioUrl) {
    const audio = h('audio', { controls: true, src: item.audioUrl, style: 'width:100%' });
    speed.addEventListener('change', () => { audio.playbackRate = Number(speed.value); });
    return { el: card('เสียง', audio, field('ความเร็ว', speed)), stop: () => audio.pause() };
  }
  const synth = window.speechSynthesis;
  const play = btn('▶ เล่นเสียง', () => {
    if (!synth) { toast('เบราว์เซอร์นี้ไม่มีเสียงสังเคราะห์'); return; }
    synth.cancel();
    const u = new SpeechSynthesisUtterance(item.ttsScript);
    u.lang = lang;
    u.rate = Number(speed.value);
    synth.speak(u);
  }, 'primary');
  return {
    el: card('เสียง',
      notice('', 'รายการนี้ใช้เสียงสังเคราะห์ของเบราว์เซอร์เพื่อทดสอบโครงเท่านั้น เฟส 2 จะเปลี่ยนเป็นไฟล์เสียงจริง'),
      h('div', { class: 'row' }, play, btn('■ หยุด', () => synth?.cancel())),
      field('ความเร็ว', speed, 'เปลี่ยนความเร็วแล้วกดเล่นใหม่')),
    stop: () => synth?.cancel(),
  };
}

function ownAudio() {
  const audio = h('audio', { controls: true, style: 'width:100%', hidden: true });
  const speed = select(SPEEDS, '1');
  speed.addEventListener('change', () => { audio.playbackRate = Number(speed.value); });
  const file = h('input', { type: 'file', accept: 'audio/*' });
  let url;
  file.addEventListener('change', () => {
    if (url) URL.revokeObjectURL(url);
    const f = file.files[0];
    if (!f) return;
    url = URL.createObjectURL(f);
    audio.src = url;
    audio.hidden = false;
    audio.playbackRate = Number(speed.value);
  });
  return card('ฝึกกับไฟล์เสียงของตัวเอง (Shadowing / Dictation)',
    h('p', {}, 'เลือกไฟล์เสียงจากเครื่อง เช่น พอดแคสต์ที่ดาวน์โหลดไว้ แล้วปรับความเร็วเพื่อพูดตามหรือเขียนตามคำบอก ไฟล์ไม่ถูกอัปโหลดไปที่ใด'),
    field('ไฟล์เสียง', file), field('ความเร็ว', speed), audio);
}

async function extensiveLog() {
  const sessions = (await getAll('sessions')).filter((x) => x.kind === 'extensive' && x.skill === 'listening').sort((a, b) => b.date.localeCompare(a.date));
  const hours = sessions.reduce((a, x) => a + x.minutes, 0) / 60;
  const date = h('input', { type: 'date', value: todayISO(), max: todayISO() });
  const minutes = h('input', { type: 'number', min: '1', max: '600', inputmode: 'numeric', value: '30' });
  const source = h('input', { type: 'text', placeholder: 'เช่น ชื่อพอดแคสต์หรือรายการ' });
  return card('บันทึกการฟังนอกเวลา (Extensive listening)',
    h('p', {}, h('strong', {}, `สะสม ${fmtNum(hours, 1)} ชั่วโมง`), ' — C2 ต้องฟังของจริงปริมาณมากนอกเหนือจากแบบฝึก'),
    h('form', { onsubmit: async (e) => {
      e.preventDefault();
      if (!(Number(minutes.value) > 0)) { toast('ใส่จำนวนนาที'); return; }
      await logSession({ date: date.value || todayISO(), minutes: minutes.value, skill: 'listening', module: 'listening', kind: 'extensive', note: source.value.trim() });
      toast('บันทึกแล้ว');
      refresh();
    } },
      h('div', { class: 'grid' }, field('วันที่', date), field('นาที', minutes)),
      field('ฟังอะไร', source),
      h('button', { type: 'submit', class: 'btn primary' }, 'บันทึก')),
    sessions.length > 0 && h('ul', { class: 'list' }, sessions.slice(0, 8).map((x) => h('li', { class: 'row' },
      h('span', {}, `${fmtDate(x.date)} · ${x.minutes} นาที${x.note ? ' · ' + x.note : ''}`),
      btn('ลบ', async () => { await del('sessions', x.id); refresh(); }, 'small', { 'aria-label': `ลบบันทึกวันที่ ${fmtDate(x.date)}` })))));
}

export async function render(root, params) {
  const cfg = await loadConfig();
  if (params.id) {
    const item = LISTENING_ITEMS.find((x) => x.id === params.id);
    if (!item) { root.append(h('h1', {}, 'ไม่พบรายการนี้'), h('a', { href: '#' + BASE }, 'กลับ')); return; }
    add(root, h('p', {}, h('a', { href: '#' + BASE }, '← กลับไปรายการแบบฝึกฟัง')), h('h1', { lang: 'en' }, item.title));
    const p = player(item, cfg.speechLang);
    const script = item.ttsScript && h('details', {}, h('summary', {}, 'ดู transcript'), h('p', { lang: 'en', class: 'en' }, item.ttsScript));
    const off = renderQuiz(root, { item, module: 'listening', skill: 'listening', stimulus: p.el, afterSubmit: script });
    return () => { p.stop(); off(); };
  }
  add(root,
    h('h1', {}, 'Listening Lab'),
    h('p', { class: 'muted' }, 'แบบฝึกจับเวลา ปรับความเร็วได้ และบันทึกชั่วโมงฟังนอกเวลา'),
    card('แบบฝึกฟังจับเวลา', await itemList(LISTENING_ITEMS, BASE, 'listening')),
    ownAudio(),
    await extensiveLog());
}
