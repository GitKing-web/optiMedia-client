<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const activeTab = ref<'all' | 'pending' | 'active' | 'expiring'>('all')

// Mocked user database matching Neon relational structure concepts
interface UserSub {
    userId: string
    userName: string
    userEmail: string
    serviceName: string
    status: 'active' | 'pending' | 'none'
    price: number
    icon: string
    startDate?: string
    expireDate?: string
}

const users = ref<UserSub[]>([
    {
        userId: 'u101',
        userName: 'Tunde Bakare',
        userEmail: 'tunde.b@gmail.com',
        serviceName: 'Netflix Premium',
        status: 'active',
        price: 2500,
        icon: 'fa-solid fa-play',
        startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
        expireDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString() // 25 days left
    },
    {
        userId: 'u102',
        userName: 'Chidi Nwachukwu',
        userEmail: 'chidi.nwa@yahoo.com',
        serviceName: 'Spotify Premium',
        status: 'pending',
        price: 1000,
        icon: 'fa-brands fa-spotify'
    },
    {
        userId: 'u103',
        userName: 'Amina Yusuf',
        userEmail: 'amina_y@outlook.com',
        serviceName: 'Amazon Prime',
        status: 'active',
        price: 2000,
        icon: 'fa-brands fa-amazon',
        startDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(), // 25 days ago
        expireDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days left (Expiring soon)
    },
    {
        userId: 'u104',
        userName: 'Chioma Adebayo',
        userEmail: 'chioma.ade@hotmail.com',
        serviceName: 'Apple Music',
        status: 'active',
        price: 1000,
        icon: 'fa-brands fa-apple',
        startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
        expireDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString() // 20 days left
    },
    {
        userId: 'u105',
        userName: 'Bolaji Coker',
        userEmail: 'coker_bolaji@gmail.com',
        serviceName: 'YouTube Premium',
        status: 'pending',
        price: 1500,
        icon: 'fa-brands fa-youtube'
    },
    {
        userId: 'u106',
        userName: 'Kelechi Opara',
        userEmail: 'kopara.dev@outlook.com',
        status: 'none',
        serviceName: 'None',
        price: 0,
        icon: 'fa-solid fa-ban'
    }
])

