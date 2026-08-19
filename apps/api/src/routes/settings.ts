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

const preferencesSchema = z.object({
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
})

const settingsRoutes: FastifyPluginAsync = async (app) => {
  /*
   * ==========================================================================
   * GET LEARNING PREFERENCES
   * ==========================================================================
   */

  app.get("/preferences", async (request, reply) => {
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return reply.code(401).send({
        error: "Unauthorized",
      })
    }

    const [profile] = await db
      .select({
        englishLevel: userProfiles.englishLevel,
        studyTime: userProfiles.studyTime,
      })
      .from(userProfiles)
      .where(eq(userProfiles.userId, user.id))
      .limit(1)

    const learningGoals = await db
      .select({
        goal: userLearningGoals.goal,
      })
      .from(userLearningGoals)
      .where(eq(userLearningGoals.userId, user.id))

    const interests = await db
      .select({
        interest: userInterests.interest,
      })
      .from(userInterests)
      .where(eq(userInterests.userId, user.id))

    const examGoals = await db
      .select({
        exam: userExamGoals.exam,
        toeicTargetScore: userExamGoals.toeicTargetScore,
        eikenTargetGrade: userExamGoals.eikenTargetGrade,
      })
      .from(userExamGoals)
      .where(eq(userExamGoals.userId, user.id))

    return {
      englishLevel: profile?.englishLevel ?? null,
      studyTime: profile?.studyTime ?? null,
      learningGoals: learningGoals.map((item) => item.goal),
      interests: interests.map((item) => item.interest),
      examGoals,
    }
  })

  /*
   * ==========================================================================
   * UPDATE LEARNING PREFERENCES
   * ==========================================================================
   */

  app.patch("/preferences", async (request, reply) => {
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return reply.code(401).send({
        error: "Unauthorized",
      })
    }

    const result = preferencesSchema.safeParse(request.body)

    if (!result.success) {
      return reply.code(400).send({
        error: "Invalid preferences",
        details: result.error.flatten(),
      })
    }

    const { englishLevel, studyTime, learningGoals, interests } = result.data

    /*
     * ==========================================================================
     * SAVE
     * ==========================================================================
     *
     * IMPORTANT:
     * We deliberately do NOT modify onboardingCompleted.
     */

    await db.transaction(async (tx) => {
      /*
       * PROFILE
       */

      await tx
        .insert(userProfiles)
        .values({
          userId: user.id,
          englishLevel,
          studyTime,
        })
        .onConflictDoUpdate({
          target: userProfiles.userId,
          set: {
            englishLevel,
            studyTime,
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

    return {
      success: true,
    }
  })

  app.patch("/exam-targets", async (request, reply) => {
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return reply.code(401).send({
        error: "Unauthorized",
      })
    }

    const schema = z.object({
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

    const result = schema.safeParse(request.body)

    if (!result.success) {
      return reply.code(400).send({
        error: "Invalid exam target data",
        details: result.error.flatten(),
      })
    }

    const { examGoals } = result.data

    /*
     * Validate TOEIC target.
     */
    for (const goal of examGoals) {
      if (goal.exam === "toeic" && goal.toeicTargetScore) {
        const score = Number(goal.toeicTargetScore)

        if (!Number.isInteger(score) || score < 10 || score > 990) {
          return reply.code(400).send({
            error: "Invalid TOEIC target score",
          })
        }
      }

      if (goal.exam === "eiken" && !goal.eikenTargetGrade) {
        return reply.code(400).send({
          error: "EIKEN target grade is required",
        })
      }
    }

    /*
     * Replace the user's exam targets.
     */
    await db.transaction(async (tx) => {
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
    })

    return {
      success: true,
    }
  })
}

export default settingsRoutes
