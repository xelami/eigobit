import type { FastifyPluginAsync } from "fastify"
import { and, count, eq, gte, lt, sql } from "drizzle-orm"

import { db } from "@repo/db"
import {
  practiceSessions,
  practiceSessionQuestions,
  userProfiles,
  userLearningGoals,
  userInterests,
  userExamGoals,
  userVocabulary,
} from "@repo/db/schema"
import { getAuthenticatedUser } from "../authenticated-user.js"

const dashboardRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", async (request, reply) => {
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return reply.code(401).send({
        error: "Unauthorized",
      })
    }

    const userId = user.id

    /*
     * ==========================================================================
     * DASHBOARD DATA
     *
     * Everything is fetched from one API request.
     * Independent database queries run concurrently.
     * ==========================================================================
     */

    const start = performance.now()

    const [
      profileResult,
      learningGoalsResult,
      interestsResult,
      examGoalsResult,
      practiceStatsResult,
      vocabularyResult,
      practiceSummaryResult,
    ] = await Promise.all([
      /*
       * PROFILE
       */

      db
        .select({
          englishLevel: userProfiles.englishLevel,
          studyTime: userProfiles.studyTime,
          onboardingCompleted: userProfiles.onboardingCompleted,
        })
        .from(userProfiles)
        .where(eq(userProfiles.userId, userId))
        .limit(1),

      /*
       * LEARNING GOALS
       */

      db
        .select({
          goal: userLearningGoals.goal,
        })
        .from(userLearningGoals)
        .where(eq(userLearningGoals.userId, userId)),

      /*
       * INTERESTS
       */

      db
        .select({
          interest: userInterests.interest,
        })
        .from(userInterests)
        .where(eq(userInterests.userId, userId)),

      /*
       * EXAM GOALS
       */

      db
        .select({
          exam: userExamGoals.exam,
          toeicTargetScore: userExamGoals.toeicTargetScore,
          eikenTargetGrade: userExamGoals.eikenTargetGrade,
        })
        .from(userExamGoals)
        .where(eq(userExamGoals.userId, userId)),

      /*
       * PRACTICE STATS
       */

      getPracticeStats(userId),

      /*
       * VOCABULARY COUNT
       */

      db
        .select({
          count: count(),
        })
        .from(userVocabulary)
        .where(eq(userVocabulary.userId, userId)),

      /*
       * PRACTICE SUMMARY
       */

      getPracticeSummary(userId),
    ])

    console.log(`Dashboard DB: ${Math.round(performance.now() - start)}ms`)

    const profile = profileResult[0] ?? null

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },

      onboarding: {
        profile,
        learningGoals: learningGoalsResult.map((row) => row.goal),
        interests: interestsResult.map((row) => row.interest),
        examGoals: examGoalsResult,
      },

      stats: {
        practice: practiceStatsResult.practice,
        today: practiceStatsResult.today,

        vocabulary: {
          count: vocabularyResult[0]?.count ?? 0,
        },
      },

      practiceSummary: practiceSummaryResult,
    }
  })
}

/*
 * ============================================================================
 * PRACTICE STATS
 * ============================================================================
 */

async function getPracticeStats(userId: string) {
  const [sessionStats, answerStats, todayStats] = await Promise.all([
    db
      .select({
        totalSessions: count(),
        completedSessions: sql<number>`
          count(*) filter (where ${practiceSessions.completedAt} is not null)
        `,
      })
      .from(practiceSessions)
      .where(eq(practiceSessions.userId, userId)),

    db
      .select({
        answeredQuestions: sql<number>`
          count(*) filter (where ${practiceSessionQuestions.answeredAt} is not null)
        `,
        correctAnswers: sql<number>`
          count(*) filter (
            where ${practiceSessionQuestions.answeredAt} is not null
            and ${practiceSessionQuestions.isCorrect} = true
          )
        `,
      })
      .from(practiceSessionQuestions)
      .innerJoin(
        practiceSessions,
        eq(practiceSessionQuestions.sessionId, practiceSessions.id),
      )
      .where(eq(practiceSessions.userId, userId)),

    getTodayQuestionCount(userId),
  ])

  const totalSessions = Number(sessionStats[0]?.totalSessions ?? 0)
  const completedSessions = Number(sessionStats[0]?.completedSessions ?? 0)

  const answeredQuestions = Number(answerStats[0]?.answeredQuestions ?? 0)

  const correctAnswers = Number(answerStats[0]?.correctAnswers ?? 0)

  const accuracy =
    answeredQuestions > 0
      ? Math.round((correctAnswers / answeredQuestions) * 100)
      : 0

  return {
    practice: {
      totalSessions,
      completedSessions,
      answeredQuestions,
      correctAnswers,
      accuracy,
    },

    today: {
      questionsAnswered: todayStats,
    },
  }
}