// Calculate remaining days countdown
function getDaysRemaining(expireDateStr?: string) {
    if (!expireDateStr) return 0
    const now = Date.now()
    const exp = new Date(expireDateStr).getTime()
    const diff = exp - now
    if (diff <= 0) return 0
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

// Reactively search and filter users based on tabs
const filteredUsers = computed(() => {
    switch (activeTab.value) {
        case 'pending':
            return users.value.filter(u => u.status === 'pending')
        case 'active':
            return users.value.filter(u => u.status === 'active')
        case 'expiring':
            return users.value.filter(u => {
                if (u.status !== 'active' || !u.expireDate) return false
                const days = getDaysRemaining(u.expireDate)
                return days > 0 && days <= 10
            })
        case 'all':
        default:
            return users.value
    }
})

// Counts metrics
const totalUsersCount = computed(() => users.value.length)
const pendingCount = computed(() => users.value.filter(u => u.status === 'pending').length)
const activeCount = computed(() => users.value.filter(u => u.status === 'active').length)
const expiringCount = computed(() => {
    return users.value.filter(u => {
        if (u.status !== 'active' || !u.expireDate) return false
        const days = getDaysRemaining(u.expireDate)
        return days > 0 && days <= 10
    }).length
})

// Activate pending subscriptions
function activateSubscription(userId: string) {
    const user = users.value.find(u => u.userId === userId)
    if (user && user.status === 'pending') {
        user.status = 'active'
        user.startDate = new Date().toISOString()
        user.expireDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
        alert(`Successfully activated ${user.serviceName} subscription for ${user.userName}! Time countdown initialized.`)
    }
}

// Interval timer to force reactive re-evaluation of countdowns every minute
let updateInterval: any = null
onMounted(() => {
    updateInterval = setInterval(() => {
        // Simple force trigger update
        users.value = [...users.value]
    }, 60000)
})

onUnmounted(() => {
    if (updateInterval) clearInterval(updateInterval)
})
</script>

<template>
    <div class="min-h-screen bg-secondary text-white flex flex-col lg:flex-row relative">
        <!-- Sidebar Navigation -->
        <aside
            class="w-full lg:w-72 bg-black/40 border-b lg:border-b-0 lg:border-r border-white/5 flex flex-col p-8 lg:sticky top-0 h-auto lg:h-screen z-30">
            <div class="flex items-center justify-between mb-12">
                <div class="flex items-center gap-3">
                    <img src="/images/logo.jpeg" alt="Logo" class="h-10 w-10 rounded-xl" />
                    <span class="text-xl font-black tracking-tighter uppercase italic">OPTIMEDIA ADMIN</span>
                </div>
                <button @click="router.push('/dashboard')"
                    class="text-xs font-black uppercase tracking-widest text-primary hover:underline flex items-center gap-2">
                    <i class="fa-solid fa-desktop"></i> User Portal
                </button>
            </div>

            <nav class="hidden lg:flex flex-col gap-2 flex-1">
                <div
                    class="flex items-center gap-4 px-6 py-4 rounded-2xl cursor-pointer bg-primary text-white shadow-xl shadow-primary/20 font-bold text-sm tracking-tight">
                    <i class="fa-solid fa-users-gear text-lg"></i>
                    Users Database
                </div>
                <div @click="router.push('/dashboard')"
                    class="flex items-center gap-4 px-6 py-4 rounded-2xl cursor-pointer text-white/40 hover:text-white hover:bg-white/5 transition-all font-bold text-sm tracking-tight">
                    <i class="fa-solid fa-chart-line text-lg"></i>
                    User Dashboard
                </div>
            </nav>
        </aside>

        <!-- Main Content -->
        <main class="flex-1 p-6 lg:p-12 overflow-x-hidden flex flex-col">
            <!-- Header -->
            <header class="flex flex-col md:flex-row justify-between md:items-center gap-6 mb-12 relative z-10">
                <div>
                    <h1 class="text-4xl font-black tracking-tight uppercase italic">Admin Console</h1>
                    <p class="text-white/40 font-medium mt-1">Manage users database, activate sub sheets, and monitor
                        expiration times.</p>
                </div>
                <div class="flex items-center gap-6">
                    <div class="flex items-center gap-4 bg-black/20 p-2 pr-6 rounded-2xl border border-white/5">
                        <div
                            class="h-10 w-10 bg-primary rounded-xl flex items-center justify-center text-sm font-bold text-white uppercase italic">
                            AD
                        </div>
                        <div>
                            <p class="font-black text-sm text-white">Administrator</p>
                            <p class="text-[10px] font-bold text-primary uppercase tracking-widest">Global Master</p>
                        </div>
                    </div>
                </div>
            </header>

            <!-- Metrics grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                <div
                    class="bg-black/20 p-8 rounded-[2rem] border border-white/5 relative overflow-hidden group shadow-lg">
                    <p class="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Total Users</p>
                    <h3 class="text-4xl font-black">{{ totalUsersCount }}</h3>
                </div>
                <div
                    class="bg-black/20 p-8 rounded-[2rem] border border-white/5 relative overflow-hidden group shadow-lg">
                    <p class="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Pending Subs</p>
                    <h3 class="text-4xl font-black text-primary">{{ pendingCount }}</h3>
                </div>
                <div
                    class="bg-black/20 p-8 rounded-[2rem] border border-white/5 relative overflow-hidden group shadow-lg">
                    <p class="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-1">Active Users</p>
                    <h3 class="text-4xl font-black text-emerald-400">{{ activeCount }}</h3>
                </div>
                <div
                    class="bg-black/20 p-8 rounded-[2rem] border border-white/5 relative overflow-hidden group shadow-lg">
                    <p class="text-[10px] font-black uppercase tracking-widest text-red-400 mb-1">Expiring in 10d</p>
                    <h3 class="text-4xl font-black text-red-400">{{ expiringCount }}</h3>
                </div>
            </div>

            <!-- Tabbed Panel -->
            <div class="flex-1 bg-black/20 rounded-[2.5rem] border border-white/5 p-6 lg:p-10 flex flex-col">
                <!-- Tabs controls -->
                <div class="flex flex-wrap gap-4 mb-8">
                    <button @click="activeTab = 'all'"
                        class="px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                        :class="activeTab === 'all' ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'bg-white/5 text-white/60 hover:text-white'">
                        All Users ({{ totalUsersCount }})
                    </button>
                    <button @click="activeTab = 'pending'"
                        class="px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                        :class="activeTab === 'pending' ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'bg-white/5 text-white/60 hover:text-white'">
                        Pending Subs ({{ pendingCount }})
                    </button>
                    <button @click="activeTab = 'active'"
                        class="px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                        :class="activeTab === 'active' ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'bg-white/5 text-white/60 hover:text-white'">
                        Active Users ({{ activeCount }})
                    </button>
                    <button @click="activeTab = 'expiring'"
                        class="px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                        :class="activeTab === 'expiring' ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'bg-white/5 text-white/60 hover:text-white'">
                        Expiring Sub ({{ expiringCount }})
                    </button>
                </div>

                <!-- Database Table list view -->
                <div class="overflow-x-auto flex-1">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr
                                class="border-b border-white/5 text-white/40 text-[10px] font-black uppercase tracking-widest">
                                <th class="py-4 px-6">User Info</th>
                                <th class="py-4 px-6">Service Requested</th>
                                <th class="py-4 px-6">Sub Status</th>
                                <th class="py-4 px-6">Billing Info / Expiry</th>
                                <th class="py-4 px-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="user in filteredUsers" :key="user.userId"
                                class="border-b border-white/5 hover:bg-white/5 transition-all">
                                <td class="py-6 px-6">
                                    <h4 class="font-black text-sm text-white">{{ user.userName }}</h4>
                                    <p class="text-xs text-white/40 mt-0.5">{{ user.userEmail }}</p>
                                </td>
                                <td class="py-6 px-6">
                                    <div class="flex items-center gap-3">
                                        <div
                                            class="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center text-md border border-white/10 shadow-sm">
                                            <i :class="user.icon"></i>
                                        </div>
                                        <div>
                                            <span class="font-bold text-sm text-white">{{ user.serviceName }}</span>
                                            <p v-if="user.price > 0" class="text-[10px] text-white/40 mt-0.5">₦{{
                                                user.price.toLocaleString() }}/mo</p>
                                        </div>
                                    </div>
                                </td>
                                <td class="py-6 px-6">
                                    <span v-if="user.status === 'active'"
                                        class="inline-block px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                        Active
                                    </span>
                                    <span v-else-if="user.status === 'pending'"
                                        class="inline-block px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                        Pending Action
                                    </span>
                                    <span v-else
                                        class="inline-block px-3 py-1 bg-white/5 text-white/30 border border-white/5 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                        No Sub
                                    </span>
                                </td>
                                <td class="py-6 px-6">
                                    <div v-if="user.status === 'active' && user.expireDate">
                                        <!-- Countdown math display -->
                                        <p class="text-sm font-black text-white/90">
                                            {{ getDaysRemaining(user.expireDate) }} days remaining
                                        </p>
                                        <p class="text-[10px] text-white/40 mt-1 uppercase tracking-widest">
                                            Expires: {{ new Date(user.expireDate).toLocaleDateString() }}
                                        </p>
                                    </div>
                                    <span v-else class="text-xs text-white/30 uppercase tracking-widest font-bold">
                                        --
                                    </span>
                                </td>
                                <td class="py-6 px-6 text-right">
                                    <button v-if="user.status === 'pending'" @click="activateSubscription(user.userId)"
                                        class="bg-emerald-500 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg hover:-translate-y-0.5 hover:shadow-emerald-500/20 active:scale-95">
                                        Activate Sub
                                    </button>
                                    <span v-else class="text-xs text-white/20 uppercase font-black tracking-widest">
                                        Locked
                                    </span>
                                </td>
                            </tr>
                            <tr v-if="filteredUsers.length === 0">
                                <td colspan="5"
                                    class="py-12 text-center text-white/30 font-bold uppercase tracking-widest">
                                    No database entries found for this state
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    </div>
</template>

<style scoped></style>
