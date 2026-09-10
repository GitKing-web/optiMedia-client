import type { Response } from 'express'
import {
  assignFamilySlot,
  cleanupExpiredSlots,
  createFamilyAccount,
  deleteFamilyAccount,
  extendFamilySlot,
  listFamilyAccounts,
  updateFamilyAccount,
  vacateFamilySlot,
} from '../services/family.service.ts'
import type { AuthenticatedRequest } from '../types.ts'

export async function listFamilyAccountsController(_req: AuthenticatedRequest, res: Response) {
  const accounts = await listFamilyAccounts()
  res.json({ accounts })
}

export async function createFamilyAccountController(req: AuthenticatedRequest, res: Response) {
  const result = await createFamilyAccount(req.body || {})
  if ('error' in result) {
    res.status(400).json({ message: result.error })
    return
  }

  res.status(201).json(result)
}

export async function updateFamilyAccountController(req: AuthenticatedRequest, res: Response) {
  const id = String(req.params.id || '')
  const result = await updateFamilyAccount(id, req.body || {})
  if ('error' in result) {
    res.status(404).json({ message: result.error })
    return
  }

  res.json(result)
}

export async function deleteFamilyAccountController(req: AuthenticatedRequest, res: Response) {
  const id = String(req.params.id || '')
  const result = await deleteFamilyAccount(id)
  if ('error' in result) {
    res.status(404).json({ message: result.error })
    return
  }

  res.json(result)
}

export async function assignFamilySlotController(req: AuthenticatedRequest, res: Response) {
  const accountId = String(req.params.id || '')
  const slotId = String(req.params.slotId || '')
  const result = await assignFamilySlot(accountId, slotId, req.body || {})
  if ('error' in result) {
    res.status(400).json({ message: result.error })
    return
  }

  res.json(result)
}

export async function vacateFamilySlotController(req: AuthenticatedRequest, res: Response) {
  const accountId = String(req.params.id || '')
  const slotId = String(req.params.slotId || '')
  const result = await vacateFamilySlot(accountId, slotId)
  if ('error' in result) {
    res.status(404).json({ message: result.error })
    return
  }

  res.json(result)
}

export async function extendFamilySlotController(req: AuthenticatedRequest, res: Response) {
  const accountId = String(req.params.id || '')
  const slotId = String(req.params.slotId || '')
  const result = await extendFamilySlot(accountId, slotId, req.body?.months)
  if ('error' in result) {
    res.status(404).json({ message: result.error })
    return
  }

  res.json(result)
}

export async function cleanupFamilySlotsController(req: AuthenticatedRequest, res: Response) {
  const accountId = String(req.params.id || '')
  res.json(await cleanupExpiredSlots(accountId))
}
