// ชั้น AI — ทุกโมดูลเรียกผ่าน ai.rate() / ai.generate() เท่านั้น
// เพิ่ม provider ใหม่: สร้างไฟล์ที่ export { rate, generate } แล้วลงทะเบียนใน PROVIDERS
import { loadConfig } from '../config.js';
import { finalizeResult } from '../scoring.js';
import * as mock from './mock.js';
import * as claude from './claude.js';

const PROVIDERS = { mock, claude };

function pick(cfg) {
  const name = cfg.provider in PROVIDERS ? cfg.provider : 'mock';
  if (name === 'claude' && !cfg.apiKey) throw new Error('ยังไม่ได้ใส่ API key — ไปที่หน้าตั้งค่า หรือสลับกลับเป็นโหมดจำลอง');
  return { name, impl: PROVIDERS[name], model: name === 'mock' ? 'mock' : cfg.model };
}

export const ai = {
  /**
   * ประเมินงานหนึ่งชิ้น
   * @param task   งานจาก data/tasks.js
   * @param input  { text, targetPhrases?: string[], version?: number, turns?: [] }
   * @param rubric จาก data/rubrics.js
   * @returns rubric result (ดู schemas/rubric-result.schema.json)
   */
  async rate(task, input, rubric) {
    const cfg = await loadConfig();
    const p = pick(cfg);
    const raw = await p.impl.rate({ task, input, rubric, cfg });
    return finalizeResult(raw, rubric, { task, text: input.text, provider: p.name, model: p.model, targetPhrases: input.targetPhrases || [] });
  },

  /** สร้างเนื้อหา: kind = 'reformulate' | 'challenge' */
  async generate(kind, payload) {
    const cfg = await loadConfig();
    const p = pick(cfg);
    const out = await p.impl.generate({ kind, payload, cfg });
    return { ...out, provider: p.name, isMock: p.name === 'mock' };
  },

  async info() {
    const cfg = await loadConfig();
    return { provider: cfg.provider, model: cfg.model, isMock: cfg.provider !== 'claude', ready: cfg.provider !== 'claude' || !!cfg.apiKey };
  },
};
