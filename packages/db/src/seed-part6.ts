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
  questionType: "multiple_choice" | "sentence_insertion"
  explanation: string
  vocabulary: {
    word: string
    meaning: string
    exampleSentence: string
  }[]
  options: QuestionOption[]
}

type Passage = {
  title: string
  passageText: string
  difficulty: "beginner"
  questions: Question[]
}

const passages: Passage[] = [
  {
    title: "Office Renovation",
    difficulty: "beginner",
    passageText: `To: All Employees
From: Facilities Department
Subject: Office Renovation

The second-floor offices will be renovated next month. The work is scheduled to begin on September 3 and is expected to take approximately two weeks.

During this period, employees who normally work on the second floor will temporarily move to the conference rooms on the first floor. Please take all personal belongings home before the renovation begins.

[A] The Facilities Department will provide additional information about the temporary workspaces next week.

[B] Employees may continue to use the second-floor offices during the renovation.

[C] The renovation is necessary because several areas of the office require repairs.

[D] We apologize for any inconvenience this change may cause.`,
    questions: [
      {
        questionType: "multiple_choice",
        questionText:
          "The renovation is expected to take approximately ______.",
        explanation:
          "The passage states that the work is expected to take approximately two weeks.",
        vocabulary: [
          {
            word: "approximately",
            meaning: "約、およそ",
            exampleSentence: "The meeting will last approximately one hour.",
          },
        ],
        options: [
          ["A", "three days", false],
          ["B", "one week", false],
          ["C", "two weeks", true],
          ["D", "one month", false],
        ],
      },
      {
        questionType: "multiple_choice",
        questionText:
          "Employees who normally work on the second floor will temporarily work ______.",
        explanation:
          "The passage says that these employees will temporarily move to conference rooms on the first floor.",
        vocabulary: [
          {
            word: "conference room",
            meaning: "会議室",
            exampleSentence:
              "The meeting will take place in the conference room.",
          },
        ],
        options: [
          ["A", "at home", false],
          ["B", "on the first floor", true],
          ["C", "in another building", false],
          ["D", "outside the office", false],
        ],
      },
      {
        questionType: "multiple_choice",
        questionText:
          "Please take all personal belongings home before the renovation ______.",
        explanation:
          "The phrase 'before the renovation begins' correctly completes the sentence.",
        vocabulary: [
          {
            word: "begin",
            meaning: "始まる、始める",
            exampleSentence: "The meeting will begin at nine o'clock.",
          },
        ],
        options: [
          ["A", "begin", false],
          ["B", "begins", true],
          ["C", "began", false],
          ["D", "beginning", false],
        ],
      },
      {
        questionType: "sentence_insertion",
        questionText:
          'Where would the following sentence best fit in the passage?\n\n"The construction team will also replace the lighting in several offices."',
        explanation:
          "The sentence gives another detail about the renovation and fits best after the passage explains that several areas require repairs.",
        vocabulary: [
          {
            word: "construction",
            meaning: "建設、工事",
            exampleSentence:
              "Construction on the new building will begin next month.",
          },
          {
            word: "lighting",
            meaning: "照明",
            exampleSentence: "The office has recently received new lighting.",
          },
        ],
        options: [
          ["A", "After the first paragraph", false],
          ["B", "After the sentence about repairs", true],
          ["C", "After the sentence about personal belongings", false],
          ["D", "At the very end", false],
        ],
      },
    ],
  },

  {
    title: "New Store Hours",
    difficulty: "beginner",
    passageText: `Important Announcement

Beginning October 1, Green Market will have new opening hours. The store will open at 8:00 a.m. from Monday through Saturday and will close at 9:00 p.m.

The new schedule has been introduced to better serve customers who shop before and after work.

[A] On Sundays, the store will continue to open at 10:00 a.m.

[B] Customers can also place orders through our website.

[C] Employees are currently preparing the store for the new schedule.

[D] We appreciate your understanding and look forward to serving you during our new business hours.`,
    questions: [
      {
        questionType: "multiple_choice",
        questionText: "When will the new opening hours take effect?",
        explanation:
          "The announcement says that the new hours will begin on October 1.",
        vocabulary: [
          {
            word: "take effect",
            meaning: "実施される、効力を発する",
            exampleSentence: "The new policy will take effect next Monday.",
          },
        ],
        options: [
          ["A", "September 1", false],
          ["B", "October 1", true],
          ["C", "October 10", false],
          ["D", "November 1", false],
        ],
      },
      {
        questionType: "multiple_choice",
        questionText:
          "The new schedule is intended to better serve customers who shop ______.",
        explanation:
          "The passage specifically mentions customers who shop before and after work.",
        vocabulary: [
          {
            word: "intended",
            meaning: "意図された、目的とした",
            exampleSentence: "The program is intended to help new employees.",
          },
        ],
        options: [
          ["A", "during holidays", false],
          ["B", "only on Sundays", false],
          ["C", "before and after work", true],
          ["D", "late at night", false],
        ],
      },
      {
        questionType: "multiple_choice",
        questionText:
          "The store will be open until ______ from Monday through Saturday.",
        explanation:
          "The passage states that the store will close at 9:00 p.m.",
        vocabulary: [
          {
            word: "through",
            meaning: "～を通して、～から～まで",
            exampleSentence: "The store is open Monday through Saturday.",
          },
        ],
        options: [
          ["A", "6:00 p.m.", false],
          ["B", "7:00 p.m.", false],
          ["C", "8:00 p.m.", false],
          ["D", "9:00 p.m.", true],
        ],
      },
      {
        questionType: "sentence_insertion",
        questionText:
          'Where would the following sentence best fit in the passage?\n\n"This means that customers will have more time to shop on weekdays."',
        explanation:
          "The sentence explains the benefit of the newly extended weekday hours, so it fits immediately after the new hours are introduced.",
        vocabulary: [
          {
            word: "extended",
            meaning: "延長された",
            exampleSentence: "The store introduced extended business hours.",
          },
        ],
        options: [
          ["A", "After the first sentence", true],
          ["B", "After the sentence about Sundays", false],
          ["C", "After the website sentence", false],
          ["D", "At the very end", false],
        ],
      },
    ],
  },

  {
    title: "Employee Training Session",
    difficulty: "beginner",
    passageText: `To: New Employees
Subject: Customer Service Training

All new employees are required to attend a customer service training session on September 12. The session will begin at 9:30 a.m. and will be held in Room 204.

The training will cover several topics, including communication with customers and handling complaints.

[A] Please arrive at least ten minutes before the session begins.

[B] Employees should bring a notebook and a pen.

[C] The training department will provide lunch after the session.

[D] Attendance is required, so please contact your supervisor if you cannot attend.`,
    questions: [
      {
        questionType: "multiple_choice",
        questionText: "Who is required to attend the training session?",
        explanation:
          "The notice is specifically addressed to new employees and states that all new employees are required to attend.",
        vocabulary: [
          {
            word: "session",
            meaning: "講習、セッション",
            exampleSentence: "The training session will last two hours.",
          },
        ],
        options: [
          ["A", "All customers", false],
          ["B", "Managers only", false],
          ["C", "New employees", true],
          ["D", "Training department staff", false],
        ],
      },
      {
        questionType: "multiple_choice",
        questionText: "What will the training cover?",
        explanation:
          "The passage says that the training will cover communication with customers and handling complaints.",
        vocabulary: [
          {
            word: "handle",
            meaning: "対応する、処理する",
            exampleSentence: "She knows how to handle difficult customers.",
          },
        ],
        options: [
          ["A", "Computer programming", false],
          ["B", "Communication and complaints", true],
          ["C", "Financial planning", false],
          ["D", "Office maintenance", false],
        ],
      },
      {
        questionType: "multiple_choice",
        questionText:
          "Employees are asked to arrive at least ten minutes ______ the session begins.",
        explanation:
          "The correct preposition is 'before' because employees should arrive earlier than the start time.",
        vocabulary: [
          {
            word: "at least",
            meaning: "少なくとも",
            exampleSentence: "Please arrive at least fifteen minutes early.",
          },
        ],
        options: [
          ["A", "during", false],
          ["B", "before", true],
          ["C", "until", false],
          ["D", "while", false],
        ],
      },
      {
        questionType: "sentence_insertion",
        questionText:
          'Where would the following sentence best fit in the passage?\n\n"The session is designed to help new employees feel more confident when assisting customers."',
        explanation:
          "The sentence explains the purpose of the training and fits naturally after the topics covered by the session have been introduced.",
        vocabulary: [
          {
            word: "confident",
            meaning: "自信のある",
            exampleSentence:
              "The training helped employees feel more confident.",
          },
          {
            word: "assist",
            meaning: "手伝う、支援する",
            exampleSentence: "Staff members are available to assist customers.",
          },
        ],
        options: [
          ["A", "After the first paragraph", false],
          ["B", "After the paragraph about training topics", true],
          ["C", "After the arrival instruction", false],
          ["D", "At the very end", false],
        ],
      },
    ],
  },

  {
    title: "Company Newsletter",
    difficulty: "beginner",
    passageText: `Company News

We are pleased to announce that the company has opened a new branch in Osaka. The new office will initially have twenty employees and will focus on supporting customers in western Japan.

The Osaka branch is located near Namba Station, making it convenient for both employees and visitors.

[A] The office includes several meeting rooms and a large training area.

[B] We expect the new branch to strengthen our relationships with local businesses.

[C] More information about the branch can be found on the company website.

[D] We are also planning to hire additional employees next year.`,
    questions: [
      {
        questionType: "multiple_choice",
        questionText: "Where has the company opened a new branch?",
        explanation:
          "The first paragraph states that the new branch has opened in Osaka.",
        vocabulary: [
          {
            word: "branch",
            meaning: "支店、支社",
            exampleSentence: "Our company has branches throughout Japan.",
          },
        ],
        options: [
          ["A", "Tokyo", false],
          ["B", "Kyoto", false],
          ["C", "Osaka", true],
          ["D", "Nara", false],
        ],
      },
      {
        questionType: "multiple_choice",
        questionText:
          "The new branch will focus on ______ customers in western Japan.",
        explanation:
          "The phrase 'supporting customers' correctly completes the sentence.",
        vocabulary: [
          {
            word: "support",
            meaning: "支援する、サポートする",
            exampleSentence:
              "Our team supports customers throughout the region.",
          },
        ],
        options: [
          ["A", "support", false],
          ["B", "supported", false],
          ["C", "supporting", true],
          ["D", "supports", false],
        ],
      },
      {
        questionType: "multiple_choice",
        questionText: "Why is the location of the new office convenient?",
        explanation:
          "The passage explains that the office is located near Namba Station.",
        vocabulary: [
          {
            word: "located",
            meaning: "位置している",
            exampleSentence: "The hotel is located near the station.",
          },
        ],
        options: [
          ["A", "It is close to an airport.", false],
          ["B", "It is near Namba Station.", true],
          ["C", "It is next to the company's headquarters.", false],
          ["D", "It has free parking.", false],
        ],
      },
      {
        questionType: "sentence_insertion",
        questionText:
          'Where would the following sentence best fit in the passage?\n\n"These facilities will be especially useful for the branch\'s growing customer-support team."',
        explanation:
          "The sentence refers directly to the meeting rooms and training area mentioned in sentence A, so it belongs immediately afterward.",
        vocabulary: [
          {
            word: "facility",
            meaning: "施設、設備",
            exampleSentence: "The building has excellent training facilities.",
          },
          {
            word: "growing",
            meaning: "成長している、増加している",
            exampleSentence: "The company has a growing customer base.",
          },
        ],
        options: [
          ["A", "Before the first paragraph", false],
          ["B", "After sentence A", true],
          ["C", "After sentence B", false],
          ["D", "At the end of the passage", false],
        ],
      },
    ],
  },

  {
    title: "Customer Order Update",
    difficulty: "beginner",
    passageText: `Dear Ms. Tanaka,

Thank you for your recent order from Westside Electronics. We are writing to inform you that your order has been delayed because one of the items is temporarily out of stock.

We expect to receive the item from our supplier by Friday. Once it arrives, we will immediately prepare your order for shipment.

[A] We apologize for the delay and appreciate your patience.

[B] Your order will therefore be shipped early next week.

[C] You can check the status of your order using the tracking link in your account.

[D] Please contact our customer service team if you have any questions.`,
    questions: [
      {
        questionType: "multiple_choice",
        questionText: "Why has the customer's order been delayed?",
        explanation:
          "The email explains that one of the ordered items is temporarily out of stock.",
        vocabulary: [
          {
            word: "delayed",
            meaning: "遅れた、延期された",
            exampleSentence: "The delivery was delayed because of bad weather.",
          },
        ],
        options: [
          ["A", "The customer changed the order.", false],
          ["B", "An item is out of stock.", true],
          ["C", "The supplier closed.", false],
          ["D", "The shipping address was incorrect.", false],
        ],
      },
      {
        questionType: "multiple_choice",
        questionText:
          "The company expects to receive the item from its supplier ______.",
        explanation:
          "The email states that the item is expected to arrive from the supplier by Friday.",
        vocabulary: [
          {
            word: "by",
            meaning: "～までに",
            exampleSentence: "Please complete the form by Friday.",
          },
        ],
        options: [
          ["A", "on Monday", false],
          ["B", "by Friday", true],
          ["C", "next month", false],
          ["D", "after shipment", false],
        ],
      },
      {
        questionType: "multiple_choice",
        questionText:
          "Once the item arrives, the company will immediately ______ the order.",
        explanation:
          "The passage says that the company will immediately prepare the order for shipment.",
        vocabulary: [
          {
            word: "prepare",
            meaning: "準備する",
            exampleSentence: "We will prepare your order as soon as possible.",
          },
        ],
        options: [
          ["A", "cancel", false],
          ["B", "return", false],
          ["C", "prepare", true],
          ["D", "replace", false],
        ],
      },
      {
        questionType: "sentence_insertion",
        questionText:
          'Where would the following sentence best fit in the passage?\n\n"As a result, customers should expect their orders to arrive several days later than originally planned."',
        explanation:
          "The sentence summarizes the consequence of the delayed shipment and fits immediately after the company explains when it expects to receive the item.",
        vocabulary: [
          {
            word: "originally",
            meaning: "もともと、当初は",
            exampleSentence: "The meeting was originally scheduled for Monday.",
          },
          {
            word: "consequence",
            meaning: "結果、影響",
            exampleSentence:
              "The delay had a serious consequence for the project.",
          },
        ],
        options: [
          ["A", "After the greeting", false],
          ["B", "After the paragraph about the supplier", true],
          ["C", "After the tracking information", false],
          ["D", "At the very end", false],
        ],
      },
    ],
  },
]

