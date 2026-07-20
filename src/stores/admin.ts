import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { apiFetch, ApiError } from '../lib/api'
import { useAuthStore } from './auth'

export interface AdminUserRow {
    userId: string
    userName: string
    userEmail: string
    whatsappContact: string
    serviceName: string
    status: 'active' | 'pending' | 'none'
    price: number
    icon: string
    startDate?: string
    expireDate?: string
    authUserId?: string
}

export interface AdminSummary {
    totalUsers: number
    activeCount: number
    pendingCount: number
    expiringCount: number
}

export interface UserDetail {
    id: string
    name: string
    email: string
    whatsapp: string
    role: string
    avatar: string | null
    createdAt: string
    subscriptions: Array<{
        id: string
        serviceName: string
        status: string
        price: number
        icon: string
        activeDate: string | null
        nextBilling: string | null
        createdAt: string
    }>
    payments: Array<{
        id: string
        reference: string
        amount: number
        status: string
        gateway: string
        paidAt: string | null
        createdAt: string
    }>
    activities: Array<{
        id: string
        type: string
        service: string
        amount: string
        status: string
        date: string
        createdAt: string
    }>
}

export interface RevenueMonth {
    month: string
    revenue: number
}

export interface SubscriptionLog {
    id: string
    userName: string
    userEmail: string
    type: string
    service: string
    amount: string
    status: string
    date: string
    createdAt: string
}

interface AdminUsersResponse {
    summary: AdminSummary
    users: AdminUserRow[]
}

export const useAdminStore = defineStore('admin', () => {
    const authStore = useAuthStore()
    const activeTab = ref<'all' | 'pending' | 'active' | 'expiring'>('all')
    const users = ref<AdminUserRow[]>([])
    const summary = ref<AdminSummary>({
        totalUsers: 0,
        activeCount: 0,
        pendingCount: 0,
        expiringCount: 0
    })
    const isLoading = ref(false)
    const error = ref<string | null>(null)
    const selectedUserDetail = ref<UserDetail | null>(null)
    const isDetailLoading = ref(false)
    const revenueMonths = ref<RevenueMonth[]>([])
    const totalRevenue = ref(0)
    const subscriptionLogs = ref<SubscriptionLog[]>([])
    const isLogsLoading = ref(false)
    const bulkActivating = ref(false)

    const filteredUsers = computed(() => users.value)

    async function fetchUsers(tab: typeof activeTab.value = activeTab.value) {
        if (!authStore.token) {
            users.value = []
            return []
        }

        isLoading.value = true
        error.value = null

        try {
            const response = await apiFetch<AdminUsersResponse>(`/api/admin/users?tab=${tab}`, {
                authToken: authStore.token
            })

            summary.value = response.summary
            users.value = response.users
            return response.users
        } catch (caughtError) {
            if (caughtError instanceof ApiError) {
                error.value = caughtError.message
            } else {
                error.value = 'Unable to load admin users'
            }
            throw caughtError
        } finally {
            isLoading.value = false
        }
    }

    async function fetchSummary() {
        if (!authStore.token) {
            summary.value = {
                totalUsers: 0,
                activeCount: 0,
                pendingCount: 0,
                expiringCount: 0
            }
            return summary.value
        }

        const response = await apiFetch<AdminSummary>('/api/admin/stats', {
            authToken: authStore.token
        })

        summary.value = response
        return response
    }

    async function activateSubscription(userId: string) {
        if (!authStore.token) {
            throw new Error('You must be logged in as an admin')
        }

        const response = await apiFetch<{ row: AdminUserRow; message: string }>(
            `/api/admin/users/${userId}/activate`,
            {
                method: 'POST',
                authToken: authStore.token
            }
        )

        const index = users.value.findIndex((user) => user.userId === userId)
        if (index >= 0) {
            users.value[index] = response.row
        }

        await fetchSummary()
        return response.row
    }

    async function fetchUserDetail(userId: string) {
        if (!authStore.token) return null

        isDetailLoading.value = true
        try {
            const response = await apiFetch<{ user: UserDetail }>(`/api/admin/users/${userId}/detail`, {
                authToken: authStore.token
            })
            selectedUserDetail.value = response.user
            return response.user
        } catch {
            return null
        } finally {
            isDetailLoading.value = false
        }
    }

    async function bulkActivate(userIds: string[]) {
        if (!authStore.token) throw new Error('Unauthorized')

        bulkActivating.value = true
        try {
            const response = await apiFetch<{ message: string; results: Array<{ userId: string; success: boolean; error?: string }> }>(
                '/api/admin/users/bulk-activate',
                { method: 'POST', authToken: authStore.token, body: JSON.stringify({ userIds }) }
            )
            await refresh()
            return response
        } finally {
            bulkActivating.value = false
        }
    }

    async function fetchRevenue() {
        if (!authStore.token) return
        try {
            const response = await apiFetch<{ months: RevenueMonth[]; totalRevenue: number }>(
                '/api/admin/revenue',
                { authToken: authStore.token }
            )
            revenueMonths.value = response.months
            totalRevenue.value = response.totalRevenue
        } catch {
        }
    }

    async function fetchSubscriptionLogs() {
        if (!authStore.token) return

        isLogsLoading.value = true
        try {
            const response = await apiFetch<{ logs: SubscriptionLog[] }>('/api/admin/logs', {
                authToken: authStore.token
            })
            subscriptionLogs.value = response.logs
        } catch {
        } finally {
            isLogsLoading.value = false
        }
    }

    async function downloadCSV() {
        if (!authStore.token) return
        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/admin/export/csv`, {
                headers: { Authorization: `Bearer ${authStore.token}` }
            })
            if (!response.ok) throw new Error('Failed to export')
            const blob = await response.blob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = 'optimedia-users.csv'
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
        } catch {
        }
    }

    async function sendEmail(payload: { subject: string; html: string; userIds?: string[] }) {
        if (!authStore.token) throw new Error('Unauthorized')

        return apiFetch<{ sent: number; failed: number; total: number }>(
            '/api/admin/send-email',
            { method: 'POST', authToken: authStore.token, body: JSON.stringify(payload) }
        )
    }

    async function refresh(tab: typeof activeTab.value = activeTab.value) {
        await Promise.all([fetchSummary(), fetchUsers(tab)])
    }

    return {
        activeTab,
        users,
        summary,
        filteredUsers,
        isLoading,
        error,
        selectedUserDetail,
        isDetailLoading,
        revenueMonths,
        totalRevenue,
        subscriptionLogs,
        isLogsLoading,
        bulkActivating,
        fetchUsers,
        fetchSummary,
        activateSubscription,
        fetchUserDetail,
        bulkActivate,
        fetchRevenue,
        fetchSubscriptionLogs,
        downloadCSV,
        sendEmail,
        refresh
    }
})
