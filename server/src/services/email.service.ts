import { Resend } from 'resend'
import { RESEND_API_KEY, RESEND_FROM_EMAIL } from '../config.ts'

export function getResend() {
  if (!RESEND_API_KEY) {
    return null
  }

  return new Resend(RESEND_API_KEY)
}

export function getEmailSender() {
  return RESEND_FROM_EMAIL || 'OptiMedia <noreply@optimedia.local>'
}

export function isEmailConfigured() {
  return Boolean(RESEND_API_KEY && RESEND_FROM_EMAIL)
}

export async function sendVerificationEmail(to: string, code: string) {
  const resend = getResend()
  if (!resend) {
    throw new Error('Resend is not configured. Set RESEND_API_KEY and RESEND_FROM_EMAIL.')
  }

  await resend.emails.send({
    from: getEmailSender(),
    to,
    subject: 'Verify your OptiMedia email',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
        <h2 style="color:#1e293b;">Confirm your email</h2>
        <p style="color:#475569;">Use the code below to verify your OptiMedia account. It expires in 10 minutes.</p>
        <div style="display:inline-block;background:#eef2ff;color:#4338ca;padding:16px 24px;border-radius:8px;font-size:28px;font-weight:700;letter-spacing:8px;margin:16px 0;">
          ${code}
        </div>
        <p style="color:#94a3b8;font-size:12px;">If you didn't create an OptiMedia account, you can safely ignore this email.</p>
      </div>
    `,
  })
}
