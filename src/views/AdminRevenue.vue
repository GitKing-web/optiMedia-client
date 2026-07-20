<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminStore } from '../stores/admin'

const router = useRouter()
const adminStore = useAdminStore()

onMounted(() => {
    adminStore.fetchRevenue()
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
                <button @click="router.push('/admin/logs')"
                    class="w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm tracking-tight text-white/40 hover:text-white hover:bg-white/5 transition-all text-left">
                    <i class="fa-solid fa-clock-rotate-left text-lg"></i>
                    Activity Logs
                </button>
                <div
                    class="flex items-center gap-4 px-6 py-4 rounded-2xl bg-primary text-white shadow-xl shadow-primary/20 font-bold text-sm tracking-tight">
                    <i class="fa-solid fa-chart-line text-lg"></i>
                    Revenue
                </div>
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
            <div class="mb-8">
                <h1 class="text-3xl sm:text-4xl font-black tracking-tight uppercase italic">Revenue Overview</h1>
                <p class="text-white/40 text-sm font-medium mt-1">Track monthly revenue from successful payments over the last 6 months.</p>
            </div>

            <div class="bg-black/20 rounded-3xl border border-white/5 p-6 sm:p-8 lg:p-10 flex flex-col gap-8">
                <div class="bg-black/30 p-8 rounded-2xl text-center">
                    <p class="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Total Revenue (6 Months)</p>
                    <h3 class="text-5xl sm:text-6xl font-black text-emerald-400">₦{{ adminStore.totalRevenue.toLocaleString() }}</h3>
                </div>

                <div class="space-y-4">
                    <h3 class="text-sm font-black uppercase tracking-widest text-white/60">Monthly Breakdown</h3>
                    <div v-for="m in adminStore.revenueMonths" :key="m.month"
                        class="flex items-center gap-4 p-4 bg-black/20 rounded-xl">
                        <p class="text-sm font-bold text-white/60 w-24 shrink-0">{{ m.month }}</p>
                        <div class="flex-1 h-4 bg-white/5 rounded-full overflow-hidden">
                            <div class="h-full bg-primary rounded-full transition-all duration-700"
                                :style="{ width: `${adminStore.totalRevenue > 0 ? (m.revenue / adminStore.totalRevenue) * 100 : 0}%` }">
                            </div>
                        </div>
                        <p class="text-sm font-black text-white w-28 text-right shrink-0">₦{{ m.revenue.toLocaleString() }}</p>
                    </div>
                    <p v-if="adminStore.revenueMonths.length === 0"
                        class="text-center text-white/30 py-12 font-bold uppercase tracking-widest">
                        No revenue data yet. Complete some payments to see stats.
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
