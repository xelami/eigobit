import type { APIRoute } from "astro"

const API_URL = "https://api.eigobit.com"

export const DELETE: APIRoute = async ({ cookies }) => {
  const sessionToken = cookies.get("toeic_session")?.value

  if (!sessionToken) {
    return new Response(
      JSON.stringify({
        error: "Unauthorized",
      }),
      {
        status: 401,
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
  }

  const response = await fetch(`${API_URL}/api/v1/auth/account`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${sessionToken}`,
    },
  })

  const data = await response.text()

  if (!response.ok) {
    return new Response(
      data ||
        JSON.stringify({
          error: "Failed to delete account",
        }),
      {
        status: response.status,
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
  }

  cookies.delete("toeic_session", {
    path: "/",
  })

  return new Response(
    JSON.stringify({
      success: true,
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    },
  )
}
