export function passwordResetEmail({ resetUrl }: { resetUrl: string }) {
  return {
    subject: "英語ビットのパスワードをリセット",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1>パスワードのリセット</h1>

        <p>
          英語ビットのパスワードリセットのリクエストを受け付けました。
        </p>

        <p>
          下のボタンをクリックして、新しいパスワードを設定してください。
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
            パスワードをリセット
          </a>
        </p>

        <p>
          このリクエストに心当たりがない場合は、このメールを無視してください。
        </p>

        <p>
          このリンクには有効期限があります。
        </p>
      </div>
    `,
  }
}
