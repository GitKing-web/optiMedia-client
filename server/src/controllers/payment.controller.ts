import type { Response } from 'express'
import { findAuthUserById } from '../services/auth.service.ts'
import { findService } from '../services/subscription.service.ts'
import { createPaystackCheckout, verifyPaystackCheckout } from '../services/payment.service.ts'
import type { AuthenticatedRequest } from '../types.ts'

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

  try {
    const result = await createPaystackCheckout(user, service)
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

  const reference = req.params.reference
  if (!reference) {
    res.status(400).json({ message: 'reference is required' })
    return
  }

  try {
    const result = await verifyPaystackCheckout(user, reference)
    if ('error' in result) {
      res.status(400).json({ message: result.error })
      return
    }

    res.json({
      message: result.message,
      payment: {
        reference: result.payment.reference,
        status: result.payment.status,
        amount: result.payment.amount,
      },
      subscription: result.subscription
        ? {
            ...result.subscription,
            service: result.subscription.service
              ? {
                  ...result.subscription.service,
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

