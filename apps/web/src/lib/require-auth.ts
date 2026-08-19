import type { APIContext } from "astro"
import { getCurrentUser } from "./auth"

export async function requireAuth(context: APIContext) {
  const user = await getCurrentUser(context)

  if (!user) {
    return context.redirect("/login")
  }

  if (!user.onboardingCompleted) return context.redirect("/onboarding")
  return user
}
