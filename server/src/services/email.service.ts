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
