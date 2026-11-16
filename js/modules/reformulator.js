// โมดูล 7 — Reformulator: ประโยคของเรา → แม่นยำ/เป็นธรรมชาติขึ้น → แบบภาษาพูด → เก็บวลีเข้าคลัง
import { h, card, btn, field, notice, toast, uid, add, fill } from '../ui.js';
import { getAll, put } from '../db.js';
import { loadConfig } from '../config.js';
import { ai } from '../ai/index.js';
import { addCard } from '../vault-api.js';
import { fmtDate } from '../dates.js';

export const title = 'เกลาประโยค';

function output(out, sentence) {
  return card('ผลการเกลา',
    out.isMock && notice('', 'โหมดจำลอง: แทนคำจากรายการตัวอย่างเท่านั้น ยังไม่ใช่การเกลาจริง'),
    h('div', { class: 'muted' }, 'ประโยคเดิม'), h('blockquote', { lang: 'en' }, sentence),
    (out.issues || []).length > 0 && h('ul', {}, out.issues.map((x) => h('li', {}, h('strong', { lang: 'en', class: 'en' }, x.span), ' — ', x.why))),
    h('div', { class: 'muted' }, 'แบบเขียน: แม่นยำและเป็นธรรมชาติขึ้น'), h('blockquote', { lang: 'en' }, out.precise || '—'),
    h('div', { class: 'muted' }, 'แบบพูด: ใช้ในการอภิปราย'), h('blockquote', { lang: 'en' }, out.spoken || '—'),
    out.note && h('p', {}, out.note),
    (out.chunks || []).length > 0 && h('div', {}, h('h3', {}, 'วลีที่ควรเก็บ'),
      h('ul', { class: 'list' }, out.chunks.map((c) => h('li', { class: 'row' },
        h('span', {}, h('strong', { lang: 'en', class: 'en' }, c.chunk), ' — ', c.cue),
        btn('ส่งเข้าคลัง', async (ev) => {
          const { duplicate } = await addCard({ chunk: c.chunk, cue: c.cue, example: out.precise, source: 'reformulator' });
          ev.target.disabled = true;
          toast(duplicate ? 'มีวลีนี้ในคลังอยู่แล้ว' : 'ส่งเข้าคลังแล้ว');
        }, 'small'))))));
}

export async function render(root) {
  const cfg = await loadConfig();
  const history = (await getAll('submissions')).filter((x) => x.module === 'reformulator').sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const sentence = h('textarea', { lang: 'en', spellcheck: 'true', style: 'min-height:6rem', placeholder: 'พิมพ์ประโยคที่เขียนหรือพูดแล้วรู้สึกว่ายังไม่คม' });
  const attempt = h('textarea', { lang: 'en', spellcheck: 'true', style: 'min-height:5rem' });
  const out = h('div');
  const status = h('span', { role: 'status', class: 'muted' });

  const go = btn('เกลาประโยค', async () => {
    const text = sentence.value.trim();
    if (text.split(/\s+/).length < 3) { toast('พิมพ์ประโยคอย่างน้อย 3 คำ'); return; }
    go.disabled = true;
    status.textContent = 'กำลังเกลา…';
    try {
      const res = await ai.generate('reformulate', { sentence: text, attempt: attempt.value.trim(), level: cfg.startLevel });
      await put('submissions', { id: uid(), rootId: null, version: 1, module: 'reformulator', skill: 'writing', taskId: null, taskType: 'reformulation', level: '', text, attempt: attempt.value.trim(), output: res, result: null, createdAt: new Date().toISOString() });
      fill(out, output(res, text));
    } catch (err) { toast(err.message, 6000); }
    go.disabled = false;
    status.textContent = '';
  }, 'primary');

  add(root,
    h('h1', {}, 'เกลาประโยค (Reformulator)'),
    h('p', { class: 'muted' }, 'เป้าหมายคือความแม่นยำและความเป็นธรรมชาติ ไม่ใช่ศัพท์หรู'),
    card('ประโยคของคุณครู',
      field('ประโยคเดิม (ภาษาอังกฤษ)', sentence),
      field('ลองแก้เองก่อน (ไม่บังคับ)', attempt, 'ถ้าลองแก้เองก่อน จะได้คำแนะนำต่อฉบับที่แก้ด้วย'),
      h('div', { class: 'row' }, go, status)),
    out,
    history.length > 0 && card('ประวัติล่าสุด', history.slice(0, 5).map((x) => h('details', {},
      h('summary', {}, `${fmtDate(x.createdAt)} · `, h('span', { lang: 'en' }, x.text.slice(0, 60))),
      h('blockquote', { lang: 'en' }, x.output?.precise || '—')))));
}
