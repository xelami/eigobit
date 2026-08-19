import "dotenv/config"

import { and, eq } from "drizzle-orm"

import { db } from "./index.js"
import { practiceQuestions, practiceQuestionOptions } from "./schema.js"

type QuestionOption = [string, string, boolean]

type QuestionVocabulary = {
  word: string
  meaning: string
  exampleSentence: string
}

type Question = {
  questionText: string
  explanation: string
  difficulty: "beginner"
  vocabulary: QuestionVocabulary[]
  options: QuestionOption[]
}

const questions: Question[] = [
  // ---------------------------------------------------------------------------
  // VERB FORMS
  // ---------------------------------------------------------------------------

  {
    questionText: "The manager ______ the email yesterday.",
    explanation:
      "'Yesterday' indicates the past, so the past form of 'send' is required: 'sent'.",
    difficulty: "beginner",
    vocabulary: [
      {
        word: "manager",
        meaning: "管理職、マネージャー",
        exampleSentence: "The manager will meet with the team this afternoon.",
      },
      {
        word: "email",
        meaning: "メール",
        exampleSentence:
          "I received an important email from the client this morning.",
      },
    ],
    options: [
      ["A", "send", false],
      ["B", "sends", false],
      ["C", "sent", true],
      ["D", "sending", false],
    ],
  },

  {
    questionText: "The meeting will ______ at 10:00 a.m. tomorrow.",
    explanation:
      "After 'will', we use the base form of the verb. 'Begin' is correct.",
    difficulty: "beginner",
    vocabulary: [
      {
        word: "meeting",
        meaning: "会議、打ち合わせ",
        exampleSentence: "The sales team has a meeting every Monday morning.",
      },
      {
        word: "begin",
        meaning: "始まる、始める",
        exampleSentence:
          "The presentation will begin after everyone takes their seats.",
      },
    ],
    options: [
      ["A", "begin", true],
      ["B", "began", false],
      ["C", "beginning", false],
      ["D", "begins", false],
    ],
  },

  {
    questionText: "Mr. Brown ______ to work by train every morning.",
    explanation:
      "The subject 'Mr. Brown' is third-person singular, so the present simple verb takes -s: 'travels'.",
    difficulty: "beginner",
    vocabulary: [
      {
        word: "travel",
        meaning: "移動する、旅行する",
        exampleSentence: "She travels to Osaka several times a month for work.",
      },
      {
        word: "every morning",
        meaning: "毎朝",
        exampleSentence: "He goes for a walk every morning before breakfast.",
      },
    ],
    options: [
      ["A", "travel", false],
      ["B", "travels", true],
      ["C", "traveling", false],
      ["D", "traveled", false],
    ],
  },

  {
    questionText: "All employees must ______ their identification cards.",
    explanation:
      "After the modal verb 'must', we use the base form of the verb: 'bring'.",
    difficulty: "beginner",
    vocabulary: [
      {
        word: "employee",
        meaning: "従業員、社員",
        exampleSentence: "Every employee must complete the training course.",
      },
      {
        word: "identification card",
        meaning: "身分証明書、IDカード",
        exampleSentence:
          "Please show your identification card at the entrance.",
      },
    ],
    options: [
      ["A", "brings", false],
      ["B", "brought", false],
      ["C", "bringing", false],
      ["D", "bring", true],
    ],
  },

  {
    questionText: "Ms. Green ______ at the company for five years.",
    explanation:
      "The present perfect 'has worked' is used for an action that began in the past and continues to the present.",
    difficulty: "beginner",
    vocabulary: [
      {
        word: "company",
        meaning: "会社",
        exampleSentence: "The company opened a new office in Kyoto last year.",
      },
      {
        word: "work",
        meaning: "働く、仕事をする",
        exampleSentence: "He has worked in the finance department since 2022.",
      },
    ],
    options: [
      ["A", "works", false],
      ["B", "worked", false],
      ["C", "has worked", true],
      ["D", "working", false],
    ],
  },

  {
    questionText:
      "The assistant ______ the documents before the meeting started.",
    explanation:
      "The past perfect 'had prepared' shows that the preparation happened before another past event.",
    difficulty: "beginner",
    vocabulary: [
      {
        word: "assistant",
        meaning: "アシスタント、助手",
        exampleSentence:
          "The assistant arranged the documents on the manager's desk.",
      },
      {
        word: "document",
        meaning: "書類、文書",
        exampleSentence: "Please sign all of the documents before Friday.",
      },
      {
        word: "prepare",
        meaning: "準備する",
        exampleSentence: "We need to prepare a report for tomorrow's meeting.",
      },
    ],
    options: [
      ["A", "prepares", false],
      ["B", "prepared", false],
      ["C", "had prepared", true],
      ["D", "preparing", false],
    ],
  },

  // ---------------------------------------------------------------------------
  // PREPOSITIONS
  // ---------------------------------------------------------------------------

  {
    questionText: "Please send the report ______ Friday.",
    explanation:
      "'By Friday' means no later than Friday and is commonly used for deadlines.",
    difficulty: "beginner",
    vocabulary: [
      {
        word: "report",
        meaning: "報告書、レポート",
        exampleSentence:
          "The manager asked me to finish the report by tomorrow.",
      },
      {
        word: "deadline",
        meaning: "締め切り、期限",
        exampleSentence: "The deadline for the application is next Monday.",
      },
    ],
    options: [
      ["A", "at", false],
      ["B", "on", false],
      ["C", "by", true],
      ["D", "from", false],
    ],
  },

  {
    questionText: "The company has three offices ______ Tokyo.",
    explanation: "'In' is used with cities to indicate location.",
    difficulty: "beginner",
    vocabulary: [
      {
        word: "office",
        meaning: "オフィス、事務所",
        exampleSentence: "Our main office is located near the station.",
      },
      {
        word: "location",
        meaning: "場所、所在地",
        exampleSentence: "The company is looking for a new office location.",
      },
    ],
    options: [
      ["A", "at", false],
      ["B", "on", false],
      ["C", "in", true],
      ["D", "to", false],
    ],
  },

  {
    questionText: "The store is closed ______ Sundays.",
    explanation:
      "'On' is used with days of the week. 'On Sundays' means every Sunday.",
    difficulty: "beginner",
    vocabulary: [
      {
        word: "store",
        meaning: "店、店舗",
        exampleSentence: "The store closes at eight o'clock every evening.",
      },
      {
        word: "closed",
        meaning: "閉まっている、営業していない",
        exampleSentence: "The restaurant is closed on public holidays.",
      },
    ],
    options: [
      ["A", "at", false],
      ["B", "in", false],
      ["C", "on", true],
      ["D", "by", false],
    ],
  },

  {
    questionText: "The conference begins ______ 9:30 a.m.",
    explanation: "'At' is used with specific times.",
    difficulty: "beginner",
    vocabulary: [
      {
        word: "conference",
        meaning: "会議、大会、カンファレンス",
        exampleSentence:
          "More than five hundred people attended the conference.",
      },
      {
        word: "begin",
        meaning: "始まる、始める",
        exampleSentence: "The ceremony will begin at noon.",
      },
    ],
    options: [
      ["A", "in", false],
      ["B", "on", false],
      ["C", "at", true],
      ["D", "by", false],
    ],
  },

  {
    questionText: "The new employee arrived ______ the office early.",
    explanation: "'At' is used with a specific location such as 'the office'.",
    difficulty: "beginner",
    vocabulary: [
      {
        word: "new employee",
        meaning: "新入社員",
        exampleSentence: "The new employee started work on Monday.",
      },
      {
        word: "arrive",
        meaning: "到着する",
        exampleSentence:
          "Please arrive at the airport two hours before departure.",
      },
    ],
    options: [
      ["A", "at", true],
      ["B", "on", false],
      ["C", "in", false],
      ["D", "to", false],
    ],
  },

  {
    questionText: "The company has been operating ______ 2018.",
    explanation: "'Since' is used with a specific starting point in time.",
    difficulty: "beginner",
    vocabulary: [
      {
        word: "operate",
        meaning: "運営する、営業する",
        exampleSentence:
          "The restaurant has operated in this area for more than ten years.",
      },
      {
        word: "since",
        meaning: "～以来、～から",
        exampleSentence: "She has lived in Tokyo since 2020.",
      },
    ],
    options: [
      ["A", "for", false],
      ["B", "since", true],
      ["C", "during", false],
      ["D", "until", false],
    ],
  },

  // ---------------------------------------------------------------------------
  // ARTICLES / DETERMINERS
  // ---------------------------------------------------------------------------

  {
    questionText: "Ms. Lee is ______ employee in our department.",
    explanation:
      "'Employee' is a singular countable noun beginning with a vowel sound, so 'an' is required.",
    difficulty: "beginner",
    vocabulary: [
      {
        word: "employee",
        meaning: "従業員、社員",
        exampleSentence: "The company has over five hundred employees.",
      },
      {
        word: "department",
        meaning: "部署、部門",
        exampleSentence: "She works in the marketing department.",
      },
    ],
    options: [
      ["A", "a", false],
      ["B", "an", true],
      ["C", "the", false],
      ["D", "some", false],
    ],
  },

  {
    questionText: "We need ______ chairs for the meeting room.",
    explanation:
      "'Some' can be used before plural countable nouns when referring to an unspecified number.",
    difficulty: "beginner",
    vocabulary: [
      {
        word: "chair",
        meaning: "椅子",
        exampleSentence: "Please move the chairs closer to the table.",
      },
      {
        word: "meeting room",
        meaning: "会議室",
        exampleSentence: "The meeting room is available after two o'clock.",
      },
    ],
    options: [
      ["A", "some", true],
      ["B", "much", false],
      ["C", "anyone", false],
      ["D", "another", false],
    ],
  },

  {
    questionText: "The company hired ______ new manager last month.",
    explanation:
      "'Manager' is a singular countable noun and is being mentioned for the first time, so 'a' is appropriate.",
    difficulty: "beginner",
    vocabulary: [
      {
        word: "hire",
        meaning: "雇う、採用する",
        exampleSentence:
          "The company plans to hire several engineers this year.",
      },
      {
        word: "manager",
        meaning: "管理職、マネージャー",
        exampleSentence: "The new manager has ten years of experience.",
      },
    ],
    options: [
      ["A", "a", true],
      ["B", "an", false],
      ["C", "some", false],
      ["D", "many", false],
    ],
  },

  {
    questionText: "Please contact ______ manager if you have any questions.",
    explanation:
      "'The' is used when referring to a specific person understood from the context.",
    difficulty: "beginner",
    vocabulary: [
      {
        word: "contact",
        meaning: "連絡する",
        exampleSentence:
          "Please contact our customer service team if you need help.",
      },
      {
        word: "question",
        meaning: "質問、疑問",
        exampleSentence: "Please let me know if you have any questions.",
      },
    ],
    options: [
      ["A", "a", false],
      ["B", "an", false],
      ["C", "the", true],
      ["D", "some", false],
    ],
  },

  // ---------------------------------------------------------------------------
  // WORD FORMS
  // ---------------------------------------------------------------------------

  {
    questionText: "The new restaurant is very ______ with local workers.",
    explanation:
      "The blank describes the restaurant, so an adjective is required. 'Popular' is the correct adjective.",
    difficulty: "beginner",
    vocabulary: [
      {
        word: "restaurant",
        meaning: "レストラン、飲食店",
        exampleSentence: "This restaurant is popular with office workers.",
      },
      {
        word: "popular",
        meaning: "人気のある",
        exampleSentence: "The new café is popular among local residents.",
      },
    ],
    options: [
      ["A", "popularity", false],
      ["B", "popular", true],
      ["C", "popularly", false],
      ["D", "popularize", false],
    ],
  },

  {
    questionText: "The company announced the ______ of a new branch.",
    explanation:
      "The noun 'opening' is needed after 'the' to describe the event of opening a new branch.",
    difficulty: "beginner",
    vocabulary: [
      {
        word: "announce",
        meaning: "発表する、知らせる",
        exampleSentence: "The company announced its plans for next year.",
      },
      {
        word: "branch",
        meaning: "支店、支社",
        exampleSentence: "The bank opened a new branch near the station.",
      },
      {
        word: "opening",
        meaning: "開店、開業、開設",
        exampleSentence: "The grand opening of the new store is next Saturday.",
      },
    ],
    options: [
      ["A", "open", false],
      ["B", "openly", false],
      ["C", "opening", true],
      ["D", "opened", false],
    ],
  },

  {
    questionText: "The manager spoke ______ during the meeting.",
    explanation:
      "The blank modifies the verb 'spoke', so an adverb is required. 'Clearly' is the correct form.",
    difficulty: "beginner",
    vocabulary: [
      {
        word: "clearly",
        meaning: "明確に、はっきりと",
        exampleSentence: "Please speak clearly during the presentation.",
      },
      {
        word: "result",
        meaning: "結果",
        exampleSentence: "The test results will be available tomorrow.",
      },
    ],
    options: [
      ["A", "clear", false],
      ["B", "clearly", true],
      ["C", "clarity", false],
      ["D", "cleared", false],
    ],
  },

  {
    questionText: "The company is looking for a ______ assistant.",
    explanation:
      "The blank describes the assistant, so an adjective is required. 'Reliable' is the correct adjective.",
    difficulty: "beginner",
    vocabulary: [
      {
        word: "reliable",
        meaning: "信頼できる、頼りになる",
        exampleSentence: "We need a reliable person to manage the project.",
      },
      {
        word: "assistant",
        meaning: "アシスタント、助手",
        exampleSentence: "The assistant helped prepare the presentation.",
      },
    ],
    options: [
      ["A", "rely", false],
      ["B", "reliably", false],
      ["C", "reliable", true],
      ["D", "reliability", false],
    ],
  },

  {
    questionText: "The manager was very ______ with the results.",
    explanation:
      "'Satisfied' is an adjective describing the manager's feeling about the results.",
    difficulty: "beginner",
    vocabulary: [
      {
        word: "satisfied",
        meaning: "満足した、満足している",
        exampleSentence: "The customer was satisfied with the service.",
      },
      {
        word: "result",
        meaning: "結果",
        exampleSentence: "We were pleased with the final results.",
      },
    ],
    options: [
      ["A", "satisfaction", false],
      ["B", "satisfy", false],
      ["C", "satisfied", true],
      ["D", "satisfying", false],
    ],
  },

  {
    questionText: "The company needs an ______ worker for the position.",
    explanation: "'Experienced' is an adjective describing the worker.",
    difficulty: "beginner",
    vocabulary: [
      {
        word: "experienced",
        meaning: "経験豊富な、経験のある",
        exampleSentence: "We are looking for an experienced designer.",
      },
      {
        word: "position",
        meaning: "職、役職、ポジション",
        exampleSentence: "She applied for a position in the sales department.",
      },
    ],
    options: [
      ["A", "experience", false],
      ["B", "experienced", true],
      ["C", "experiencing", false],
      ["D", "experientially", false],
    ],
  },

  // ---------------------------------------------------------------------------
  // CONJUNCTIONS
  // ---------------------------------------------------------------------------

  {
    questionText: "The meeting was canceled ______ the manager was ill.",
    explanation:
      "'Because' introduces the reason why the meeting was canceled.",
    difficulty: "beginner",
    vocabulary: [
      {
        word: "cancel",
        meaning: "中止する、キャンセルする",
        exampleSentence:
          "The airline canceled the flight because of bad weather.",
      },
      {
        word: "ill",
        meaning: "病気の、具合が悪い",
        exampleSentence: "She was unable to come to work because she was ill.",
      },
    ],
    options: [
      ["A", "because", true],
      ["B", "although", false],
      ["C", "unless", false],
      ["D", "while", false],
    ],
  },

  {
    questionText: "Please call me ______ you arrive at the office.",
    explanation: "'When' introduces the time at which something happens.",
    difficulty: "beginner",
    vocabulary: [
      {
        word: "arrive",
        meaning: "到着する",
        exampleSentence: "Please call me when you arrive at the hotel.",
      },
      {
        word: "office",
        meaning: "オフィス、事務所",
        exampleSentence: "Our office is closed on national holidays.",
      },
    ],
    options: [
      ["A", "because", false],
      ["B", "when", true],
      ["C", "although", false],
      ["D", "unless", false],
    ],
  },

  {
    questionText: "The store was busy, ______ we decided to wait outside.",
    explanation: "'So' connects a situation with its result.",
    difficulty: "beginner",
    vocabulary: [
      {
        word: "busy",
        meaning: "忙しい、混雑した",
        exampleSentence: "The restaurant is usually busy on Friday evenings.",
      },
      {
        word: "decide",
        meaning: "決める、決定する",
        exampleSentence: "We decided to postpone the meeting until Monday.",
      },
    ],
    options: [
      ["A", "but", false],
      ["B", "because", false],
      ["C", "so", true],
      ["D", "although", false],
    ],
  },

  {
    questionText: "______ the weather was bad, the employees arrived on time.",
    explanation:
      "'Although' introduces a contrast between the bad weather and the employees arriving on time.",
    difficulty: "beginner",
    vocabulary: [
      {
        word: "although",
        meaning: "～だけれども、～にもかかわらず",
        exampleSentence:
          "Although it was raining, the event continued as planned.",
      },
      {
        word: "employee",
        meaning: "従業員、社員",
        exampleSentence: "All employees must attend the annual training.",
      },
      {
        word: "on time",
        meaning: "時間通りに、定刻に",
        exampleSentence: "The train arrived on time despite the heavy rain.",
      },
    ],
    options: [
      ["A", "Because", false],
      ["B", "Although", true],
      ["C", "So", false],
      ["D", "And", false],
    ],
  },

  // ---------------------------------------------------------------------------
  // VOCABULARY
  // ---------------------------------------------------------------------------

  {
    questionText:
      "Employees should wear appropriate ______ during business meetings.",
    explanation:
      "'Attire' means clothing, especially clothing suitable for a particular situation.",
    difficulty: "beginner",
    vocabulary: [
      {
        word: "attire",
        meaning: "服装、衣装",
        exampleSentence: "Formal attire is required for the awards ceremony.",
      },
      {
        word: "appropriate",
        meaning: "適切な、ふさわしい",
        exampleSentence: "Please wear appropriate clothing for the interview.",
      },
      {
        word: "business meeting",
        meaning: "仕事の会議、商談",
        exampleSentence:
          "She has a business meeting with an overseas client tomorrow.",
      },
    ],
    options: [
      ["A", "attire", true],
      ["B", "arrival", false],
      ["C", "equipment", false],
      ["D", "scenery", false],
    ],
  },

  {
    questionText: "Please make a ______ before visiting the doctor.",
    explanation:
      "'Appointment' is the correct word for an arranged meeting at a particular time.",
    difficulty: "beginner",
    vocabulary: [
      {
        word: "appointment",
        meaning: "予約、約束",
        exampleSentence: "I have a doctor's appointment at three o'clock.",
      },
      {
        word: "visit",
        meaning: "訪問する、訪問",
        exampleSentence: "She plans to visit the client next week.",
      },
    ],
    options: [
      ["A", "appointment", true],
      ["B", "application", false],
      ["C", "agreement", false],
      ["D", "announcement", false],
    ],
  },

  {
    questionText: "The company will ______ a new product next month.",
    explanation:
      "'Launch' means to introduce a new product or service to the market.",
    difficulty: "beginner",
    vocabulary: [
      {
        word: "launch",
        meaning: "発売する、開始する",
        exampleSentence:
          "The company plans to launch a new smartphone this fall.",
      },
      {
        word: "product",
        meaning: "製品、商品",
        exampleSentence:
          "The company developed a new product for small businesses.",
      },
    ],
    options: [
      ["A", "launch", true],
      ["B", "borrow", false],
      ["C", "repair", false],
      ["D", "cancel", false],
    ],
  },

  {
    questionText:
      "The manager asked the employee to ______ the report before Friday.",
    explanation: "'Complete' means to finish something that has been started.",
    difficulty: "beginner",
    vocabulary: [
      {
        word: "complete",
        meaning: "完了する、完成させる",
        exampleSentence: "Please complete the form before submitting it.",
      },
      {
        word: "report",
        meaning: "報告書、レポート",
        exampleSentence: "The manager reviewed the monthly sales report.",
      },
    ],
    options: [
      ["A", "complete", true],
      ["B", "invite", false],
      ["C", "attend", false],
      ["D", "replace", false],
    ],
  },

  {
    questionText: "The hotel offers free breakfast to all ______.",
    explanation: "'Guests' refers to people staying at a hotel.",
    difficulty: "beginner",
    vocabulary: [
      {
        word: "guest",
        meaning: "宿泊客、客",
        exampleSentence: "All hotel guests can use the swimming pool.",
      },
      {
        word: "offer",
        meaning: "提供する、申し出る",
        exampleSentence: "The hotel offers free Wi-Fi to all guests.",
      },
    ],
    options: [
      ["A", "guests", true],
      ["B", "customers", false],
      ["C", "employees", false],
      ["D", "drivers", false],
    ],
  },

  {
    questionText:
      "Please keep your receipt in case you need to ______ the item.",
    explanation: "'Return' means to take an item back to the store.",
    difficulty: "beginner",
    vocabulary: [
      {
        word: "receipt",
        meaning: "レシート、領収書",
        exampleSentence: "Please keep your receipt until the warranty expires.",
      },
      {
        word: "return",
        meaning: "返品する、返す",
        exampleSentence: "You can return the item within thirty days.",
      },
      {
        word: "item",
        meaning: "商品、品物",
        exampleSentence: "This item is currently out of stock.",
      },
    ],
    options: [
      ["A", "return", true],
      ["B", "reserve", false],
      ["C", "borrow", false],
      ["D", "deliver", false],
    ],
  },
]

