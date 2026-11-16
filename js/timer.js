// ตัวจับเวลาใช้ร่วมกันทุกโมดูล — mode 'up' นับขึ้น, 'down' นับถอยหลัง
import { h, fmtClock } from './ui.js';

export function createTimer({ mode = 'up', seconds = 0, onEnd } = {}) {
  let elapsed = 0;
  let startedAt = null;
  let handle = null;
  const el = h('span', { class: 'timer', role: 'timer', 'aria-label': 'เวลา' }, fmtClock(mode === 'down' ? seconds : 0));

  const now = () => elapsed + (startedAt ? (Date.now() - startedAt) / 1000 : 0);
  function paint() {
    const t = now();
    const shown = mode === 'down' ? Math.max(0, seconds - t) : t;
    el.textContent = fmtClock(shown);
    el.classList.toggle('over', seconds > 0 && t >= seconds);
    if (mode === 'down' && t >= seconds && startedAt) { api.pause(); onEnd?.(); }
  }
  const api = {
    el,
    running: () => startedAt !== null,
    elapsed: () => Math.round(now()),
    start() { if (startedAt) return; startedAt = Date.now(); handle = setInterval(paint, 500); paint(); },
    pause() { if (!startedAt) return; elapsed = now(); startedAt = null; clearInterval(handle); paint(); },
    reset() { api.pause(); elapsed = 0; paint(); },
    destroy() { clearInterval(handle); startedAt = null; },
  };
  return api;
}
