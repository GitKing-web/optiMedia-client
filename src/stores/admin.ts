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

export interface NewsletterSubscriber {
    id: string
    email: string
    active: boolean
    createdAt: string
}

export type FamilySlotStatus = 'vacant' | 'occupied' | 'expired'

export interface FamilySlot {
    id: string
    slotNumber: number
    memberName: string | null
    memberEmail: string | null
    memberContact: string | null
    status: FamilySlotStatus
    startDate: string | null
    expireDate: string | null
    notes: string | null
}

export interface FamilyAccount {
    id: string
    label: string
    serviceName: string
    masterEmail: string
    masterPassword: string | null
    capacity: number
    monthlyCost: number | null
    renewalDate: string | null
    notes: string | null
    createdAt: string
    updatedAt: string
    slots: FamilySlot[]
    summary: {
        capacity: number
        occupied: number
        expired: number
        vacant: number
        utilization: number
    }
}

export type PaymentProviderName = 'paystack' | 'flutterwave'

export interface PaymentSettings {
    provider: PaymentProviderName
    paystack: {
        publicKey: string
        secretKeySet: boolean
        secretKeyMasked: string
    }
    flutterwave: {
        publicKey: string
        secretKeySet: boolean
        secretKeyMasked: string
        secretHashSet: boolean
        secretHashMasked: string
    }
}

export interface UpdatePaymentSettingsInput {
    provider?: PaymentProviderName
    paystackPublicKey?: string
    paystackSecretKey?: string
    flutterwavePublicKey?: string
    flutterwaveSecretKey?: string
    flutterwaveSecretHash?: string
}

export interface PaginationMeta {
    total: number
    page: number
    pageSize: number
    totalPages: number
}

export const EMPTY_PAGINATION: PaginationMeta = { total: 0, page: 1, pageSize: 10, totalPages: 1 }

export interface SiteSettings {
    siteName: string
    siteBanner: string
    platformFee: number
}

export interface Coupon {
    id: string
    code: string
    type: 'percentage' | 'fixed'
    value: number
    active: boolean
    minAmount: number | null
    maxUses: number | null
    usedCount: number
    welcome: boolean
    oneTimePerUser: boolean
    expiresAt: string | null
    createdAt: string
    updatedAt: string
}

export interface CouponInput {
    code?: string
    type?: 'percentage' | 'fixed'
    value?: number
    active?: boolean
    minAmount?: number | null
    maxUses?: number | null
    expiresAt?: string | null
    welcome?: boolean
    oneTimePerUser?: boolean
}

interface AdminUsersResponse {
    summary: AdminSummary
    users: AdminUserRow[]
    pagination: PaginationMeta
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

    const newsletterSubscribers = ref<NewsletterSubscriber[]>([])
    const isNewsletterLoading = ref(false)

    const familyAccounts = ref<FamilyAccount[]>([])
    const isFamilyLoading = ref(false)

    const paymentSettings = ref<PaymentSettings | null>(null)
    const isSettingsLoading = ref(false)
    const isSavingSettings = ref(false)

    const siteSettings = ref<SiteSettings | null>(null)
    const isSiteLoading = ref(false)
    const isSavingSite = ref(false)
    const isSavingAccount = ref(false)

    const coupons = ref<Coupon[]>([])
    const isCouponsLoading = ref(false)
    const isSavingCoupon = ref(false)

    const recipients = ref<AdminUserRow[]>([])

    const usersPagination = ref<PaginationMeta>({ ...EMPTY_PAGINATION })
    const usersSearch = ref('')
    const logsPagination = ref<PaginationMeta>({ ...EMPTY_PAGINATION })
    const newsletterPagination = ref<PaginationMeta>({ ...EMPTY_PAGINATION })

    const filteredUsers = computed(() => users.value)

