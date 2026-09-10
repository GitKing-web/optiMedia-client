import type { Request, Response } from 'express'
import {
  listNewsletterSubscribers,
  removeNewsletterSubscriber,
  subscribeToNewsletter,
} from '../services/newsletter.service.ts'

export async function subscribeNewsletterController(req: Request, res: Response) {
  const email = typeof req.body?.email === 'string' ? req.body.email : ''
  if (!email) {
    res.status(400).json({ message: 'Email is required.' })
    return
  }

  const result = await subscribeToNewsletter(email)
  if ('error' in result) {
    res.status(400).json({ message: result.error })
    return
  }

  res.status(201).json(result)
}

export async function listNewsletterSubscribersController(req: Request, res: Response) {
  const result = await listNewsletterSubscribers({
    search: String(req.query.search || ''),
    page: req.query.page,
    pageSize: req.query.pageSize,
  })
  res.json(result)
}

export async function removeNewsletterSubscriberController(req: Request, res: Response) {
  const id = String(req.params.id || '')
  if (!id) {
    res.status(400).json({ message: 'Subscriber id is required.' })
    return
  }

  try {
    const result = await removeNewsletterSubscriber(id)
    res.json(result)
  } catch {
    res.status(404).json({ message: 'Subscriber not found.' })
  }
}
