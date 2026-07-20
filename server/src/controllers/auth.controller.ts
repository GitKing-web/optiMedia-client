import type { Request, Response } from 'express'
import {
  findAuthUserById,
  forgotPassword,
  loginUser,
  publicUser,
  registerUser,
  resetPassword,
  validateRegisterBody,
} from '../services/auth.service.ts'
import { buildDashboard } from '../services/subscription.service.ts'
import type { AuthenticatedRequest, LoginBody, RegisterBody } from '../types.ts'

export async function registerController(req: Request & { body: RegisterBody }, res: Response) {
  const validationErrors = validateRegisterBody(req.body)
  if (validationErrors.length > 0) {
    res.status(400).json({
      message: 'Registration validation failed',
      details: validationErrors,
    })
    return
  }

  const result = await registerUser(req.body)
  if ('error' in result) {
    res.status(409).json({ message: result.error })
    return
  }

  res.status(201).json({
    token: result.token,
    user: publicUser(result.user),
  })
}

export async function loginController(req: Request & { body: LoginBody }, res: Response) {
  const body = req.body
  if (!body.identifier || !body.password) {
    res.status(400).json({ message: 'Identifier and password are required' })
    return
  }

  const result = await loginUser(body)
  if ('error' in result) {
    res.status(401).json({ message: result.error })
    return
  }

  res.json({
    token: result.token,
    user: publicUser(result.user),
  })
}

export async function meController(req: AuthenticatedRequest, res: Response) {
  const user = await findAuthUserById(req.auth!.sub)
  if (!user) {
    res.status(404).json({ message: 'User not found' })
    return
  }

  res.json({
    user: publicUser(user),
    dashboard: await buildDashboard(user),
  })
}

export async function forgotPasswordController(req: Request, res: Response) {
  const { email } = req.body
  if (!email) {
    res.status(400).json({ message: 'Email is required.' })
    return
  }

  const result = await forgotPassword(email)
  if ('error' in result) {
    res.status(400).json({ message: result.error })
    return
  }

  res.json(result)
}

export function logoutController(_req: AuthenticatedRequest, res: Response) {
  res.json({ message: 'Logged out successfully.' })
}

export async function resetPasswordController(req: Request, res: Response) {
  const { token, password } = req.body
  if (!token || !password) {
    res.status(400).json({ message: 'Token and password are required.' })
    return
  }

  const result = await resetPassword(token, password)
  if ('error' in result) {
    res.status(400).json({ message: result.error })
    return
  }

  res.json(result)
}
