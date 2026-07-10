import type { Response } from 'express'
import { activateAdminUser, buildAdminSummary, filterAdminUsers, findAdminUser } from '../services/admin.service.ts'
import type { AuthenticatedRequest } from '../types.ts'

export async function adminStatsController(_req: AuthenticatedRequest, res: Response) {
  res.json(await buildAdminSummary())
}

export async function adminUsersController(req: AuthenticatedRequest, res: Response) {
  const tab = String(req.query.tab || 'all')
  res.json({
    summary: await buildAdminSummary(),
    users: await filterAdminUsers(tab),
  })
}

export async function adminUserController(req: AuthenticatedRequest, res: Response) {
  const user = await findAdminUser(req.params.userId)
  if (!user) {
    res.status(404).json({ message: 'User row not found' })
    return
  }

  res.json({ user })
}

export async function activateAdminUserController(req: AuthenticatedRequest, res: Response) {
  const result = await activateAdminUser(req.params.userId)
  if ('error' in result) {
    const status = result.error === 'User row not found' ? 404 : 400
    res.status(status).json({ message: result.error })
    return
  }

  res.json({
    message: `${result.row.userName} has been activated`,
    row: result.row,
  })
}
