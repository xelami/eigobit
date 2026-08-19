import crypto, { randomBytes, createHash } from "node:crypto"
import argon2 from "argon2"

import { db } from "@repo/db"
import { sessions } from "@repo/db/schema"

export const SESSION_DURATION = 60 * 60 * 24 * 30

export async function hashPassword(password: string) {
  return argon2.hash(password)
}

export async function verifyPassword(hash: string, password: string) {
  return argon2.verify(hash, password)
}

export function generateSessionToken() {
  return crypto.randomBytes(32).toString("hex")
}

export function hashSessionToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex")
}

export function generatePasswordResetToken() {
  return randomBytes(32).toString("hex")
}

export function hashPasswordResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

export async function createSession(userId: string) {
  const token = generateSessionToken()
  const tokenHash = hashSessionToken(token)

  const expiresAt = new Date(Date.now() + SESSION_DURATION * 1000)

  await db.insert(sessions).values({
    tokenHash,
    userId,
    expiresAt,
  })

  return {
    token,
    expiresAt,
  }
}
