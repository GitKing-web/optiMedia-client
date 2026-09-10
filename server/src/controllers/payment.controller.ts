import type { Response } from 'express'
import { findAuthUserById } from '../services/auth.service.ts'
import { findService } from '../services/subscription.service.ts'
import { createPaystackCheckout, verifyPaystackCheckout, handlePaystackWebhook } from '../services/payment.service.ts'
import type { AuthenticatedRequest, RawBodyRequest } from '../types.ts'

export async function initializePaystackController(req: AuthenticatedRequest, res: Response) {
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

  try {
    const result = await createPaystackCheckout(user, service, months)
    res.json(result)
  } catch (error) {
    res.status(502).json({
      message: error instanceof Error ? error.message : 'Unable to initialize Paystack checkout',
    })
  }
}

export async function verifyPaystackController(req: AuthenticatedRequest, res: Response) {
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
    const result = await verifyPaystackCheckout(user, reference)
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
      message: error instanceof Error ? error.message : 'Unable to verify Paystack payment',
    })
  }
}

export async function paystackWebhookController(req: RawBodyRequest, res: Response) {
  const signature = req.get('x-paystack-signature') || null
  const rawBody = req.rawBody || req.body

  try {
    const result = await handlePaystackWebhook(typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody), signature)

    if ('error' in result && result.error) {
      res.status(400).json({ message: result.error })
      return
    }

    res.status(200).json(result)
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Unable to process Paystack webhook',
    })
  }
}

