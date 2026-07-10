import express, { type NextFunction, type Request, type Response } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.routes.ts'
import catalogRoutes from './routes/catalog.routes.ts'
import subscriptionRoutes from './routes/subscription.routes.ts'
import adminRoutes from './routes/admin.routes.ts'

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  })
})

app.use('/api', catalogRoutes)
app.use('/api/auth', authRoutes)
app.use('/api', subscriptionRoutes)
app.use('/api/admin', adminRoutes)

app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' })
})

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err)
  res.status(500).json({ message: 'Internal server error' })
})

export default app