/*
 * ============================================================================
 * REMOVE EXISTING BEGINNER TOEIC PART 5 QUESTIONS
 * ============================================================================
 *
 * This prevents duplicate questions when the seed is run again.
 *
 * The question options are deleted first because they reference the questions.
 */

const existingQuestions = await db
  .select({
    id: practiceQuestions.id,
  })
  .from(practiceQuestions)
  .where(
    and(
      eq(practiceQuestions.exam, "toeic"),
      eq(practiceQuestions.part, "5"),
      eq(practiceQuestions.difficulty, "beginner"),
    ),
  )

for (const question of existingQuestions) {
  await db
    .delete(practiceQuestionOptions)
    .where(eq(practiceQuestionOptions.questionId, question.id))

  await db
    .delete(practiceQuestions)
    .where(eq(practiceQuestions.id, question.id))
}

/*
 * ============================================================================
 * INSERT QUESTIONS
 * ============================================================================
 */

for (const item of questions) {
  const [question] = await db
    .insert(practiceQuestions)
    .values({
      exam: "toeic",
      part: "5",
      questionType: "multiple_choice",
      questionText: item.questionText,
      explanation: item.explanation,
      difficulty: item.difficulty,
      vocabulary: item.vocabulary,
    })
    .returning({
      id: practiceQuestions.id,
    })

  if (!question) {
    throw new Error("Failed to create question")
  }

  await db.insert(practiceQuestionOptions).values(
    item.options.map(([label, text, isCorrect]) => ({
      questionId: question.id,
      optionLabel: label,
      optionText: text,
      isCorrect,
    })),
  )
}

console.log(`Seeded ${questions.length} TOEIC Part 5 beginner questions.`)
