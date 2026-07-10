import { Router } from 'express'
import { initializePaystackController, verifyPaystackController } from '../controllers/payment.controller.ts'
import { requireAuth } from '../middleware/auth.middleware.ts'

const router = Router()

router.post('/payments/paystack/initialize', requireAuth, initializePaystackController)
router.get('/payments/paystack/verify/:reference', requireAuth, verifyPaystackController)

export default router
