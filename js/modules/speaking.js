// โมดูล 4 — Speaking Studio
// หลักการ: ระหว่างพูดแสดงแค่เวลา ระดับเสียง และ transcript สด / feedback ทั้งหมดมาหลังจบเทิร์น
// transcript ต้องให้ผู้ใช้แก้ได้ก่อนให้คะแนน เพื่อไม่ให้ความผิดพลาดของระบบถอดเสียงกลายเป็นคะแนนภาษา
import { h, card, btn, link, badge, notice, toast, uid, countWords, field, fill, add } from '../ui.js';
import { getAll, put } from '../db.js';
import { loadConfig, LEVELS } from '../config.js';
import { computePlan } from '../planner.js';
import { ai } from '../ai/index.js';
import { createTimer } from '../timer.js';
import { logSession } from '../sessions.js';
import { renderResult } from '../feedback.js';
import { SPEAKING_TASKS } from '../data/tasks.js';
import { RUBRICS } from '../data/rubrics.js';

export const title = 'Speaking Studio';
const BASE = '/speaking';
const skillOf = (task) => (task.mode === 'interaction' ? 'spoken-interaction' : 'spoken-production');
const byCreated = (a, b) => a.createdAt.localeCompare(b.createdAt);

export async function render(root, params) {
  if (params.id) {
    const task = SPEAKING_TASKS.find((t) => t.id === params.id);
    if (!task) { root.append(h('h1', {}, 'ไม่พบโจทย์นี้'), h('a', { href: '#' + BASE }, 'กลับ')); return; }
    return studio(root, task);
  }
  const cfg = await loadConfig();
  const plan = computePlan(cfg, await getAll('sessions'));
  const latest = new Map();
  (await getAll('submissions')).filter((x) => x.module === 'speaking').sort(byCreated).forEach((x) => latest.set(x.taskId, x));
  root.append(h('h1', {}, 'Speaking Studio'), h('p', { class: 'muted' }, 'อัดเสียง → ตรวจแก้ transcript → รับผลประเมิน → พูดซ้ำ (Redo)'));
  for (const level of LEVELS) {
    const list = SPEAKING_TASKS.filter((t) => t.level === level);
    if (!list.length) continue;
    root.append(card(`ระดับ ${level}${level === plan.phase.workLevel ? ' — ระดับที่ควรฝึกในเฟสนี้' : ''}`,
      h('ul', { class: 'list' }, list.map((t) => {
        const last = latest.get(t.id);
        return h('li', {}, h('a', { class: 'item-link', href: `#${BASE}/${t.id}` },
          h('strong', { lang: 'en' }, t.title), ' ', t.mode === 'interaction' && badge('Devil\'s Advocate'), h('br'),
          h('small', { class: 'muted' }, `${t.type} · ประมาณ ${t.minutes} นาที`),
          last?.result && h('div', {}, h('small', {}, `ล่าสุด: ${last.result.total ?? '—'}/100 · ${last.result.overallLabel}${last.result.isMock ? ' (จำลอง)' : ''}`))));
      }))));
  }
}

