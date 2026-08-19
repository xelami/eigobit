import type { FastifyPluginAsync } from "fastify"
import { z } from "zod"
import { eq } from "drizzle-orm"

import { db } from "@repo/db"
import {
  users,
  sessions,
  passwordResetTokens,
  userProfiles,
} from "@repo/db/schema"

import {
  createSession,
  generatePasswordResetToken,
  hashPassword,
  hashPasswordResetToken,
  hashSessionToken,
  verifyPassword,
} from "../auth.js"
import { getAuthenticatedUser } from "../authenticated-user.js"
import { sendEmail } from "../lib/email.js"

const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(100).optional(),
})

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
})

const authRoutes: FastifyPluginAsync = async (app) => {
  /*
   * REGISTER
   */
  app.post("/register", async (request, reply) => {
    const result = registerSchema.safeParse(request.body)

    if (!result.success) {
      return reply.code(400).send({
        error: "Invalid request",
        details: result.error.flatten(),
      })
    }

    const { email, password, name } = result.data

    const normalizedEmail = email.toLowerCase()

    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1)

    if (existingUser.length > 0) {
      return reply.code(409).send({
        error: "Email already registered",
      })
    }

    const passwordHash = await hashPassword(password)

    const [user] = await db
      .insert(users)
      .values({
        email: normalizedEmail,
        passwordHash,
        name,
      })
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
      })

    if (!user) {
      return reply.code(500).send({
        error: "Failed to create user",
      })
    }

    const session = await createSession(user.id)

    return reply.code(201).send({
      user,
      sessionToken: session.token,
      expiresAt: session.expiresAt,
    })
  })

  /*
   * LOGIN
   */
  app.post("/login", async (request, reply) => {
    const result = loginSchema.safeParse(request.body)

    if (!result.success) {
      return reply.code(400).send({
        error: "Invalid request",
      })
    }

    const { email, password } = result.data

    const normalizedEmail = email.toLowerCase()

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1)

    if (!user) {
      return reply.code(401).send({
        error: "Invalid email or password",
      })
    }

    if (!user.passwordHash) {
      return reply.code(401).send({
        error:
          "This account does not have a password. Please use your social login.",
      })
    }

    const validPassword = await verifyPassword(user.passwordHash, password)

    if (!validPassword) {
      return reply.code(401).send({
        error: "Invalid email or password",
      })
    }

    const session = await createSession(user.id)

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      sessionToken: session.token,
      expiresAt: session.expiresAt,
    }
  })

  /*
   * LOGOUT
   */
  app.post("/logout", async (request, reply) => {
    const token = request.headers.authorization?.replace("Bearer ", "")

    if (token) {
      const tokenHash = hashSessionToken(token)

      await db.delete(sessions).where(eq(sessions.tokenHash, tokenHash))
    }

    return {
      success: true,
    }
  })

  /*
   * ME
   */
  app.get("/me", async (request, reply) => {
    const token = request.headers.authorization?.replace("Bearer ", "")

    if (!token) {
      return reply.code(401).send({
        error: "Unauthorized",
      })
    }

    const tokenHash = hashSessionToken(token)

    const [session] = await db
      .select({
        sessionId: sessions.id,
        expiresAt: sessions.expiresAt,
        userId: users.id,
        email: users.email,
        name: users.name,
        onboardingCompleted: userProfiles.onboardingCompleted,
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
      .where(eq(sessions.tokenHash, tokenHash))
      .limit(1)

    if (!session) {
      return reply.code(401).send({
        error: "Unauthorized",
      })
    }

    if (session.expiresAt <= new Date()) {
      await db.delete(sessions).where(eq(sessions.id, session.sessionId))

      return reply.code(401).send({
        error: "Session expired",
      })
    }

    return {
      user: {
        id: session.userId,
        email: session.email,
        name: session.name,
        onboardingCompleted: session.onboardingCompleted,
      },
    }
  })

  /*
   * FORGOT PASSWORD
   */
  app.post("/forgot-password", async (request, reply) => {
    const schema = z.object({
      email: z.email(),
    })

    const result = schema.safeParse(request.body)

    if (!result.success) {
      return reply.code(400).send({
        error: "Invalid email",
      })
    }

    const email = result.data.email.toLowerCase()

    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    /*
     * Always return the same response regardless of whether
     * the email exists.
     */
    if (!user) {
      return {
        success: true,
      }
    }

    /*
     * Invalidate existing reset tokens for this user.
     */
    await db
      .delete(passwordResetTokens)
      .where(eq(passwordResetTokens.userId, user.id))

    const token = generatePasswordResetToken()
    const tokenHash = hashPasswordResetToken(token)

    const expiresAt = new Date(Date.now() + 1000 * 60 * 30)

    await db.insert(passwordResetTokens).values({
      userId: user.id,
      tokenHash,
      expiresAt,
    })

    // const devResetUrl = `http://localhost:4321/reset-password?token=${token}`

    /*
     * DEVELOPMENT ONLY
     *
     * Replace this with your email provider later.
     */
    // app.log.info(
    //   {
    //     email: user.email,
    //     devResetUrl,
    //   },
    //   "PASSWORD RESET URL",
    // )

    const webUrl = process.env.WEB_URL

    if (!webUrl) {
      throw new Error("WEB_URL is not configured")
    }

    const resetUrl = `${webUrl}/reset-password?token=${encodeURIComponent(token)}`

    await sendEmail({
      to: user.email!,
      subject: "Reset your password",
      html: `
    <!DOCTYPE html>
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <h1 style="font-size: 24px; margin-bottom: 16px;">
            Reset your password
          </h1>

          <p>
            We received a request to reset your password.
          </p>

          <p>
            Click the button below to choose a new password.
          </p>

          <p style="margin: 32px 0;">
            <a
              href="${resetUrl}"
              style="
                display: inline-block;
                padding: 12px 20px;
                background: #111;
                color: #fff;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 600;
              "
            >
              Reset password
            </a>
          </p>

          <p style="color: #666; font-size: 14px;">
            This link will expire in 30 minutes.
          </p>

          <p style="color: #666; font-size: 14px;">
            If you didn't request a password reset, you can safely ignore
            this email.
          </p>

          <p style="color: #999; font-size: 12px; margin-top: 32px;">
            If the button doesn't work, copy and paste this URL into your browser:
          </p>

          <p style="color: #999; font-size: 12px; word-break: break-all;">
            ${resetUrl}
          </p>
        </div>
      </body>
    </html>
  `,
    })

    return {
      success: true,
    }
  })

  /*
   * RESET PASSWORD
   */
  app.post("/reset-password", async (request, reply) => {
    const schema = z.object({
      token: z.string().min(1),
      password: z.string().min(8).max(128),
    })

    const result = schema.safeParse(request.body)

    if (!result.success) {
      return reply.code(400).send({
        error: "Invalid request",
      })
    }

    const { token, password } = result.data

    const tokenHash = hashPasswordResetToken(token)

    const [resetToken] = await db
      .select({
        id: passwordResetTokens.id,
        userId: passwordResetTokens.userId,
        expiresAt: passwordResetTokens.expiresAt,
        usedAt: passwordResetTokens.usedAt,
      })
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.tokenHash, tokenHash))
      .limit(1)

    if (!resetToken) {
      return reply.code(400).send({
        error: "Invalid or expired reset link",
      })
    }

    if (resetToken.usedAt) {
      return reply.code(400).send({
        error: "Invalid or expired reset link",
      })
    }

    if (resetToken.expiresAt <= new Date()) {
      await db
        .delete(passwordResetTokens)
        .where(eq(passwordResetTokens.id, resetToken.id))

      return reply.code(400).send({
        error: "Invalid or expired reset link",
      })
    }

    const passwordHash = await hashPassword(password)

    /*
     * Change password.
     */
    await db
      .update(users)
      .set({
        passwordHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, resetToken.userId))

    /*
     * Invalidate all existing sessions.
     *
     * This is important: changing a password should
     * kick existing sessions out.
     */
    await db.delete(sessions).where(eq(sessions.userId, resetToken.userId))

    /*
     * Mark reset token as used.
     */
    await db
      .update(passwordResetTokens)
      .set({
        usedAt: new Date(),
      })
      .where(eq(passwordResetTokens.id, resetToken.id))

    return {
      success: true,
    }
  })

  app.delete("/account", async (request, reply) => {
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return reply.code(401).send({
        error: "Unauthorized",
      })
    }

    const userId = user.id

    await db.transaction(async (tx) => {
      await tx.delete(users).where(eq(users.id, userId))
    })

    reply
      .clearCookie("toeic_session", {
        path: "/",
      })
      .send({
        success: true,
      })
  })
}

export default authRoutes
