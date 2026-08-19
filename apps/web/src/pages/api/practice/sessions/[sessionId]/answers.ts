import type { APIRoute } from "astro"
import { apiFetch } from "../../../../../lib/api.js"

export const POST: APIRoute = async (context) => {
  const { params, request } = context

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
    const body = await request.json()

    if (!body.questionId || !body.optionId) {
      return new Response(
        JSON.stringify({
          error: "questionId and optionId are required",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        },
      )
    }

    const result = await apiFetch(
      `/api/v1/practice/sessions/${sessionId}/answers`,
      context,
      {
        method: "POST",
        body: JSON.stringify({
          questionId: body.questionId,
          optionId: body.optionId,
        }),
      },
    )

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    })
  } catch (error) {
    console.error("Failed to submit practice answer:", error)

    return new Response(
      JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : "Failed to submit practice answer",
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
