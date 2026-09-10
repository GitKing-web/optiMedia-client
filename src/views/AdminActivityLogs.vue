<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import Skeleton from '../components/Skeleton.vue'
import Pagination from '../components/Pagination.vue'
import { useAdminStore } from '../stores/admin'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const adminStore = useAdminStore()
const authStore = useAuthStore()
const searchQuery = ref('')
let searchTimer: ReturnType<typeof setTimeout> | null = null

// Logs are filtered + paginated server-side.
const filteredLogs = computed(() => adminStore.subscriptionLogs)

watch(searchQuery, () => {
    if (searchTimer) clearTimeout(searchTimer)
    searchTimer = setTimeout(() => {
        adminStore.fetchSubscriptionLogs({ search: searchQuery.value, page: 1 })
    }, 300)
})

function changePage(page: number) {
    adminStore.fetchSubscriptionLogs({ page })
}

onMounted(() => {
    adminStore.fetchSubscriptionLogs()
})

async function handleLogout() {
    await authStore.logout()
    router.push('/')
}
</script>

<template>
    <div class="min-h-screen bg-secondary text-white flex flex-col lg:flex-row">
        <aside
            class="w-full lg:w-72 bg-black/40 border-b lg:border-b-0 lg:border-r border-white/5 flex flex-col p-6 sm:p-8 lg:sticky top-0 h-auto lg:h-screen z-30">
            <div class="flex items-center gap-3 mb-8 lg:mb-12">
                <img src="/images/logo.jpeg" alt="Logo" class="h-10 w-10 rounded-xl" />
                <span class="text-xl font-black tracking-tighter uppercase italic">OPTIMEDIA ADMIN</span>
            </div>
            <nav class="flex flex-col gap-2 flex-1">
                <button @click="router.push('/admin')"
                    class="w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm tracking-tight text-white/40 hover:text-white hover:bg-white/5 transition-all text-left">
                    <i class="fa-solid fa-users-gear text-lg"></i>
                    Users
                </button>
                <div
                    class="flex items-center gap-4 px-6 py-4 rounded-2xl bg-primary text-white shadow-xl shadow-primary/20 font-bold text-sm tracking-tight">
                    <i class="fa-solid fa-clock-rotate-left text-lg"></i>
                    Activity Logs
                </div>
                <button @click="router.push('/admin/revenue')"
                    class="w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm tracking-tight text-white/40 hover:text-white hover:bg-white/5 transition-all text-left">
                    <i class="fa-solid fa-chart-line text-lg"></i>
                    Revenue
                </button>
                <button @click="router.push('/admin/email')"
                    class="w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm tracking-tight text-white/40 hover:text-white hover:bg-white/5 transition-all text-left">
                    <i class="fa-solid fa-envelope text-lg"></i>
                    Email Users
                </button>
                <button @click="router.push('/admin/newsletter')"
                    class="w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm tracking-tight text-white/40 hover:text-white hover:bg-white/5 transition-all text-left">
                    <i class="fa-solid fa-envelope-open-text text-lg"></i>
                    Newsletter
                </button>
                <button @click="router.push('/admin/family')"
                    class="w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm tracking-tight text-white/40 hover:text-white hover:bg-white/5 transition-all text-left">
                    <i class="fa-solid fa-users-rectangle text-lg"></i>
                    Family Slots
                </button>
                <button @click="router.push('/admin/coupons')"
                    class="w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm tracking-tight text-white/40 hover:text-white hover:bg-white/5 transition-all text-left">
                    <i class="fa-solid fa-tags text-lg"></i>
                    Coupons
                </button>
                <button @click="router.push('/admin/settings')"
                    class="w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm tracking-tight text-white/40 hover:text-white hover:bg-white/5 transition-all text-left">
                    <i class="fa-solid fa-gear text-lg"></i>
                    Settings
                </button>
            </nav>
            <div class="mt-auto pt-6 border-t border-white/5 flex flex-col gap-2">
                <button @click="adminStore.downloadCSV()"
                    class="w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl font-bold text-sm tracking-tight text-white/40 hover:text-white hover:bg-white/5 transition-all text-left">
                    <i class="fa-solid fa-download text-lg"></i>
                    Export CSV
                </button>
                <button @click="router.push('/dashboard')"
                    class="w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl font-bold text-sm tracking-tight text-white/40 hover:text-white hover:bg-white/5 transition-all text-left">
                    <i class="fa-solid fa-arrow-left text-lg"></i>
                    Dashboard
                </button>
                <button @click="handleLogout" :disabled="authStore.isLoggingOut"
                    class="w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl font-bold text-sm tracking-tight text-red-400/60 hover:text-red-400 hover:bg-red-500/5 transition-all text-left disabled:opacity-60 disabled:cursor-not-allowed">
                    <i :class="authStore.isLoggingOut ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-right-from-bracket'"
                        class="text-lg"></i>
                    {{ authStore.isLoggingOut ? 'Logging out...' : 'Logout' }}
                </button>
            </div>
        </aside>

        <main class="flex-1 p-4 sm:p-6 lg:p-8 2xl:p-12 overflow-x-hidden flex flex-col">
            <div class="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
                <div>
                    <h1 class="text-3xl sm:text-4xl font-black tracking-tight uppercase italic">Activity Logs</h1>
                    <p class="text-white/40 text-sm font-medium mt-1">Review all payments and subscription activity across users.</p>
                </div>
                <div class="relative w-full sm:w-64">
                    <i class="fa-solid fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20 text-sm"></i>
                    <input v-model="searchQuery" type="text" placeholder="Search logs..."
                        class="w-full bg-black/20 border border-white/5 rounded-xl py-2.5 pl-9 pr-4 text-sm text-white placeholder-white/20 focus:outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/20 transition-all" />
                </div>
            </div>

            <div v-if="adminStore.isLogsLoading" class="bg-white/5 backdrop-blur-md rounded-4xl border border-white/10 shadow-xl overflow-hidden">
                <div class="p-5 border-b border-white/5">
                    <Skeleton width="10rem" height="1.2rem" />
                </div>
                <div class="divide-y divide-white/5">
                    <div v-for="i in 6" :key="i" class="flex items-center gap-4 px-5 py-4">
                        <Skeleton width="2.5rem" height="2.5rem" radius="0.75rem" />
                        <div class="flex-1 space-y-2">
                            <Skeleton width="55%" height="0.9rem" />
                            <Skeleton width="35%" height="0.7rem" />
                        </div>
                        <Skeleton width="5rem" height="1.5rem" radius="0.5rem" />
                    </div>
                </div>
            </div>

            <div v-else class="flex-1 bg-black/20 rounded-3xl border border-white/5 p-4 sm:p-6 lg:p-8">
                <div class="space-y-2">
                    <div v-for="log in filteredLogs" :key="log.id"
                        class="flex items-center justify-between p-4 bg-black/20 rounded-xl hover:bg-black/30 transition-all">
                        <div class="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                            <div
                                class="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0"
                                :class="log.type === 'payment' ? 'text-emerald-400' : 'text-primary'">
                                <i :class="log.type === 'payment' ? 'fa-solid fa-credit-card' : 'fa-solid fa-arrow-trend-up'"
                                    class="text-lg"></i>
                            </div>
                            <div class="min-w-0 flex-1">
                                <p class="text-sm font-bold text-white truncate">{{ log.userName }} <span class="text-white/40 font-normal">—</span> {{ log.service }}</p>
                                <p class="text-[10px] text-white/40 truncate">{{ log.userEmail }} · {{ log.date }}</p>
                            </div>
                        </div>
                        <div class="text-right shrink-0 ml-4">
                            <p class="text-sm font-black text-white">{{ log.amount }}</p>
                            <span :class="log.status === 'Completed' ? 'text-emerald-400' : 'text-primary'"
                                class="text-[9px] font-black uppercase tracking-widest">{{ log.status }}</span>
                        </div>
                    </div>
                    <p v-if="filteredLogs.length === 0"
                        class="text-center text-white/30 py-16 font-bold uppercase tracking-widest">
                        No activity found
                    </p>
                </div>

                <Pagination :page="adminStore.logsPagination.page"
                    :total-pages="adminStore.logsPagination.totalPages"
                    :total="adminStore.logsPagination.total"
                    :page-size="adminStore.logsPagination.pageSize"
                    @update:page="changePage" />
            </div>
        </main>
    </div>
</template>

<style scoped>
::-webkit-scrollbar { height: 6px; width: 6px; }
::-webkit-scrollbar-track { background: rgba(15, 23, 42, 0.3); }
::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.4); border-radius: 10px; }
::-webkit-scrollbar-thumb:hover { background: rgba(99, 102, 241, 0.7); }
</style>
