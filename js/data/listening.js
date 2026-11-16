// คลังแบบฝึกฟัง — รายการหนึ่งใช้ได้ 2 แบบ:
//   audioUrl : ลิงก์ไฟล์เสียงจริง (แนะนำ — เพิ่มในเฟส 2)
//   ttsScript: บทพูดที่ให้เบราว์เซอร์อ่านด้วยเสียงสังเคราะห์ (ใช้ทดสอบโครงเท่านั้น)
export const LISTENING_ITEMS = [
  { id: 'l-b2-01', level: 'B2', title: 'Staff briefing: the new timetable', minutes: 6,
    ttsScript: 'Good morning, everyone, and thanks for coming to this short briefing. As you know, the school is trialling a new timetable from next term. The main change is that lessons will run for fifty minutes rather than an hour, which frees up a thirty-minute slot at the end of each day. I should stress that this slot is not free time. Three days a week it will be used for supervised reading, and on the remaining two, for small-group support in maths and English. A few colleagues have asked whether shorter lessons mean covering less material. Honestly, we don\'t know yet. Schools that have tried this report that students stay more focused, but the evidence is mixed, so we\'ll review the results after one term before deciding whether to continue. If you have concerns, please raise them with your head of department by Friday.',
    questions: [
      { id: 'q1', tag: 'detail', stem: 'What is the main change to the timetable?', options: ['The school day will finish earlier.', 'Lessons will be shortened to fifty minutes.', 'There will be an extra lesson each day.', 'Maths and English will get more lessons.'], answer: 1, explanation: '"lessons will run for fifty minutes rather than an hour"' },
      { id: 'q2', tag: 'detail', stem: 'How will the new thirty-minute slot be used?', options: ['As free time for students.', 'For staff meetings.', 'For supervised reading and small-group support.', 'For homework.'], answer: 2, explanation: 'อ่านแบบมีครูดูแล 3 วัน และสอนเสริมกลุ่มย่อย 2 วัน' },
      { id: 'q3', tag: 'tone', stem: 'When asked whether less material will be covered, the speaker is', options: ['confident that nothing will be lost.', 'openly uncertain.', 'irritated by the question.', 'sure that content will be cut.'], answer: 1, explanation: '"Honestly, we don\'t know yet" และ "the evidence is mixed"' },
      { id: 'q4', tag: 'detail', stem: 'What will happen after one term?', options: ['The new timetable becomes permanent.', 'The results will be reviewed before a decision is made.', 'Lessons will return to one hour.', 'Parents will be asked to vote.'], answer: 1, explanation: '"we\'ll review the results after one term before deciding whether to continue"' },
    ] },
];
