// โมดูล 3 — Writing Studio
import { h } from '../ui.js';
import { loadConfig } from '../config.js';
import { getAll } from '../db.js';
import { computePlan } from '../planner.js';
import { WRITING_TASKS } from '../data/tasks.js';
import { RUBRICS } from '../data/rubrics.js';
import { renderTaskList, renderWorkbench } from '../workbench.js';

export const title = 'Writing Studio';
const BASE = '/writing';

export async function render(root, params) {
  if (params.id) {
    const task = WRITING_TASKS.find((t) => t.id === params.id);
    if (!task) { root.append(h('h1', {}, 'ไม่พบโจทย์นี้'), h('a', { href: '#' + BASE }, 'กลับ')); return; }
    return renderWorkbench(root, { module: 'writing', skill: 'writing', task, rubric: RUBRICS.writing, base: BASE });
  }
  const cfg = await loadConfig();
  const plan = computePlan(cfg, await getAll('sessions'));
  await renderTaskList(root, {
    heading: 'Writing Studio',
    intro: 'เขียน → รับผลประเมินพร้อมหลักฐาน → แก้เองก่อน → จึงเห็นตัวอย่างการเขียนใหม่',
    tasks: WRITING_TASKS, base: BASE, module: 'writing', workLevel: plan.phase.workLevel,
  });
}
