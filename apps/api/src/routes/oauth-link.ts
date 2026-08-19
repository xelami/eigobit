import type { FastifyPluginAsync } from "fastify"
import { and, eq } from "drizzle-orm"
import { generateCodeVerifier, generateState } from "arctic"

import { db } from "@repo/db"
import { accounts, oauthLinkStates, sessions, users } from "@repo/db/schema"

import { googleLink } from "../oauth/google.js"
import { findUserByOAuthAccount, linkOAuthAccount } from "../oauth.js"
import { hashSessionToken } from "../auth.js"
import { getAuthenticatedUser } from "../authenticated-user.js"

const LINK_STATE_DURATION = 60 * 10

const oauthLinkRoutes: FastifyPluginAsync = async (app) => {
  /*
   * ==========================================================================
   * START GOOGLE ACCOUNT LINKING
   * ==========================================================================
   */

  app.get("/google", async (request, reply) => {
    /*
     * The user must already be authenticated.
     */
    const sessionToken = request.cookies.toeic_session

    if (!sessionToken) {
      return reply.redirect("http://localhost:4321/login?error=unauthorized")
    }

    const user = await getAuthenticatedUserFromCookie(sessionToken)

    if (!user) {
      return reply.redirect("http://localhost:4321/login?error=unauthorized")
    }

    /*
     * Generate OAuth state + PKCE verifier.
     */
    const state = generateState()
    const codeVerifier = generateCodeVerifier()

    /*
     * Store the entire linking transaction server-side.
     *
     * Nothing identifying the user is placed
     * in a browser-controlled cookie.
     */
    await db.insert(oauthLinkStates).values({
      state,
      userId: user.id,
      provider: "google",
      codeVerifier,
      expiresAt: new Date(Date.now() + LINK_STATE_DURATION * 1000),
    })

    /*
     * Create Google authorization URL.
     */
    const url = googleLink.createAuthorizationURL(state, codeVerifier, [
      "openid",
      "email",
      "profile",
    ])

    /*
     * Store ONLY the OAuth state in the browser.
     *
     * The actual user ID and PKCE verifier stay
     * in the database.
     */
    reply.setCookie("google_link_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: LINK_STATE_DURATION,
    })

    return reply.redirect(url.toString())
  })

  /*
   * ==========================================================================
   * GOOGLE LINK CALLBACK
   * ==========================================================================
   */

  app.get("/google/callback", async (request, reply) => {
    const { code, state } = request.query as {
      code?: string
      state?: string
    }

    if (!code || !state) {
      return reply.code(400).send({
        error: "Invalid OAuth request",
      })
    }

    /*
     * Verify the browser's state cookie.
     */
    const storedState = request.cookies.google_link_state

    if (!storedState || storedState !== state) {
      return reply.code(400).send({
        error: "Invalid OAuth state",
      })
    }

    /*
     * Retrieve the OAuth transaction.
     */
    const [linkState] = await db
      .select()
      .from(oauthLinkStates)
      .where(
        and(
          eq(oauthLinkStates.state, state),
          eq(oauthLinkStates.provider, "google"),
        ),
      )
      .limit(1)

    if (!linkState) {
      return reply.code(400).send({
        error: "Invalid or expired OAuth state",
      })
    }

    /*
     * Delete the state immediately.
     *
     * This makes the linking transaction
     * single-use.
     */
    await db.delete(oauthLinkStates).where(eq(oauthLinkStates.id, linkState.id))

    /*
     * Remove the browser state cookie.
     */
    reply.clearCookie("google_link_state", {
      path: "/",
    })

    /*
     * Check expiration.
     */
    if (linkState.expiresAt <= new Date()) {
      return reply.code(400).send({
        error: "OAuth request expired",
      })
    }

    /*
     * Re-authenticate the user from the
     * normal session cookie.
     *
     * This is the important security check.
     */
    const sessionToken = request.cookies.toeic_session

    if (!sessionToken) {
      return reply.redirect("http://localhost:4321/login?error=session_expired")
    }

    const authenticatedUser = await getAuthenticatedUserFromCookie(sessionToken)

    if (!authenticatedUser) {
      return reply.redirect("http://localhost:4321/login?error=session_expired")
    }

    /*
     * Make sure the authenticated user is
     * the same user who started the linking flow.
     */
    if (authenticatedUser.id !== linkState.userId) {
      return reply.code(403).send({
        error: "OAuth session mismatch",
      })
    }

    /*
     * Exchange authorization code for tokens.
     */
    let tokens

    try {
      tokens = await googleLink.validateAuthorizationCode(
        code,
        linkState.codeVerifier,
      )
    } catch {
      return reply.code(400).send({
        error: "Failed to authenticate with Google",
      })
    }

    const accessToken = tokens.accessToken()

    /*
     * Retrieve Google profile.
     */
    const response = await fetch(
      "https://openidconnect.googleapis.com/v1/userinfo",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    )

    if (!response.ok) {
      return reply.code(400).send({
        error: "Failed to retrieve Google profile",
      })
    }

    const profile = (await response.json()) as {
      sub: string
      email?: string
      email_verified?: boolean
      name?: string
    }

    if (!profile.sub) {
      return reply.code(400).send({
        error: "Google account has no valid ID",
      })
    }

    /*
     * Check whether this Google identity is
     * already linked to another account.
     */
    const existingUser = await findUserByOAuthAccount("google", profile.sub)

    if (existingUser) {
      return reply.redirect(
        "http://localhost:4321/settings?error=google_already_linked",
      )
    }

    /*
     * Explicitly link Google to the
     * authenticated user.
     */
    try {
      await linkOAuthAccount(authenticatedUser.id, {
        provider: "google",
        providerAccountId: profile.sub,
        email: profile.email ?? null,
        emailVerified: profile.email_verified === true,
        name: profile.name ?? null,
      })
    } catch {
      return reply.redirect(
        "http://localhost:4321/settings?error=google_link_failed",
      )
    }

    return reply.redirect("http://localhost:4321/settings?linked=google")
  })

  /*
   * ==========================================================================
   * GET CONNECTED ACCOUNTS
   * ==========================================================================
   */

  app.get("/accounts", async (request, reply) => {
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return reply.code(401).send({
        error: "Unauthorized",
      })
    }

    const connectedAccounts = await db

      .select({
        provider: accounts.provider,
      })
      .from(accounts)
      .where(eq(accounts.userId, user.id))

    const connectedProviders = new Set(
      connectedAccounts.map((account) => account.provider),
    )

    return {
      google: connectedProviders.has("google"),
      apple: connectedProviders.has("apple"),
      line: connectedProviders.has("line"),
    }
  })

  /*
   * ==========================================================================
   * DISCONNECT OAUTH ACCOUNT
   * ==========================================================================
   */

  app.delete("/:provider", async (request, reply) => {
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return reply.code(401).send({
        error: "Unauthorized",
      })
    }

    const { provider } = request.params as {
      provider: string
    }

    if (provider !== "google") {
      return reply.code(400).send({
        error: "Unsupported provider",
      })
    }

    /*
     * Get the current user so we can check whether
     * they still have another way to authenticate.
     */
    const [currentUser] = await db
      .select({
        passwordHash: users.passwordHash,
      })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1)

    if (!currentUser) {
      return reply.code(404).send({
        error: "User not found",
      })
    }

    /*
     * If the user has no password, disconnecting Google
     * would leave them with no way to log in.
     */
    if (!currentUser.passwordHash) {
      const linkedAccounts = await db
        .select({
          provider: accounts.provider,
        })
        .from(accounts)
        .where(eq(accounts.userId, user.id))

      if (linkedAccounts.length <= 1) {
        return reply.code(400).send({
          error:
            "You cannot disconnect your only sign-in method. Set a password first.",
        })
      }
    }

    const deleted = await db
      .delete(accounts)
      .where(and(eq(accounts.userId, user.id), eq(accounts.provider, provider)))
      .returning({
        provider: accounts.provider,
      })

    if (deleted.length === 0) {
      return reply.code(404).send({
        error: "Account is not connected",
      })
    }

    return {
      success: true,
    }
  })
}

/*
 * ============================================================================
 * AUTHENTICATE USER FROM SESSION COOKIE
 * ============================================================================
 */

async function getAuthenticatedUserFromCookie(token: string) {
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

  /*
   * Remove expired sessions.
   */
  if (session.expiresAt <= new Date()) {
    await db.delete(sessions).where(eq(sessions.id, session.sessionId))

    return null
  }

  return session.user
}

export default oauthLinkRoutes
