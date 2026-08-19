import type { APIContext } from "astro"
import { apiFetch } from "./api"

type CurrentUser = {
  id: string
  email: string
  name: string | null
  onboardingCompleted: string | null
}

export async function getCurrentUser(
  context: APIContext,
): Promise<CurrentUser | null> {
  try {
    const data = await apiFetch<{ user: CurrentUser }>(
      "/api/v1/auth/me",
      context,
    )

    return data.user
  } catch {
    return null
  }
}
