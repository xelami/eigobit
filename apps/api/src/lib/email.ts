import { Resend } from "resend"

const apiKey = process.env.RESEND_API_KEY
const emailFrom = process.env.EMAIL_FROM_NO_REPLY

if (!apiKey) {
  throw new Error("RESEND_API_KEY is not configured")
}

if (!emailFrom) {
  throw new Error("EMAIL_FROM_NO_REPLY is not configured")
}

const verifiedEmailFrom: string = emailFrom

const resend = new Resend(apiKey)

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) {
  const { data, error } = await resend.emails.send({
    from: verifiedEmailFrom,
    to,
    subject,
    html,
  })

  if (error) {
    throw new Error(`Resend error: ${error.message}`)
  }

  return data
}