/*
 * ============================================================================
 * TODAY'S QUESTIONS
 * ============================================================================
 */

async function getTodayQuestionCount(userId: string) {
  const now = new Date()

  const startOfDay = new Date(now)
  startOfDay.setHours(0, 0, 0, 0)

  const startOfTomorrow = new Date(startOfDay)
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1)

  const result = await db
    .select({
      count: count(),
    })
    .from(practiceSessionQuestions)
    .innerJoin(
      practiceSessions,
      eq(practiceSessionQuestions.sessionId, practiceSessions.id),
    )
    .where(
      and(
        eq(practiceSessions.userId, userId),
        gte(practiceSessionQuestions.answeredAt, startOfDay),
        lt(practiceSessionQuestions.answeredAt, startOfTomorrow),
      ),
    )

  return Number(result[0]?.count ?? 0)
}

/*
 * ============================================================================
 * PRACTICE SUMMARY
 * ============================================================================
 */

async function getPracticeSummary(userId: string) {
  const [summaryResult, recentSessions] = await Promise.all([
    db
      .select({
        completedSessions: sql<number>`
          count(*) filter (where ${practiceSessions.completedAt} is not null)
        `,
        totalQuestions: sql<number>`
          coalesce(sum(${practiceSessions.totalQuestions}), 0)
        `,
        totalCorrectAnswers: sql<number>`
          coalesce(sum(${practiceSessions.correctAnswers}), 0)
        `,
      })
      .from(practiceSessions)
      .where(eq(practiceSessions.userId, userId)),

    db
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
      .where(eq(practiceSessions.userId, userId))
      .orderBy(sql`${practiceSessions.createdAt} desc`)
      .limit(5),
  ])

  const completedSessions = Number(summaryResult[0]?.completedSessions ?? 0)

  const totalQuestions = Number(summaryResult[0]?.totalQuestions ?? 0)

  const totalCorrectAnswers = Number(summaryResult[0]?.totalCorrectAnswers ?? 0)

  const averageScore =
    totalQuestions > 0
      ? Math.round((totalCorrectAnswers / totalQuestions) * 100)
      : 0

  return {
    completedSessions,
    totalQuestions,
    totalCorrectAnswers,
    averageScore,
    recentSessions,
  }
}

export default dashboardRoutes

// app.get("/stats", async (request, reply) => {
//   const user = await getAuthenticatedUser(request)

//   if (!user) {
//     return reply.code(401).send({
//       error: "Unauthorized",
//     })
//   }

//   /*
//    * Use Japan time for "today".
//    *
//    * The application is being used in Japan, so the dashboard should
//    * change days at midnight Japan time rather than UTC midnight.
//    */

//   const now = new Date()

//   const japanDate = new Intl.DateTimeFormat("en-CA", {
//     timeZone: "Asia/Tokyo",
//     year: "numeric",
//     month: "2-digit",
//     day: "2-digit",
//   }).format(now)

//   const startOfToday = new Date(`${japanDate}T00:00:00+09:00`)

//   const startOfTomorrow = new Date(startOfToday)

//   startOfTomorrow.setUTCDate(startOfTomorrow.getUTCDate() + 1)

//   /*
//    * ==========================================================================
//    * TODAY'S ANSWERS
//    * ==========================================================================
//    */

