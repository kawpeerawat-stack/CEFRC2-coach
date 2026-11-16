// กราฟ SVG เขียนเอง ไม่มี dependency — สีมาจาก CSS variables (สลับโหมดสว่าง/มืดอัตโนมัติ)
import { h, s, fmtNum } from './ui.js';

/** กราฟเส้น: ชั่วโมงสะสมจริงเทียบแผน (แกนเดียว) */
export function hoursChart({ months, total, actual, nowX }) {
  const W = 340, H = 190, m = { l: 34, r: 40, t: 10, b: 24 };
  const maxActual = actual[actual.length - 1].y;
  const step = Math.max(50, Math.ceil(Math.max(total, maxActual) / 4 / 50) * 50);
  const maxY = step * 4;
  const x = (v) => m.l + v / months * (W - m.l - m.r);
  const y = (v) => H - m.b - v / maxY * (H - m.t - m.b);
  const path = (pts) => pts.map((p, i) => `${i ? 'L' : 'M'}${x(p.x).toFixed(1)},${y(p.y).toFixed(1)}`).join(' ');
  const planAt = (mx) => total * mx / months;
  const actualAt = (mx) => { let v = 0; for (const p of actual) { if (p.x <= mx) v = p.y; else break; } return v; };

  const cross = s('line', { class: 'cross', y1: m.t, y2: H - m.b, visibility: 'hidden' });
  const readout = h('p', { class: 'readout', 'aria-live': 'off' }, 'แตะหรือชี้ที่กราฟเพื่อดูค่ารายเดือน');
  const svg = s('svg', { class: 'viz', viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': `ชั่วโมงฝึกสะสม ${fmtNum(maxActual, 1)} ชั่วโมง เทียบแผน ${fmtNum(planAt(nowX), 1)} ชั่วโมง ณ วันนี้` },
    [0, 1, 2, 3, 4].map((i) => [
      s('line', { class: 'grid-line', x1: m.l, x2: W - m.r, y1: y(i * step), y2: y(i * step) }),
      s('text', { x: m.l - 5, y: y(i * step) + 3, 'text-anchor': 'end' }, i * step),
    ]),
    [0, 6, 12, 18, 24].filter((v) => v <= months).map((v) => s('text', { x: x(v), y: H - 8, 'text-anchor': 'middle' }, 'ด.' + v)),
    s('path', { class: 'line plan s1', d: path([{ x: 0, y: 0 }, { x: months, y: total }]) }),
    s('path', { class: 'line s2', d: path(actual) }),
    s('circle', { class: 'f2 dot-ring', cx: x(nowX), cy: y(maxActual), r: 4.5 }),
    s('text', { class: 'lbl', x: x(months) + 4, y: y(total) + 3 }, 'แผน'),
    s('text', { class: 'lbl', x: Math.min(x(nowX) + 7, W - 22), y: y(maxActual) - 7 }, 'จริง'),
    cross);

  function show(clientX) {
    const r = svg.getBoundingClientRect();
    const vx = (clientX - r.left) / r.width * W;
    const mx = Math.max(0, Math.min(months, (vx - m.l) / (W - m.l - m.r) * months));
    cross.setAttribute('x1', x(mx)); cross.setAttribute('x2', x(mx)); cross.setAttribute('visibility', 'visible');
    readout.textContent = `เดือนที่ ${fmtNum(mx, 1)} · แผน ${fmtNum(planAt(mx))} ชม.` + (mx <= nowX ? ` · จริง ${fmtNum(actualAt(mx), 1)} ชม.` : ' · (ยังไม่ถึง)');
  }
  svg.addEventListener('pointermove', (e) => show(e.clientX));
  svg.addEventListener('pointerdown', (e) => show(e.clientX));
  svg.addEventListener('pointerleave', () => cross.setAttribute('visibility', 'hidden'));

  return h('figure', { style: 'margin:0' }, svg, readout,
    h('div', { class: 'legend' },
      h('span', {}, h('i', { class: 'k1 dashed' }), 'แผน'),
      h('span', {}, h('i', { class: 'k2' }), 'ชั่วโมงจริงสะสม')));
}

/** เรดาร์ 6 ทักษะ: พื้นที่ = ประเมินตนเอง, จุด = หลักฐานจากงาน (ค่าเป็น null = ยังไม่มีข้อมูล) */
export function radarChart({ axes, self, evidence, rings }) {
  const W = 320, H = 290, cx = 160, cy = 146, R = 96, max = 5;
  const pt = (i, v) => {
    const a = -Math.PI / 2 + i * 2 * Math.PI / axes.length;
    return [cx + Math.cos(a) * R * v / max, cy + Math.sin(a) * R * v / max];
  };
  const poly = (vals) => vals.map((v, i) => pt(i, v ?? 0).map((n) => n.toFixed(1)).join(',')).join(' ');
  const hasSelf = self.some((v) => v != null);
  const tip = (text) => s('title', {}, text);

  return h('figure', { style: 'margin:0' },
    s('svg', { class: 'viz', viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'เรดาร์ระดับรายทักษะ รายละเอียดอยู่ในตารางด้านล่าง' },
      rings.map((r) => s('polygon', { class: 'ring', points: poly(axes.map(() => r.v)) })),
      axes.map((_, i) => { const [x2, y2] = pt(i, max); return s('line', { class: 'grid-line', x1: cx, y1: cy, x2, y2 }); }),
      // ป้ายระดับวางกลางด้านของหกเหลี่ยม (ระหว่างแกนที่ 1 กับ 2) เพื่อไม่ทับจุดข้อมูลบนแกน
      rings.map((r) => {
        const d = R * r.v / max * Math.cos(Math.PI / axes.length);
        const a = -Math.PI / 2 + Math.PI / axes.length;
        return s('text', { x: cx + Math.cos(a) * d, y: cy + Math.sin(a) * d - 2, 'text-anchor': 'middle' }, r.label);
      }),
      hasSelf && s('polygon', { class: 'poly', points: poly(self) }),
      self.map((v, i) => v != null && s('circle', { class: 'f1 dot-ring', cx: pt(i, v)[0], cy: pt(i, v)[1], r: 4 }, tip(`${axes[i]}: ประเมินตนเอง`))),
      evidence.map((v, i) => v != null && s('rect', { class: 'f2 dot-ring', x: pt(i, v)[0] - 4.5, y: pt(i, v)[1] - 4.5, width: 9, height: 9, rx: 2 }, tip(`${axes[i]}: หลักฐานจากงาน`))),
      axes.map((label, i) => {
        const [x, y] = pt(i, max + 0.9);
        return s('text', { class: 'lbl', x, y: y + 3, 'text-anchor': Math.abs(x - cx) < 8 ? 'middle' : x > cx ? 'start' : 'end' }, label);
      })),
    h('div', { class: 'legend' },
      h('span', {}, h('i', { class: 'k1' }), 'ประเมินตนเอง (Can-do)'),
      h('span', {}, h('i', { class: 'dot', style: 'border-radius:2px' }), 'หลักฐานจากงาน/แบบฝึก')));
}
