// โมดูล 10 — Settings: AI provider, แผน, เป้าหมาย, สำรอง/กู้คืนข้อมูล
import { h, card, btn, field, select, notice, toast, add, confirmDialog } from '../ui.js';
import { loadConfig, saveConfig, SKILLS, LEVELS } from '../config.js';
import { downloadBackup, importData, wipeAll } from '../backup.js';
import { fmtDate, todayISO } from '../dates.js';
import { refresh } from '../router.js';
import { planTotalHours } from '../planner.js';

export const title = 'ตั้งค่า';

export async function render(root) {
  const cfg = await loadConfig();

  // --- AI ---
  const provider = select([['mock', 'โหมดจำลอง (ไม่ใช้ AI จริง)'], ['claude', 'Claude API']], cfg.provider);
  const apiKey = h('input', { type: 'password', autocomplete: 'off', spellcheck: 'false', value: cfg.apiKey, placeholder: 'sk-ant-…' });
  const model = h('input', { type: 'text', spellcheck: 'false', value: cfg.model });
  const speechLang = select([['en-GB', 'English (UK)'], ['en-US', 'English (US)'], ['en-AU', 'English (Australia)']], cfg.speechLang);

  // --- แผน ---
  const planStart = h('input', { type: 'date', value: cfg.planStart || todayISO() });
  const weeklyHours = h('input', { type: 'number', min: '1', max: '40', step: '0.5', inputmode: 'decimal', value: String(cfg.weeklyHours) });
  const startLevel = select(['A2', ...LEVELS], cfg.startLevel);
  const targets = SKILLS.map((x) => ({ id: x.id, th: x.th, input: select(LEVELS, cfg.targets[x.id] || 'C2') }));

  const file = h('input', { type: 'file', accept: 'application/json,.json' });

  add(root,
    h('h1', {}, 'ตั้งค่า'),

    card('ผู้ประเมิน (AI)',
      field('ผู้ให้บริการ', provider),
      field('API key', apiKey, 'เก็บไว้ในเบราว์เซอร์นี้เท่านั้น และไม่ถูกรวมในไฟล์สำรอง'),
      field('ชื่อโมเดล', model, 'เปลี่ยนได้เมื่อมีโมเดลรุ่นใหม่'),
      field('สำเนียงสำหรับระบบถอดเสียงและเสียงอ่าน', speechLang),
      notice('', 'ผู้ที่เข้าถึงอุปกรณ์นี้ได้จะอ่าน API key ได้ ควรใช้ key ที่ตั้งวงเงินจำกัดไว้ และอย่าใช้แอปนี้บนเครื่องสาธารณะ ค่าใช้จ่ายคิดตามการใช้งานจริงของ key นั้น'),
      btn('บันทึกการตั้งค่า AI', async () => {
        if (provider.value === 'claude' && !apiKey.value.trim()) { toast('ใส่ API key ก่อนเลือก Claude API'); return; }
        await saveConfig({ provider: provider.value, apiKey: apiKey.value.trim(), model: model.value.trim() || cfg.model, speechLang: speechLang.value });
        toast('บันทึกแล้ว');
      }, 'primary')),

    card('แผน 24 เดือน',
      h('div', { class: 'grid' }, field('วันเริ่มแผน', planStart), field('ชั่วโมงต่อสัปดาห์', weeklyHours), field('ระดับเริ่มต้น', startLevel)),
      h('p', { class: 'muted' }, `แผนปัจจุบัน: ${cfg.weeklyHours} ชม./สัปดาห์ × 48 สัปดาห์ × 2 ปี = ${planTotalHours(cfg)} ชั่วโมง`),
      h('h3', {}, 'ระดับเป้าหมายรายทักษะ'),
      h('div', { class: 'grid' }, targets.map((t) => field(t.th, t.input))),
      btn('บันทึกแผน', async () => {
        const w = Number(weeklyHours.value);
        if (!(w > 0) || !planStart.value) { toast('ตรวจสอบวันเริ่มแผนและจำนวนชั่วโมง'); return; }
        await saveConfig({ planStart: planStart.value, weeklyHours: w, startLevel: startLevel.value, targets: Object.fromEntries(targets.map((t) => [t.id, t.input.value])) });
        toast('บันทึกแล้ว');
        refresh();
      }, 'primary')),

    card('สำรองและกู้คืนข้อมูล',
      h('p', {}, 'ข้อมูลทั้งหมดอยู่ในเบราว์เซอร์นี้เท่านั้น ถ้าล้างข้อมูลเบราว์เซอร์หรือเปลี่ยนเครื่อง ข้อมูลจะหาย ควรสำรองอย่างน้อยสัปดาห์ละครั้ง'),
      h('p', { class: 'muted' }, cfg.lastBackupAt ? `สำรองล่าสุด: ${fmtDate(cfg.lastBackupAt)}` : 'ยังไม่เคยสำรองข้อมูล'),
      btn('ดาวน์โหลดไฟล์สำรอง (JSON)', async () => { await downloadBackup(); toast('ดาวน์โหลดไฟล์สำรองแล้ว'); refresh(); }, 'primary'),
      h('h3', {}, 'กู้คืนจากไฟล์สำรอง'),
      field('ไฟล์สำรอง (.json)', file, 'ข้อมูลปัจจุบันทั้งหมดจะถูกแทนที่ด้วยข้อมูลในไฟล์'),
      btn('กู้คืนข้อมูล', async () => {
        const f = file.files[0];
        if (!f) { toast('เลือกไฟล์สำรองก่อน'); return; }
        let obj;
        try { obj = JSON.parse(await f.text()); } catch { toast('อ่านไฟล์ไม่ได้ ไฟล์อาจเสียหาย', 5000); return; }
        if (!(await confirmDialog('แทนที่ข้อมูลปัจจุบันทั้งหมดด้วยข้อมูลจากไฟล์นี้?', 'กู้คืน'))) return;
        try {
          const counts = await importData(obj);
          toast(`กู้คืนแล้ว: บันทึกเวลา ${counts.sessions} · งาน ${counts.submissions} · วลี ${counts.vault}`, 5000);
          refresh();
        } catch (err) { toast(err.message, 6000); }
      })),

    card('ล้างข้อมูล',
      h('p', {}, 'ลบข้อมูลทั้งหมดในเบราว์เซอร์นี้ รวมถึง API key ไม่สามารถกู้คืนได้ถ้าไม่มีไฟล์สำรอง'),
      btn('ลบข้อมูลทั้งหมด', async () => {
        if (!(await confirmDialog('ลบข้อมูลทั้งหมดอย่างถาวร? ควรดาวน์โหลดไฟล์สำรองก่อน', 'ลบทั้งหมด'))) return;
        await wipeAll();
        await saveConfig({ planStart: todayISO() });
        toast('ลบข้อมูลทั้งหมดแล้ว');
        refresh();
      }, 'danger')),

    card('ติดตั้งเป็นแอป',
      h('p', {}, 'บนมือถือ: เปิดเมนูของเบราว์เซอร์แล้วเลือก "เพิ่มไปยังหน้าจอหลัก" แอปจะเปิดได้แม้ไม่มีอินเทอร์เน็ต (ยกเว้นการประเมินด้วย AI)')));
}
