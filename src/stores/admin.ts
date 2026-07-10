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
        fetchUsers,
        fetchSummary,
        activateSubscription,
        refresh
    }
})
