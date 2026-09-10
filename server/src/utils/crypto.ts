import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto'
import { JWT_SECRET } from '../config.ts'

const ALGORITHM = 'aes-256-gcm'
const PREFIX = 'v1'
const KEY = scryptSync(JWT_SECRET, 'optimedia-platform-settings', 32)

export function encryptSecret(plain: string): string {
  if (!plain || isEncrypted(plain)) return plain

  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGORITHM, KEY, iv)
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()

  return [PREFIX, iv.toString('base64'), tag.toString('base64'), encrypted.toString('base64')].join(':')
}

export function decryptSecret(stored: string): string {
  if (!stored || !isEncrypted(stored)) return stored

  try {
    const [, ivB64, tagB64, dataB64] = stored.split(':')
    const decipher = createDecipheriv(ALGORITHM, KEY, Buffer.from(ivB64, 'base64'))
    decipher.setAuthTag(Buffer.from(tagB64, 'base64'))
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(dataB64, 'base64')),
      decipher.final(),
    ])
    return decrypted.toString('utf8')
  } catch {
    return ''
  }
}

function isEncrypted(value: string) {
  return value.startsWith(`${PREFIX}:`)
}

export function maskSecret(value: string): string {
  if (!value) return ''
  if (value.length <= 8) return '••••'
  return `${value.slice(0, 6)}••••${value.slice(-4)}`
}
