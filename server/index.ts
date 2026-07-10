import app from './src/app.ts'
import { seedDatabase } from './src/data/seed.ts'

const PORT = Number(process.env.PORT || 3000)

try {
  await seedDatabase()

  app.listen(PORT, () => {
    console.log(`server running on port ${PORT}`)
  })
} catch (error) {
  console.error(error)
  process.exit(1)
}
