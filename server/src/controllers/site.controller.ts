import type { Response } from 'express'
import * as bcrypt from 'bcrypt'
import { prisma } from '../db/prisma.ts'
import { findAuthUserById } from '../services/auth.service.ts'
import { getPublicSiteSettings, getSiteSettings, updateSiteSettings } from '../services/settings.service.ts'
import { normalizeEmail } from '../utils.ts'
import type { AuthenticatedRequest } from '../types.ts'

export async function publicSiteController(_req: unknown, res: Response) {
  res.json(await getPublicSiteSettings())
}

export async function adminSiteController(_req: AuthenticatedRequest, res: Response) {
  res.json({ settings: await getSiteSettings() })
}

export async function updateSiteController(req: AuthenticatedRequest, res: Response) {
  const result = await updateSiteSettings(req.body || {})
  if ('error' in result) {
    res.status(400).json({ message: result.error })
    return
  }
  res.json(result)
}

export async function updateAccountController(req: AuthenticatedRequest, res: Response) {
  const user = await findAuthUserById(req.auth!.sub)
  if (!user) {
    res.status(404).json({ message: 'User not found' })
    return
  }

  const { currentPassword, email, password } = req.body || {}
  if (typeof currentPassword !== 'string' || !currentPassword) {
    res.status(400).json({ message: 'Current password is required to make changes' })
    return
  }

  const passwordMatches = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!passwordMatches) {
    res.status(400).json({ message: 'Current password is incorrect' })
    return
  }

  const data: Record<string, unknown> = {}

  if (typeof email === 'string' && email.trim()) {
    const normalized = normalizeEmail(email)
    const clash = await prisma.user.findUnique({ where: { email: normalized } })
    if (clash && clash.id !== user.id) {
      res.status(400).json({ message: 'That email is already in use' })
      return
    }
    if (normalized !== user.email) {
      data.email = normalized
      data.emailVerified = false
    }
  }

  if (typeof password === 'string' && password) {
    if (password.length < 6) {
      res.status(400).json({ message: 'New password must be at least 6 characters' })
      return
    }
    data.passwordHash = await bcrypt.hash(password, 10)
  }

  if (Object.keys(data).length === 0) {
    res.status(400).json({ message: 'Nothing to update' })
    return
  }

  await prisma.user.update({ where: { id: user.id }, data })

  res.json({
    message: 'Account updated successfully',
    emailChanged: Boolean(data.email),
  })
}
