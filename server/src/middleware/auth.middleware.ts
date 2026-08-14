import type { NextFunction, Response } from 'express'
import * as jwt from 'jsonwebtoken'
import { AUTH_COOKIE_NAME, JWT_SECRET } from '../config.ts'
import { prisma } from '../db/prisma.ts'
import type { AuthenticatedRequest, JwtPayload } from '../types.ts'

export function getRequestAuth(req: AuthenticatedRequest) {
  const header = req.headers.authorization
  const cookieToken = req.cookies?.[AUTH_COOKIE_NAME]
  const token = header?.startsWith('Bearer ')
    ? header.slice('Bearer '.length)
    : typeof cookieToken === 'string'
      ? cookieToken
      : ''

  if (!token) {
    return null
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
    return decoded
  } catch {
    return null
  }
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const auth = getRequestAuth(req)
  if (!auth) {
    res.status(401).json({ message: 'Unauthorized' })
    return
  }

  req.auth = auth
  next()
}

export async function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.auth) {
    res.status(401).json({ message: 'Unauthorized' })
    return
  }

  const user = await prisma.user.findUnique({
    where: { id: req.auth.sub },
    select: { role: true },
  })

  if (!user || user.role !== 'admin') {
    res.status(403).json({ message: 'Admin access required' })
    return
  }

  req.auth = { ...req.auth, role: user.role }
  next()
}
