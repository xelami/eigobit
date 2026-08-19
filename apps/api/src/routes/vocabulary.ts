import type { FastifyPluginAsync } from "fastify"
import { eq, and, ilike, or, count, desc } from "drizzle-orm"
import { z } from "zod"

import { db } from "@repo/db"
import { userVocabulary } from "@repo/db/schema"

import { getAuthenticatedUser } from "../authenticated-user.js"

const vocabularySchema = z.object({
  word: z.string().trim().min(1).max(100),
  meaning: z.string().trim().max(500).nullable().optional(),
  exampleSentence: z.string().trim().max(1000).nullable().optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
  tags: z.string().trim().max(500).nullable().optional(),
})

const vocabularyRoutes: FastifyPluginAsync = async (app) => {
  /*
   * ==========================================================================
   * GET ALL VOCABULARY
   * ==========================================================================
   *
   * Supports:
   *
   * ?search=business
   * ?page=2
   * ?limit=20
   *
   */

  app.get("/", async (request, reply) => {
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return reply.code(401).send({
        error: "Unauthorized",
      })
    }

    const querySchema = z.object({
      search: z.string().trim().optional().default(""),
      page: z.coerce.number().int().min(1).optional().default(1),
      limit: z.coerce.number().int().min(1).max(100).optional().default(20),
    })

    const result = querySchema.safeParse(request.query)

    if (!result.success) {
      return reply.code(400).send({
        error: "Invalid query parameters",
      })
    }

    const { search, page, limit } = result.data

    const offset = (page - 1) * limit

    const searchCondition = search
      ? or(
          ilike(userVocabulary.word, `%${search}%`),
          ilike(userVocabulary.meaning, `%${search}%`),
          ilike(userVocabulary.tags, `%${search}%`),
        )
      : undefined

    const whereCondition = searchCondition
      ? and(eq(userVocabulary.userId, user.id), searchCondition)
      : eq(userVocabulary.userId, user.id)

    const [vocabulary, countResult] = await Promise.all([
      db
        .select()
        .from(userVocabulary)
        .where(whereCondition)
        .orderBy(desc(userVocabulary.createdAt))
        .limit(limit)
        .offset(offset),

      db
        .select({
          total: count(),
        })
        .from(userVocabulary)
        .where(whereCondition),
    ])

    const total = Number(countResult[0]?.total ?? 0)

    const totalPages = Math.ceil(total / limit)

    return {
      vocabulary,
      pagination: {
        page,
        limit,
        total: Number(total),
        totalPages,
      },
    }
  })

  /*
   * ==========================================================================
   * GET ONE
   * ==========================================================================
   */

  app.get("/:id", async (request, reply) => {
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return reply.code(401).send({
        error: "Unauthorized",
      })
    }

    const params = z.object({
      id: z.uuid(),
    })

    const result = params.safeParse(request.params)

    if (!result.success) {
      return reply.code(400).send({
        error: "Invalid vocabulary ID",
      })
    }

    const [word] = await db
      .select()
      .from(userVocabulary)
      .where(
        and(
          eq(userVocabulary.id, result.data.id),
          eq(userVocabulary.userId, user.id),
        ),
      )
      .limit(1)

    if (!word) {
      return reply.code(404).send({
        error: "Vocabulary item not found",
      })
    }

    return {
      word,
    }
  })

  /*
   * ==========================================================================
   * CREATE
   * ==========================================================================
   */

  app.post("/", async (request, reply) => {
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return reply.code(401).send({
        error: "Unauthorized",
      })
    }

    const result = vocabularySchema.safeParse(request.body)

    if (!result.success) {
      return reply.code(400).send({
        error: "Invalid vocabulary data",
        details: result.error.flatten(),
      })
    }

    const word = result.data.word.trim()

    const [existing] = await db
      .select({
        id: userVocabulary.id,
      })
      .from(userVocabulary)
      .where(
        and(eq(userVocabulary.userId, user.id), eq(userVocabulary.word, word)),
      )
      .limit(1)

    if (existing) {
      return reply.code(409).send({
        error: "Word already exists in vocabulary",
        vocabularyId: existing.id,
      })
    }

    const [created] = await db
      .insert(userVocabulary)
      .values({
        userId: user.id,
        word,
        meaning: result.data.meaning ?? null,
        exampleSentence: result.data.exampleSentence ?? null,
        notes: result.data.notes ?? null,
        tags: result.data.tags ?? null,
      })
      .returning()

    if (!created) {
      return reply.code(500).send({
        error: "Failed to create vocabulary item",
      })
    }

    return reply.code(201).send({
      word: created,
    })
  })

  /*
   * ==========================================================================
   * UPDATE
   * ==========================================================================
   */

  app.put("/:id", async (request, reply) => {
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return reply.code(401).send({
        error: "Unauthorized",
      })
    }

    const params = z.object({
      id: z.uuid(),
    })

    const paramsResult = params.safeParse(request.params)

    if (!paramsResult.success) {
      return reply.code(400).send({
        error: "Invalid vocabulary ID",
      })
    }

    const bodyResult = vocabularySchema.safeParse(request.body)

    if (!bodyResult.success) {
      return reply.code(400).send({
        error: "Invalid vocabulary data",
        details: bodyResult.error.flatten(),
      })
    }

    const [word] = await db
      .update(userVocabulary)
      .set({
        word: bodyResult.data.word,
        meaning: bodyResult.data.meaning ?? null,
        exampleSentence: bodyResult.data.exampleSentence ?? null,
        notes: bodyResult.data.notes ?? null,
        tags: bodyResult.data.tags ?? null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(userVocabulary.id, paramsResult.data.id),
          eq(userVocabulary.userId, user.id),
        ),
      )
      .returning()

    if (!word) {
      return reply.code(404).send({
        error: "Vocabulary item not found",
      })
    }

    return {
      word,
    }
  })

  /*
   * ==========================================================================
   * DELETE
   * ==========================================================================
   */

  app.delete("/:id", async (request, reply) => {
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return reply.code(401).send({
        error: "Unauthorized",
      })
    }

    const params = z.object({
      id: z.uuid(),
    })

    const result = params.safeParse(request.params)

    if (!result.success) {
      return reply.code(400).send({
        error: "Invalid vocabulary ID",
      })
    }

    const [deleted] = await db
      .delete(userVocabulary)
      .where(
        and(
          eq(userVocabulary.id, result.data.id),
          eq(userVocabulary.userId, user.id),
        ),
      )
      .returning({
        id: userVocabulary.id,
      })

    if (!deleted) {
      return reply.code(404).send({
        error: "Vocabulary item not found",
      })
    }

    return {
      success: true,
    }
  })
}

export default vocabularyRoutes
