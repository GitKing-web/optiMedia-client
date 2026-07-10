import type { Request, Response } from 'express'
import { findService, getAllServices } from '../services/subscription.service.ts'

export async function getServicesController(_req: Request, res: Response) {
  res.json({ services: await getAllServices() })
}

export async function getServiceController(req: Request, res: Response) {
  const service = await findService(req.params.slug)
  if (!service) {
    res.status(404).json({ message: 'Service not found' })
    return
  }

  res.json({ service })
}
