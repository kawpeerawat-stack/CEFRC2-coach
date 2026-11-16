// คำนวณสถานะแผน 24 เดือน: ชั่วโมงจริงเทียบแผน, เฟส, streak, จุดตรวจถัดไป
import PLAN from './data/plan.js';
import { todayISO, addMonths, addDays, diffDays, parseISO } from './dates.js';

export const planTotalHours = (cfg) => Math.round(cfg.weeklyHours * PLAN.weeksPerYear * PLAN.months / 12);

export function computeStreak(sessions, today = todayISO()) {
  const days = new Set(sessions.map((x) => x.date));
  let d = days.has(today) ? today : addDays(today, -1);
  let n = 0;
  while (days.has(d)) { n += 1; d = addDays(d, -1); }
  return n;
}

export function computePlan(cfg, sessions, checkpoints = [], today = todayISO()) {
  const start = cfg.planStart || today;
  const end = addMonths(start, PLAN.months);
  const totalDays = diffDays(start, end);
  const elapsed = Math.max(0, Math.min(totalDays, diffDays(start, today)));
  const total = planTotalHours(cfg);
  const plannedToDate = total * elapsed / totalDays;
  const actual = sessions.reduce((a, x) => a + (x.minutes || 0), 0) / 60;
  const month = Math.min(PLAN.months, Math.floor(elapsed / (totalDays / PLAN.months)) + 1);
  const phase = PLAN.phases.find((p) => month >= p.from && month <= p.to) || PLAN.phases[PLAN.phases.length - 1];

  // สัปดาห์ฝึกที่เหลือ (คิดสัดส่วน 48/52)
  const weeksLeft = (totalDays - elapsed) / 7 * PLAN.weeksPerYear / 52;
  const requiredWeekly = weeksLeft > 0.5 ? Math.max(0, (total - actual) / weeksLeft) : null;
  const from = addDays(today, -27);
  const recentWeeks = Math.max(1, Math.min(4, (elapsed + 1) / 7));
  const avgWeekly = sessions.filter((x) => x.date >= from && x.date <= today).reduce((a, x) => a + x.minutes, 0) / 60 / recentWeeks;
  const projectedTotal = actual + avgWeekly * Math.max(0, weeksLeft);

  // อนุกรมสำหรับกราฟ (แกน x = เดือนที่ 0–24)
  const toX = (iso) => Math.max(0, Math.min(PLAN.months, diffDays(start, iso) / totalDays * PLAN.months));
  const byDay = new Map();
  for (const x of sessions) byDay.set(x.date, (byDay.get(x.date) || 0) + x.minutes / 60);
  let cum = 0;
  const actualSeries = [{ x: 0, y: 0 }];
  for (const d of [...byDay.keys()].sort()) { cum += byDay.get(d); actualSeries.push({ x: toX(d), y: cum }); }
  const nowX = toX(today);
  if (actualSeries[actualSeries.length - 1].x < nowX) actualSeries.push({ x: nowX, y: cum });

  const cps = PLAN.checkpoints.map((cp) => {
    const date = addMonths(start, cp.month);
    const done = checkpoints.some((c) => Number(c.planMonth) === cp.month);
    return { ...cp, date, done, daysLeft: diffDays(today, date) };
  });
  const nextCheckpoint = cps.find((c) => !c.done) || null;
  const weekday = parseISO(today).getDay();

  return {
    start, end, today, month, phase, total, plannedToDate, actual, gap: actual - plannedToDate,
    requiredWeekly, avgWeekly, projectedTotal, streak: computeStreak(sessions, today),
    series: { months: PLAN.months, total, actual: actualSeries, nowX },
    checkpoints: cps, nextCheckpoint, todayTemplate: PLAN.templates[PLAN.weekly[weekday]],
  };
}
