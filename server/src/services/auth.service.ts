import * as bcrypt from 'bcrypt'
import * as jwt from 'jsonwebtoken'
import { randomBytes } from 'node:crypto'
import { Resend } from 'resend'
import { prisma } from '../db/prisma.ts'
import { normalizeEmail, normalizePhoneDigits, normalizeWhatsApp } from '../utils.ts'
import type { AuthUser, JwtPayload, LoginBody, RegisterBody } from '../types.ts'

const JWT_SECRET = process.env.JWT_SECRET || ''
const BCRYPT_ROUNDS = 10
const RESET_TOKEN_EXPIRY_HOURS = 1
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3001'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export function publicUser(user: AuthUser) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    whatsapp: user.whatsapp,
    role: user.role,
    avatar: user.avatar,
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
    await resend.emails.send({
      from: 'OptiMedia <noreply@optimedia.local>',
      to: normalized,
      subject: 'Reset your OptiMedia password',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
          <h2 style="color:#1e293b;">Reset your password</h2>
          <p style="color:#475569;">Click the link below to reset your password. This link expires in 1 hour.</p>
          <a href="${resetLink}" style="display:inline-block;background:#6366f1;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;margin:16px 0;">
            Reset Password
          </a>
          <p style="color:#94a3b8;font-size:12px;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    })
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
