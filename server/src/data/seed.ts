import * as bcrypt from 'bcrypt'
import { prisma } from '../db/prisma.ts'
import { addDays } from '../utils.ts'

const BCRYPT_ROUNDS = 10

export async function seedDatabase() {
  const services = await Promise.all([
    prisma.service.upsert({
      where: { slug: 'netflix' },
      data: {
        slug: 'netflix',
        name: 'Netflix Premium',
        price: 2500,
        icon: 'fa-solid fa-play',
        bg: '/images/backgrounds/netflix.jpg',
        description: '4K Ultra HD + HDR, 4 screens. Official Account, Full Warranty, Instant Activation.',
        features: ['Official Account', 'Full Warranty', 'Instant Activation', 'Mobile/TV/PC'],
      },
      update: {},
    }),
    prisma.service.upsert({
      where: { slug: 'spotify' },
      data: {
        slug: 'spotify',
        name: 'Spotify Premium',
        price: 1000,
        icon: 'fa-brands fa-spotify',
        bg: '/images/backgrounds/spotify.jpg',
        description: 'Ad-free music, 6 accounts. Your Own Account, High Quality Audio, Offline Playback.',
        features: ['Your Own Account', 'High Quality Audio', 'Offline Playback', 'Unlimited Skips'],
      },
      update: {},
    }),
    prisma.service.upsert({
      where: { slug: 'amazon' },
      data: {
        slug: 'amazon',
        name: 'Amazon Prime',
        price: 2000,
        icon: 'fa-brands fa-amazon',
        bg: '/images/backgrounds/amazon.jpg',
        description: 'Prime Video + Free Delivery. Global Access, No Ads on Video, Exclusive Originals.',
        features: ['Global Access', 'No Ads on Video', 'Exclusive Originals', '4K Streaming'],
      },
      update: {},
    }),
    prisma.service.upsert({
      where: { slug: 'youtube' },
      data: {
        slug: 'youtube',
        name: 'YouTube Premium',
        price: 1500,
        icon: 'fa-brands fa-youtube',
        bg: '/images/backgrounds/ytMusic.jpg',
        description: 'Ad-free YouTube and Music. Background Play, Downloads, and Official Activation.',
        features: ['Ad-free YouTube', 'Background Play', 'Downloads', 'Official Activation'],
      },
      update: {},
    }),
    prisma.service.upsert({
      where: { slug: 'apple' },
      data: {
        slug: 'apple',
        name: 'Apple Music',
        price: 1000,
        icon: 'fa-brands fa-apple',
        bg: '/images/backgrounds/appleMusic.jpg',
        description: 'Lossless audio, spatial audio. Your Own Account, High Quality Audio, Official Activation.',
        features: ['Lossless Audio', 'Spatial Audio', 'Your Own Account', 'Official Activation'],
      },
      update: {},
    }),
  ])

  const adminPasswordHash = bcrypt.hashSync('Admin12345!', BCRYPT_ROUNDS)
  const userPasswordHash = bcrypt.hashSync('Demo12345!', BCRYPT_ROUNDS)

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@optimedia.local' },
    data: {
      name: 'OptiMedia Admin',
      email: 'admin@optimedia.local',
      whatsapp: '+2348000000000',
      role: 'admin',
      avatar: 'A',
      passwordHash: adminPasswordHash,
    },
    update: {},
  })

  const user = await prisma.user.upsert({
    where: { email: 'john@example.com' },
    data: {
      name: 'John Doe',
      email: 'john@example.com',
      whatsapp: '+2348012345678',
      role: 'user',
      avatar: 'J',
      passwordHash: userPasswordHash,
    },
    update: {},
  })

  await prisma.subscription.upsert({
    where: {
      userId_serviceId: {
        userId: user.id,
        serviceId: services[0].id,
      },
    },
    create: {
      userId: user.id,
      serviceId: services[0].id,
      status: 'active',
      price: 2500,
      icon: 'fa-solid fa-play',
      bg: '/images/backgrounds/netflix.jpg',
      activeDate: new Date(addDays(new Date(), -10)),
      durationDays: 30,
      nextBilling: new Date(addDays(new Date(), 20)),
    },
    update: {},
  })

  await prisma.subscription.upsert({
    where: {
      userId_serviceId: {
        userId: user.id,
        serviceId: services[1].id,
      },
    },
    create: {
      userId: user.id,
      serviceId: services[1].id,
      status: 'pending',
      price: 1000,
      icon: 'fa-brands fa-spotify',
      bg: '/images/backgrounds/spotify.jpg',
    },
    update: {},
  })

  await prisma.activity.upsert({
    where: { id: 'act-1' },
    create: {
      id: 'act-1',
      userId: user.id,
      type: 'payment',
      service: 'Netflix Renewal',
      amount: '₦15,490',
      status: 'Completed',
      date: '2 days ago',
      icon: 'fa-solid fa-credit-card',
    },
    update: {},
  })

  await prisma.activity.upsert({
    where: { id: 'act-2' },
    create: {
      id: 'act-2',
      userId: user.id,
      type: 'subscription',
      service: 'Spotify Family',
      amount: '₦16,990',
      status: 'Completed',
      date: '5 days ago',
      icon: 'fa-brands fa-spotify',
    },
    update: {},
  })

  await prisma.activity.upsert({
    where: { id: 'act-3' },
    create: {
      id: 'act-3',
      userId: user.id,
      type: 'subscription',
      service: 'Disney+',
      amount: '₦7,990',
      status: 'Pending',
      date: 'Just now',
      icon: 'fa-solid fa-plus',
    },
    update: {},
  })

  await prisma.subscription.upsert({
    where: {
      userId_serviceId: {
        userId: adminUser.id,
        serviceId: services[0].id,
      },
    },
    create: {
      userId: adminUser.id,
      serviceId: services[0].id,
      status: 'active',
      price: 2500,
      icon: 'fa-solid fa-play',
      bg: '/images/backgrounds/netflix.jpg',
      activeDate: new Date(addDays(new Date(), -5)),
      durationDays: 30,
      nextBilling: new Date(addDays(new Date(), 25)),
    },
    update: {},
  })
}
