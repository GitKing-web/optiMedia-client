import { Router } from 'express'
import {
  assignFamilySlotController,
  bulkAssignFamilySlotsController,
  cleanupFamilySlotsController,
  createFamilyAccountController,
  deleteFamilyAccountController,
  extendFamilySlotController,
  listFamilyAccountsController,
  searchFamilyMembersController,
  updateFamilyAccountController,
  vacateFamilySlotController,
} from '../controllers/family.controller.ts'
import { requireAdmin, requireAuth } from '../middleware/auth.middleware.ts'

const router = Router()

router.use(requireAuth, requireAdmin)

router.get('/', listFamilyAccountsController)
router.get('/members', searchFamilyMembersController)
router.post('/', createFamilyAccountController)
router.patch('/:id', updateFamilyAccountController)
router.delete('/:id', deleteFamilyAccountController)
router.post('/:id/cleanup', cleanupFamilySlotsController)
router.post('/:id/slots/bulk', bulkAssignFamilySlotsController)
router.post('/:id/slots/:slotId', assignFamilySlotController)
router.post('/:id/slots/:slotId/extend', extendFamilySlotController)
router.delete('/:id/slots/:slotId', vacateFamilySlotController)

export default router
