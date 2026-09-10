import { getActiveProviderName, isPaymentProvider, type PaymentProviderName } from '../settings.service.ts'
import { paystackProvider } from './paystack.provider.ts'
import { flutterwaveProvider } from './flutterwave.provider.ts'
import type { PaymentProvider } from './types.ts'

const PROVIDERS: Record<PaymentProviderName, PaymentProvider> = {
  paystack: paystackProvider,
  flutterwave: flutterwaveProvider,
}

export function getProvider(name: string): PaymentProvider {
  if (isPaymentProvider(name)) {
    return PROVIDERS[name]
  }
  return paystackProvider
}

export async function getActiveProvider(): Promise<PaymentProvider> {
  const name = await getActiveProviderName()
  return PROVIDERS[name]
}