async function seedPart6() {
  console.log("Seeding TOEIC Part 6...")

  await db.transaction(async (tx) => {
    /*
     * Delete all existing TOEIC Part 6 passages.
     *
     * practice_questions references practice_passages with ON DELETE CASCADE,
     * so the associated questions and their options will also be deleted.
     */
    await tx
      .delete(practicePassages)
      .where(
        and(eq(practicePassages.exam, "toeic"), eq(practicePassages.part, "6")),
      )

    let totalQuestions = 0
    let totalOptions = 0

    for (const passage of passages) {
      const [createdPassage] = await tx
        .insert(practicePassages)
        .values({
          exam: "toeic",
          part: "6",
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
        const [createdQuestion] = await tx
          .insert(practiceQuestions)
          .values({
            exam: "toeic",
            part: "6",
            questionType: question.questionType,
            passageId: createdPassage.id,
            passageQuestionNumber: index + 1,
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

        await tx.insert(practiceQuestionOptions).values(
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
    console.log("Part 6 seeded successfully")
    console.log(`Passages: ${passages.length}`)
    console.log(`Questions: ${totalQuestions}`)
    console.log(`Options: ${totalOptions}`)
    console.log("────────────────────────────")
  })
}

seedPart6()
  .catch((error) => {
    console.error("Failed to seed Part 6:", error)
    process.exitCode = 1
  })
  .finally(async () => {
    await db.$client.end()
  })
