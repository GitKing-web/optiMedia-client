import { prisma } from '../db/prisma.ts'
import { decryptSecret, encryptSecret, maskSecret } from '../utils/crypto.ts'

export type PaymentProviderName = 'paystack' | 'flutterwave'

export const PAYMENT_PROVIDERS: PaymentProviderName[] = ['paystack', 'flutterwave']

const KEYS = {
  provider: 'payment_provider',
  paystackPublicKey: 'paystack_public_key',
  paystackSecretKey: 'paystack_secret_key',
  flutterwavePublicKey: 'flutterwave_public_key',
  flutterwaveSecretKey: 'flutterwave_secret_key',
  flutterwaveSecretHash: 'flutterwave_secret_hash',
  siteName: 'site_name',
  siteBanner: 'site_banner',
  platformFee: 'platform_fee',
} as const

const SECRET_KEYS = new Set<string>([
  KEYS.paystackSecretKey,
  KEYS.flutterwaveSecretKey,
  KEYS.flutterwaveSecretHash,
])

const ENV_FALLBACK: Record<string, string> = {
  [KEYS.provider]: process.env.PAYMENT_PROVIDER || 'paystack',
  [KEYS.paystackPublicKey]: process.env.PAYSTACK_PUBLIC_KEY || '',
  [KEYS.paystackSecretKey]: process.env.PAYSTACK_SECRET_KEY || '',
  [KEYS.flutterwavePublicKey]: process.env.FLUTTERWAVE_PUBLIC_KEY || '',
  [KEYS.flutterwaveSecretKey]: process.env.FLUTTERWAVE_SECRET_KEY || '',
  [KEYS.flutterwaveSecretHash]: process.env.FLUTTERWAVE_SECRET_HASH || '',
  [KEYS.siteName]: process.env.SITE_NAME || 'OptiMedia',
  [KEYS.siteBanner]: process.env.SITE_BANNER || '',
  [KEYS.platformFee]: process.env.PLATFORM_FEE || '0',
}

async function readValue(key: string): Promise<string> {
  const row = await prisma.platformSetting.findUnique({ where: { key } })
  const stored = row?.value
  if (stored === undefined || stored === null || stored === '') {
    return ENV_FALLBACK[key] ?? ''
  }
  return SECRET_KEYS.has(key) ? decryptSecret(stored) : stored
}

export function isPaymentProvider(value: unknown): value is PaymentProviderName {
  return value === 'paystack' || value === 'flutterwave'
}

export async function getActiveProviderName(): Promise<PaymentProviderName> {
  const value = await readValue(KEYS.provider)
  return isPaymentProvider(value) ? value : 'paystack'
}

export interface PaystackCredentials {
  publicKey: string
  secretKey: string
}

export interface FlutterwaveCredentials {
  publicKey: string
  secretKey: string
  secretHash: string
}

export async function getPaystackCredentials(): Promise<PaystackCredentials> {
  const [publicKey, secretKey] = await Promise.all([
    readValue(KEYS.paystackPublicKey),
    readValue(KEYS.paystackSecretKey),
  ])
  return { publicKey, secretKey }
}

export async function getFlutterwaveCredentials(): Promise<FlutterwaveCredentials> {
  const [publicKey, secretKey, secretHash] = await Promise.all([
    readValue(KEYS.flutterwavePublicKey),
    readValue(KEYS.flutterwaveSecretKey),
    readValue(KEYS.flutterwaveSecretHash),
  ])
  return { publicKey, secretKey, secretHash }
}

export interface PaymentSettingsView {
  provider: PaymentProviderName
  paystack: { publicKey: string; secretKeySet: boolean; secretKeyMasked: string }
  flutterwave: {
    publicKey: string
    secretKeySet: boolean
    secretKeyMasked: string
    secretHashSet: boolean
    secretHashMasked: string
  }
}

