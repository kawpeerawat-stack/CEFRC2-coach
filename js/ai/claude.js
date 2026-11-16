// Provider: Claude API (เรียกตรงจากเบราว์เซอร์ด้วย key ที่ผู้ใช้กรอกเอง)
import { buildRatePrompt, buildGeneratePrompt } from './prompts.js';

const ENDPOINT = 'https://api.anthropic.com/v1/messages';

async function call(cfg, { system, user }, maxTokens = 4000) {
  let res;
  try {
    res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': cfg.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({ model: cfg.model, max_tokens: maxTokens, system, messages: [{ role: 'user', content: user }] }),
    });
  } catch {
    throw new Error('เชื่อมต่อ Claude API ไม่ได้ ตรวจสอบอินเทอร์เน็ตแล้วลองใหม่ (งานที่พิมพ์ไว้ยังอยู่)');
  }
  if (!res.ok) {
    let detail = '';
    try { detail = (await res.json())?.error?.message || ''; } catch { /* ignore */ }
    const hint = res.status === 401 ? 'API key ไม่ถูกต้อง' : res.status === 404 ? 'ไม่พบชื่อโมเดลนี้ ตรวจสอบในหน้าตั้งค่า' : res.status === 429 ? 'ใช้งานเกินโควตา ลองใหม่ภายหลัง' : 'คำขอไม่สำเร็จ';
    throw new Error(`${hint} (HTTP ${res.status}) ${detail}`.trim());
  }
  const data = await res.json();
  return (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('');
}

export function parseJSON(text) {
  const a = text.indexOf('{');
  const b = text.lastIndexOf('}');
  if (a < 0 || b <= a) throw new Error('AI ตอบกลับมาไม่เป็น JSON ลองส่งใหม่อีกครั้ง');
  try { return JSON.parse(text.slice(a, b + 1)); } catch { throw new Error('อ่านผลจาก AI ไม่ได้ (JSON ไม่สมบูรณ์) ลองส่งใหม่อีกครั้ง'); }
}

export async function rate({ task, input, rubric, cfg }) {
  return parseJSON(await call(cfg, buildRatePrompt({ task, input, rubric })));
}

export async function generate({ kind, payload, cfg }) {
  return parseJSON(await call(cfg, buildGeneratePrompt(kind, payload), 1200));
}
