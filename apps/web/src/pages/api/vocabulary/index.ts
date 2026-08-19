import type { APIRoute } from "astro"

export const POST: APIRoute = async ({ request, cookies }) => {
  const apiUrl =
    import.meta.env.API_URL ||
    import.meta.env.PUBLIC_API_URL ||
    "http://localhost:3000"

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

  const body = await request.text()

  try {
    const response = await fetch(`${apiUrl}/api/v1/vocabulary`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionToken}`,
      },
      body,
    })

    const responseBody = await response.text()

    return new Response(responseBody, {
      status: response.status,
      headers: {
        "Content-Type":
          response.headers.get("Content-Type") || "application/json",
      },
    })
  } catch (error) {
    console.error("Vocabulary proxy error:", error)

    return new Response(
      JSON.stringify({
        error: "Failed to connect to API",
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
