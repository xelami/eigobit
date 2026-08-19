import type { APIContext } from "astro"
import { getSessionToken } from "./session"

const API_URL = import.meta.env.PUBLIC_API_URL

export async function apiFetch<T>(
  path: string,
  context: APIContext,
  options: RequestInit = {},
): Promise<T> {
  const token = getSessionToken(context)

  const headers = new Headers(options.headers)

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json")
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const body = await response.text()

    throw new Error(
      `API request failed: ${response.status}${body ? ` - ${body}` : ""}`,
    )
  }

  return response.json()
}
