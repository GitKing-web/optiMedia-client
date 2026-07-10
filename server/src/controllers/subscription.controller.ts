import type { Response } from 'express'
import { findAuthUserById } from '../services/auth.service.ts'
import {
  buildDashboard,
  findService,
  getUserSubscriptions,
  publicSubscription,
  requestSubscription,
  updateSubscriptionStatus,
} from '../services/subscription.service.ts'
import type {
  AuthenticatedRequest,
  RequestSubscriptionBody,
  UpdateSubscriptionStatusBody,
} from '../types.ts'

export async function getDashboardController(req: AuthenticatedRequest, res: Response) {
  const user = await findAuthUserById(req.auth!.sub)
  if (!user) {
    res.status(404).json({ message: 'User not found' })
    return
  }

  res.json(await buildDashboard(user))
}

export async function getSubscriptionsController(req: AuthenticatedRequest, res: Response) {
  const user = await findAuthUserById(req.auth!.sub)
  if (!user) {
    res.status(404).json({ message: 'User not found' })
    return
  }

  const subscriptions = await getUserSubscriptions(user.id)
  res.json({ subscriptions: subscriptions.map((subscription) => publicSubscription(subscription)) })
}

export async function requestSubscriptionController(
  req: AuthenticatedRequest & { body: RequestSubscriptionBody },
  res: Response,
) {
  const user = await findAuthUserById(req.auth!.sub)
  if (!user) {
    res.status(404).json({ message: 'User not found' })
    return
  }

  const serviceValue = req.body.serviceId || req.body.slug
  if (!serviceValue) {
    res.status(400).json({ message: 'serviceId or slug is required' })
    return
  }

  const service = await findService(serviceValue)
  if (!service) {
    res.status(404).json({ message: 'Service not found' })
    return
  }

  const result = await requestSubscription(user, service)
  if ('error' in result) {
    res.status(409).json({ message: result.error })
    return
  }

  res.status(201).json({
    message: `Request for ${service.name} created`,
    subscription: publicSubscription(result.subscription),
  })
}

export async function updateSubscriptionStatusController(
  req: AuthenticatedRequest & { body: UpdateSubscriptionStatusBody },
  res: Response,
) {
  const status = req.body.status
  if (!status || !['active', 'expired', 'canceled', 'pending'].includes(status)) {
    res.status(400).json({ message: 'A valid status is required' })
    return
  }

  const result = await updateSubscriptionStatus(req.params.subscriptionId, status)
  if ('error' in result) {
    res.status(404).json({ message: result.error })
    return
  }

  res.json({ subscription: publicSubscription(result.subscription) })
}
