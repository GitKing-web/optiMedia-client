import * as bcrypt from 'bcrypt'
import * as jwt from 'jsonwebtoken'
import { randomBytes, randomInt, createHash } from 'node:crypto'
import { prisma } from '../db/prisma.ts'
import { normalizeEmail, normalizePhoneDigits, normalizeWhatsApp } from '../utils.ts'
import { JWT_SECRET } from '../config.ts'
import { getClientUrl } from '../config.ts'
import { getEmailSender, getReplyTo, getResend, htmlToPlainText, sendVerificationEmail, wrapInEmailTemplate } from './email.service.ts'
import type { AuthUser, JwtPayload, LoginBody, RegisterBody } from '../types.ts'

const BCRYPT_ROUNDS = 10
const RESET_TOKEN_EXPIRY_HOURS = 1
const OTP_EXPIRY_MINUTES = 10
const CLIENT_URL = getClientUrl()
const resend = getResend()

function hashOtp(code: string) {
  return createHash('sha256').update(code).digest('hex')
}

export async function sendVerificationOtp(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    return { error: 'User not found' }
  }

  if (user.emailVerified) {
    return { error: 'Email is already verified' }
  }

  const code = String(randomInt(0, 1000000)).padStart(6, '0')
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)

  await prisma.user.update({
    where: { id: userId },
    data: {
      emailVerificationCode: hashOtp(code),
      emailVerificationExpires: expiresAt,
    },
  })

  try {
    await sendVerificationEmail(user.email, code)
    return { message: 'Verification code sent' }
  } catch (error) {
    console.error('Failed to send verification email:', error)
    return { error: 'Unable to send verification email. Please try again.' }
  }
}

export async function verifyEmailOtp(userId: string, code: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    return { error: 'User not found' }
  }

  if (user.emailVerified) {
    return { message: 'Email is already verified' }
  }

  if (!user.emailVerificationCode || !user.emailVerificationExpires) {
    return { error: 'No verification code was requested for this email' }
  }

  if (new Date() > user.emailVerificationExpires) {
    return { error: 'Verification code has expired. Please request a new one.' }
  }

  if (hashOtp(code.trim()) !== user.emailVerificationCode) {
    return { error: 'Invalid verification code' }
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      emailVerificationCode: null,
      emailVerificationExpires: null,
    },
  })

  return {
    message: 'Email verified successfully',
    user: publicUser({ ...user, emailVerified: true } as AuthUser),
  }
}

export function publicUser(user: AuthUser) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    whatsapp: user.whatsapp,
    role: user.role,
    avatar: user.avatar,
    emailVerified: Boolean(user.emailVerified),
  }
}

export async function findAuthUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
  })
}

export async function findAuthUserByIdentifier(identifier: string) {
  const normalizedEmail = normalizeEmail(identifier)
  const normalizedPhone = normalizePhoneDigits(identifier)

  if (identifier.includes('@')) {
    return prisma.user.findFirst({
      where: { email: normalizedEmail },
    })
  }

  if (normalizedPhone.length > 0) {
    return prisma.user.findFirst({
      where: {
        OR: [
          { whatsapp: { contains: normalizedPhone } },
          { whatsapp: { contains: normalizeWhatsApp(identifier) } },
        ],
      },
    })
  }

  return prisma.user.findFirst({
    where: {
      email: normalizedEmail,
    },
  })
}

export function validateRegisterBody(body: RegisterBody) {
  const errors: string[] = []

  if (!body.name || body.name.trim().length < 3) {
    errors.push('Name must be at least 3 characters long.')
  }

  if (!body.email || !body.email.includes('@')) {
    errors.push('A valid email is required.')
  }

  if (!body.whatsapp || normalizePhoneDigits(body.whatsapp).length < 10) {
    errors.push('A valid WhatsApp number is required.')
  }

  if (!body.password || body.password.length < 6) {
    errors.push('Password must be at least 6 characters long.')
  }

  return errors
}

