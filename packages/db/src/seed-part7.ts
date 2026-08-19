import "dotenv/config"

import { and, eq } from "drizzle-orm"

import { db } from "./index.js"
import {
  practicePassages,
  practiceQuestions,
  practiceQuestionOptions,
} from "./schema.js"

type QuestionOption = [string, string, boolean]

type Question = {
  questionText: string
  questionType: "multiple_choice"
  explanation: string
  vocabulary: {
    word: string
    meaning: string
    exampleSentence: string
  }[]
  options: QuestionOption[]
}

type Passage = {
  passageType: "email" | "notice" | "advertisement" | "article"
  title: string
  passageText: string
  difficulty: "beginner"
  questions: Question[]
}

const passages: Passage[] = [
  {
    passageType: "email",
    title: "Staff Meeting Change",
    difficulty: "beginner",
    passageText: `To: All Marketing Staff
From: Sarah Wilson
Subject: Tuesday Staff Meeting

Hello everyone,

This week's marketing staff meeting has been moved from Tuesday morning to Wednesday afternoon. The meeting will begin at 2:00 p.m. in Conference Room B.

We will discuss the results of last month's advertising campaign and plans for the company's new website.

Please bring your monthly sales reports to the meeting. If you cannot attend, send your report to me by Tuesday evening.

Thank you,
Sarah Wilson
Marketing Manager`,
    questions: [
      {
        questionType: "multiple_choice",
        questionText: "When will the marketing staff meeting take place?",
        explanation:
          "The email states that the meeting has been moved to Wednesday afternoon and will begin at 2:00 p.m.",
        vocabulary: [
          {
            word: "moved",
            meaning: "変更された、移された",
            exampleSentence: "The meeting was moved to Wednesday afternoon.",
          },
        ],
        options: [
          ["A", "Monday morning", false],
          ["B", "Tuesday morning", false],
          ["C", "Wednesday afternoon", true],
          ["D", "Thursday afternoon", false],
        ],
      },
      {
        questionType: "multiple_choice",
        questionText: "What will the employees discuss at the meeting?",
        explanation:
          "The email says that the staff will discuss last month's advertising campaign and plans for the new website.",
        vocabulary: [
          {
            word: "advertising campaign",
            meaning: "広告キャンペーン",
            exampleSentence: "The company launched a new advertising campaign.",
          },
        ],
        options: [
          ["A", "A new office location", false],
          ["B", "Last month's advertising campaign", true],
          ["C", "Employee vacation schedules", false],
          ["D", "A new training program", false],
        ],
      },
      {
        questionType: "multiple_choice",
        questionText: "What are employees asked to bring to the meeting?",
        explanation:
          "Sarah asks employees to bring their monthly sales reports.",
        vocabulary: [
          {
            word: "sales report",
            meaning: "売上報告書",
            exampleSentence: "Please submit your monthly sales report.",
          },
        ],
        options: [
          ["A", "Their laptops", false],
          ["B", "Sales reports", true],
          ["C", "Customer surveys", false],
          ["D", "Website designs", false],
        ],
      },
    ],
  },

  {
    passageType: "notice",
    title: "Parking Lot Maintenance",
    difficulty: "beginner",
    passageText: `NOTICE TO BUILDING TENANTS

The parking lot behind the Riverside Office Building will be closed for maintenance on Saturday, October 12.

Workers will repaint the parking spaces and repair several areas of damaged pavement. The work is expected to begin at 8:00 a.m. and finish by 5:00 p.m.

Employees who normally park in the lot should use the public parking garage on Oak Street. The garage is approximately a five-minute walk from the office building.

We apologize for the inconvenience.`,
    questions: [
      {
        questionType: "multiple_choice",
        questionText: "Why will the parking lot be closed?",
        explanation:
          "The notice says that workers will repaint parking spaces and repair damaged pavement.",
        vocabulary: [
          {
            word: "maintenance",
            meaning: "保守、整備、メンテナンス",
            exampleSentence: "The parking lot will be closed for maintenance.",
          },
        ],
        options: [
          ["A", "A company event", false],
          ["B", "Building construction", false],
          ["C", "Maintenance work", true],
          ["D", "A public holiday", false],
        ],
      },
      {
        questionType: "multiple_choice",
        questionText: "What will workers repair?",
        explanation:
          "The notice specifically states that workers will repair areas of damaged pavement.",
        vocabulary: [
          {
            word: "pavement",
            meaning: "舗装、舗装道路",
            exampleSentence: "Several areas of pavement need to be repaired.",
          },
        ],
        options: [
          ["A", "The building's elevators", false],
          ["B", "Damaged pavement", true],
          ["C", "The office windows", false],
          ["D", "The parking garage", false],
        ],
      },
      {
        questionType: "multiple_choice",
        questionText: "Where should employees park on October 12?",
        explanation:
          "Employees are instructed to use the public parking garage on Oak Street.",
        vocabulary: [
          {
            word: "garage",
            meaning: "駐車場、ガレージ",
            exampleSentence: "The public parking garage is near the station.",
          },
        ],
        options: [
          ["A", "Behind the office", false],
          ["B", "On the street behind the building", false],
          ["C", "At the Oak Street garage", true],
          ["D", "At the company's warehouse", false],
        ],
      },
    ],
  },

  {
    passageType: "advertisement",
    title: "Greenway Fitness Center",
    difficulty: "beginner",
    passageText: `GREENWAY FITNESS CENTER

Special Membership Offer

Join Greenway Fitness Center before November 1 and receive your first month of membership for half price.

Our membership includes access to the gym, swimming pool, and group exercise classes. Members can also use the fitness center's locker rooms and showers.

The center is open from 6:00 a.m. to 10:00 p.m. Monday through Friday and from 8:00 a.m. to 8:00 p.m. on weekends.

New members who sign up for a one-year membership will also receive a free fitness assessment.

Visit our website or speak with a staff member at the front desk for more information.`,
    questions: [
      {
        questionType: "multiple_choice",
        questionText: "What does the special offer provide?",
        explanation:
          "Customers who join before November 1 receive their first month of membership for half price.",
        vocabulary: [
          {
            word: "membership",
            meaning: "会員資格、会員登録",
            exampleSentence: "Her gym membership expires next month.",
          },
        ],
        options: [
          ["A", "A free personal trainer", false],
          ["B", "Half-price first month", true],
          ["C", "Free gym equipment", false],
          ["D", "A free swimming class", false],
        ],
      },
      {
        questionType: "multiple_choice",
        questionText: "What is included with a membership?",
        explanation:
          "The advertisement says that members can access the gym, swimming pool, and group exercise classes.",
        vocabulary: [
          {
            word: "access",
            meaning: "利用する権利、アクセス",
            exampleSentence: "Members have access to the swimming pool.",
          },
        ],
        options: [
          ["A", "Free meals", false],
          ["B", "Private offices", false],
          ["C", "The gym and swimming pool", true],
          ["D", "Transportation services", false],
        ],
      },
      {
        questionType: "multiple_choice",
        questionText:
          "What additional benefit is offered to people who sign up for a one-year membership?",
        explanation:
          "New members who choose a one-year membership receive a free fitness assessment.",
        vocabulary: [
          {
            word: "assessment",
            meaning: "評価、診断",
            exampleSentence: "Every new member receives a fitness assessment.",
          },
        ],
        options: [
          ["A", "A free fitness assessment", true],
          ["B", "A free year's membership", false],
          ["C", "Free exercise equipment", false],
          ["D", "Free weekend classes", false],
        ],
      },
    ],
  },

  {
    passageType: "article",
    title: "Local Library Renovation",
    difficulty: "beginner",
    passageText: `Riverside Library to Reopen

The Riverside Public Library has been closed since June while workers completed renovations to the main building.

The library is scheduled to reopen on Monday, September 9. According to library director Michael Brown, the renovated building will have a larger children's reading area and additional computers for visitors.

The library's collection of books has also been reorganized. New signs have been installed to make it easier for visitors to find books by subject.

During the renovation, library members were able to borrow books from the Eastside Library. The Eastside branch will continue to accept Riverside Library books until September 20.

Library officials expect the renovated building to attract more visitors from the local community.`,
    questions: [
      {
        questionType: "multiple_choice",
        questionText: "Why was Riverside Library closed?",
        explanation:
          "The article says the library was closed while workers completed renovations.",
        vocabulary: [
          {
            word: "renovation",
            meaning: "改修、改装",
            exampleSentence: "The library closed during the renovation.",
          },
        ],
        options: [
          ["A", "Because of a staff shortage", false],
          ["B", "Because of renovations", true],
          ["C", "Because of a holiday", false],
          ["D", "Because of bad weather", false],
        ],
      },
      {
        questionType: "multiple_choice",
        questionText: "What has been added to the renovated building?",
        explanation:
          "The renovated library will have a larger children's reading area and additional computers.",
        vocabulary: [
          {
            word: "additional",
            meaning: "追加の、さらに",
            exampleSentence: "The library now has additional computers.",
          },
        ],
        options: [
          ["A", "A restaurant", false],
          ["B", "A parking garage", false],
          ["C", "Additional computers", true],
          ["D", "A new entrance", false],
        ],
      },
      {
        questionType: "multiple_choice",
        questionText: "Why were new signs installed?",
        explanation:
          "The signs were installed to help visitors find books by subject more easily.",
        vocabulary: [
          {
            word: "subject",
            meaning: "分野、テーマ、科目",
            exampleSentence: "The books are organized by subject.",
          },
        ],
        options: [
          ["A", "To advertise new books", false],
          ["B", "To identify library employees", false],
          ["C", "To make finding books easier", true],
          ["D", "To show the library's opening hours", false],
        ],
      },

      {
        questionType: "multiple_choice",
        questionText:
          "Until when will the Eastside Library accept Riverside Library books?",
        explanation:
          "The article states that the Eastside branch will continue accepting Riverside Library books until September 20.",
        vocabulary: [
          {
            word: "accept",
            meaning: "受け入れる、受け取る",
            exampleSentence:
              "The library will accept returned books until Friday.",
          },
        ],
        options: [
          ["A", "September 9", false],
          ["B", "September 15", false],
          ["C", "September 20", true],
          ["D", "October 1", false],
        ],
      },
    ],
  },

  {
    passageType: "email",
    title: "Product Delivery Update",
    difficulty: "beginner",
    passageText: `To: Mr. Daniel Lee
From: Westfield Office Supplies
Subject: Your Office Chair Order

Dear Mr. Lee,

Thank you for ordering an executive office chair from Westfield Office Supplies.

We originally expected to deliver your chair on Thursday, but our delivery truck has experienced a mechanical problem. As a result, your order will arrive on Friday instead.

There is no additional delivery charge. Our driver will call you approximately thirty minutes before arriving at your office.

If you will not be available on Friday, please contact our customer service department to arrange another delivery date.

We apologize for the inconvenience.

Sincerely,
Westfield Office Supplies`,
    questions: [
      {
        questionType: "multiple_choice",
        questionText:
          "Why will the chair arrive later than originally planned?",
        explanation:
          "The delivery truck experienced a mechanical problem, causing the delivery to be delayed.",
        vocabulary: [
          {
            word: "mechanical",
            meaning: "機械の、機械的な",
            exampleSentence:
              "The truck stopped because of a mechanical problem.",
          },
        ],
        options: [
          ["A", "The chair was damaged", false],
          ["B", "The customer changed the address", false],
          ["C", "The delivery truck has a problem", true],
          ["D", "The company closed", false],
        ],
      },
      {
        questionType: "multiple_choice",
        questionText: "When will the chair be delivered?",
        explanation:
          "The email says the chair was originally scheduled for Thursday but will arrive on Friday instead.",
        vocabulary: [
          {
            word: "instead",
            meaning: "その代わりに",
            exampleSentence: "The meeting will take place on Friday instead.",
          },
        ],
        options: [
          ["A", "Wednesday", false],
          ["B", "Thursday", false],
          ["C", "Friday", true],
          ["D", "Monday", false],
        ],
      },
      {
        questionType: "multiple_choice",
        questionText: "What will the driver do before arriving?",
        explanation:
          "The driver will call approximately thirty minutes before arriving at the customer's office.",
        vocabulary: [
          {
            word: "approximately",
            meaning: "約、およそ",
            exampleSentence:
              "The driver will arrive in approximately thirty minutes.",
          },
        ],
        options: [
          ["A", "Send an email", false],
          ["B", "Call the customer", true],
          ["C", "Leave the chair outside", false],
          ["D", "Contact the customer's manager", false],
        ],
      },
    ],
  },
]

