import { Router } from 'express'
import { getServiceController, getServicesController } from '../controllers/catalog.controller.ts'

const router = Router()

router.get('/services', getServicesController)
router.get('/services/:slug', getServiceController)

export default router
