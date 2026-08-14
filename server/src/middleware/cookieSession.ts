import type { Response } from 'express'
import { AUTH_COOKIE_NAME, isProduction } from '../config.ts'

export interface CookieOptions {
  maxAge?: number
  path?: string
}

export function buildCookieOptions(opts: CookieOptions = {}) {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? ('lax' as const) : ('lax' as const),
    path: opts.path || '/',
    maxAge: opts.maxAge ?? 7 * 24 * 60 * 60 * 1000,
  }
}

export function setAuthCookie(res: Response, token: string, opts: CookieOptions = {}) {
  res.cookie(AUTH_COOKIE_NAME, token, buildCookieOptions(opts))
}

export function clearAuthCookie(res: Response) {
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? ('lax' as const) : ('lax' as const),
    path: '/',
  })
}
