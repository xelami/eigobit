import type { FastifyPluginAsync } from "fastify"
import { and, eq, gte, lt } from "drizzle-orm"

import { db } from "@repo/db"
import { practiceSessions, practiceSessionQuestions } from "@repo/db/schema"

import { getAuthenticatedUser } from "../authenticated-user.js"

const dashboardRoutes: FastifyPluginAsync = async (app) => {
  app.get("/stats", async (request, reply) => {
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return reply.code(401).send({
        error: "Unauthorized",
      })
    }

    /*
     * Use Japan time for "today".
     *
     * The application is being used in Japan, so the dashboard should
     * change days at midnight Japan time rather than UTC midnight.
     */

    const now = new Date()

    const japanDate = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Tokyo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now)

    const startOfToday = new Date(`${japanDate}T00:00:00+09:00`)

    const startOfTomorrow = new Date(startOfToday)

    startOfTomorrow.setUTCDate(startOfTomorrow.getUTCDate() + 1)

    /*
     * ==========================================================================
     * TODAY'S ANSWERS
     * ==========================================================================
     */

    const todayAnswers = await db
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
          lt(practiceSessionQuestions.answeredAt, startOfTomorrow),
        ),
      )

    const questionsToday = todayAnswers.length

    const correctToday = todayAnswers.filter(
      (answer) => answer.isCorrect === true,
    ).length

    const accuracyToday =
      questionsToday > 0
        ? Math.round((correctToday / questionsToday) * 100)
        : null

    /*
     * ==========================================================================
     * TODAY'S STUDY TIME
     * ==========================================================================
     *
     * We don't have a dedicated duration column.
     *
     * A practice session already has:
     *
     * createdAt   = session started
     * completedAt = session finished
     *
     * So we can calculate the duration of completed sessions.
     */

    const completedToday = await db
      .select({
        createdAt: practiceSessions.createdAt,
        completedAt: practiceSessions.completedAt,
      })
      .from(practiceSessions)
      .where(
        and(
          eq(practiceSessions.userId, user.id),
          gte(practiceSessions.completedAt, startOfToday),
          lt(practiceSessions.completedAt, startOfTomorrow),
        ),
      )

    const studySecondsToday = completedToday.reduce((total, session) => {
      if (!session.completedAt) {
        return total
      }

      const duration =
        session.completedAt.getTime() - session.createdAt.getTime()

      /*
       * Ignore obviously invalid sessions.
       *
       * This also prevents a broken session from making the
       * dashboard say something ridiculous like 4,000 minutes.
       */

      if (duration > 0 && duration < 4 * 60 * 60 * 1000) {
        return total + duration / 1000
      }

      return total
    }, 0)

    const studyMinutesToday = Math.round(studySecondsToday / 60)

    /*
     * ==========================================================================
     * STUDY STREAK
     * ==========================================================================
     *
     * A day counts when the user completed at least one practice session.
     *
     * We fetch completed sessions and build a set of Japanese calendar dates.
     */

    const completedSessions = await db
      .select({
        completedAt: practiceSessions.completedAt,
      })
      .from(practiceSessions)
      .where(and(eq(practiceSessions.userId, user.id)))

    const completedDates = new Set<string>()

    for (const session of completedSessions) {
      if (!session.completedAt) {
        continue
      }

      const date = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Tokyo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(session.completedAt)

      completedDates.add(date)
    }

    /*
     * Count backwards from today.
     *
     * Today itself does not have to be completed for the existing streak
     * to remain meaningful, so if today has no activity we start from
     * yesterday.
     */

    const todayCompleted = completedDates.has(japanDate)

    let streak = 0

    const cursor = new Date(
      todayCompleted
        ? startOfToday
        : startOfToday.getTime() - 24 * 60 * 60 * 1000,
    )

    while (true) {
      const date = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Tokyo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(cursor)

      if (!completedDates.has(date)) {
        break
      }

      streak += 1

      cursor.setUTCDate(cursor.getUTCDate() - 1)
    }

    return {
      studyMinutesToday,
      questionsToday,
      accuracyToday,
      streak,
    }
  })
}

export default dashboardRoutes
