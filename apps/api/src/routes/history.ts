import type { FastifyPluginAsync } from "fastify"
import { getAuthenticatedUser } from "../authenticated-user.js"
import { db } from "@repo/db"
import {
  practiceQuestions,
  practiceSessionQuestions,
  practiceSessions,
} from "@repo/db/schema"
import { and, desc, eq, isNotNull } from "drizzle-orm"

const historyRoutes: FastifyPluginAsync = async (app) => {
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
     * PERFORMANCE OVER TIME
     * ========================================================================
     */

    const performanceOverTime = sessions
      .slice()
      .reverse()
      .map((session) => ({
        date: session.completedAt ?? session.createdAt,
        part: session.part,
        exam: session.exam,
        score:
          session.totalQuestions > 0
            ? Math.round(
                (session.correctAnswers / session.totalQuestions) * 100,
              )
            : 0,
      }))
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

export default historyRoutes
