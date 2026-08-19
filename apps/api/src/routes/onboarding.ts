import type { FastifyPluginAsync } from "fastify"
import { eq } from "drizzle-orm"
import { z } from "zod"

import { db } from "@repo/db"
import {
  userExamGoals,
  userInterests,
  userLearningGoals,
  userProfiles,
} from "@repo/db/schema"

import { getAuthenticatedUser } from "../authenticated-user.js"

const onboardingSchema = z.object({
  englishLevel: z.enum([
    "beginner",
    "elementary",
    "intermediate",
    "upper_intermediate",
    "advanced",
    "unknown",
  ]),

  studyTime: z.enum(["5", "10", "20", "30", "60", "whenever"]),

  learningGoals: z
    .array(
      z.enum([
        "toeic",
        "eiken",
        "improve_english",
        "speaking",
        "vocabulary",
        "listening",
        "reading",
        "writing",
        "school",
        "work",
        "casual",
      ]),
    )
    .min(1),

  interests: z.array(z.string().trim().min(1).max(50)).max(20),

  examGoals: z
    .array(
      z.object({
        exam: z.enum(["toeic", "eiken"]),

        toeicTargetScore: z.string().trim().max(10).optional(),

        eikenTargetGrade: z
          .enum([
            "grade_5",
            "grade_4",
            "grade_3",
            "pre_2",
            "pre_2_plus",
            "grade_2",
            "pre_1",
            "grade_1",
          ])
          .optional(),
      }),
    )
    .max(2),
})

const onboardingRoutes: FastifyPluginAsync = async (app) => {
  /*
   * ==========================================================================
   * GET ONBOARDING
   * ==========================================================================
   *
   * Returns the current onboarding state for the authenticated user.
   */

  app.get("/", async (request, reply) => {
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return reply.code(401).send({
        error: "Unauthorized",
      })
    }

    const [profile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, user.id))
      .limit(1)

    const learningGoals = await db
      .select({
        goal: userLearningGoals.goal,
      })
      .from(userLearningGoals)
      .where(eq(userLearningGoals.userId, user.id))

    const examGoals = await db
      .select({
        exam: userExamGoals.exam,
        toeicTargetScore: userExamGoals.toeicTargetScore,
        eikenTargetGrade: userExamGoals.eikenTargetGrade,
      })
      .from(userExamGoals)
      .where(eq(userExamGoals.userId, user.id))

    const interests = await db
      .select({
        interest: userInterests.interest,
      })
      .from(userInterests)
      .where(eq(userInterests.userId, user.id))

    return {
      completed: Boolean(profile?.onboardingCompleted),

      profile: profile
        ? {
            englishLevel: profile.englishLevel,
            studyTime: profile.studyTime,
            onboardingCompleted: profile.onboardingCompleted,
          }
        : null,

      learningGoals: learningGoals.map((item) => item.goal),

      examGoals,

      interests: interests.map((item) => item.interest),
    }
  })

  /*
   * ==========================================================================
   * SAVE ONBOARDING
   * ==========================================================================
   */

  app.post("/", async (request, reply) => {
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return reply.code(401).send({
        error: "Unauthorized",
      })
    }

    const result = onboardingSchema.safeParse(request.body)

    if (!result.success) {
      return reply.code(400).send({
        error: "Invalid onboarding data",
        details: result.error.flatten(),
      })
    }

    const { englishLevel, studyTime, learningGoals, examGoals, interests } =
      result.data

    /*
     * ==========================================================================
     * EXAM GOAL VALIDATION
     * ==========================================================================
     */

    const hasToeicGoal = learningGoals.includes("toeic")
    const hasEikenGoal = learningGoals.includes("eiken")

    const hasToeicExamGoal = examGoals.some((goal) => goal.exam === "toeic")

    const hasEikenExamGoal = examGoals.some((goal) => goal.exam === "eiken")

    if (hasToeicExamGoal && !hasToeicGoal) {
      return reply.code(400).send({
        error:
          "TOEIC exam goal requires TOEIC to be selected as a learning goal",
      })
    }

    if (hasEikenExamGoal && !hasEikenGoal) {
      return reply.code(400).send({
        error:
          "EIKEN exam goal requires EIKEN to be selected as a learning goal",
      })
    }

    /*
     * ==========================================================================
     * TOEIC / EIKEN TARGET VALIDATION
     * ==========================================================================
     */

    for (const examGoal of examGoals) {
      if (examGoal.exam === "toeic" && examGoal.toeicTargetScore) {
        const score = Number(examGoal.toeicTargetScore)

        if (!Number.isInteger(score) || score < 10 || score > 990) {
          return reply.code(400).send({
            error: "Invalid TOEIC target score",
          })
        }
      }

      if (examGoal.exam === "eiken" && !examGoal.eikenTargetGrade) {
        return reply.code(400).send({
          error: "EIKEN target grade is required",
        })
      }
    }

    /*
     * ==========================================================================
     * SAVE EVERYTHING IN ONE TRANSACTION
     * ==========================================================================
     */

    await db.transaction(async (tx) => {
      /*
       * USER PROFILE
       */

      await tx
        .insert(userProfiles)
        .values({
          userId: user.id,
          englishLevel,
          studyTime,
          onboardingCompleted: new Date(),
        })
        .onConflictDoUpdate({
          target: userProfiles.userId,
          set: {
            englishLevel,
            studyTime,
            onboardingCompleted: new Date(),
            updatedAt: new Date(),
          },
        })

      /*
       * LEARNING GOALS
       */

      await tx
        .delete(userLearningGoals)
        .where(eq(userLearningGoals.userId, user.id))

      if (learningGoals.length > 0) {
        await tx.insert(userLearningGoals).values(
          learningGoals.map((goal) => ({
            userId: user.id,
            goal,
          })),
        )
      }

      /*
       * EXAM GOALS
       */

      await tx.delete(userExamGoals).where(eq(userExamGoals.userId, user.id))

      if (examGoals.length > 0) {
        await tx.insert(userExamGoals).values(
          examGoals.map((goal) => ({
            userId: user.id,
            exam: goal.exam,
            toeicTargetScore:
              goal.exam === "toeic" ? (goal.toeicTargetScore ?? null) : null,
            eikenTargetGrade:
              goal.exam === "eiken" ? (goal.eikenTargetGrade ?? null) : null,
          })),
        )
      }

      /*
       * INTERESTS
       */

      await tx.delete(userInterests).where(eq(userInterests.userId, user.id))

      if (interests.length > 0) {
        await tx.insert(userInterests).values(
          interests.map((interest) => ({
            userId: user.id,
            interest,
          })),
        )
      }
    })

    return reply.send({
      success: true,
      completed: true,
    })
  })
}

export default onboardingRoutes
