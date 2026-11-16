// คลังโจทย์ (เนื้อหาเขียนขึ้นใหม่ทั้งหมด) — เพิ่มโจทย์ได้โดยต่อท้ายอาร์เรย์
// type ใช้นับ "ประเภทงานที่ต่างกัน" ในเกณฑ์ C2-ready จึงควรตั้งให้สื่อความหมาย

export const WRITING_TASKS = [
  { id: 'diag-writing', diagnostic: true, level: 'B2', type: 'placement', title: 'Placement: a change I would make', minWords: 150, minutes: 25,
    prompt: 'Describe one change you would make to the way English is taught at your school. Explain why it is needed and what difficulties you would expect.' },
  { id: 'w-b1-01', level: 'B1', type: 'informal-email', title: 'Welcoming a new colleague', minWords: 120, minutes: 20,
    prompt: 'A teacher from another country is joining your school next month. Write an email to welcome them. Describe the school briefly and suggest two things they should do in your town.' },
  { id: 'w-b1-02', level: 'B1', type: 'opinion-paragraph', title: 'Phones in the classroom', minWords: 120, minutes: 20,
    prompt: 'Do students learn better when phones are allowed in the classroom, or when they are not? Give your opinion with two reasons and one example from your own teaching.' },
  { id: 'w-b2-01', level: 'B2', type: 'opinion-essay', title: 'Exams or continuous assessment?', minWords: 220, minutes: 35,
    prompt: 'Some schools have replaced end-of-term examinations with continuous assessment. Do the advantages of this change outweigh the disadvantages? Give reasons and relevant examples.' },
  { id: 'w-b2-02', level: 'B2', type: 'report', title: 'Report: English-only day', minWords: 200, minutes: 35,
    prompt: 'Your department trialled a weekly "English-only day" for one term. Write a report for the head of department: say what was done, what worked, what did not, and make one clear recommendation.' },
  { id: 'w-c1-01', level: 'C1', type: 'proposal', title: 'Proposal: peer observation', minWords: 280, minutes: 40,
    prompt: 'Write a proposal to your school director recommending that teachers observe one another\'s lessons once a term. Explain the benefits, anticipate the objections colleagues are likely to raise, and say how you would address them.' },
  { id: 'w-c1-02', level: 'C1', type: 'discursive-essay', title: 'What students need to learn', minWords: 300, minutes: 45,
    prompt: '"Technology has changed what students need to learn, not just how they learn it." To what extent do you agree? Discuss with reference to a subject you know well.' },
  { id: 'w-c2-01', level: 'C2', type: 'critical-review', title: 'Persuasive but flawed', minWords: 320, minutes: 45,
    prompt: 'Review a book, talk or policy document about education that you found persuasive but flawed. Evaluate its central argument, show where it overreaches, and say who should nevertheless read it.' },
  { id: 'w-c2-02', level: 'C2', type: 'synthesis-essay', title: 'Two views on standardised testing', minWords: 280, minutes: 45,
    prompt: 'Read the two texts. Write an essay summarising and evaluating the key points of both, using your own words throughout, and include your own view.',
    sources: [
      { title: 'Text 1', text: 'Standardised tests are the least unfair instrument we have. A teacher\'s judgement, however conscientious, is shaped by what she already knows of a child: his manners, his family, the neatness of his handwriting. A common paper marked by strangers is indifferent to all of that. Where such tests have been abolished, the gap has rarely been filled by something more humane; it has been filled by private tutoring, portfolios polished by parents, and references from people who matter.' },
      { title: 'Text 2', text: 'What a common test measures with admirable consistency is a narrow band of what schools are for. Once results carry consequences, classrooms reorganise themselves around the paper: subjects that are not tested shrink, and those that are become rehearsals. The scores then rise, and we congratulate ourselves on an improvement that exists largely on the mark sheet. Fairness of procedure is not the same as fairness of outcome, and a ruler that is applied equally to everyone still measures only length.' },
    ] },
];