export async function getPaymentSettingsView(): Promise<PaymentSettingsView> {
  const [provider, paystack, flutterwave] = await Promise.all([
    getActiveProviderName(),
    getPaystackCredentials(),
    getFlutterwaveCredentials(),
  ])

  return {
    provider,
    paystack: {
      publicKey: paystack.publicKey,
      secretKeySet: Boolean(paystack.secretKey),
      secretKeyMasked: maskSecret(paystack.secretKey),
    },
    flutterwave: {
      publicKey: flutterwave.publicKey,
      secretKeySet: Boolean(flutterwave.secretKey),
      secretKeyMasked: maskSecret(flutterwave.secretKey),
      secretHashSet: Boolean(flutterwave.secretHash),
      secretHashMasked: maskSecret(flutterwave.secretHash),
    },
  }
}

export interface UpdatePaymentSettingsInput {
  provider?: string
  paystackPublicKey?: string
  paystackSecretKey?: string
  flutterwavePublicKey?: string
  flutterwaveSecretKey?: string
  flutterwaveSecretHash?: string
}

async function upsertSetting(key: string, value: string) {
  const stored = SECRET_KEYS.has(key) ? encryptSecret(value) : value
  await prisma.platformSetting.upsert({
    where: { key },
    create: { key, value: stored },
    update: { value: stored },
  })
}

export async function updatePaymentSettings(input: UpdatePaymentSettingsInput) {
  if (input.provider !== undefined) {
    if (!isPaymentProvider(input.provider)) {
      return { error: 'Invalid payment provider' }
    }
    await upsertSetting(KEYS.provider, input.provider)
  }

  const assignments: [string, string | undefined][] = [
    [KEYS.paystackPublicKey, input.paystackPublicKey],
    [KEYS.paystackSecretKey, input.paystackSecretKey],
    [KEYS.flutterwavePublicKey, input.flutterwavePublicKey],
    [KEYS.flutterwaveSecretKey, input.flutterwaveSecretKey],
    [KEYS.flutterwaveSecretHash, input.flutterwaveSecretHash],
  ]

  for (const [key, value] of assignments) {
    if (typeof value === 'string' && value.trim() !== '') {
      await upsertSetting(key, value.trim())
    }
  }

  return { settings: await getPaymentSettingsView() }
}

export interface SiteSettings {
  siteName: string
  siteBanner: string
  platformFee: number
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const [siteName, siteBanner, platformFee] = await Promise.all([
    readValue(KEYS.siteName),
    readValue(KEYS.siteBanner),
    readValue(KEYS.platformFee),
  ])

  return {
    siteName: siteName || 'OptiMedia',
    siteBanner,
    platformFee: Math.max(0, Math.floor(Number(platformFee) || 0)),
  }
}

export async function getPublicSiteSettings() {
  const { siteName, siteBanner, platformFee } = await getSiteSettings()
  return { siteName, siteBanner, platformFee }
}

export async function getPlatformFee(): Promise<number> {
  return (await getSiteSettings()).platformFee
}

export interface UpdateSiteSettingsInput {
  siteName?: string
  siteBanner?: string | null
  platformFee?: number
}

export async function updateSiteSettings(input: UpdateSiteSettingsInput) {
  if (typeof input.siteName === 'string' && input.siteName.trim()) {
    await upsertSetting(KEYS.siteName, input.siteName.trim().slice(0, 80))
  }

  if (input.siteBanner !== undefined) {
    const banner = (input.siteBanner || '').trim()
    if (banner.length > 900_000) {
      return { error: 'Banner image is too large. Please use a smaller image or a URL.' }
    }
    await upsertSetting(KEYS.siteBanner, banner)
  }

  if (input.platformFee !== undefined) {
    const fee = Number(input.platformFee)
    if (!Number.isFinite(fee) || fee < 0) {
      return { error: 'Platform fee must be a non-negative number' }
    }
    await upsertSetting(KEYS.platformFee, String(Math.floor(fee)))
  }

  return { settings: await getSiteSettings() }
}
