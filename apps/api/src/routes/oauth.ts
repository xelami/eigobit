import type { FastifyPluginAsync } from "fastify"
import { generateCodeVerifier, generateState } from "arctic"

import { google } from "../oauth/google.js"
import { resolveOAuthLogin } from "../oauth.js"
import { createSession } from "../auth.js"

const oauthRoutes: FastifyPluginAsync = async (app) => {
  /*
   * ==========================================================================
   * GOOGLE LOGIN
   * ==========================================================================
   */

  app.get("/google", async (_request, reply) => {
    const state = generateState()
    const codeVerifier = generateCodeVerifier()

    const url = google.createAuthorizationURL(state, codeVerifier, [
      "openid",
      "email",
      "profile",
    ])

    reply.setCookie("google_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      domain: ".eigobit.com",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 10,
    })

    reply.setCookie("google_oauth_code_verifier", codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      domain: ".eigobit.com",
      path: "/",
      maxAge: 60 * 10,
    })

    return reply.redirect(url.toString())
  })

  /*
   * ==========================================================================
   * GOOGLE CALLBACK
   * ==========================================================================
   */

  app.get("/google/callback", async (request, reply) => {
    const { code, state } = request.query as {
      code?: string
      state?: string
    }

    const storedState = request.cookies.google_oauth_state

    const codeVerifier = request.cookies.google_oauth_code_verifier

    if (!code || !state || !storedState || !codeVerifier) {
      return reply.code(400).send({
        error: "Invalid OAuth request",
      })
    }

    /*
     * Prevent CSRF attacks.
     */
    if (state !== storedState) {
      return reply.code(400).send({
        error: "Invalid OAuth state",
      })
    }

    /*
     * These cookies have now served their purpose.
     */
    reply.clearCookie("google_oauth_state", {
      path: "/",
    })

    reply.clearCookie("google_oauth_code_verifier", {
      path: "/",
    })

    /*
     * Exchange the authorization code for tokens.
     */
    let tokens

    try {
      tokens = await google.validateAuthorizationCode(code, codeVerifier)
    } catch {
      return reply.code(400).send({
        error: "Failed to authenticate with Google",
      })
    }

    /*
     * Get the Google access token.
     */
    const accessToken = tokens.accessToken()

    /*
     * Retrieve the authenticated Google user's
     * OpenID Connect profile.
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
     * Resolve the Google identity to one of our users.
     *
     * Existing Google account → existing user
     * Verified matching email → link Google
     * Otherwise → create new user
     */
    const result = await resolveOAuthLogin({
      provider: "google",

      providerAccountId: profile.sub,

      email: profile.email ?? null,

      emailVerified: profile.email_verified === true,

      name: profile.name ?? null,
    })

    if (result.status === "email_exists") {
      return reply.redirect(
        `${process.env.WEB_URL}/login?error=oauth_account_exists`,
      )
    }

    const user = result.user

    /*
     * Create our normal application session.
     */
    const session = await createSession(user.id)

    /*
     * Store our session token in the same cookie
     * used by normal email/password authentication.
     */
    reply.setCookie("toeic_session", session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      domain: ".eigobit.com",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    })

    /*
     * Send the user back to Astro.
     */
    return reply.redirect(`${process.env.WEB_URL}/dashboard`)
  })
}

export default oauthRoutes
