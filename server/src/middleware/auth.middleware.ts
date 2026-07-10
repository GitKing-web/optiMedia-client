import type { NextFunction, Response } from 'express'
import * as jwt from 'jsonwebtoken'
import type { AuthenticatedRequest, JwtPayload } from '../types.ts'

const JWT_SECRET = process.env.JWT_SECRET || '';

export function getRequestAuth(req: AuthenticatedRequest) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return null
  }

  try {
    const token = header.slice('Bearer '.length)
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

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (req.auth?.role !== 'admin') {
    res.status(403).json({ message: 'Admin access required' })
    return
  }

  next()
}
