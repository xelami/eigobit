import type { APIRoute } from "astro"

const API_URL = "http://localhost:3001"

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const formData = await request.formData()

  const email = formData.get("email")
  const password = formData.get("password")

  if (typeof email !== "string" || typeof password !== "string") {
    return new Response("Invalid request", {
      status: 400,
    })
  }

  const response = await fetch(`${API_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
    }),
  })

  if (!response.ok) {
    return new Response("Invalid email or password", {
      status: 401,
    })
  }

  const data = await response.json()

  const setCookie = response.headers.get("set-cookie")

  if (setCookie) {
    cookies.set("toeic_session", data.sessionToken, {
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    })
  }

  return redirect("/dashboard")
}
