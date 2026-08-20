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

      getPracticeStats(userId),

      db
        .select({
          count: count(),
        })
        .from(userVocabulary)
        .where(eq(userVocabulary.userId, userId)),

      getPracticeSummary(userId),
    ])

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
