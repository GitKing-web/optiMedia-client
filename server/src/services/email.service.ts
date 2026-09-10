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

type EmailPayload = Parameters<Resend['emails']['send']>[0]

async function deliverEmail(payload: EmailPayload) {
  const resend = getResend()
  if (!resend) {
    throw new Error('Resend is not configured.')
  }

  const result = await resend.emails.send(payload)
  if (result.error) {
    throw new Error(result.error.message || 'Resend failed to send email')
  }

  return result
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

  await deliverEmail({
    from: getEmailSender(),
    to: [to],
    subject: 'Verify your OptiMedia email',
    html: wrapInEmailTemplate(html, `Your verification code is ${code}`),
    text: plainText,
    replyTo: getReplyTo(),
  })
}

function ctaButton(label: string, href: string) {
  return `
    <div style="text-align:center;margin:28px 0;">
      <a href="${href}" style="display:inline-block;background:#6366f1;color:#ffffff;padding:14px 32px;border-radius:10px;font-size:15px;font-weight:700;text-decoration:none;">
        ${label}
      </a>
    </div>`
}

interface ServiceEmailContext {
  name: string
  serviceName: string
  months?: number
  expiresAt?: Date | null
  renewUrl: string
}

function firstName(name: string) {
  return (name || 'there').split(' ')[0]
}

export async function sendWelcomeEmail(to: string, context: ServiceEmailContext) {
  const resend = getResend()
  if (!resend) return

  const expiresLine = context.expiresAt
    ? `<p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.6;">Your access runs until <strong>${context.expiresAt.toDateString()}</strong>.</p>`
    : ''

  const html = `
    <h2 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#1e293b;">Welcome to OptiMedia, ${firstName(context.name)}! 🎉</h2>
    <p style="margin:0 0 16px;font-size:16px;color:#475569;line-height:1.6;">
      Thanks for subscribing to <strong>${context.serviceName}</strong>${context.months && context.months > 1 ? ` for ${context.months} months` : ''}. We're thrilled to have you.
    </p>
    ${expiresLine}
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:20px;margin:20px 0;">
      <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#1e293b;text-transform:uppercase;letter-spacing:1px;">Your onboarding steps</p>
      <ol style="margin:0;padding-left:20px;color:#475569;font-size:14px;line-height:1.9;">
        <li>Open your OptiMedia dashboard to review your subscription.</li>
        <li>Our team will deliver your access credentials / invite link shortly.</li>
        <li>Activate and start streaming right away.</li>
      </ol>
    </div>
    <p style="margin:0 0 8px;font-size:15px;color:#475569;line-height:1.6;">Need anything? Just reply to this email and our support team will help.</p>
    ${ctaButton('Go to my dashboard', context.renewUrl)}
  `

  const plainText = `Welcome to OptiMedia, ${firstName(context.name)}!\n\nThanks for subscribing to ${context.serviceName}${context.months && context.months > 1 ? ` for ${context.months} months` : ''}.\n\nOnboarding steps:\n1. Open your dashboard to review your subscription.\n2. Our team will deliver your access credentials / invite link shortly.\n3. Activate and start streaming right away.\n\nDashboard: ${context.renewUrl}`

  await deliverEmail({
    from: getEmailSender(),
    to: [to],
    subject: `Welcome to OptiMedia — your ${context.serviceName} is ready`,
    html: wrapInEmailTemplate(html, `Welcome aboard, ${firstName(context.name)}!`),
    text: plainText,
    replyTo: getReplyTo(),
  })
}

export async function sendExpiryReminderEmail(to: string, context: ServiceEmailContext & { daysLeft: number }) {
  const resend = getResend()
  if (!resend) return

  const dateLine = context.expiresAt ? context.expiresAt.toDateString() : 'soon'
  const dayWord = context.daysLeft === 1 ? 'day' : 'days'

  const html = `
    <h2 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#1e293b;">Your ${context.serviceName} ends in ${context.daysLeft} ${dayWord}</h2>
    <p style="margin:0 0 16px;font-size:16px;color:#475569;line-height:1.6;">
      Hi ${firstName(context.name)}, this is a friendly reminder that your <strong>${context.serviceName}</strong> subscription expires on <strong>${dateLine}</strong>.
    </p>
    <p style="margin:0 0 8px;font-size:15px;color:#475569;line-height:1.6;">
      Renew now to keep your access without interruption — it only takes a moment.
    </p>
    ${ctaButton('Renew my subscription', context.renewUrl)}
    <p style="margin:24px 0 0;font-size:13px;color:#94a3b8;line-height:1.6;">
      If you've already renewed, you can safely ignore this email.
    </p>
  `

  const plainText = `Hi ${firstName(context.name)},\n\nYour ${context.serviceName} subscription expires on ${dateLine} (${context.daysLeft} ${dayWord}).\n\nRenew here: ${context.renewUrl}`

  await deliverEmail({
    from: getEmailSender(),
    to: [to],
    subject: `⏳ Your ${context.serviceName} expires in ${context.daysLeft} ${dayWord}`,
    html: wrapInEmailTemplate(html, `Renew your ${context.serviceName} to avoid interruption`),
    text: plainText,
    replyTo: getReplyTo(),
  })
}

export async function sendExpiryNoticeEmail(to: string, context: ServiceEmailContext) {
  const resend = getResend()
  if (!resend) return

  const html = `
    <h2 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#1e293b;">Your ${context.serviceName} access ends today</h2>
    <p style="margin:0 0 16px;font-size:16px;color:#475569;line-height:1.6;">
      Hi ${firstName(context.name)}, your <strong>${context.serviceName}</strong> subscription reaches its expiry date today.
    </p>
    <p style="margin:0 0 8px;font-size:15px;color:#475569;line-height:1.6;">
      Don't lose access — reactivate in one click and pick up right where you left off.
    </p>
    ${ctaButton('Reactivate now', context.renewUrl)}
    <p style="margin:24px 0 0;font-size:13px;color:#94a3b8;line-height:1.6;">
      Questions? Simply reply to this email and we'll help you get back online.
    </p>
  `

  const plainText = `Hi ${firstName(context.name)},\n\nYour ${context.serviceName} subscription expires today.\n\nReactivate here: ${context.renewUrl}`

  await deliverEmail({
    from: getEmailSender(),
    to: [to],
    subject: `Your ${context.serviceName} expires today`,
    html: wrapInEmailTemplate(html, 'Reactivate in one click to keep your access'),
    text: plainText,
    replyTo: getReplyTo(),
  })
}
