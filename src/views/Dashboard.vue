<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const isMobileNavOpen = ref(false)

const userName = computed(() => authStore.user?.name || 'User')
const userInitial = computed(() => userName.value.charAt(0).toUpperCase())

const greeting = computed(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
})

const navigateTo = (path: string) => {
    isMobileNavOpen.value = false
    router.push(path)
}

async function handleLogout() {
    await authStore.logout()
    router.push('/')
}

watch(() => route.path, () => {
    isMobileNavOpen.value = false
})
</script>

<template>
    <div class="min-h-screen bg-secondary text-white flex flex-col lg:flex-row relative overflow-x-hidden antialiased">
        <header class="w-full bg-black/20 border-b border-white/5 p-4 flex items-center justify-between lg:hidden sticky top-0 z-40 backdrop-blur-md">
            <div class="flex items-center gap-3">
                <span class="text-base font-black tracking-tighter uppercase italic bg-linear-to-r from-white to-white/60 bg-clip-text text-transparent">OPTIMEDIA</span>
            </div>

            <button
                @click="isMobileNavOpen = !isMobileNavOpen"
                class="h-10 w-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-white/80 active:scale-95 transition-all"
                aria-label="Toggle Menu"
            >
                <i v-if="!isMobileNavOpen" class="fa-solid fa-bars text-lg"></i>
                <i v-else class="fa-solid fa-xmark text-lg"></i>
            </button>
        </header>

        <div
            v-if="isMobileNavOpen"
            @click="isMobileNavOpen = false"
            class="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs"
        ></div>

        <aside
            class="fixed inset-y-0 left-0 w-72 bg-secondary border-r border-white/5 flex flex-col p-6 sm:p-8 transform transition-transform duration-300 ease-in-out z-50 lg:translate-x-0 lg:static lg:h-screen lg:z-30 shrink-0"
            :class="isMobileNavOpen ? 'translate-x-0' : '-translate-x-full'"
        >
            <div class="hidden lg:flex items-center gap-3 mb-10">
                <span class="text-lg font-black tracking-tighter uppercase italic bg-linear-to-r from-white to-white/60 bg-clip-text text-transparent">OPTIMEDIA</span>
            </div>

            <div class="flex items-center justify-between mb-8 lg:hidden border-b border-white/5 pb-4">
                <span class="text-base font-black tracking-tighter uppercase italic text-white/60">Navigation</span>
                <button @click="isMobileNavOpen = false" class="text-white/40 hover:text-white text-sm font-bold uppercase tracking-wider">Close</button>
            </div>

            <nav class="flex flex-col gap-1.5 flex-1">
                <button
                    @click="navigateTo('/dashboard')"
                    class="w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl font-bold text-sm tracking-tight transition-all text-left"
                    :class="route.name === 'DashboardHome' ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-white/40 hover:text-white hover:bg-white/5'"
                >
                    <i class="fa-solid fa-table-columns text-lg"></i>
                    Dashboard
                </button>
                <button
                    @click="navigateTo('/subscriptions')"
                    class="w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl font-bold text-sm tracking-tight text-white/40 hover:text-white hover:bg-white/5 transition-all text-left"
                >
                    <i class="fa-solid fa-list-ul text-lg"></i>
                    Subscriptions
                </button>
                <button
                    @click="navigateTo('/dashboard/history')"
                    class="w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl font-bold text-sm tracking-tight transition-all text-left"
                    :class="route.name === 'UsageHistory' ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-white/40 hover:text-white hover:bg-white/5'"
                >
                    <i class="fa-solid fa-clock-rotate-left text-lg"></i>
                    Usage History
                </button>
                <button
                    @click="navigateTo('/dashboard/settings')"
                    class="w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl font-bold text-sm tracking-tight transition-all text-left"
                    :class="route.name === 'Settings' ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-white/40 hover:text-white hover:bg-white/5'"
                >
                    <i class="fa-solid fa-gear text-lg"></i>
                    Settings
                </button>
            </nav>

            <div class="mt-auto pt-6 border-t border-white/5 space-y-2">
                <div class="bg-black/30 border border-white/5 rounded-2xl p-5 relative overflow-hidden">
                    <p class="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Status</p>
                    <h4 class="text-base font-black text-white italic">Pro Member</h4>
                </div>
                <button @click="handleLogout"
                    class="w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl font-bold text-sm tracking-tight text-red-400/60 hover:text-red-400 hover:bg-red-500/5 transition-all text-left">
                    <i class="fa-solid fa-right-from-bracket text-lg"></i>
                    Logout
                </button>
            </div>
        </aside>

        <main class="flex-1 p-6 lg:p-12 overflow-x-hidden flex flex-col lg:h-screen lg:overflow-y-auto">
            <header class="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-10 relative z-10">
                <div>
                    <h1 class="text-2xl sm:text-3xl font-black tracking-tight uppercase italic">
                        {{ greeting }}, {{ userName }}
                    </h1>
                    <p class="text-white/40 font-medium text-xs sm:text-sm mt-0.5">
                        <span v-if="route.name === 'DashboardHome'">Here's what's happening with your subscriptions today.</span>
                        <span v-else-if="route.name === 'UsageHistory'">Review your historical transactions and invoices.</span>
                        <span v-else-if="route.name === 'Settings'">Configure secure credentials and account contact profiles.</span>
                    </p>
                </div>
                <div class="flex items-center gap-4 self-end sm:self-auto">
                    <button class="h-11 w-11 bg-black/20 hover:bg-black/40 border border-white/5 rounded-xl flex items-center justify-center text-white/80 transition-all">
                        <i class="fa-regular fa-bell text-lg"></i>
                    </button>
                    <div class="flex items-center gap-3 bg-black/20 p-1.5 pr-5 rounded-xl border border-white/5">
                        <div class="h-8 w-8 bg-black/40 rounded-lg flex items-center justify-center text-xs font-black uppercase italic border border-white/10 text-primary">
                            {{ userInitial }}
                        </div>
                        <div>
                            <p class="font-black text-xs text-white leading-none mb-0.5">{{ userName }}</p>
                            <p class="text-[8px] font-bold text-primary uppercase tracking-widest leading-none">PRO MEMBER</p>
                        </div>
                    </div>
                </div>
            </header>

            <div class="flex-1 w-full min-h-0 flex flex-col">
                <router-view v-slot="{ Component }">
                    <transition name="fade-page" mode="out-in">
                        <component :is="Component" />
                    </transition>
                </router-view>
            </div>
        </main>
    </div>
</template>

<style scoped>
.fade-page-enter-active,
.fade-page-leave-active {
    transition: opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1), transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
.fade-page-enter-from {
    opacity: 0;
    transform: translateY(8px);
}
.fade-page-leave-to {
    opacity: 0;
    transform: translateY(-8px);
}
</style>