// mode: 'production' = พูดเดี่ยว, 'interaction' = โต้ตอบกับกรรมการ (Devil's Advocate)
export const SPEAKING_TASKS = [
  { id: 's-b1-01', level: 'B1', mode: 'production', type: 'narrative', title: 'A lesson that went well', minutes: 2, minWords: 60,
    prompt: 'Describe a lesson that went well recently. What did you do, and why do you think it worked?' },
  { id: 's-b2-01', level: 'B2', mode: 'production', type: 'balanced-opinion', title: 'Should schools ban phones?', minutes: 2, minWords: 120,
    prompt: 'Should secondary schools ban mobile phones during the school day? Present both sides, then give your own position.' },
  { id: 's-b2-02', level: 'B2', mode: 'interaction', type: 'parent-meeting', title: 'Talking to a worried parent', minutes: 3, minWords: 120,
    prompt: 'A parent wants to know why their child\'s English grade has dropped this term. Explain the situation tactfully and agree on next steps. The examiner plays the parent.' },
  { id: 's-c1-01', level: 'C1', mode: 'production', type: 'staff-presentation', title: 'The case for less homework', minutes: 3, minWords: 220,
    prompt: 'Present to a staff meeting the case for reducing homework in the upper-secondary years. Deal with the most likely objection before anyone raises it.' },
  { id: 's-c1-02', level: 'C1', mode: 'interaction', type: 'debate', title: 'Testing teachers\' English', minutes: 4, minWords: 220,
    prompt: 'Defend or oppose this claim: "Teachers of English should have their own proficiency tested every five years." Expect to be challenged.' },
  { id: 's-c2-01', level: 'C2', mode: 'interaction', type: 'hostile-panel', title: 'Standardised tests in rural schools', minutes: 5, minWords: 280,
    prompt: 'Take a position on whether standardised tests do more harm than good in small rural schools, and defend it under sustained challenge.' },
  { id: 's-c2-02', level: 'C2', mode: 'production', type: 'conference-talk', title: 'What research says about feedback', minutes: 4, minWords: 320,
    prompt: 'Give a short conference-style talk: what does research really say about feedback, and what should a school change on Monday morning as a result?' },
];

export const MEDIATION_TASKS = [
  { id: 'm-b2-01', level: 'B2', type: 'plain-language', title: 'Explain a notice to parents', minWords: 110, minutes: 20,
    audience: 'Parents with no background in education',
    prompt: 'Rewrite the key information in this staff notice as a short message for parents. Keep everything they need to know or do; leave out what only concerns staff.',
    sources: [
      { title: 'Staff notice', text: 'From the start of next term, summative assessment in M.4–M.6 English will be supplemented by formative checkpoints at three-week intervals. Checkpoint outcomes will not contribute to the term grade but will be recorded on the tracking sheet and shared at parent consultations. Students falling below the expected threshold on two consecutive checkpoints will be referred to the Thursday support session, attendance at which is compulsory. Homeroom teachers should brief their classes by Friday.' },
    ] },
  { id: 'm-c1-01', level: 'C1', type: 'briefing-synthesis', title: 'Briefing: what to do about homework', minWords: 200, minutes: 30,
    audience: 'The school director, who has five minutes to read it',
    prompt: 'Using both sources, write a briefing for the school director. Summarise where the sources agree and disagree, and end with one recommendation you can justify from them.',
    sources: [
      { title: 'Research summary', text: 'Across studies, homework shows a modest positive association with attainment in the upper-secondary years and almost none in the primary years. The effect is larger for short, focused tasks linked to recent teaching and for homework that receives feedback. Time spent beyond roughly ninety minutes a night is not associated with further gains. Most studies are correlational, so the direction of cause is uncertain.' },
      { title: 'Teacher\'s comment', text: 'The research is all very well, but it describes averages. In my M.6 classes the students who do the homework are the ones who would do well anyway, and the ones who need it most copy it on the bus. Cutting homework will not help them; neither does setting it. What changed things for me was ten minutes of practice at the start of each lesson, where I can actually see who is stuck.' },
    ] },
];

export const findTask = (id) => [...WRITING_TASKS, ...SPEAKING_TASKS, ...MEDIATION_TASKS].find((t) => t.id === id);