async function studio(root, task) {
  const cfg = await loadConfig();
  const info = await ai.info();
  const skill = skillOf(task);
  const prior = (await getAll('submissions')).filter((x) => x.module === 'speaking' && x.taskId === task.id).sort(byCreated);
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const canRecord = !!(navigator.mediaDevices?.getUserMedia && window.MediaRecorder);

  // สถานะของรอบปัจจุบัน
  let rootId = null;
  let version = 1;
  let turns = [];            // { role: 'user'|'examiner', text, durationSec }
  let stream, recorder, chunks = [], audioUrl = null, recog = null, audioCtx = null, raf = 0;
  let recording = false, baseText = '', finalText = '';
  const timer = createTimer({ mode: 'up', seconds: task.minutes * 60 });

  const stage = h('div');
  const turnsBox = h('div');
  const resultBox = h('div');
  const vu = h('span');
  const live = h('p', { class: 'live', lang: 'en', 'aria-live': 'off' });

  add(root,
    h('p', {}, link('← กลับไปรายการโจทย์', '#' + BASE)),
    h('h1', { lang: 'en' }, task.title),
    h('p', { class: 'row' }, badge(task.level), badge(task.type), badge(task.mode === 'interaction' ? 'พูดโต้ตอบ' : 'พูดนำเสนอ')),
    info.isMock && notice('', 'กำลังใช้โหมดจำลอง (Mock AI) — ใช้ทดสอบขั้นตอนได้ แต่คะแนนไม่ใช่การประเมินจริง'),
    card('โจทย์', h('p', { lang: 'en', class: 'en' }, task.prompt), h('p', { class: 'muted' }, `พูดประมาณ ${task.minutes} นาที`)),
    turnsBox, stage, resultBox);

  function stopMedia() {
    recording = false;
    cancelAnimationFrame(raf);
    try { recog?.stop(); } catch { /* ignore */ }
    recog = null;
    try { if (recorder && recorder.state !== 'inactive') recorder.stop(); } catch { /* ignore */ }
    stream?.getTracks().forEach((t) => t.stop());
    stream = null;
    audioCtx?.close().catch(() => {});
    audioCtx = null;
  }

  function meter(src) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      audioCtx.createMediaStreamSource(src).connect(analyser);
      const buf = new Uint8Array(analyser.fftSize);
      const tick = () => {
        analyser.getByteTimeDomainData(buf);
        let sum = 0;
        for (const v of buf) sum += ((v - 128) / 128) ** 2;
        vu.style.width = Math.min(100, Math.sqrt(sum / buf.length) * 320) + '%';
        raf = requestAnimationFrame(tick);
      };
      tick();
    } catch { /* ไม่มี AudioContext ก็ยังอัดได้ */ }
  }

  function recognise() {
    if (!SR) return;
    baseText = ''; finalText = '';
    recog = new SR();
    recog.lang = cfg.speechLang;
    recog.continuous = true;
    recog.interimResults = true;
    recog.onresult = (e) => {
      let fin = '', interim = '';
      for (let i = 0; i < e.results.length; i++) {
        if (e.results[i].isFinal) fin += e.results[i][0].transcript + ' '; else interim += e.results[i][0].transcript;
      }
      finalText = baseText + fin;
      live.textContent = finalText + interim;
    };
    recog.onend = () => { if (recording) { baseText = finalText; try { recog.start(); } catch { /* ignore */ } } };
    recog.onerror = () => {};
    try { recog.start(); } catch { /* ignore */ }
  }

  async function startRecording() {
    resultBox.replaceChildren();
    if (!canRecord) { showReview(''); return; }
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
    catch { toast('เข้าถึงไมโครโฟนไม่ได้ — พิมพ์สิ่งที่พูดเองได้ในช่อง transcript', 5000); showReview(''); return; }
    chunks = [];
    recorder = new MediaRecorder(stream);
    recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    recorder.onstop = () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      audioUrl = chunks.length ? URL.createObjectURL(new Blob(chunks, { type: recorder.mimeType })) : null;
      showReview(finalText.trim());
    };
    recording = true;
    live.textContent = SR ? '' : '(เบราว์เซอร์นี้ไม่มีระบบถอดเสียงอัตโนมัติ — พิมพ์ transcript เองหลังหยุดอัด)';
    recorder.start();
    meter(stream);
    recognise();
    timer.reset();
    timer.start();
    // ขั้นที่ 1: ระหว่างพูด — ไม่มี feedback ด้านภาษา
    fill(stage, card('กำลังอัดเสียง',
      h('div', { class: 'row' }, timer.el, btn('หยุด', () => { timer.pause(); stopMedia(); }, 'primary')),
      h('div', { class: 'vu', role: 'img', 'aria-label': 'ระดับเสียงไมโครโฟน' }, vu),
      h('h3', {}, 'Transcript สด'), live));
  }

  // ขั้นที่ 2: หลังจบเทิร์น — ตรวจแก้ transcript ก่อน
  function showReview(text) {
    const ta = h('textarea', { lang: 'en', spellcheck: 'true', value: text });
    fill(stage, card('ตรวจแก้ transcript ก่อนให้คะแนน',
      h('p', {}, 'แก้ให้ตรงกับที่พูดจริง (รวมคำที่พูดผิดด้วย) ระบบถอดเสียงอาจฟังสำเนียงไทยผิด ซึ่งไม่ควรกลายเป็นคะแนนภาษา'),
      audioUrl && h('audio', { controls: true, src: audioUrl, style: 'width:100%' }),
      field('Transcript ของเทิร์นนี้', ta),
      h('div', { class: 'row' },
        btn('ใช้เทิร์นนี้', () => {
          const t = ta.value.trim();
          if (countWords(t) < 5) { toast('transcript สั้นเกินไป'); return; }
          turns.push({ role: 'user', text: t, durationSec: timer.elapsed() });
          drawTurns();
          showNext();
        }, 'primary'),
        btn('ทิ้งแล้วอัดใหม่', showNext))));
  }

  function showNext() {
    const userTurns = turns.filter((t) => t.role === 'user');
    const lastIsUser = turns.length && turns[turns.length - 1].role === 'user';
    const status = h('span', { role: 'status', class: 'muted' });
    fill(stage, card(userTurns.length ? 'เทิร์นถัดไป' : 'เริ่มพูด',
      !canRecord && notice('', 'เบราว์เซอร์นี้อัดเสียงไม่ได้ — กด "เริ่มอัดเสียง" เพื่อพิมพ์ transcript เองแทน'),
      h('div', { class: 'row' },
        btn(userTurns.length ? 'อัดเทิร์นถัดไป' : 'เริ่มอัดเสียง', startRecording, userTurns.length ? '' : 'primary'),
        task.mode === 'interaction' && lastIsUser && btn('ขอคำถามแย้งจากกรรมการ', async (ev) => {
          ev.target.disabled = true;
          status.textContent = 'กรรมการกำลังคิดคำถาม…';
          try {
            const out = await ai.generate('challenge', { task, turns });
            turns.push({ role: 'examiner', text: out.question, durationSec: 0 });
            drawTurns();
            showNext();
          } catch (err) { toast(err.message, 6000); ev.target.disabled = false; status.textContent = ''; }
        }),
        userTurns.length > 0 && btn('จบและให้คะแนน', (ev) => rate(ev.target, status), 'primary'),
        status)));
  }

  function drawTurns() {
    fill(turnsBox, turns.length > 0 && card(`บทพูดรอบนี้ (ฉบับที่ ${version})`, turns.map((t) => h('div', { class: 'turn ' + (t.role === 'examiner' ? 'examiner' : '') },
      h('strong', {}, t.role === 'examiner' ? 'กรรมการ' : 'คุณครู'), h('p', { lang: 'en', class: 'en' }, t.text)))));
  }

  async function rate(button, status) {
    const text = turns.filter((t) => t.role === 'user').map((t) => t.text).join('\n\n');
    button.disabled = true;
    status.textContent = 'กำลังประเมิน…';
    let result;
    try { result = await ai.rate(task, { text, turns, version }, RUBRICS.speaking); }
    catch (err) { toast(err.message, 6000); button.disabled = false; status.textContent = ''; return; }
    const id = uid();
    const durationSec = turns.reduce((a, t) => a + (t.durationSec || 0), 0);
    rootId = rootId || id;
    // ไม่เก็บไฟล์เสียงลงฐานข้อมูล (เก็บเฉพาะ transcript) เพื่อให้ไฟล์สำรองมีขนาดเล็ก
    const sub = { id, rootId, version, module: 'speaking', skill, taskId: task.id, taskType: task.type, level: task.level, text, turns, wordCount: countWords(text), durationSec, targetPhrases: [], result, createdAt: new Date().toISOString() };
    await put('submissions', sub);
    await logSession({ minutes: Math.max(1, durationSec / 60), skill, module: 'speaking', kind: 'loop', note: task.title });
    fill(resultBox, renderResult(result, { locked: version === 1, level: task.level, sourceId: id }));
    fill(stage, card('Redo', h('p', {}, version === 1 ? 'พูดโจทย์เดิมอีกครั้งโดยแก้จุดที่ถูกยกมา เพื่อปลดล็อกตัวอย่างการพูดใหม่' : 'พูดซ้ำได้อีก หรือกลับไปเลือกโจทย์ใหม่'),
      btn(`พูดซ้ำ (ฉบับที่ ${version + 1})`, () => { version += 1; turns = []; drawTurns(); resultBox.replaceChildren(); showNext(); }, 'primary')));
    document.getElementById('result-heading')?.focus();
  }

  if (prior.length) {
    root.append(card('ประวัติ', prior.slice(-5).reverse().map((x) => h('details', {},
      h('summary', {}, `ฉบับที่ ${x.version} · ${x.result?.total ?? '—'}/100 · ${x.result?.overallLabel ?? ''}`),
      h('blockquote', { lang: 'en', style: 'white-space:pre-wrap' }, x.text)))));
  }
  showNext();

  return () => { stopMedia(); timer.destroy(); if (audioUrl) URL.revokeObjectURL(audioUrl); };
}
