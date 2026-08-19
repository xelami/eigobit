import type { APIRoute } from "astro"

import { apiFetch } from "../../../../../lib/api"

export const POST: APIRoute = async (context) => {
  const { params } = context

  const sessionId = params.sessionId

  if (!sessionId) {
    return new Response(
      JSON.stringify({
        error: "sessionId is required",
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
  }

  try {
    const result = await apiFetch(
      `/api/v1/practice/sessions/${sessionId}/complete`,
      context,
      {
        method: "POST",
      },
    )

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    })
  } catch (error) {
    console.error("Failed to complete practice session:", error)

    return new Response(
      JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : "Failed to complete practice session",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
  }
}
