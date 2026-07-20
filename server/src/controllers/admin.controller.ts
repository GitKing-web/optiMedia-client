import type { Request, Response } from 'express'
import {
  activateAdminUser,
  buildAdminSummary,
  bulkActivateUsers,
  exportUsersCSV,
  filterAdminUsers,
  findAdminUser,
  getRevenueStats,
  getSubscriptionLogs,
  getUserDetail,
  sendEmailBroadcast,
} from '../services/admin.service.ts'
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

export async function adminUserDetailController(req: AuthenticatedRequest, res: Response) {
  const detail = await getUserDetail(req.params.userId)
  if (!detail) {
    res.status(404).json({ message: 'User not found' })
    return
  }

  res.json({ user: detail })
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

export async function bulkActivateController(req: AuthenticatedRequest, res: Response) {
  const { userIds } = req.body
  if (!Array.isArray(userIds) || userIds.length === 0) {
    res.status(400).json({ message: 'userIds array is required' })
    return
  }

  const results = await bulkActivateUsers(userIds)
  const succeeded = results.filter((r) => r.success).length
  res.json({ message: `${succeeded} of ${userIds.length} activated`, results })
}

export async function revenueStatsController(_req: AuthenticatedRequest, res: Response) {
  res.json(await getRevenueStats())
}

export async function subscriptionLogsController(_req: AuthenticatedRequest, res: Response) {
  res.json({ logs: await getSubscriptionLogs() })
}

export async function exportCSVController(_req: AuthenticatedRequest, res: Response) {
  const csv = await exportUsersCSV()
  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', 'attachment; filename="optimedia-users.csv"')
  res.send(csv)
}

export async function sendEmailController(req: AuthenticatedRequest, res: Response) {
  const { subject, html, userIds } = req.body
  if (!subject || !html) {
    res.status(400).json({ message: 'subject and html are required' })
    return
  }

  const result = await sendEmailBroadcast({ subject, html, userIds })
  if ('error' in result) {
    res.status(400).json({ message: result.error })
    return
  }

  res.json(result)
}
