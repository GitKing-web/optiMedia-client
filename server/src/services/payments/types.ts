export type ProviderName = 'paystack' | 'flutterwave'

export type NormalizedStatus = 'success' | 'failed' | 'abandoned' | 'pending'

export interface InitializeParams {
  email: string
  name?: string
  amount: number
  currency: string
  reference: string
  callbackUrl: string
  metadata: Record<string, unknown>
}

export interface InitializeResult {
  authorizationUrl: string
  accessCode?: string
  providerReference?: string
}

export interface VerifyResult {
  status: NormalizedStatus
  amount: number
  currency?: string
  paidAt?: string | null
  raw: unknown
}

export type WebhookResult =
  | { ignored: true }
  | { error: string }
  | { reference: string; transaction: VerifyResult }

export interface PaymentProvider {
  name: ProviderName
  initialize(params: InitializeParams): Promise<InitializeResult>
  verify(reference: string): Promise<VerifyResult>
  parseWebhook(rawBody: string, headers: Record<string, string | undefined>): Promise<WebhookResult>
}
