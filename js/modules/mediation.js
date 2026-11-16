// โมดูล 8 — Mediation Lab (ใช้ workbench และ rubric งานเขียน โดยเกณฑ์ Source synthesis ทำงานเต็มที่)
import { h } from '../ui.js';
import { loadConfig } from '../config.js';
import { getAll } from '../db.js';
import { computePlan } from '../planner.js';
import { MEDIATION_TASKS } from '../data/tasks.js';
import { RUBRICS } from '../data/rubrics.js';
import { renderTaskList, renderWorkbench } from '../workbench.js';

export const title = 'Mediation Lab';
const BASE = '/mediation';

export async function render(root, params) {
  if (params.id) {
    const task = MEDIATION_TASKS.find((t) => t.id === params.id);
    if (!task) { root.append(h('h1', {}, 'ไม่พบโจทย์นี้'), h('a', { href: '#' + BASE }, 'กลับ')); return; }
    return renderWorkbench(root, { module: 'mediation', skill: 'mediation', task, rubric: RUBRICS.writing, base: BASE });
  }
  const cfg = await loadConfig();
  const plan = computePlan(cfg, await getAll('sessions'));
  await renderTaskList(root, {
    heading: 'Mediation Lab',
    intro: 'ถ่ายทอดสารจากแหล่งข้อมูล 1–2 แหล่ง ให้ผู้อ่านกลุ่มที่กำหนดเข้าใจ โดยใช้ถ้อยคำของตนเอง',
    tasks: MEDIATION_TASKS, base: BASE, module: 'mediation', workLevel: plan.phase.workLevel,
  });
}
