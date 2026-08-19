import type { FastifyRequest } from "fastify"
import { eq } from "drizzle-orm"

import { db } from "@repo/db"
import { accounts, sessions, users } from "@repo/db/schema"

import { hashSessionToken } from "./auth.js"

export async function getAuthenticatedUser(request: FastifyRequest) {
  const authorization = request.headers.authorization

  if (!authorization?.startsWith("Bearer ")) {
    return null
  }

  const token = authorization.slice(7)

  if (!token) {
    return null
  }

  const tokenHash = hashSessionToken(token)

  const [session] = await db
    .select({
      sessionId: sessions.id,
      expiresAt: sessions.expiresAt,
      user: users,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.tokenHash, tokenHash))
    .limit(1)

  if (!session) {
    return null
  }

  if (session.expiresAt <= new Date()) {
    await db.delete(sessions).where(eq(sessions.id, session.sessionId))
    return null
  }

  return session.user
}
