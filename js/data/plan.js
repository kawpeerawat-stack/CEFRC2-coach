// แผน 24 เดือน — แก้ไขไฟล์นี้ได้โดยตรง (เดือนนับจาก 1)
export default {
  months: 24,
  weeksPerYear: 48, // เผื่อหยุด 4 สัปดาห์ต่อปี
  phases: [
    { id: 'p1', from: 1, to: 6, label: 'B1 → B2+', workLevel: 'B2', focus: ['สร้างฐานไวยากรณ์และคำศัพท์ B2', 'ฟังและอ่านปริมาณมาก (extensive input)', 'ล้างข้อผิดพลาดซ้ำซากในคลัง'] },
    { id: 'p2', from: 7, to: 12, label: 'B2+ → C1', workLevel: 'C1', focus: ['ภาษาเชิงวิชาการและ register', 'โครงสร้างข้อโต้แย้ง', 'ใช้ Reformulator กับงานทุกชิ้น'] },
    { id: 'p3', from: 13, to: 20, label: 'C1 → C2', workLevel: 'C2', focus: ['นัยความหมายและ stance', 'Devil\'s Advocate', 'Mediation จากหลายแหล่ง'] },
    { id: 'p4', from: 21, to: 24, label: 'ข้อสอบจำลองและสอบจริง', workLevel: 'C2', focus: ['Full mock รายสัปดาห์', 'อุดทักษะที่ยังแกว่ง', 'สอบจริง'] },
  ],
  // จุดตรวจภายนอกทุก 6 เดือน (month = จำนวนเดือนนับจากวันเริ่มแผน)
  checkpoints: [
    { month: 0, target: 'Baseline', suggested: 'Diagnostic ในแอป + EF SET' },
    { month: 6, target: 'B2+', suggested: 'EF SET' },
    { month: 12, target: 'C1', suggested: 'EF SET + Aptis Advanced หรือ IELTS (ข้อสอบจำลองทางการ)' },
    { month: 18, target: 'C1+', suggested: 'ให้ผู้ตรวจจริงประเมินงานเขียน/พูด + ข้อสอบจำลอง Cambridge C2' },
    { month: 24, target: 'C2', suggested: 'สอบจริง: IELTS Academic หรือ Cambridge C2 Proficiency' },
  ],
  // ตารางประจำสัปดาห์ — key คือวัน (0 = อาทิตย์ … 6 = เสาร์)
  weekly: {
    1: 'write', 3: 'write', 5: 'write', 2: 'speak', 4: 'speak', 6: 'mock', 0: 'audit',
  },
  templates: {
    write: { label: 'วงจร 60 นาที — วันเขียน', minutes: 60, steps: [
      { min: 15, label: 'Input: อ่านหรือฟัง แล้วเก็บวลี 1–2 วลีเข้าคลัง', href: '#/reading' },
      { min: 20, label: 'ผลิตภาษา: เขียนงาน 1 ชิ้น', href: '#/writing' },
      { min: 25, label: 'Redo: แก้งานเดิมตาม feedback แล้วส่งซ้ำ', href: '#/writing' },
    ] },
    speak: { label: 'วงจร 60 นาที — วันพูด', minutes: 60, steps: [
      { min: 15, label: 'Input: ฟัง แล้วเก็บวลี 1–2 วลีเข้าคลัง', href: '#/listening' },
      { min: 20, label: 'ผลิตภาษา: พูดงาน 1 ชิ้น', href: '#/speaking' },
      { min: 25, label: 'Redo: พูดซ้ำตาม feedback', href: '#/speaking' },
    ] },
    mock: { label: 'วันเสาร์ — ข้อสอบจับเวลา 2 ชั่วโมง', minutes: 120, steps: [
      { min: 120, label: 'ทำข้อสอบจำลองแบบจับเวลา', href: '#/mock' },
    ] },
    audit: { label: 'วันอาทิตย์ — ทบทวนคลัง + Shadowing 1.5 ชั่วโมง', minutes: 90, steps: [
      { min: 45, label: 'ทบทวนวลีและคลังข้อผิดพลาดของสัปดาห์', href: '#/vault' },
      { min: 45, label: 'Shadowing: พูดตามต้นฉบับ เลียนจังหวะและการเน้นเสียง', href: '#/listening' },
    ] },
  },
};
