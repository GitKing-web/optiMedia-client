import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Subscription {
    id: string
    name: string
    status: 'active' | 'expired' | 'canceled' | 'pending'
    price: number
    nextBilling?: string
    icon: string
    bg: string
    activeDate?: string
    durationDays?: number
}

export interface Service {
    id: string
    name: string
    price: number
    icon: string
    bg: string
    description: string
}

export const useSubscriptionStore = defineStore('subscription', () => {
    const activeSubscriptions = ref<Subscription[]>([])

    const availableServices = ref<Service[]>([
        { id: '1', name: 'Netflix Premium', price: 2500, icon: 'fa-solid fa-play', bg: '/images/backgrounds/netflix.jpg', description: '4K Ultra HD + HDR, 4 screens. Official Account, Full Warranty, Instant Activation.' },
        { id: '2', name: 'Spotify Premium', price: 1000, icon: 'fa-brands fa-spotify', bg: '/images/backgrounds/spotify.jpg', description: 'Ad-free music, 6 accounts. Your Own Account, High Quality Audio, Offline Playback.' },
        { id: '3', name: 'Amazon Prime', price: 2000, icon: 'fa-brands fa-amazon', bg: '/images/backgrounds/amazon.jpg', description: 'Prime Video + Free Delivery. Global Access, No Ads on Video, Exclusive Originals.' },
        { id: '4', name: 'YouTube Premium', price: 1500, icon: 'fa-brands fa-youtube', bg: '/images/backgrounds/ytMusic.jpg', description: 'Ad-free YouTube and Music. Background Play, Downloads, and Official Activation.' },
        { id: '5', name: 'Apple Music', price: 1000, icon: 'fa-brands fa-apple', bg: '/images/backgrounds/appleMusic.jpg', description: 'Lossless audio, spatial audio. Your Own Account, High Quality Audio, Official Activation.' }
    ])

    function requestSubscription(service: Service) {
        // Avoid duplicates in active/pending
        if (activeSubscriptions.value.find(s => s.name === service.name)) return

        const newSub: Subscription = {
            id: Math.random().toString(36).substr(2, 9),
            name: service.name,
            status: 'pending',
            price: service.price,
            icon: service.icon,
            bg: service.bg
        }
        activeSubscriptions.value.push(newSub)
    }

    // Helper for demo: Toggle status
    function toggleStatus(id: string) {
        const sub = activeSubscriptions.value.find(s => s.id === id)
        if (sub) {
            sub.status = sub.status === 'pending' ? 'active' : 'pending'
            if (sub.status === 'active') {
                sub.activeDate = new Date().toISOString()
                sub.durationDays = 30
            }
        }
    }

    return {
        activeSubscriptions,
        availableServices,
        requestSubscription,
        toggleStatus
    }
})
