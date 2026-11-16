// รูปแบบข้อสอบจำลอง — เก็บเฉพาะ "โครงสร้างและเวลา" เท่านั้น
// ตัวข้อสอบให้ใช้ตัวอย่างที่ผู้จัดสอบเผยแพร่อย่างเป็นทางการ ห้ามคัดลอกเนื้อหาข้อสอบมาใส่ในแอป
// ตรวจสอบรูปแบบล่าสุดกับผู้จัดสอบก่อนสอบจริงเสมอ
export const MOCK_FORMATS = [
  { id: 'ielts-academic', name: 'IELTS Academic', official: 'https://ielts.org', scoreLabel: 'Band (0–9)', c2Note: 'เป้าหมายภายใน: 8.5 ขึ้นไปทุกทักษะ',
    sections: [
      { id: 'listening', skill: 'listening', name: 'Listening', minutes: 30, detail: '4 ส่วน 40 ข้อ' },
      { id: 'reading', skill: 'reading', name: 'Reading', minutes: 60, detail: '3 บทอ่าน 40 ข้อ' },
      { id: 'writing', skill: 'writing', name: 'Writing', minutes: 60, detail: 'Task 1 อย่างน้อย 150 คำ + Task 2 อย่างน้อย 250 คำ' },
      { id: 'speaking', skill: 'spoken-interaction', name: 'Speaking', minutes: 14, detail: '3 ส่วน ประมาณ 11–14 นาที' },
    ] },
  { id: 'cambridge-c2', name: 'Cambridge C2 Proficiency', official: 'https://www.cambridgeenglish.org', scoreLabel: 'Cambridge English Scale', c2Note: 'เป้าหมายภายใน: 200 ขึ้นไปทุกทักษะ',
    sections: [
      { id: 'reading-use', skill: 'reading', name: 'Reading and Use of English', minutes: 90, detail: '7 ส่วน 53 ข้อ' },
      { id: 'writing', skill: 'writing', name: 'Writing', minutes: 90, detail: '2 ส่วน' },
      { id: 'listening', skill: 'listening', name: 'Listening', minutes: 40, detail: '4 ส่วน 30 ข้อ ประมาณ 40 นาที' },
      { id: 'speaking', skill: 'spoken-interaction', name: 'Speaking', minutes: 16, detail: '3 ส่วน ประมาณ 16 นาที (สอบเป็นคู่)' },
    ] },
];
