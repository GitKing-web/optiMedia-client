import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { apiFetch, ApiError } from '../lib/api'
import { useAuthStore } from './auth'

export interface Subscription {
    id: string
    serviceId: string
    name: string
    status: 'active' | 'expired' | 'canceled' | 'pending'
    price: number
    nextBilling?: string
    icon: string
    bg: string
    activeDate?: string
    durationDays?: number
    service?: {
        id: string
        slug: string
        name: string
        price: number
        icon: string
        bg: string
        description: string
        features: string[]
    } | null
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

interface DashboardResponse {
    profile: unknown
    metrics: {
        monthlySpend: number
        activeServices: number
        pendingRequests: number
        financialHealth: string
    }
    subscriptions: Array<{
        id: string
        serviceId: string
        name?: string
        status: 'active' | 'expired' | 'canceled' | 'pending'
        price: number
        icon: string
        bg: string
        activeDate?: string
        durationDays?: number
        nextBilling?: string
        service?: Service | null
    }>
    activities: Array<{
        id: string
        type: 'payment' | 'subscription'
        service: string
        amount: string
        status: string
        date: string
        icon: string
    }>
    services: Service[]
}

interface ServicesResponse {
    services: Service[]
}

interface RequestSubscriptionResponse {
    message: string
    subscription: Subscription
}

interface PaystackInitializationResponse {
    message: string
    authorizationUrl: string
    reference: string
}

interface PaystackVerificationResponse {
    message: string
    subscription?: Subscription
    payment?: {
        reference: string
        status: string
        amount: number
    }
}

export const useSubscriptionStore = defineStore('subscription', () => {
    const authStore = useAuthStore()
    const activeSubscriptions = ref<Subscription[]>([])
    const availableServices = ref<Service[]>([])
    const activities = ref<DashboardResponse['activities']>([])
    const metrics = ref<DashboardResponse['metrics'] | null>(null)
    const isLoading = ref(false)
    const error = ref<string | null>(null)

    const activeAndPending = computed(() => activeSubscriptions.value)

    function mapSubscription(subscription: DashboardResponse['subscriptions'][number]): Subscription {
        return {
            id: subscription.id,
            serviceId: subscription.serviceId,
            name: subscription.service?.name || subscription.name || 'Unknown Service',
            status: subscription.status,
            price: subscription.price,
            nextBilling: subscription.nextBilling,
            icon: subscription.icon,
            bg: subscription.bg,
            activeDate: subscription.activeDate,
            durationDays: subscription.durationDays,
            service: subscription.service || null
        }
    }

    async function fetchServices() {
        const response = await apiFetch<ServicesResponse>('/api/services')
        availableServices.value = response.services
        return response.services
    }

    async function fetchDashboard() {
        if (!authStore.token) {
            activeSubscriptions.value = []
            activities.value = []
            metrics.value = null
            return null
        }

        isLoading.value = true
        error.value = null

        try {
            const response = await apiFetch<DashboardResponse>('/api/dashboard', {
                authToken: authStore.token
            })

            metrics.value = response.metrics
            activities.value = response.activities
            activeSubscriptions.value = response.subscriptions.map(mapSubscription)
            availableServices.value = response.services
            return response
        } catch (caughtError) {
            if (caughtError instanceof ApiError) {
                error.value = caughtError.message
            } else {
                error.value = 'Unable to load subscription data'
            }
            throw caughtError
        } finally {
            isLoading.value = false
        }
    }

    async function fetchSubscriptions() {
        if (!authStore.token) {
            activeSubscriptions.value = []
            return []
        }

        const response = await apiFetch<{ subscriptions: DashboardResponse['subscriptions'] }>('/api/subscriptions', {
            authToken: authStore.token
        })

        activeSubscriptions.value = response.subscriptions.map(mapSubscription)
        return activeSubscriptions.value
    }

    async function requestSubscription(service: Service) {
        if (!authStore.token) {
            throw new Error('You must be logged in to request a subscription')
        }

        const response = await apiFetch<RequestSubscriptionResponse>('/api/subscriptions/request', {
            method: 'POST',
            authToken: authStore.token,
            body: JSON.stringify({ serviceId: service.id })
        })

        const mapped = mapSubscription(response.subscription)
        const existingIndex = activeSubscriptions.value.findIndex((item) => item.id === mapped.id)

        if (existingIndex >= 0) {
            activeSubscriptions.value[existingIndex] = mapped
        } else {
            activeSubscriptions.value.unshift(mapped)
        }

        return mapped
    }

    async function initializePaystackCheckout(service: Service) {
        if (!authStore.token) {
            throw new Error('You must be logged in to continue')
        }

        return apiFetch<PaystackInitializationResponse>('/api/payments/paystack/initialize', {
            method: 'POST',
            authToken: authStore.token,
            body: JSON.stringify({ serviceId: service.id })
        })
    }

    async function verifyPaystackCheckout(reference: string) {
        if (!authStore.token) {
            throw new Error('You must be logged in to continue')
        }

        const response = await apiFetch<PaystackVerificationResponse>(`/api/payments/paystack/verify/${reference}`, {
            authToken: authStore.token
        })

        await refreshAll().catch(() => null)
        return response
    }

    async function refreshAll() {
        await Promise.all([fetchServices(), fetchDashboard()])
    }

    return {
        activeSubscriptions,
        activeAndPending,
        availableServices,
        activities,
        metrics,
        isLoading,
        error,
        fetchServices,
        fetchDashboard,
        fetchSubscriptions,
        requestSubscription,
        initializePaystackCheckout,
        verifyPaystackCheckout,
        refreshAll
    }
})
