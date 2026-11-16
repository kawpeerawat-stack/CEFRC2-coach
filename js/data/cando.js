// Can-do statements — เขียนขึ้นใหม่ตามแนว CEFR Companion Volume (ไม่ได้คัดลอกข้อความต้นฉบับ)
// เพิ่มข้อใหม่: ต่อท้ายอาร์เรย์ โดย id ต้องไม่ซ้ำ รูปแบบ: [id, skill, level, statement]
const ROWS = [
  ['l-b1-1', 'listening', 'B1', 'I can follow the main points of clear talk about familiar school or work topics.'],
  ['l-b1-2', 'listening', 'B1', 'I can get the gist of a podcast or radio item on a topic I know when the delivery is slow and clear.'],
  ['l-b2-1', 'listening', 'B2', 'I can follow a talk or lecture in my field even when the line of argument is complex.'],
  ['l-b2-2', 'listening', 'B2', 'I can understand most news and current-affairs programmes at normal speed.'],
  ['l-c1-1', 'listening', 'C1', 'I can follow extended talk even when it is loosely structured and ideas are only implied.'],
  ['l-c1-2', 'listening', 'C1', 'I can understand films and podcasts that use slang and idiom without much effort.'],
  ['l-c2-1', 'listening', 'C2', 'I can follow any kind of spoken English at natural speed, including unfamiliar accents after a short adjustment.'],
  ['l-c2-2', 'listening', 'C2', 'I can pick up irony, understatement and attitude that speakers do not state directly.'],

  ['r-b1-1', 'reading', 'B1', 'I can understand straightforward factual texts on subjects related to my work.'],
  ['r-b1-2', 'reading', 'B1', 'I can find the information I need in everyday material such as letters, notices and short official documents.'],
  ['r-b2-1', 'reading', 'B2', 'I can read articles and reports on current issues and identify the writer\'s stance.'],
  ['r-b2-2', 'reading', 'B2', 'I can scan a long text quickly enough to decide whether it deserves closer study.'],
  ['r-c1-1', 'reading', 'C1', 'I can understand long, complex texts and notice differences of style.'],
  ['r-c1-2', 'reading', 'C1', 'I can read specialised articles outside my own field with only occasional use of a dictionary.'],
  ['r-c2-1', 'reading', 'C2', 'I can read virtually any text with ease, including abstract or literary writing with dense structure.'],
  ['r-c2-2', 'reading', 'C2', 'I can appreciate fine shades of meaning, implied criticism and deliberate ambiguity.'],

  ['si-b1-1', 'spoken-interaction', 'B1', 'I can join a conversation on a familiar topic without preparing.'],
  ['si-b1-2', 'spoken-interaction', 'B1', 'I can handle most situations at work or when travelling, such as explaining a problem.'],
  ['si-b2-1', 'spoken-interaction', 'B2', 'I can keep up a discussion with fluent speakers and defend my view with relevant arguments.'],
  ['si-b2-2', 'spoken-interaction', 'B2', 'I can answer follow-up questions spontaneously without obvious strain.'],
  ['si-c1-1', 'spoken-interaction', 'C1', 'I can express myself fluently in meetings without much searching for words.'],
  ['si-c1-2', 'spoken-interaction', 'C1', 'I can link what I say to what others have said, and interrupt or concede a point politely.'],
  ['si-c2-1', 'spoken-interaction', 'C2', 'I can take part effortlessly in any discussion and use idiomatic language accurately.'],
  ['si-c2-2', 'spoken-interaction', 'C2', 'I can backtrack and rephrase so smoothly that listeners hardly notice.'],

  ['sp-b1-1', 'spoken-production', 'B1', 'I can give a short prepared talk on a familiar topic and explain my reasons.'],
  ['sp-b1-2', 'spoken-production', 'B1', 'I can describe an experience or tell a story in connected sentences.'],
  ['sp-b2-1', 'spoken-production', 'B2', 'I can give a clear, detailed presentation that weighs advantages and disadvantages.'],
  ['sp-b2-2', 'spoken-production', 'B2', 'I can leave my notes to follow up a point raised by the audience.'],
  ['sp-c1-1', 'spoken-production', 'C1', 'I can give a well-structured talk on a complex subject and round it off with a fitting conclusion.'],
  ['sp-c1-2', 'spoken-production', 'C1', 'I can vary stress and intonation to express finer shades of meaning.'],
  ['sp-c2-1', 'spoken-production', 'C2', 'I can present a complex argument with a structure that helps listeners notice and remember the key points.'],
  ['sp-c2-2', 'spoken-production', 'C2', 'I can change the level of formality and detail on the spot for a different audience.'],

  ['w-b1-1', 'writing', 'B1', 'I can write simple connected text on topics that are familiar to me.'],
  ['w-b1-2', 'writing', 'B1', 'I can write a personal email describing experiences and impressions.'],
  ['w-b2-1', 'writing', 'B2', 'I can write a clear, detailed essay or report giving reasons for and against a point of view.'],
  ['w-b2-2', 'writing', 'B2', 'I can write a formal email that makes clear why something matters.'],
  ['w-c1-1', 'writing', 'C1', 'I can write well-structured text on complex subjects and underline the issues I consider most important.'],
  ['w-c1-2', 'writing', 'C1', 'I can choose a style that suits the reader I have in mind.'],
  ['w-c2-1', 'writing', 'C2', 'I can write smoothly flowing text in an appropriate style, with a structure that helps the reader find the key points.'],
  ['w-c2-2', 'writing', 'C2', 'I can write summaries and critical reviews of professional or literary works.'],

  ['m-b1-1', 'mediation', 'B1', 'I can pass on the main points of a short, clear text or announcement in simple terms.'],
  ['m-b1-2', 'mediation', 'B1', 'I can tell an absent colleague what was decided in a simple meeting.'],
  ['m-b2-1', 'mediation', 'B2', 'I can summarise the key points of an article or talk in my field for a colleague.'],
  ['m-b2-2', 'mediation', 'B2', 'I can explain the information in a chart or table and point out the main trends.'],
  ['m-c1-1', 'mediation', 'C1', 'I can summarise long, demanding texts for a particular audience, adjusting detail and register.'],
  ['m-c1-2', 'mediation', 'C1', 'I can guide a discussion towards a conclusion while weighing different contributions.'],
  ['m-c2-1', 'mediation', 'C2', 'I can explain what a text or talk implies: irony, veiled criticism and cultural references.'],
  ['m-c2-2', 'mediation', 'C2', 'I can combine information and arguments from several sources into a coherent account for non-specialists.'],
];

export const CANDO = ROWS.map(([id, skill, level, text]) => ({ id, skill, level, text }));
export const CANDO_STATES = [
  { value: 0, label: 'ยังทำไม่ได้' },
  { value: 1, label: 'ทำได้บางครั้ง' },
  { value: 2, label: 'ทำได้มั่นใจ' },
];
