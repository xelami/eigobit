export function passwordResetEmail({ resetUrl }: { resetUrl: string }) {
  return {
    subject: "Reset your English Bit password",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1>Reset your password</h1>

        <p>
          We received a request to reset your English Bit password.
        </p>

        <p>
          Click the button below to choose a new password.
        </p>

        <p>
          <a
            href="${resetUrl}"
            style="
              display: inline-block;
              padding: 12px 20px;
              background: #111827;
              color: white;
              text-decoration: none;
              border-radius: 8px;
            "
          >
            Reset password
          </a>
        </p>

        <p>
          If you didn't request this, you can safely ignore this email.
        </p>

        <p>
          This link will expire shortly.
        </p>
      </div>
    `,
  }
}
