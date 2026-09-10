import type { Response } from 'express'
import { AUTH_COOKIE_NAME, getCookieSameSite, isCookieSecure } from '../config.ts'

export interface CookieOptions {
  maxAge?: number
  path?: string
}

export function buildCookieOptions(opts: CookieOptions = {}) {
  const sameSite = getCookieSameSite()
  const secure = sameSite === 'none' ? true : isCookieSecure()

  return {
    httpOnly: true,
    secure,
    sameSite,
    path: opts.path || '/',
    maxAge: opts.maxAge ?? 7 * 24 * 60 * 60 * 1000,
  }
}

export function setAuthCookie(res: Response, token: string, opts: CookieOptions = {}) {
  res.cookie(AUTH_COOKIE_NAME, token, buildCookieOptions(opts))
}

export function clearAuthCookie(res: Response) {
  const sameSite = getCookieSameSite()
  const secure = sameSite === 'none' ? true : isCookieSecure()

  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    secure,
    sameSite,
    path: '/',
  })
}
