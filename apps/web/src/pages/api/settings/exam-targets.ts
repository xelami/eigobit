import type { APIRoute } from "astro"
import { apiFetch } from "../../../lib/api"

export const PATCH: APIRoute = async (context) => {
  try {
    const body = await context.request.json()

    const result = await apiFetch("/api/v1/settings/exam-targets", context, {
      method: "PATCH",
      body: JSON.stringify(body),
    })

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    })
  } catch (error) {
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : "Failed to save exam targets",
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