export async function registerUser(body: RegisterBody) {
  const email = normalizeEmail(body.email || '')
  const whatsapp = normalizeWhatsApp(body.whatsapp || '')

  const existingAccount = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { whatsapp }],
    },
  })

  if (existingAccount) {
    return { error: 'An account with this email or WhatsApp number already exists' }
  }

  const user = await prisma.user.create({
    data: {
      name: body.name!.trim(),
      email,
      whatsapp,
      passwordHash: await bcrypt.hash(body.password!, BCRYPT_ROUNDS),
      role: 'user',
      avatar: body.name!.trim()[0]?.toUpperCase() || 'U',
    },
  })

  await sendVerificationOtp(user.id).catch(() => null)

  const token = jwt.sign(
    { sub: user.id, role: user.role, email: user.email } satisfies JwtPayload,
    JWT_SECRET,
    { expiresIn: '7d' },
  )

  return { user, token }
}

export async function forgotPassword(email: string) {
  const normalized = normalizeEmail(email)
  if (!normalized.includes('@')) {
    return { error: 'A valid email is required.' }
  }

  const user = await prisma.user.findUnique({ where: { email: normalized } })
  if (!user) {
    return { message: 'If an account with that email exists, a reset link has been sent.' }
  }

  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000)

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt,
    },
  })

  const resetLink = `${CLIENT_URL}/reset-password?token=${token}`

  if (resend) {
    try {
      const html = `
        <h2 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#1e293b;">Reset your password</h2>
        <p style="margin:0 0 24px;font-size:16px;color:#475569;line-height:1.6;">
          Click the link below to reset your password. This link expires in 1 hour.
        </p>
        <div style="text-align:center;margin:24px 0;">
          <a href="${resetLink}" style="display:inline-block;background:#6366f1;color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px;">
            Reset Password
          </a>
        </div>
        <p style="margin:24px 0 0;font-size:13px;color:#94a3b8;line-height:1.6;">
          If you didn't request this, you can safely ignore this email.
        </p>
      `
      const plainText = `Reset your password\n\nClick the link below to reset your password. This link expires in 1 hour.\n\n${resetLink}\n\nIf you didn't request this, you can safely ignore this email.`

      await resend.emails.send({
        from: getEmailSender(),
        to: [normalized],
        subject: 'Reset your OptiMedia password',
        html: wrapInEmailTemplate(html, 'Click the link to reset your OptiMedia password'),
        text: plainText,
        replyTo: getReplyTo(),
        headers: {
          'List-Unsubscribe': `<mailto:support@optimedia.solution.com?subject=unsubscribe>`,
        },
      })
    } catch (error) {
      console.error('Failed to send password reset email:', error)
    }
  }

  return { message: 'If an account with that email exists, a reset link has been sent.' }
}

export async function resetPassword(token: string, newPassword: string) {
  if (newPassword.length < 6) {
    return { error: 'Password must be at least 6 characters long.' }
  }

  const record = await prisma.passwordResetToken.findUnique({ where: { token } })
  if (!record) {
    return { error: 'Invalid or expired reset token.' }
  }

  if (record.usedAt) {
    return { error: 'This reset token has already been used.' }
  }

  if (new Date() > record.expiresAt) {
    return { error: 'Reset token has expired.' }
  }

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS)

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ])

  return { message: 'Password has been reset successfully.' }
}

export async function loginUser(body: LoginBody) {
  const user = await findAuthUserByIdentifier(body.identifier || '')
  if (!user) {
    return { error: 'Invalid credentials' }
  }

  const passwordMatches = await bcrypt.compare(body.password || '', user.passwordHash)
  if (!passwordMatches) {
    return { error: 'Invalid credentials' }
  }

  const token = jwt.sign(
    { sub: user.id, role: user.role, email: user.email } satisfies JwtPayload,
    JWT_SECRET,
    { expiresIn: '7d' },
  )

  return { user, token }
}
