import { prisma } from '../db/prisma.ts'
import { encryptSecret, maskSecret, tryDecryptSecret } from '../utils/crypto.ts'

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

export type SettingSource = 'database' | 'environment' | 'undecryptable' | 'none'

/**
 * Reads a setting, reporting where the effective value came from. This makes it
 * obvious in the admin UI whether a saved key is actually persisted in the
 * database, only supplied by the environment, or unusable (e.g. JWT_SECRET
 * changed after it was encrypted).
 */
async function readValueWithSource(key: string): Promise<{ value: string; source: SettingSource }> {
  let row: { value: string } | null = null
  try {
    row = await prisma.platformSetting.findUnique({ where: { key } })
  } catch (error) {
    console.error('[settings] failed to read setting from database:', key, error)
    const envValue = ENV_FALLBACK[key] ?? ''
    return { value: envValue, source: envValue ? 'environment' : 'none' }
  }

  const stored = row?.value
  if (stored === undefined || stored === null || stored === '') {
    const envValue = ENV_FALLBACK[key] ?? ''
    return { value: envValue, source: envValue ? 'environment' : 'none' }
  }

  if (SECRET_KEYS.has(key)) {
    const result = tryDecryptSecret(stored)
    if (!result.ok) {
      console.error(`[settings] stored secret for "${key}" could not be decrypted (JWT_SECRET changed?)`)
      return { value: '', source: 'undecryptable' }
    }
    return { value: result.value, source: 'database' }
  }

  return { value: stored, source: 'database' }
}

async function readValue(key: string): Promise<string> {
  return (await readValueWithSource(key)).value
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
  providerSource: SettingSource
  paystack: {
    publicKey: string
    secretKeySet: boolean
    secretKeyMasked: string
    secretKeySource: SettingSource
  }
  flutterwave: {
    publicKey: string
    secretKeySet: boolean
    secretKeyMasked: string
    secretKeySource: SettingSource
    secretHashSet: boolean
    secretHashMasked: string
    secretHashSource: SettingSource
  }
}

export async function getPaymentSettingsView(): Promise<PaymentSettingsView> {
  const [provider, paystackPublicKey, paystackSecret, flutterwavePublicKey, flutterwaveSecret, flutterwaveHash] =
    await Promise.all([
      readValueWithSource(KEYS.provider),
      readValueWithSource(KEYS.paystackPublicKey),
      readValueWithSource(KEYS.paystackSecretKey),
      readValueWithSource(KEYS.flutterwavePublicKey),
      readValueWithSource(KEYS.flutterwaveSecretKey),
      readValueWithSource(KEYS.flutterwaveSecretHash),
    ])

  const providerName = isPaymentProvider(provider.value) ? provider.value : 'paystack'

  return {
    provider: providerName,
    providerSource: provider.source,
    paystack: {
      publicKey: paystackPublicKey.value,
      secretKeySet: Boolean(paystackSecret.value),
      secretKeyMasked: maskSecret(paystackSecret.value),
      secretKeySource: paystackSecret.source,
    },
    flutterwave: {
      publicKey: flutterwavePublicKey.value,
      secretKeySet: Boolean(flutterwaveSecret.value),
      secretKeyMasked: maskSecret(flutterwaveSecret.value),
      secretKeySource: flutterwaveSecret.source,
      secretHashSet: Boolean(flutterwaveHash.value),
      secretHashMasked: maskSecret(flutterwaveHash.value),
      secretHashSource: flutterwaveHash.source,
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

  const updatedKeys: string[] = []

  for (const [key, value] of assignments) {
    if (typeof value === 'string' && value.trim() !== '') {
      await upsertSetting(key, value.trim())
      updatedKeys.push(key)
    }
  }

  console.log('[settings] payment settings updated', {
    provider: input.provider ?? '(unchanged)',
    keys: updatedKeys,
  })

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
