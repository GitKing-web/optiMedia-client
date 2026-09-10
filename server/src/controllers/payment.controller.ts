import type { Response } from 'express'
import { findAuthUserById } from '../services/auth.service.ts'
import { findService } from '../services/subscription.service.ts'
import { createCheckout, verifyCheckout, handleWebhook } from '../services/payment.service.ts'
import type { AuthenticatedRequest, RawBodyRequest } from '../types.ts'

function headerRecord(req: RawBodyRequest): Record<string, string | undefined> {
  const headers: Record<string, string | undefined> = {}
  for (const [key, value] of Object.entries(req.headers)) {
    headers[key.toLowerCase()] = Array.isArray(value) ? value[0] : value
  }
  return headers
}

export async function initializePaymentController(req: AuthenticatedRequest, res: Response) {
  const user = await findAuthUserById(req.auth!.sub)
  if (!user) {
    res.status(404).json({ message: 'User not found' })
    return
  }

  const serviceValue = req.body?.serviceId || req.body?.slug
  if (!serviceValue) {
    res.status(400).json({ message: 'serviceId or slug is required' })
    return
  }

  const service = await findService(serviceValue)
  if (!service) {
    res.status(404).json({ message: 'Service not found' })
    return
  }

  const months = req.body?.months
  const couponCode = req.body?.couponCode

  try {
    const result = await createCheckout(user, service, months, couponCode)
    if ('error' in result && result.error) {
      res.status(400).json({ message: result.error })
      return
    }
    res.json(result)
  } catch (error) {
    res.status(502).json({
      message: error instanceof Error ? error.message : 'Unable to initialize checkout',
    })
  }
}

export async function verifyPaymentController(req: AuthenticatedRequest, res: Response) {
  const user = await findAuthUserById(req.auth!.sub)
  if (!user) {
    res.status(404).json({ message: 'User not found' })
    return
  }

  const rawReference = (req.params.reference ?? '').toString().split(',')[0].trim()
  const reference = rawReference.replace(/[^A-Za-z0-9_.\-]/g, '')
  if (!reference) {
    res.status(400).json({ message: 'reference is required' })
    return
  }

  try {
    const result = await verifyCheckout(user, reference)
    if ('error' in result && result.error) {
      res.status(400).json({ message: result.error })
      return
    }

    const payment = 'payment' in result ? result.payment : null
    const subscription = 'subscription' in result ? result.subscription : null

    res.json({
      message: 'message' in result ? result.message : 'Payment verified',
      payment: payment
        ? {
            reference: payment.reference,
            status: payment.status,
            amount: payment.amount,
          }
        : null,
      subscription: subscription
        ? {
            ...subscription,
            service: subscription.service
              ? {
                  ...subscription.service,
                }
              : null,
          }
        : null,
    })
  } catch (error) {
    res.status(502).json({
      message: error instanceof Error ? error.message : 'Unable to verify payment',
    })
  }
}

async function processWebhook(providerName: string, req: RawBodyRequest, res: Response) {
  // Prefer the exact raw bytes captured by the JSON body parser; signatures are
  // computed over the raw payload, never a re-serialized object.
  const rawBody: string | Buffer =
    req.rawBody ?? (typeof req.body === 'string' ? req.body : JSON.stringify(req.body))

  try {
    const result = await handleWebhook(providerName, rawBody, headerRecord(req))

    if ('error' in result && result.error) {
      res.status(400).json({ message: result.error })
      return
    }

    res.status(200).json(result)
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Unable to process webhook',
    })
  }
}

export function paystackWebhookController(req: RawBodyRequest, res: Response) {
  return processWebhook('paystack', req, res)
}

export function flutterwaveWebhookController(req: RawBodyRequest, res: Response) {
  return processWebhook('flutterwave', req, res)
}
