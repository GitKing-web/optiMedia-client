export const JWT_SECRET: string = (() => {
  const value = process.env.JWT_SECRET || ''
  if (!value || value.length < 16) {
    throw new Error(
      'JWT_SECRET must be set to a strong value (at least 16 characters long) in server/.env',
    )
  }
  return value
})()

export const NODE_ENV = process.env.NODE_ENV || 'development'

export const isProduction = NODE_ENV === 'production'

export const AUTH_COOKIE_NAME = 'optimedia_token'

export function getClientUrl() {
  return process.env.CLIENT_URL || 'http://localhost:3001'
}
