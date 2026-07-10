import * as bcrypt from 'bcrypt'
import * as jwt from 'jsonwebtoken'
import { prisma } from '../db/prisma.ts'
import { normalizeEmail, normalizePhoneDigits, normalizeWhatsApp } from '../utils.ts'
import type { AuthUser, JwtPayload, LoginBody, RegisterBody } from '../types.ts'

const JWT_SECRET = process.env.JWT_SECRET || ''
const BCRYPT_ROUNDS = 10

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
