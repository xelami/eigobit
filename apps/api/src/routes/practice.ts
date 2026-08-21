import type { FastifyPluginAsync } from "fastify"
import {
  and,
  eq,
  inArray,
  count,
  gte,
  isNotNull,
  desc,
  aliasedTable,
} from "drizzle-orm"

import { db } from "@repo/db"
import {
  practicePassages,
  practiceQuestions,
  practiceQuestionOptions,
  practiceSessions,
  practiceSessionQuestions,
  userProfiles,
  userVocabulary,
} from "@repo/db/schema"

import { getAuthenticatedUser } from "../authenticated-user.js"

const practiceRoutes: FastifyPluginAsync = async (app) => {
  /*
   * ==========================================================================
   * GET PRACTICE QUESTIONS
   * ==========================================================================
   *
   * GET /api/v1/practice/questions?exam=toeic&part=5&limit=10
   *
   * The correct answer is deliberately NOT returned.
   */

  app.get("/questions", async (request, reply) => {
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return reply.code(401).send({
        error: "Unauthorized",
      })
    }

    const query = request.query as {
      exam?: string
      part?: string
      limit?: string
    }

    const exam = query.exam ?? "toeic"
    const part = query.part ?? "5"

    const requestedLimit = Number(query.limit ?? "10")

    const limit = Number.isInteger(requestedLimit)
      ? Math.min(Math.max(requestedLimit, 1), 50)
      : 10

    const questions = await db
      .select({
        id: practiceQuestions.id,
        exam: practiceQuestions.exam,
        part: practiceQuestions.part,
        questionType: practiceQuestions.questionType,
        questionText: practiceQuestions.questionText,
        explanation: practiceQuestions.explanation,
        difficulty: practiceQuestions.difficulty,
        vocabulary: practiceQuestions.vocabulary,
        optionId: practiceQuestionOptions.id,
        optionLabel: practiceQuestionOptions.optionLabel,
        optionText: practiceQuestionOptions.optionText,
      })
      .from(practiceQuestions)
      .leftJoin(
        practiceQuestionOptions,
        eq(practiceQuestionOptions.questionId, practiceQuestions.id),
      )
      .where(
        and(
          eq(practiceQuestions.exam, exam as "toeic" | "eiken"),
          eq(practiceQuestions.part, part),
        ),
      )
      .limit(limit * 4)

    const questionMap = new Map<
      string,
      {
        id: string
        exam: string
        part: string
        questionType: string
        questionText: string
        explanation: string | null
        difficulty: string | null
        vocabulary: {
          word: string
          meaning: string
          exampleSentence: string
        }[]
        options: {
          id: string
          label: string
          text: string
        }[]
      }
    >()

    for (const row of questions) {
      let question = questionMap.get(row.id)

      if (!question) {
        question = {
          id: row.id,
          exam: row.exam,
          part: row.part,
          questionType: row.questionType,
          questionText: row.questionText,
          vocabulary: row.vocabulary ?? [],
          explanation: row.explanation,
          difficulty: row.difficulty,
          options: [],
        }

        questionMap.set(row.id, question)
      }

      if (row.optionId && row.optionLabel && row.optionText) {
        question.options.push({
          id: row.optionId,
          label: row.optionLabel,
          text: row.optionText,
        })
      }
    }

    return {
      questions: Array.from(questionMap.values()).slice(0, limit),
    }
  })

  /*
   * ==========================================================================
   * GET SINGLE QUESTION
   * ==========================================================================
   */

  app.get("/questions/:id", async (request, reply) => {
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return reply.code(401).send({
        error: "Unauthorized",
      })
    }

    const { id } = request.params as {
      id: string
    }

    const [question] = await db
      .select({
        id: practiceQuestions.id,
        exam: practiceQuestions.exam,
        part: practiceQuestions.part,
        questionType: practiceQuestions.questionType,
        questionText: practiceQuestions.questionText,
        explanation: practiceQuestions.explanation,
        difficulty: practiceQuestions.difficulty,
        vocabulary: practiceQuestions.vocabulary,
      })
      .from(practiceQuestions)
      .where(eq(practiceQuestions.id, id))
      .limit(1)

    if (!question) {
      return reply.code(404).send({
        error: "Question not found",
      })
    }

    const rows = await db
      .select({
        optionId: practiceQuestionOptions.id,
        optionLabel: practiceQuestionOptions.optionLabel,
        optionText: practiceQuestionOptions.optionText,
      })
      .from(practiceQuestionOptions)
      .where(eq(practiceQuestionOptions.questionId, question.id))

    return {
      question: {
        id: question.id,
        exam: question.exam,
        part: question.part,
        questionType: question.questionType,
        questionText: question.questionText,
        explanation: question.explanation,
        difficulty: question.difficulty,
        vocabulary: question.vocabulary ?? [],
        options: rows.map((row) => ({
          id: row.optionId,
          label: row.optionLabel,
          text: row.optionText,
        })),
      },
    }
  })

  /*
   * ==========================================================================
   * CREATE PRACTICE SESSION
   * ==========================================================================
   *
   * POST /api/v1/practice/sessions
   *
   * The user's English level determines the difficulty.
   */

  app.post("/sessions", async (request, reply) => {
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return reply.code(401).send({
        error: "Unauthorized",
      })
    }

    const body = request.body as {
      exam?: string
      part?: string
      limit?: number
    }

    const exam = body.exam ?? "toeic"
    const part = body.part ?? "5"

    const requestedLimit = Number(body.limit ?? 10)

    const limit = Number.isInteger(requestedLimit)
      ? Math.min(Math.max(requestedLimit, 1), 50)
      : 10

    /*
     * Get the user's English level.
     */

    const [profile] = await db
      .select({
        englishLevel: userProfiles.englishLevel,
      })
      .from(userProfiles)
      .where(eq(userProfiles.userId, user.id))
      .limit(1)

    console.log("PRACTICE USER:", user.id)
    console.log("PRACTICE PROFILE:", profile)

    const difficulty = profile?.englishLevel ?? "intermediate"

    /*
     * Select questions.
     *
     * Part 5:
     *   Questions are independent, so select individual questions.
     *
     * Part 6 / Part 7:
     *   Questions belong to passages, so we select whole passages and
     *   include every question belonging to the selected passage.
     */

    let selectedQuestions: { id: string }[] = []

    if (part === "6" || part === "7") {
      /*
       * Find passages matching the exam, part and difficulty.
       */

      const availablePassages = await db
        .select({
          id: practicePassages.id,
        })
        .from(practicePassages)
        .where(
          and(
            eq(practicePassages.exam, exam as "toeic" | "eiken"),
            eq(practicePassages.part, part),
            eq(practicePassages.difficulty, difficulty),
          ),
        )

      /*
       * Find all questions belonging to those passages.
       */

      const passageIds = availablePassages.map((passage) => passage.id)

      if (passageIds.length === 0) {
        return reply.code(400).send({
          error: "Not enough passages available",
          difficulty,
          requested: limit,
          available: 0,
        })
      }

      const availablePassageQuestions = await db
        .select({
          id: practiceQuestions.id,
          passageId: practiceQuestions.passageId,
          passageQuestionNumber: practiceQuestions.passageQuestionNumber,
        })
        .from(practiceQuestions)
        .where(
          and(
            inArray(practiceQuestions.passageId, passageIds),
            eq(practiceQuestions.exam, exam as "toeic" | "eiken"),
            eq(practiceQuestions.part, part),
            eq(practiceQuestions.difficulty, difficulty),
          ),
        )

      /*
       * Group questions by passage.
       */

      const questionsByPassage = new Map<
        string,
        { id: string; passageQuestionNumber: number | null }[]
      >()

      for (const question of availablePassageQuestions) {
        if (!question.passageId) continue

        const questions = questionsByPassage.get(question.passageId) ?? []

        questions.push({
          id: question.id,
          passageQuestionNumber: question.passageQuestionNumber,
        })

        questionsByPassage.set(question.passageId, questions)
      }

      /*
       * Shuffle passages rather than individual questions.
       */

      const shuffledPassageIds = [...questionsByPassage.keys()].sort(
        () => Math.random() - 0.5,
      )

      /*
       * Take complete passages until we have at least the requested
       * number of questions.
       */

      for (const passageId of shuffledPassageIds) {
        const passageQuestions = questionsByPassage.get(passageId)

        if (!passageQuestions) continue

        const sortedQuestions = [...passageQuestions].sort(
          (a, b) =>
            (a.passageQuestionNumber ?? 0) - (b.passageQuestionNumber ?? 0),
        )

        selectedQuestions.push(...sortedQuestions)

        if (selectedQuestions.length >= limit) {
          break
        }
      }

      if (selectedQuestions.length < limit) {
        return reply.code(400).send({
          error: "Not enough questions available",
          difficulty,
          requested: limit,
          available: selectedQuestions.length,
        })
      }
    } else {
      /*
       * Part 5 and other independent-question parts.
       */

      const availableQuestions = await db
        .select({
          id: practiceQuestions.id,
        })
        .from(practiceQuestions)
        .where(
          and(
            eq(practiceQuestions.exam, exam as "toeic" | "eiken"),
            eq(practiceQuestions.part, part),
            eq(practiceQuestions.difficulty, difficulty),
          ),
        )

      if (availableQuestions.length < limit) {
        return reply.code(400).send({
          error: "Not enough questions available",
          difficulty,
          requested: limit,
          available: availableQuestions.length,
        })
      }

      const shuffled = [...availableQuestions].sort(() => Math.random() - 0.5)

      selectedQuestions = shuffled.slice(0, limit)
    }

    /*
     * Create the session.
     */

    const [session] = await db
      .insert(practiceSessions)
      .values({
        userId: user.id,
        exam: exam as "toeic" | "eiken",
        part,
        totalQuestions: selectedQuestions.length,
      })
      .returning({
        id: practiceSessions.id,
      })

    if (!session) {
      throw new Error("Failed to create practice session")
    }

    /*
     * Attach questions to the session.
     */

    await db.insert(practiceSessionQuestions).values(
      selectedQuestions.map((question, index) => ({
        sessionId: session.id,
        questionId: question.id,
        questionNumber: index + 1,
      })),
    )

    return {
      sessionId: session.id,
      exam,
      part,
      difficulty,
      totalQuestions: selectedQuestions.length,
    }
  })

  /*
   * ==========================================================================
   * GET PRACTICE SESSION
   * ==========================================================================
   *
   * GET /api/v1/practice/sessions/:sessionId
   */

  app.get("/sessions/:sessionId", async (request, reply) => {
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return reply.code(401).send({
        error: "Unauthorized",
      })
    }

    const { sessionId } = request.params as {
      sessionId: string
    }

    const selectedOption = aliasedTable(
      practiceQuestionOptions,

      "selectedOption",
    )

    const correctOption = aliasedTable(
      practiceQuestionOptions,

      "correctOption",
    )

    const [session] = await db
      .select({
        id: practiceSessions.id,
        exam: practiceSessions.exam,
        part: practiceSessions.part,
        totalQuestions: practiceSessions.totalQuestions,
        correctAnswers: practiceSessions.correctAnswers,
        completedAt: practiceSessions.completedAt,
      })
      .from(practiceSessions)
      .where(
        and(
          eq(practiceSessions.id, sessionId),
          eq(practiceSessions.userId, user.id),
        ),
      )
      .limit(1)

    if (!session) {
      return reply.code(404).send({
        error: "Practice session not found",
      })
    }

    const rows = await db
      .select({
        sessionQuestionId: practiceSessionQuestions.id,
        questionNumber: practiceSessionQuestions.questionNumber,
        questionId: practiceSessionQuestions.questionId,
        selectedOptionId: practiceSessionQuestions.selectedOptionId,
        isCorrect: practiceSessionQuestions.isCorrect,

        questionText: practiceQuestions.questionText,
        questionType: practiceQuestions.questionType,
        passageId: practiceQuestions.passageId,
        explanation: practiceQuestions.explanation,
        difficulty: practiceQuestions.difficulty,
        vocabulary: practiceQuestions.vocabulary,

        optionId: practiceQuestionOptions.id,
        optionLabel: practiceQuestionOptions.optionLabel,
        optionText: practiceQuestionOptions.optionText,
      })
      .from(practiceSessionQuestions)
      .innerJoin(
        practiceQuestions,
        eq(practiceSessionQuestions.questionId, practiceQuestions.id),
      )
      .leftJoin(
        practiceQuestionOptions,
        eq(practiceQuestionOptions.questionId, practiceQuestions.id),
      )
      .where(eq(practiceSessionQuestions.sessionId, sessionId))

    const savedVocabulary = await db
      .select({
        word: userVocabulary.word,
      })
      .from(userVocabulary)
      .where(eq(userVocabulary.userId, user.id))

    const savedWords = new Set(
      savedVocabulary.map((item) => item.word.toLowerCase()),
    )

    const questionMap = new Map<
      string,
      {
        id: string
        questionNumber: number
        questionText: string
        questionType: string
        passageId: string | null
        explanation: string | null
        difficulty: string | null
        vocabulary: {
          word: string
          meaning: string
          exampleSentence: string
          saved: boolean
        }[]
        selectedOptionId: string | null
        isCorrect: boolean | null
        options: {
          id: string
          label: string
          text: string
        }[]
      }
    >()

    for (const row of rows) {
      let question = questionMap.get(row.sessionQuestionId)

      if (!question) {
        question = {
          id: row.questionId,
          questionNumber: row.questionNumber,
          questionText: row.questionText,
          questionType: row.questionType,
          passageId: row.passageId,
          explanation: row.explanation,
          difficulty: row.difficulty,
          vocabulary: (row.vocabulary ?? []).map((item) => ({
            ...item,
            saved: savedWords.has(item.word.toLowerCase()),
          })),
          selectedOptionId: row.selectedOptionId,
          isCorrect: row.isCorrect,
          options: [],
        }

        questionMap.set(row.sessionQuestionId, question)
      }

      if (row.optionId && row.optionLabel && row.optionText) {
        question.options.push({
          id: row.optionId,
          label: row.optionLabel,
          text: row.optionText,
        })
      }
    }

    return {
      session,
      questions: Array.from(questionMap.values()).sort(
        (a, b) => a.questionNumber - b.questionNumber,
      ),
    }
  })

  /*
   * ==========================================================================
   * SUBMIT ANSWER
   * ==========================================================================
   *
   * POST /api/v1/practice/sessions/:sessionId/answers
   */

  app.post("/sessions/:sessionId/answers", async (request, reply) => {
    const start = performance.now()

    const user = await getAuthenticatedUser(request)

    if (!user) {
      return reply.code(401).send({
        error: "Unauthorized",
      })
    }

    console.log("AUTH:", Math.round(performance.now() - start))

    const { sessionId } = request.params as {
      sessionId: string
    }

    const body = request.body as {
      questionId?: string
      optionId?: string
    }

    if (!body.questionId || !body.optionId) {
      return reply.code(400).send({
        error: "questionId and optionId are required",
      })
    }

    /*
     * ==========================================================================
     * ONE SELECT
     * ==========================================================================
     *
     * Instead of:
     *
     * 1. Get session
     * 2. Get session question
     * 3. Get selected option
     * 4. Get correct option
     *
     * We get everything we need in ONE database round-trip.
     */

    const databaseStart = performance.now()

    const rows = await db
      .select({
        sessionId: practiceSessions.id,
        completedAt: practiceSessions.completedAt,

        sessionQuestionId: practiceSessionQuestions.id,

        selectedOptionId: practiceQuestionOptions.id,
        selectedIsCorrect: practiceQuestionOptions.isCorrect,

        explanation: practiceQuestions.explanation,
      })
      .from(practiceSessions)
      .innerJoin(
        practiceSessionQuestions,
        and(
          eq(practiceSessionQuestions.sessionId, practiceSessions.id),
          eq(practiceSessionQuestions.questionId, body.questionId),
        ),
      )
      .innerJoin(
        practiceQuestionOptions,
        and(
          eq(practiceQuestionOptions.id, body.optionId),
          eq(practiceQuestionOptions.questionId, body.questionId),
        ),
      )
      .innerJoin(practiceQuestions, eq(practiceQuestions.id, body.questionId))
      .where(
        and(
          eq(practiceSessions.id, sessionId),
          eq(practiceSessions.userId, user.id),
        ),
      )
      .limit(1)

    console.log(
      "DATABASE SELECT:",
      Math.round(performance.now() - databaseStart),
    )

    const result = rows[0]

    if (!result) {
      return reply.code(404).send({
        error: "Invalid session, question, or option",
      })
    }

    if (result.completedAt) {
      return reply.code(400).send({
        error: "Practice session is already completed",
      })
    }

    /*
     * ==========================================================================
     * GET CORRECT OPTION
     * ==========================================================================
     *
     * We still need the correct option ID.
     *
     * This is a very small query and uses the question_id index.
     */

    const correctOptionStart = performance.now()

    const [correctOption] = await db
      .select({
        id: practiceQuestionOptions.id,
      })
      .from(practiceQuestionOptions)
      .where(
        and(
          eq(practiceQuestionOptions.questionId, body.questionId),
          eq(practiceQuestionOptions.isCorrect, true),
        ),
      )
      .limit(1)

    console.log(
      "CORRECT OPTION:",
      Math.round(performance.now() - correctOptionStart),
    )

    /*
     * ==========================================================================
     * UPDATE ANSWER
     * ==========================================================================
     */

    const isCorrect = result.selectedIsCorrect

    const updateStart = performance.now()

    await db
      .update(practiceSessionQuestions)
      .set({
        selectedOptionId: result.selectedOptionId,
        isCorrect,
        answeredAt: new Date(),
      })
      .where(eq(practiceSessionQuestions.id, result.sessionQuestionId))

    console.log("UPDATE:", Math.round(performance.now() - updateStart))

    console.log("TOTAL AFTER AUTH:", Math.round(performance.now() - start))

    return {
      questionId: body.questionId,
      selectedOptionId: result.selectedOptionId,
      isCorrect,
      correct: isCorrect,
      correctOptionId: correctOption?.id ?? null,
      explanation: result.explanation,
    }
  })

  /*
   * ==========================================================================
   * COMPLETE PRACTICE SESSION
   * ==========================================================================
   *
   * POST /api/v1/practice/sessions/:sessionId/complete
   */

  app.post("/sessions/:sessionId/complete", async (request, reply) => {
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return reply.code(401).send({
        error: "Unauthorized",
      })
    }

    const { sessionId } = request.params as {
      sessionId: string
    }

    const [session] = await db
      .select({
        id: practiceSessions.id,
        userId: practiceSessions.userId,
        totalQuestions: practiceSessions.totalQuestions,
        completedAt: practiceSessions.completedAt,
      })
      .from(practiceSessions)
      .where(
        and(
          eq(practiceSessions.id, sessionId),
          eq(practiceSessions.userId, user.id),
        ),
      )
      .limit(1)

    if (!session) {
      return reply.code(404).send({
        error: "Practice session not found",
      })
    }

    if (session.completedAt) {
      return {
        success: true,
        alreadyCompleted: true,
      }
    }

    const answers = await db
      .select({
        isCorrect: practiceSessionQuestions.isCorrect,
      })
      .from(practiceSessionQuestions)
      .where(eq(practiceSessionQuestions.sessionId, sessionId))

    const correctAnswers = answers.filter(
      (answer) => answer.isCorrect === true,
    ).length

    const answeredQuestions = answers.filter(
      (answer) => answer.isCorrect !== null,
    ).length

    if (answeredQuestions < session.totalQuestions) {
      return reply.code(400).send({
        error: "Not all questions have been answered",
        answeredQuestions,
        totalQuestions: session.totalQuestions,
      })
    }

    await db
      .update(practiceSessions)
      .set({
        correctAnswers,
        completedAt: new Date(),
      })
      .where(eq(practiceSessions.id, sessionId))

    return {
      success: true,
      correctAnswers,
      totalQuestions: session.totalQuestions,
    }
  })

  /*
   * ==========================================================================
   * GET PRACTICE SESSION RESULT
   * ==========================================================================
   *
   * GET /api/v1/practice/sessions/:sessionId/result
   */

  app.get("/sessions/:sessionId/result", async (request, reply) => {
    const start = performance.now()
    const user = await getAuthenticatedUser(request)

    console.log(
      "AUTH:",

      Math.round(performance.now() - start),
    )

    if (!user) {
      return reply.code(401).send({
        error: "Unauthorized",
      })
    }

    const { sessionId } = request.params as {
      sessionId: string
    }

    const sessionStart = performance.now()

    const [session] = await db
      .select({
        id: practiceSessions.id,
        userId: practiceSessions.userId,
        exam: practiceSessions.exam,
        part: practiceSessions.part,
        totalQuestions: practiceSessions.totalQuestions,
        correctAnswers: practiceSessions.correctAnswers,
        completedAt: practiceSessions.completedAt,
      })
      .from(practiceSessions)
      .where(
        and(
          eq(practiceSessions.id, sessionId),
          eq(practiceSessions.userId, user.id),
        ),
      )
      .limit(1)

    if (!session) {
      return reply.code(404).send({
        error: "Practice session not found",
      })
    }

    console.log(
      "SESSION QUERY:",

      Math.round(performance.now() - sessionStart),
    )

    const questionStart = performance.now()

    const questions = await db
      .select({
        sessionQuestionId: practiceSessionQuestions.id,
        questionNumber: practiceSessionQuestions.questionNumber,
        selectedOptionId: practiceSessionQuestions.selectedOptionId,
        isCorrect: practiceSessionQuestions.isCorrect,

        questionId: practiceQuestions.id,
        questionText: practiceQuestions.questionText,
        explanation: practiceQuestions.explanation,

        optionId: practiceQuestionOptions.id,
        optionLabel: practiceQuestionOptions.optionLabel,
        optionText: practiceQuestionOptions.optionText,
        isCorrectOption: practiceQuestionOptions.isCorrect,
      })
      .from(practiceSessionQuestions)
      .innerJoin(
        practiceQuestions,
        eq(practiceSessionQuestions.questionId, practiceQuestions.id),
      )
      .leftJoin(
        practiceQuestionOptions,
        eq(practiceQuestionOptions.questionId, practiceQuestions.id),
      )
      .where(eq(practiceSessionQuestions.sessionId, sessionId))

    console.log(
      "SESSION QUERY:",

      Math.round(performance.now() - questionStart),
    )

    const questionMap = new Map<
      string,
      {
        id: string
        questionNumber: number
        questionText: string
        explanation: string | null
        selectedOptionId: string | null
        isCorrect: boolean | null
        correctOptionId: string | null
        correctOptionLabel: string | null
        correctOptionText: string | null
        selectedOptionLabel: string | null
        selectedOptionText: string | null
      }
    >()

    for (const row of questions) {
      let question = questionMap.get(row.sessionQuestionId)

      if (!question) {
        question = {
          id: row.questionId,
          questionNumber: row.questionNumber,
          questionText: row.questionText,
          explanation: row.explanation,
          selectedOptionId: row.selectedOptionId,
          isCorrect: row.isCorrect,
          correctOptionId: null,
          correctOptionLabel: null,
          correctOptionText: null,
          selectedOptionLabel: null,
          selectedOptionText: null,
        }

        questionMap.set(row.sessionQuestionId, question)
      }

      if (row.isCorrectOption) {
        question.correctOptionId = row.optionId
        question.correctOptionLabel = row.optionLabel
        question.correctOptionText = row.optionText
      }

      if (row.optionId === row.selectedOptionId) {
        question.selectedOptionLabel = row.optionLabel
        question.selectedOptionText = row.optionText
      }
    }

    const reviewQuestions = Array.from(questionMap.values()).sort(
      (a, b) => a.questionNumber - b.questionNumber,
    )

    const answeredQuestions = reviewQuestions.filter(
      (question) => question.isCorrect !== null,
    ).length

    const correctAnswers = reviewQuestions.filter(
      (question) => question.isCorrect === true,
    ).length

    const scorePercentage =
      session.totalQuestions > 0
        ? Math.round((correctAnswers / session.totalQuestions) * 100)
        : 0

    return {
      session: {
        id: session.id,
        exam: session.exam,
        part: session.part,
        status: session.completedAt ? "completed" : "in_progress",
        totalQuestions: session.totalQuestions,
        answeredQuestions,
        correctAnswers,
        scorePercentage,
        completedAt: session.completedAt,
      },

      questions: reviewQuestions,
    }
  })

  /*
   * ==========================================================================
   * GET PRACTICE STATS
   * ==========================================================================
   *
   * GET /api/v1/practice/stats
   *
   * Dashboard statistics for the authenticated user.
   */

  app.get("/stats", async (request, reply) => {
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return reply.code(401).send({
        error: "Unauthorized",
      })
    }

    const [sessionStats] = await db
      .select({
        totalSessions: count(practiceSessions.id),
      })
      .from(practiceSessions)
      .where(eq(practiceSessions.userId, user.id))

    const [completedSessionStats] = await db
      .select({
        completedSessions: count(practiceSessions.id),
      })
      .from(practiceSessions)
      .where(
        and(
          eq(practiceSessions.userId, user.id),
          gte(practiceSessions.completedAt, new Date(0)),
        ),
      )

    const answeredRows = await db
      .select({
        isCorrect: practiceSessionQuestions.isCorrect,
      })
      .from(practiceSessionQuestions)
      .innerJoin(
        practiceSessions,
        eq(practiceSessionQuestions.sessionId, practiceSessions.id),
      )
      .where(eq(practiceSessions.userId, user.id))

    const answeredQuestions = answeredRows.filter(
      (row) => row.isCorrect !== null,
    ).length

    const correctAnswers = answeredRows.filter(
      (row) => row.isCorrect === true,
    ).length

    const accuracy =
      answeredQuestions > 0
        ? Math.round((correctAnswers / answeredQuestions) * 100)
        : 0

    const [vocabularyStats] = await db
      .select({
        vocabularyCount: count(userVocabulary.id),
      })
      .from(userVocabulary)
      .where(eq(userVocabulary.userId, user.id))

    /*
     * "Today's" progress uses the server's current date.
     *
     * We count questions answered since midnight.
     */

    const now = new Date()

    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    )

    const todayRows = await db
      .select({
        isCorrect: practiceSessionQuestions.isCorrect,
        answeredAt: practiceSessionQuestions.answeredAt,
      })
      .from(practiceSessionQuestions)
      .innerJoin(
        practiceSessions,
        eq(practiceSessionQuestions.sessionId, practiceSessions.id),
      )
      .where(
        and(
          eq(practiceSessions.userId, user.id),
          gte(practiceSessionQuestions.answeredAt, startOfToday),
          isNotNull(practiceSessionQuestions.answeredAt),
        ),
      )

    const todayQuestions = todayRows.filter(
      (row) => row.isCorrect !== null,
    ).length

    return {
      practice: {
        totalSessions: sessionStats?.totalSessions ?? 0,
        completedSessions: completedSessionStats?.completedSessions ?? 0,
        answeredQuestions,
        correctAnswers,
        accuracy,
      },

      today: {
        questionsAnswered: todayQuestions,
      },

      vocabulary: {
        count: vocabularyStats?.vocabularyCount ?? 0,
      },
    }
  })

  /*
   * ==========================================================================
   * GET PRACTICE SUMMARY
   * ==========================================================================
   *
   * GET /api/v1/practice/summary
   */

  app.get("/summary", async (request, reply) => {
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return reply.code(401).send({
        error: "Unauthorized",
      })
    }

    const sessions = await db
      .select({
        id: practiceSessions.id,
        exam: practiceSessions.exam,
        part: practiceSessions.part,
        totalQuestions: practiceSessions.totalQuestions,
        correctAnswers: practiceSessions.correctAnswers,
        completedAt: practiceSessions.completedAt,
        createdAt: practiceSessions.createdAt,
      })
      .from(practiceSessions)
      .where(eq(practiceSessions.userId, user.id))

    const completedSessions = sessions.filter(
      (session) => session.completedAt !== null,
    )

    const totalQuestions = completedSessions.reduce(
      (total, session) => total + session.totalQuestions,
      0,
    )

    const totalCorrectAnswers = completedSessions.reduce(
      (total, session) => total + session.correctAnswers,
      0,
    )

    const averageScore =
      totalQuestions > 0
        ? Math.round((totalCorrectAnswers / totalQuestions) * 100)
        : 0

    const recentSessions = [...completedSessions]
      .sort(
        (a, b) =>
          new Date(b.completedAt!).getTime() -
          new Date(a.completedAt!).getTime(),
      )
      .slice(0, 5)

    return {
      completedSessions: completedSessions.length,
      totalQuestions,
      totalCorrectAnswers,
      averageScore,
      recentSessions,
    }
  })

  /*
   * ==========================================================================
   * GET PRACTICE PASSAGES
   * ==========================================================================
   *
   * GET /api/v1/practice/passages?exam=toeic&part=6&limit=5
   *
   * Returns complete passages with their questions.
   */

  app.get("/passages", async (request, reply) => {
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return reply.code(401).send({
        error: "Unauthorized",
      })
    }

    const query = request.query as {
      exam?: string
      part?: string
      limit?: string
    }

    const exam = query.exam ?? "toeic"
    const part = query.part ?? "6"

    const requestedLimit = Number(query.limit ?? "5")

    const limit = Number.isInteger(requestedLimit)
      ? Math.min(Math.max(requestedLimit, 1), 20)
      : 5

    const passages = await db
      .select({
        id: practicePassages.id,
        exam: practicePassages.exam,
        part: practicePassages.part,
        title: practicePassages.title,
        passageText: practicePassages.passageText,
        difficulty: practicePassages.difficulty,
      })
      .from(practicePassages)
      .where(
        and(
          eq(practicePassages.exam, exam as "toeic" | "eiken"),
          eq(practicePassages.part, part),
        ),
      )
      .limit(limit)

    if (passages.length === 0) {
      return {
        passages: [],
      }
    }

    const passageIds = passages.map((passage) => passage.id)

    const questions = await db
      .select({
        id: practiceQuestions.id,
        passageId: practiceQuestions.passageId,
        passageQuestionNumber: practiceQuestions.passageQuestionNumber,
        questionType: practiceQuestions.questionType,
        questionText: practiceQuestions.questionText,
        explanation: practiceQuestions.explanation,
        difficulty: practiceQuestions.difficulty,

        optionId: practiceQuestionOptions.id,
        optionLabel: practiceQuestionOptions.optionLabel,
        optionText: practiceQuestionOptions.optionText,
      })
      .from(practiceQuestions)
      .leftJoin(
        practiceQuestionOptions,
        eq(practiceQuestionOptions.questionId, practiceQuestions.id),
      )
      .where(inArray(practiceQuestions.passageId, passageIds))

    const questionMap = new Map<
      string,
      {
        id: string
        questionNumber: number | null
        questionType: string
        questionText: string
        explanation: string | null
        difficulty: string | null
        options: {
          id: string
          label: string
          text: string
        }[]
      }
    >()

    for (const row of questions) {
      if (!row.passageId) {
        continue
      }

      let question = questionMap.get(row.id)

      if (!question) {
        question = {
          id: row.id,
          questionNumber: row.passageQuestionNumber,
          questionType: row.questionType,
          questionText: row.questionText,
          explanation: row.explanation,
          difficulty: row.difficulty,
          options: [],
        }

        questionMap.set(row.id, question)
      }

      if (row.optionId && row.optionLabel && row.optionText) {
        question.options.push({
          id: row.optionId,
          label: row.optionLabel,
          text: row.optionText,
        })
      }
    }

    return {
      passages: passages.map((passage) => ({
        id: passage.id,
        exam: passage.exam,
        part: passage.part,
        title: passage.title,
        passageText: passage.passageText,
        difficulty: passage.difficulty,

        questions: Array.from(questionMap.values())
          .filter((question) => {
            const questionRow = questions.find((row) => row.id === question.id)

            return questionRow?.passageId === passage.id
          })
          .sort((a, b) => (a.questionNumber ?? 0) - (b.questionNumber ?? 0)),
      })),
    }
  })

  app.get("/history", async (request, reply) => {
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return reply.code(401).send({
        error: "Unauthorized",
      })
    }

    const sessions = await db
      .select({
        id: practiceSessions.id,
        exam: practiceSessions.exam,
        part: practiceSessions.part,
        totalQuestions: practiceSessions.totalQuestions,
        correctAnswers: practiceSessions.correctAnswers,
        completedAt: practiceSessions.completedAt,
        createdAt: practiceSessions.createdAt,
      })

      .from(practiceSessions)

      .where(
        and(
          eq(practiceSessions.userId, user.id),
          isNotNull(practiceSessions.completedAt),
        ),
      )

      .orderBy(desc(practiceSessions.completedAt))

    const answers = await db

      .select({
        sessionId: practiceSessionQuestions.sessionId,
        questionId: practiceSessionQuestions.questionId,
        isCorrect: practiceSessionQuestions.isCorrect,
        part: practiceQuestions.part,
        questionType: practiceQuestions.questionType,
        difficulty: practiceQuestions.difficulty,
      })
      .from(practiceSessionQuestions)
      .innerJoin(
        practiceQuestions,
        eq(practiceSessionQuestions.questionId, practiceQuestions.id),
      )
      .innerJoin(
        practiceSessions,
        eq(practiceSessionQuestions.sessionId, practiceSessions.id),
      )
      .where(
        and(
          eq(practiceSessions.userId, user.id),
          isNotNull(practiceSessions.completedAt),
        ),
      )
    /*
  
     * ========================================================================
     * OVERALL
     * ========================================================================
     */

    const questionsAnswered = answers.length

    const correctAnswers = answers.filter(
      (answer) => answer.isCorrect === true,
    ).length

    const accuracy =
      questionsAnswered > 0
        ? Math.round((correctAnswers / questionsAnswered) * 100)
        : 0

    const bestScore =
      sessions.length > 0
        ? Math.max(
            ...sessions.map((session) =>
              session.totalQuestions > 0
                ? Math.round(
                    (session.correctAnswers / session.totalQuestions) * 100,
                  )
                : 0,
            ),
          )
        : 0
    /*
     * ========================================================================
     * BY PART
     * ========================================================================
     */

    const partMap = new Map<
      string,
      {
        questions: number
        correct: number
      }
    >()

    for (const answer of answers) {
      const existing = partMap.get(answer.part) ?? {
        questions: 0,
        correct: 0,
      }

      existing.questions += 1

      if (answer.isCorrect === true) {
        existing.correct += 1
      }

      partMap.set(answer.part, existing)
    }

    const byPart = Array.from(partMap.entries())
      .map(([part, data]) => ({
        part,
        questions: data.questions,
        correct: data.correct,
        accuracy:
          data.questions > 0
            ? Math.round((data.correct / data.questions) * 100)
            : 0,
      }))
      .sort((a, b) => a.part.localeCompare(b.part))
    /*
     * ========================================================================
     * BY DIFFICULTY
     * ========================================================================
     */

    const difficultyMap = new Map<
      string,
      {
        questions: number
        correct: number
      }
    >()

    for (const answer of answers) {
      const difficulty = answer.difficulty ?? "unknown"

      const existing = difficultyMap.get(difficulty) ?? {
        questions: 0,
        correct: 0,
      }

      existing.questions += 1

      if (answer.isCorrect === true) {
        existing.correct += 1
      }

      difficultyMap.set(difficulty, existing)
    }

    const byDifficulty = Array.from(difficultyMap.entries())

      .map(([difficulty, data]) => ({
        difficulty,
        questions: data.questions,
        correct: data.correct,
        accuracy:
          data.questions > 0
            ? Math.round((data.correct / data.questions) * 100)
            : 0,
      }))
      .sort((a, b) => {
        const order = {
          easy: 1,
          medium: 2,
          hard: 3,
          unknown: 4,
        }

        return (
          (order[a.difficulty.toLowerCase() as keyof typeof order] ?? 99) -
          (order[b.difficulty.toLowerCase() as keyof typeof order] ?? 99)
        )
      })

    /*
     * ========================================================================
     * BY QUESTION TYPE
     * ========================================================================
     */

    const questionTypeMap = new Map<
      string,
      {
        questions: number
        correct: number
      }
    >()

    for (const answer of answers) {
      const existing = questionTypeMap.get(answer.questionType) ?? {
        questions: 0,
        correct: 0,
      }

      existing.questions += 1

      if (answer.isCorrect === true) {
        existing.correct += 1
      }

      questionTypeMap.set(answer.questionType, existing)
    }

    const byQuestionType = Array.from(questionTypeMap.entries())

      .map(([questionType, data]) => ({
        questionType,
        questions: data.questions,
        correct: data.correct,
        accuracy:
          data.questions > 0
            ? Math.round((data.correct / data.questions) * 100)
            : 0,
      }))
      .sort((a, b) => a.accuracy - b.accuracy)
    /*
     * ========================================================================
     * RECENT SESSIONS
     * ========================================================================
     */

    const recentSessions = sessions.slice(0, 20).map((session) => ({
      id: session.id,
      exam: session.exam,
      part: session.part,
      totalQuestions: session.totalQuestions,
      correctAnswers: session.correctAnswers,
      score:
        session.totalQuestions > 0
          ? Math.round((session.correctAnswers / session.totalQuestions) * 100)
          : 0,

      completedAt: session.completedAt,
    }))

    const performanceMap = new Map<
      string,
      {
        date: string
        questions: number
        correct: number
      }
    >()

    for (const session of sessions) {
      if (!session.completedAt) {
        continue
      }

      const date = new Date(session.completedAt).toISOString().slice(0, 10)
      const existing = performanceMap.get(date)

      if (existing) {
        existing.questions += session.totalQuestions
        existing.correct += session.correctAnswers
      } else {
        performanceMap.set(date, {
          date,
          questions: session.totalQuestions,
          correct: session.correctAnswers,
        })
      }
    }
    /*
     * ========================================================================
     * PERFORMANCE OVER TIME
     * ========================================================================
     */
    const performanceOverTime = Array.from(performanceMap.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((day) => ({
        ...day,
        accuracy:
          day.questions > 0
            ? Math.round((day.correct / day.questions) * 100)
            : 0,
      }))
    /*
     * ========================================================================
     * WEAK AREAS
     * ========================================================================
     */
    const weakAreas = [
      ...byPart.map((item) => ({
        type: "part",
        name: `Part ${item.part}`,
        accuracy: item.accuracy,
        questions: item.questions,
      })),

      ...byQuestionType.map((item) => ({
        type: "questionType",
        name: item.questionType,
        accuracy: item.accuracy,
        questions: item.questions,
      })),
    ]
      .filter((item) => item.questions >= 3)
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 5)

    return reply.send({
      summary: {
        sessions: sessions.length,
        questionsAnswered,
        correctAnswers,
        accuracy,
        bestScore,
      },
      byPart,
      byDifficulty,
      byQuestionType,
      performanceOverTime,
      weakAreas,
      recentSessions,
    })
  })
}

export default practiceRoutes
