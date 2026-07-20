<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminStore } from '../stores/admin'

const router = useRouter()
const adminStore = useAdminStore()
const searchQuery = ref('')

const filteredLogs = computed(() => {
    const q = searchQuery.value.toLowerCase().trim()
    if (!q) return adminStore.subscriptionLogs
    return adminStore.subscriptionLogs.filter(
        (l) =>
            l.userName.toLowerCase().includes(q) ||
            l.userEmail.toLowerCase().includes(q) ||
            l.service.toLowerCase().includes(q),
    )
})

onMounted(() => {
    adminStore.fetchSubscriptionLogs()
})
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

            <div v-if="adminStore.isLogsLoading" class="flex items-center justify-center py-24 flex-1">
                <div class="flex flex-col items-center gap-4">
                    <svg class="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    <p class="text-white/40 text-sm font-bold uppercase tracking-widest">Loading logs...</p>
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
