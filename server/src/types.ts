import type { Request } from 'express'

export type Role = 'user' | 'admin'
export type SubscriptionStatus = 'active' | 'expired' | 'canceled' | 'pending'
export type AdminStatus = 'active' | 'pending' | 'none'
export type ActivityStatus = 'Completed' | 'Pending'

export interface AuthUser {
  id: string
  name: string
  email: string
  whatsapp: string
  passwordHash: string
  role: Role
  avatar?: string
}

export interface Service {
  id: string
  slug: string
  name: string
  price: number
  icon: string
  bg: string
  description: string
  features: string[]
}

export interface Subscription {
  id: string
  userId: string
  serviceId: string
  status: SubscriptionStatus
  price: number
  icon: string
  bg: string
  activeDate?: string
  durationDays?: number
  nextBilling?: string
  createdAt: string
  updatedAt: string
}

export interface AdminRow {
  userId: string
  userName: string
  userEmail: string
  whatsappContact: string
  serviceName: string
  status: AdminStatus
  price: number
  icon: string
  startDate?: string
  expireDate?: string
  authUserId?: string
}

export interface Activity {
  id: string
  userId: string
  type: 'payment' | 'subscription'
  service: string
  amount: string
  status: ActivityStatus
  date: string
  icon: string
}

export interface JwtPayload {
  sub: string
  role: Role
  email: string
}

export interface AuthenticatedRequest extends Request {
  auth?: JwtPayload
}

export interface RawBodyRequest extends Request {
  rawBody?: Buffer
}

export interface RegisterBody {
  name?: string
  email?: string
  whatsapp?: string
  password?: string
}

export interface LoginBody {
  identifier?: string
  password?: string
}

export interface RequestSubscriptionBody {
  serviceId?: string
  slug?: string
}

export interface UpdateSubscriptionStatusBody {
  status?: SubscriptionStatus
}

export interface ApiError {
  message: string
  details?: string[]
}