    async function fetchUsers(options: {
        tab?: typeof activeTab.value
        search?: string
        page?: number
        pageSize?: number
    } = {}) {
        if (!authStore.isAuthenticated) {
            users.value = []
            return []
        }

        const tab = options.tab ?? activeTab.value
        if (options.search !== undefined) usersSearch.value = options.search
        const page = options.page ?? usersPagination.value.page
        const pageSize = options.pageSize ?? usersPagination.value.pageSize

        isLoading.value = true
        error.value = null

        try {
            const params = new URLSearchParams({ tab, page: String(page), pageSize: String(pageSize) })
            if (usersSearch.value) params.set('search', usersSearch.value)

            const response = await apiFetch<AdminUsersResponse>(`/api/admin/users?${params.toString()}`)

            summary.value = response.summary
            users.value = response.users
            if (response.pagination) usersPagination.value = response.pagination
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

    async function fetchRecipients(search = '') {
        if (!authStore.isAuthenticated) return []
        const params = new URLSearchParams()
        if (search) params.set('search', search)
        const response = await apiFetch<{ users: AdminUserRow[] }>(`/api/admin/recipients?${params.toString()}`)
        recipients.value = response.users
        return response.users
    }

    async function fetchSummary() {
        if (!authStore.isAuthenticated) {
            summary.value = {
                totalUsers: 0,
                activeCount: 0,
                pendingCount: 0,
                expiringCount: 0
            }
            return summary.value
        }

        const response = await apiFetch<AdminSummary>('/api/admin/stats')

        summary.value = response
        return response
    }

    async function activateSubscription(userId: string) {
        if (!authStore.isAuthenticated) {
            throw new Error('You must be logged in as an admin')
        }

        const response = await apiFetch<{ row: AdminUserRow; message: string }>(
            `/api/admin/users/${userId}/activate`,
            {
                method: 'POST'
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
        if (!authStore.isAuthenticated) return null

        isDetailLoading.value = true
        try {
            const response = await apiFetch<{ user: UserDetail }>(`/api/admin/users/${userId}/detail`)
            selectedUserDetail.value = response.user
            return response.user
        } catch {
            return null
        } finally {
            isDetailLoading.value = false
        }
    }

    async function bulkActivate(userIds: string[]) {
        if (!authStore.isAuthenticated) throw new Error('Unauthorized')

        bulkActivating.value = true
        try {
            const response = await apiFetch<{ message: string; results: Array<{ userId: string; success: boolean; error?: string }> }>(
                '/api/admin/users/bulk-activate',
                { method: 'POST', body: JSON.stringify({ userIds }) }
            )
            await refresh()
            return response
        } finally {
            bulkActivating.value = false
        }
    }

    async function fetchRevenue() {
        if (!authStore.isAuthenticated) return
        try {
            const response = await apiFetch<{ months: RevenueMonth[]; totalRevenue: number }>(
                '/api/admin/revenue'
            )
            revenueMonths.value = response.months
            totalRevenue.value = response.totalRevenue
        } catch {
        }
    }

    async function fetchSubscriptionLogs(options: { search?: string; page?: number; pageSize?: number } = {}) {
        if (!authStore.isAuthenticated) return

        isLogsLoading.value = true
        try {
            const params = new URLSearchParams({
                page: String(options.page ?? logsPagination.value.page),
                pageSize: String(options.pageSize ?? logsPagination.value.pageSize),
            })
            if (options.search) params.set('search', options.search)

            const response = await apiFetch<{ logs: SubscriptionLog[]; pagination: PaginationMeta }>(
                `/api/admin/logs?${params.toString()}`
            )
            subscriptionLogs.value = response.logs
            if (response.pagination) logsPagination.value = response.pagination
        } catch {
        } finally {
            isLogsLoading.value = false
        }
    }

    async function downloadCSV() {
        if (!authStore.isAuthenticated) return
        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/admin/export/csv`, {
                credentials: 'include'
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
        if (!authStore.isAuthenticated) throw new Error('Unauthorized')


        return apiFetch<{ sent: number; failed: number; total: number }>(
            '/api/admin/send-email',
            { method: 'POST', body: JSON.stringify(payload) }
        )
    }

    async function refresh(tab: typeof activeTab.value = activeTab.value) {
        await Promise.all([fetchSummary(), fetchUsers({ tab })])
    }

    async function fetchPaymentSettings() {
        if (!authStore.isAuthenticated) return null
        isSettingsLoading.value = true
        try {
            const response = await apiFetch<{ settings: PaymentSettings }>('/api/admin/settings')
            paymentSettings.value = response.settings
            return response.settings
        } finally {
            isSettingsLoading.value = false
        }
    }

    async function savePaymentSettings(payload: UpdatePaymentSettingsInput) {
        if (!authStore.isAuthenticated) throw new Error('Unauthorized')
        isSavingSettings.value = true
        try {
            const response = await apiFetch<{ settings: PaymentSettings }>('/api/admin/settings', {
                method: 'PUT',
                body: JSON.stringify(payload),
            })
            paymentSettings.value = response.settings
            return response.settings
        } finally {
            isSavingSettings.value = false
        }
    }

    async function fetchSiteSettings() {
        if (!authStore.isAuthenticated) return null
        isSiteLoading.value = true
        try {
            const response = await apiFetch<{ settings: SiteSettings }>('/api/admin/site')
            siteSettings.value = response.settings
            return response.settings
        } finally {
            isSiteLoading.value = false
        }
    }

    async function saveSiteSettings(payload: { siteName?: string; siteBanner?: string; platformFee?: number }) {
        if (!authStore.isAuthenticated) throw new Error('Unauthorized')
        isSavingSite.value = true
        try {
            const response = await apiFetch<{ settings: SiteSettings }>('/api/admin/site', {
                method: 'PUT',
                body: JSON.stringify(payload),
            })
            siteSettings.value = response.settings
            return response.settings
        } finally {
            isSavingSite.value = false
        }
    }

    async function updateAccount(payload: { currentPassword: string; email?: string; password?: string }) {
        if (!authStore.isAuthenticated) throw new Error('Unauthorized')
        isSavingAccount.value = true
        try {
            const response = await apiFetch<{ message: string; emailChanged: boolean }>('/api/admin/account', {
                method: 'POST',
                body: JSON.stringify(payload),
            })
            if (response.emailChanged) {
                await authStore.fetchCurrentUser().catch(() => null)
            }
            return response
        } finally {
            isSavingAccount.value = false
        }
    }

    async function fetchCoupons() {
        if (!authStore.isAuthenticated) return []
        isCouponsLoading.value = true
        try {
            const response = await apiFetch<{ coupons: Coupon[] }>('/api/admin/coupons')
            coupons.value = response.coupons
            return response.coupons
        } catch {
            coupons.value = []
            return []
        } finally {
            isCouponsLoading.value = false
        }
    }

    async function createCoupon(payload: CouponInput) {
        if (!authStore.isAuthenticated) throw new Error('Unauthorized')
        isSavingCoupon.value = true
        try {
            await apiFetch<{ coupon: Coupon }>('/api/admin/coupons', { method: 'POST', body: JSON.stringify(payload) })
            await fetchCoupons()
        } finally {
            isSavingCoupon.value = false
        }
    }

    async function updateCoupon(id: string, payload: CouponInput) {
        if (!authStore.isAuthenticated) throw new Error('Unauthorized')
        isSavingCoupon.value = true
        try {
            await apiFetch<{ coupon: Coupon }>(`/api/admin/coupons/${id}`, { method: 'PATCH', body: JSON.stringify(payload) })
            await fetchCoupons()
        } finally {
            isSavingCoupon.value = false
        }
    }

    async function deleteCoupon(id: string) {
        if (!authStore.isAuthenticated) throw new Error('Unauthorized')
        await apiFetch<{ message: string }>(`/api/admin/coupons/${id}`, { method: 'DELETE' })
        coupons.value = coupons.value.filter((c) => c.id !== id)
    }

    async function fetchNewsletterSubscribers(options: { search?: string; page?: number; pageSize?: number } = {}) {
        if (!authStore.isAuthenticated) return []
        isNewsletterLoading.value = true
        try {
            const params = new URLSearchParams({
                page: String(options.page ?? newsletterPagination.value.page),
                pageSize: String(options.pageSize ?? newsletterPagination.value.pageSize),
            })
            if (options.search) params.set('search', options.search)

            const response = await apiFetch<{ subscribers: NewsletterSubscriber[]; pagination: PaginationMeta }>(
                `/api/newsletter/subscribers?${params.toString()}`
            )
            newsletterSubscribers.value = response.subscribers
            if (response.pagination) newsletterPagination.value = response.pagination
            return response.subscribers
        } catch {
            newsletterSubscribers.value = []
            return []
        } finally {
            isNewsletterLoading.value = false
        }
    }

    async function removeNewsletterSubscriber(id: string) {
        if (!authStore.isAuthenticated) return
        await apiFetch<{ message: string }>(`/api/newsletter/subscribers/${id}`, { method: 'DELETE' })
        newsletterSubscribers.value = newsletterSubscribers.value.filter((s) => s.id !== id)
    }

    async function fetchFamilyAccounts() {
        if (!authStore.isAuthenticated) return []
        isFamilyLoading.value = true
        try {
            const response = await apiFetch<{ accounts: FamilyAccount[] }>('/api/admin/family')
            familyAccounts.value = response.accounts
            return response.accounts
        } catch {
            familyAccounts.value = []
            return []
        } finally {
            isFamilyLoading.value = false
        }
    }

    async function createFamilyAccount(payload: {
        label: string
        serviceName: string
        masterEmail: string
        masterPassword?: string | null
        capacity?: number
        monthlyCost?: number | null
        renewalDate?: string | null
        notes?: string | null
    }) {
        if (!authStore.isAuthenticated) throw new Error('Unauthorized')
        const response = await apiFetch<{ account: FamilyAccount }>('/api/admin/family', {
            method: 'POST',
            body: JSON.stringify(payload),
        })
        await fetchFamilyAccounts()
        return response.account
    }

    async function updateFamilyAccount(id: string, payload: Record<string, unknown>) {
        if (!authStore.isAuthenticated) throw new Error('Unauthorized')
        await apiFetch<{ account: FamilyAccount }>(`/api/admin/family/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
        })
        await fetchFamilyAccounts()
    }

    async function deleteFamilyAccount(id: string) {
        if (!authStore.isAuthenticated) throw new Error('Unauthorized')
        await apiFetch<{ message: string }>(`/api/admin/family/${id}`, { method: 'DELETE' })
        familyAccounts.value = familyAccounts.value.filter((a) => a.id !== id)
    }

    async function assignFamilySlot(
        accountId: string,
        slotId: string,
        payload: { memberName: string; memberEmail?: string; memberContact?: string; months?: number; notes?: string },
    ) {
        if (!authStore.isAuthenticated) throw new Error('Unauthorized')
        await apiFetch<{ slot: FamilySlot }>(`/api/admin/family/${accountId}/slots/${slotId}`, {
            method: 'POST',
            body: JSON.stringify(payload),
        })
        await fetchFamilyAccounts()
    }

    async function extendFamilySlot(accountId: string, slotId: string, months: number) {
        if (!authStore.isAuthenticated) throw new Error('Unauthorized')
        await apiFetch<{ slot: FamilySlot }>(`/api/admin/family/${accountId}/slots/${slotId}/extend`, {
            method: 'POST',
            body: JSON.stringify({ months }),
        })
        await fetchFamilyAccounts()
    }

    async function vacateFamilySlot(accountId: string, slotId: string) {
        if (!authStore.isAuthenticated) throw new Error('Unauthorized')
        await apiFetch<{ slot: FamilySlot }>(`/api/admin/family/${accountId}/slots/${slotId}`, { method: 'DELETE' })
        await fetchFamilyAccounts()
    }

    async function cleanupFamilySlots(accountId: string) {
        if (!authStore.isAuthenticated) throw new Error('Unauthorized')
        const response = await apiFetch<{ message: string; freed: number }>(
            `/api/admin/family/${accountId}/cleanup`,
            { method: 'POST' },
        )
        await fetchFamilyAccounts()
        return response
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
        newsletterSubscribers,
        isNewsletterLoading,
        familyAccounts,
        isFamilyLoading,
        paymentSettings,
        isSettingsLoading,
        isSavingSettings,
        siteSettings,
        isSiteLoading,
        isSavingSite,
        isSavingAccount,
        coupons,
        isCouponsLoading,
        isSavingCoupon,
        recipients,
        usersPagination,
        usersSearch,
        logsPagination,
        newsletterPagination,
        fetchUsers,
        fetchRecipients,
        fetchSummary,
        activateSubscription,
        fetchUserDetail,
        bulkActivate,
        fetchRevenue,
        fetchSubscriptionLogs,
        downloadCSV,
        sendEmail,
        fetchNewsletterSubscribers,
        removeNewsletterSubscriber,
        fetchFamilyAccounts,
        createFamilyAccount,
        updateFamilyAccount,
        deleteFamilyAccount,
        assignFamilySlot,
        extendFamilySlot,
        vacateFamilySlot,
        cleanupFamilySlots,
        fetchPaymentSettings,
        savePaymentSettings,
        fetchSiteSettings,
        saveSiteSettings,
        updateAccount,
        fetchCoupons,
        createCoupon,
        updateCoupon,
        deleteCoupon,
        refresh
    }
})
