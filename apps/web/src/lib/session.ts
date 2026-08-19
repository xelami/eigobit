import type { APIContext } from "astro"

const COOKIE_NAME = "toeic_session"

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: import.meta.env.PROD,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
}

export function setSession(context: APIContext, token: string) {
  context.cookies.set(COOKIE_NAME, token, COOKIE_OPTIONS)
}

export function getSessionToken(context: APIContext) {
  return context.cookies.get(COOKIE_NAME)?.value
}

export function clearSession(context: APIContext) {
  context.cookies.delete(COOKIE_NAME, {
    path: "/",
  })
}
