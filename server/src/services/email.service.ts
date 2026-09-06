import { Resend } from 'resend'
import { RESEND_API_KEY, RESEND_FROM_EMAIL, RESEND_REPLY_TO } from '../config.ts'

export function getResend() {
  if (!RESEND_API_KEY) {
    return null
  }

  return new Resend(RESEND_API_KEY)
}

export function getEmailSender() {
  return RESEND_FROM_EMAIL || 'OptiMedia <noreply@optimedia.local>'
}

export function getReplyTo() {
  return RESEND_REPLY_TO || undefined
}

export function isEmailConfigured() {
  return Boolean(RESEND_API_KEY && RESEND_FROM_EMAIL)
}

export function htmlToPlainText(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function wrapInEmailTemplate(bodyHtml: string, preheader?: string): string {
  const preheaderText = preheader || 'OptiMedia'
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>OptiMedia</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:AllowPNG/>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="display:none;font-size:1px;color:#f1f5f9;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
    ${preheaderText}
  </div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f1f5f9;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background-color:#ffffff;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="padding:32px 40px;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px;background-color:#f8fafc;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;line-height:1.6;">
                OptiMedia &mdash; Premium streaming at local prices.<br/>
                If you no longer wish to receive these emails, you can
                <a href="mailto:support@optimedia.solution.com?subject=Unsubscribe" style="color:#6366f1;text-decoration:underline;">unsubscribe</a>.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export async function sendVerificationEmail(to: string, code: string) {
  const resend = getResend()
  if (!resend) {
    throw new Error('Resend is not configured. Set RESEND_API_KEY and RESEND_FROM_EMAIL.')
  }

  const html = `
    <h2 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#1e293b;">Confirm your email</h2>
    <p style="margin:0 0 24px;font-size:16px;color:#475569;line-height:1.6;">
      Use the code below to verify your OptiMedia account. It expires in 10 minutes.
    </p>
    <div style="text-align:center;margin:24px 0;">
      <span style="display:inline-block;background:#eef2ff;color:#4338ca;padding:16px 32px;border-radius:8px;font-size:32px;font-weight:700;letter-spacing:12px;font-family:monospace;">
        ${code}
      </span>
    </div>
    <p style="margin:24px 0 0;font-size:13px;color:#94a3b8;line-height:1.6;">
      If you didn't create an OptiMedia account, you can safely ignore this email.
    </p>
  `

  const plainText = `Confirm your email\n\nUse the code below to verify your OptiMedia account. It expires in 10 minutes.\n\n${code}\n\nIf you didn't create an OptiMedia account, you can safely ignore this email.`

  await resend.emails.send({
    from: getEmailSender(),
    to: [to],
    subject: 'Verify your OptiMedia email',
    html: wrapInEmailTemplate(html, `Your verification code is ${code}`),
    text: plainText,
    reply_to: getReplyTo(),
  })
}