async function seedPart7() {
  console.log("Seeding TOEIC Part 7...")

  const existingPassages = await db
    .select({
      id: practicePassages.id,
    })
    .from(practicePassages)
    .where(
      and(eq(practicePassages.exam, "toeic"), eq(practicePassages.part, "7")),
    )

  for (const passage of existingPassages) {
    await db.delete(practicePassages).where(eq(practicePassages.id, passage.id))
  }

  let totalQuestions = 0
  let totalOptions = 0

  for (const passage of passages) {
    const [createdPassage] = await db
      .insert(practicePassages)
      .values({
        exam: "toeic",
        part: "7",
        title: passage.title,
        passageText: passage.passageText,
        difficulty: passage.difficulty,
      })
      .returning({
        id: practicePassages.id,
      })

    if (!createdPassage) {
      throw new Error(`Failed to create passage: ${passage.title}`)
    }

    console.log(`\n✓ ${passage.title}`)

    for (const [index, question] of passage.questions.entries()) {
      const [createdQuestion] = await db
        .insert(practiceQuestions)
        .values({
          exam: "toeic",
          part: "7",
          passageId: createdPassage.id,
          passageQuestionNumber: index + 1,
          questionType: question.questionType,
          questionText: question.questionText,
          explanation: question.explanation,
          difficulty: passage.difficulty,
          vocabulary: question.vocabulary,
        })
        .returning({
          id: practiceQuestions.id,
        })

      if (!createdQuestion) {
        throw new Error(
          `Failed to create question ${index + 1} for ${passage.title}`,
        )
      }

      await db.insert(practiceQuestionOptions).values(
        question.options.map(([label, text, isCorrect]) => ({
          questionId: createdQuestion.id,
          optionLabel: label,
          optionText: text,
          isCorrect,
        })),
      )

      totalQuestions += 1
      totalOptions += question.options.length
    }

    console.log(`  ✓ ${passage.questions.length} questions`)
  }

  console.log("\n────────────────────────────")
  console.log("Part 7 seeded successfully")
  console.log(`Passages: ${passages.length}`)
  console.log(`Questions: ${totalQuestions}`)
  console.log(`Options: ${totalOptions}`)
  console.log("────────────────────────────")
}

seedPart7()
  .catch((error) => {
    console.error("Failed to seed Part 7:", error)
    process.exit(1)
  })
  .finally(async () => {
    await db.$client.end()
  })
