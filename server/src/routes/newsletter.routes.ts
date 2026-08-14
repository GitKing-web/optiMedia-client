import { Router } from 'express'
import {
  listNewsletterSubscribersController,
  removeNewsletterSubscriberController,
  subscribeNewsletterController,
} from '../controllers/newsletter.controller.ts'
import { requireAdmin, requireAuth } from '../middleware/auth.middleware.ts'

const router = Router()

router.post('/newsletter/subscribe', subscribeNewsletterController)
router.get('/newsletter/subscribers', requireAuth, requireAdmin, listNewsletterSubscribersController)
router.delete('/newsletter/subscribers/:id', requireAuth, requireAdmin, removeNewsletterSubscriberController)

export default router