//   const todayAnswers = await db
//     .select({
//       isCorrect: practiceSessionQuestions.isCorrect,
//       answeredAt: practiceSessionQuestions.answeredAt,
//     })
//     .from(practiceSessionQuestions)
//     .innerJoin(
//       practiceSessions,
//       eq(practiceSessionQuestions.sessionId, practiceSessions.id),
//     )
//     .where(
//       and(
//         eq(practiceSessions.userId, user.id),
//         gte(practiceSessionQuestions.answeredAt, startOfToday),
//         lt(practiceSessionQuestions.answeredAt, startOfTomorrow),
//       ),
//     )

//   const questionsToday = todayAnswers.length

//   const correctToday = todayAnswers.filter(
//     (answer) => answer.isCorrect === true,
//   ).length

//   const accuracyToday =
//     questionsToday > 0
//       ? Math.round((correctToday / questionsToday) * 100)
//       : null

//   /*
//    * ==========================================================================
//    * TODAY'S STUDY TIME
//    * ==========================================================================
//    *
//    * We don't have a dedicated duration column.
//    *
//    * A practice session already has:
//    *
//    * createdAt   = session started
//    * completedAt = session finished
//    *
//    * So we can calculate the duration of completed sessions.
//    */

//   const completedToday = await db
//     .select({
//       createdAt: practiceSessions.createdAt,
//       completedAt: practiceSessions.completedAt,
//     })
//     .from(practiceSessions)
//     .where(
//       and(
//         eq(practiceSessions.userId, user.id),
//         gte(practiceSessions.completedAt, startOfToday),
//         lt(practiceSessions.completedAt, startOfTomorrow),
//       ),
//     )

//   const studySecondsToday = completedToday.reduce((total, session) => {
//     if (!session.completedAt) {
//       return total
//     }

//     const duration =
//       session.completedAt.getTime() - session.createdAt.getTime()

//     /*
//      * Ignore obviously invalid sessions.
//      *
//      * This also prevents a broken session from making the
//      * dashboard say something ridiculous like 4,000 minutes.
//      */

//     if (duration > 0 && duration < 4 * 60 * 60 * 1000) {
//       return total + duration / 1000
//     }

//     return total
//   }, 0)

//   const studyMinutesToday = Math.round(studySecondsToday / 60)

//   /*
//    * ==========================================================================
//    * STUDY STREAK
//    * ==========================================================================
//    *
//    * A day counts when the user completed at least one practice session.
//    *
//    * We fetch completed sessions and build a set of Japanese calendar dates.
//    */

//   const completedSessions = await db
//     .select({
//       completedAt: practiceSessions.completedAt,
//     })
//     .from(practiceSessions)
//     .where(and(eq(practiceSessions.userId, user.id)))

//   const completedDates = new Set<string>()

//   for (const session of completedSessions) {
//     if (!session.completedAt) {
//       continue
//     }

//     const date = new Intl.DateTimeFormat("en-CA", {
//       timeZone: "Asia/Tokyo",
//       year: "numeric",
//       month: "2-digit",
//       day: "2-digit",
//     }).format(session.completedAt)

//     completedDates.add(date)
//   }

//   /*
//    * Count backwards from today.
//    *
//    * Today itself does not have to be completed for the existing streak
//    * to remain meaningful, so if today has no activity we start from
//    * yesterday.
//    */

//   const todayCompleted = completedDates.has(japanDate)

//   let streak = 0

//   const cursor = new Date(
//     todayCompleted
//       ? startOfToday
//       : startOfToday.getTime() - 24 * 60 * 60 * 1000,
//   )

//   while (true) {
//     const date = new Intl.DateTimeFormat("en-CA", {
//       timeZone: "Asia/Tokyo",
//       year: "numeric",
//       month: "2-digit",
//       day: "2-digit",
//     }).format(cursor)

//     if (!completedDates.has(date)) {
//       break
//     }

//     streak += 1

//     cursor.setUTCDate(cursor.getUTCDate() - 1)
//   }

//   return {
//     studyMinutesToday,
//     questionsToday,
//     accuracyToday,
//     streak,
//   }
// }))

// export default dashboardRoutes
