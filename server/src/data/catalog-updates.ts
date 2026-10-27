import { prisma } from '../db/prisma.ts'

/**
 * Catalog changes that must also reach databases that were seeded before the
 * change. `seed.ts` only sets prices for brand-new services, so existing
 * deployments need an explicit update.
 */
export async function applyCatalogUpdates() {
  await prisma.service.updateMany({
    where: { slug: 'apple' },
    data: { price: 1300 },
  })
}
