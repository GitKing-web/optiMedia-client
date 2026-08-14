<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import Skeleton from '../components/Skeleton.vue'
import { useAdminStore } from '../stores/admin'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const adminStore = useAdminStore()
const authStore = useAuthStore()

const searchQuery = ref<string>('')
const confirmRemove = ref<string | null>(null)

const filteredSubscribers = computed(() => {
    const q = searchQuery.value.toLowerCase().trim()
    if (!q) return adminStore.newsletterSubscribers
    return adminStore.newsletterSubscribers.filter((s) => s.email.toLowerCase().includes(q))
})

onMounted(() => {
    adminStore.fetchNewsletterSubscribers()
})

async function handleLogout() {
    await authStore.logout()
    router.push('/')
}

async function removeSubscriber(id: string) {
    try {
        await adminStore.removeNewsletterSubscriber(id)
    } finally {
        confirmRemove.value = null
    }
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
                <button @click="router.push('/admin/logs')"
                    class="w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm tracking-tight text-white/40 hover:text-white hover:bg-white/5 transition-all text-left">
                    <i class="fa-solid fa-clock-rotate-left text-lg"></i>
                    Activity Logs
                </button>
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
                <div
                    class="flex items-center gap-4 px-6 py-4 rounded-2xl bg-primary text-white shadow-xl shadow-primary/20 font-bold text-sm tracking-tight">
                    <i class="fa-solid fa-envelope-open-text text-lg"></i>
                    Newsletter
                </div>
            </nav>
            <div class="mt-auto pt-6 border-t border-white/5 flex flex-col gap-2">
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
                    <h1 class="text-3xl sm:text-4xl font-black tracking-tight uppercase italic">Newsletter Subscribers</h1>
                    <p class="text-white/40 text-sm font-medium mt-1">
                        Manage everyone who subscribed to the Optimedia newsletter.
                    </p>
                </div>
                <div class="relative w-full sm:w-72">
                    <i class="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm"></i>
                    <input v-model="searchQuery" type="text" placeholder="Search by email..."
                        class="w-full bg-black/20 border border-white/5 rounded-xl py-2.5 pl-9 pr-4 text-sm text-white placeholder-white/20 focus:outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/20 transition-all" />
                </div>
            </div>

            <div v-if="adminStore.isNewsletterLoading" class="bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 overflow-hidden">
                <div class="p-5 border-b border-white/5">
                    <Skeleton width="10rem" height="1.2rem" />
                </div>
                <div class="divide-y divide-white/5">
                    <div v-for="i in 6" :key="i" class="flex items-center gap-4 px-5 py-4">
                        <Skeleton width="2.5rem" height="2.5rem" radius="0.75rem" />
                        <div class="flex-1 space-y-2">
                            <Skeleton width="55%" height="0.9rem" />
                        </div>
                        <Skeleton width="4rem" height="1.5rem" radius="0.5rem" />
                    </div>
                </div>
            </div>

            <div v-else-if="filteredSubscribers.length > 0"
                class="bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 shadow-xl overflow-hidden">
                <div class="p-4 sm:p-5 border-b border-white/5 flex items-center justify-between">
                    <p class="text-sm font-black uppercase tracking-widest text-white/60">
                        {{ filteredSubscribers.length }} subscriber{{ filteredSubscribers.length !== 1 ? 's' : '' }}
                    </p>
                    <span class="text-[10px] font-black uppercase tracking-widest text-white/30">
                        Appears in admin email tool &amp; promotions
                    </span>
                </div>
                <div class="divide-y divide-white/5">
                    <div v-for="sub in filteredSubscribers" :key="sub.id"
                        class="flex items-center gap-4 px-5 py-4 hover:bg-white/5 transition-all">
                        <div class="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/10 shrink-0">
                            <i class="fa-solid fa-envelope text-primary"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="font-black text-sm text-white truncate">{{ sub.email }}</p>
                            <p class="text-[11px] text-white/40 mt-1">
                                {{ new Date(sub.createdAt).toLocaleDateString() }}
                                <span v-if="!sub.active" class="ml-2 text-white/30">· inactive</span>
                            </p>
                        </div>
                        <template v-if="confirmRemove === sub.id">
                            <span class="text-[10px] font-black uppercase tracking-widest text-white/40 hidden sm:inline">Remove?</span>
                            <button @click="removeSubscriber(sub.id)"
                                class="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all text-xs font-black uppercase tracking-widest">
                                Yes
                            </button>
                            <button @click="confirmRemove = null"
                                class="px-3 py-1.5 rounded-lg bg-white/10 text-white/60 hover:bg-white/20 transition-all text-xs font-black uppercase tracking-widest">
                                No
                            </button>
                        </template>
                        <button v-else @click="confirmRemove = sub.id"
                            class="px-3 py-1.5 rounded-lg bg-white/5 text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all text-xs font-black uppercase tracking-widest">
                            Remove
                        </button>
                    </div>
                </div>
            </div>

            <div v-else
                class="bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 flex flex-col items-center justify-center py-20 text-center">
                <div class="h-16 w-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5 mb-6">
                    <i class="fa-solid fa-envelope-open text-2xl text-white/20"></i>
                </div>
                <h3 class="text-xl font-black text-white mb-2">No subscribers yet</h3>
                <p class="text-white/40 text-sm max-w-md">
                    Newsletter signups from the homepage will appear here.
                </p>
            </div>
        </main>
    </div>
</template>
