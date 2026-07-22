<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminStore } from '../stores/admin'
import type { AdminUserRow } from '../stores/admin'

const router = useRouter()
const adminStore = useAdminStore()
const searchQuery = ref('')
const selectedRow = ref<AdminUserRow | null>(null)
const showUserModal = ref(false)
const selectedIds = ref<Set<string>>(new Set())

// Computed directly from users array to prevent stale/incorrect summary counts from the store
const totalUsersCount = computed(() => adminStore.users.length || adminStore.summary.totalUsers)
const pendingCount = computed(() => adminStore.users.filter((u) => u.status === 'pending').length)
const activeCount = computed(() => adminStore.users.filter((u) => u.status === 'active').length)
const expiringCount = computed(() => adminStore.summary.expiringCount)

const filteredUsers = computed(() => {
    const q = searchQuery.value.toLowerCase().trim()
    if (!q) return adminStore.users
    return adminStore.users.filter(
        (u) =>
            u.userName.toLowerCase().includes(q) ||
            u.userEmail.toLowerCase().includes(q) ||
            u.whatsappContact.includes(q),
    )
})

const pendingUsers = computed(() => adminStore.users.filter((u) => u.status === 'pending'))

const activeTab = computed({
    get: () => adminStore.activeTab,
    set: (value) => {
        adminStore.activeTab = value
    },
})

watch(() => adminStore.activeTab, (tab) => {
    searchQuery.value = ''
    selectedIds.value = new Set()
    adminStore.fetchUsers(tab).catch(() => null)
})

onMounted(async () => {
    await adminStore.refresh()
})

async function openUserDetail(user: AdminUserRow) {
    selectedRow.value = user
    showUserModal.value = true
    adminStore.fetchUserDetail(user.userId)
}

function toggleSelect(userId: string) {
    const next = new Set(selectedIds.value)
    if (next.has(userId)) next.delete(userId)
    else next.add(userId)
    selectedIds.value = next
}

function toggleSelectAll() {
    const pending = pendingUsers.value
    if (selectedIds.value.size === pending.length) {
        selectedIds.value = new Set()
    } else {
        selectedIds.value = new Set(pending.map((u) => u.userId))
    }
}

async function bulkActivate() {
    if (selectedIds.value.size === 0) return
    await adminStore.bulkActivate(Array.from(selectedIds.value))
    selectedIds.value = new Set()
}

function getDaysRemaining(expireDateStr?: string) {
    if (!expireDateStr) return 0
    const diff = new Date(expireDateStr).getTime() - Date.now()
    if (diff <= 0) return 0
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
}
</script>

<template>
    <div class="min-h-screen bg-secondary text-white flex flex-col lg:flex-row relative">
        <aside
            class="w-full lg:w-72 bg-black/40 border-b lg:border-b-0 lg:border-r border-white/5 flex flex-col p-6 sm:p-8 lg:sticky top-0 h-auto lg:h-screen z-30">
            <div class="flex items-center gap-3 mb-8 lg:mb-12">
                <img src="/images/logo.jpeg" alt="Logo" class="h-10 w-10 rounded-xl" />
                <span class="text-xl font-black tracking-tighter uppercase italic">OPTIMEDIA ADMIN</span>
            </div>
            <nav class="flex flex-col gap-2 flex-1">
                <div
                    class="flex items-center gap-4 px-6 py-4 rounded-2xl bg-primary text-white shadow-xl shadow-primary/20 font-bold text-sm tracking-tight">
                    <i class="fa-solid fa-users-gear text-lg"></i>
                    Users
                </div>
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
            </nav>
            <div class="mt-auto pt-6 border-t border-white/5 flex flex-col gap-2">
                <button @click="adminStore.downloadCSV()"
                    class="w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl font-bold text-sm tracking-tight text-white/40 hover:text-white hover:bg-white/5 transition-all text-left">
                    <i class="fa-solid fa-download text-lg"></i>
                    Export CSV
                </button>
            </div>
        </aside>

        <main class="flex-1 p-4 sm:p-6 lg:p-8 2xl:p-12 overflow-x-hidden flex flex-col">
            <div v-if="adminStore.isLoading && adminStore.users.length === 0"
                class="flex items-center justify-center py-24 flex-1">
                <div class="flex flex-col items-center gap-4">
                    <svg class="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none"
                        viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4">
                        </circle>
                        <path class="opacity-75" fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    <p class="text-white/40 text-sm font-bold uppercase tracking-widest">Loading admin data...</p>
                </div>
            </div>
            <div v-else class="flex flex-col flex-1 gap-6">
                <header class="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div>
                        <h1 class="text-3xl sm:text-4xl font-black tracking-tight uppercase italic">Admin Console</h1>
                        <p class="text-white/40 text-sm font-medium mt-1">Manage users, activate subscriptions, and
                            monitor activity.</p>
                    </div>
                </header>

                <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div class="bg-black/20 p-5 sm:p-6 rounded-2xl border border-white/5">
                        <p class="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Total Users</p>
                        <h3 class="text-2xl sm:text-3xl font-black">{{ totalUsersCount }}</h3>
                    </div>
                    <div class="bg-black/20 p-5 sm:p-6 rounded-2xl border border-white/5">
                        <p class="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Pending</p>
                        <h3 class="text-2xl sm:text-3xl font-black text-primary">{{ pendingCount }}</h3>
                    </div>
                    <div class="bg-black/20 p-5 sm:p-6 rounded-2xl border border-white/5">
                        <p class="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-1">Active</p>
                        <h3 class="text-2xl sm:text-3xl font-black text-emerald-400">{{ activeCount }}</h3>
                    </div>
                    <div class="bg-black/20 p-5 sm:p-6 rounded-2xl border border-white/5">
                        <p class="text-[10px] font-black uppercase tracking-widest text-red-400 mb-1">Expiring Soon</p>
                        <h3 class="text-2xl sm:text-3xl font-black text-red-400">{{ expiringCount }}</h3>
                    </div>
                </div>

                <div class="flex-1 bg-black/20 rounded-3xl border border-white/5 p-4 sm:p-6 lg:p-8 flex flex-col gap-5">
                    <div class="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                        <div class="flex flex-wrap gap-2">
                            <button @click="activeTab = 'all'"
                                class="px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                :class="activeTab === 'all' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white/5 text-white/60 hover:text-white'">
                                All ({{ totalUsersCount }})
                            </button>
                            <button @click="activeTab = 'pending'"
                                class="px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                :class="activeTab === 'pending' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white/5 text-white/60 hover:text-white'">
                                Pending ({{ pendingCount }})
                            </button>
                            <button @click="activeTab = 'active'"
                                class="px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                :class="activeTab === 'active' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white/5 text-white/60 hover:text-white'">
                                Active ({{ activeCount }})
                            </button>
                            <button @click="activeTab = 'expiring'"
                                class="px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                :class="activeTab === 'expiring' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white/5 text-white/60 hover:text-white'">
                                Expiring ({{ expiringCount }})
                            </button>
                        </div>
                        <div class="relative w-full sm:w-64">
                            <i
                                class="fa-solid fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20 text-sm"></i>
                            <input v-model="searchQuery" type="text" placeholder="Search users..."
                                class="w-full bg-white/5 border border-white/5 rounded-xl py-2.5 pl-9 pr-4 text-sm text-white placeholder-white/20 focus:outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/20 transition-all" />
                        </div>
                    </div>

                    <div v-if="activeTab === 'pending' && pendingUsers.length > 0" class="flex items-center gap-3">
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" :checked="selectedIds.size === pendingUsers.length && pendingUsers.length > 0"
                                @change="toggleSelectAll"
                                class="w-4 h-4 rounded border-white/20 text-primary focus:ring-primary" />
                            <span class="text-[10px] font-black uppercase tracking-widest text-white/40">Select All</span>
                        </label>
                        <button v-if="selectedIds.size > 0" @click="bulkActivate"
                            :disabled="adminStore.bulkActivating"
                            class="bg-emerald-500 text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all disabled:opacity-50">
                            {{ adminStore.bulkActivating ? 'Activating...' : `Activate (${selectedIds.size})` }}
                        </button>
                    </div>

                    <div class="overflow-x-auto -mx-4 sm:-mx-6 lg:mx-0 flex-1">
                        <div class="inline-block min-w-full align-middle px-4 sm:px-6 lg:px-0">
                            <table class="w-full text-left border-collapse">
                                <thead>
                                    <tr
                                        class="border-b border-white/5 text-white/40 text-[10px] font-black uppercase tracking-widest">
                                        <th v-if="activeTab === 'pending'" class="py-4 px-2 w-10"></th>
                                        <th class="py-4 px-4 sm:px-5">User</th>
                                        <th class="py-4 px-4 sm:px-5">WhatsApp</th>
                                        <th class="py-4 px-4 sm:px-5">Service</th>
                                        <th class="py-4 px-4 sm:px-5">Status</th>
                                        <th class="py-4 px-4 sm:px-5">Expiry</th>
                                        <th class="py-4 px-4 sm:px-5 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-white/5">
                                    <tr v-for="user in filteredUsers" :key="user.userId"
                                        class="hover:bg-white/5 transition-all">
                                        <td v-if="activeTab === 'pending'" class="py-4 px-2">
                                            <input type="checkbox" :checked="selectedIds.has(user.userId)"
                                                @change="toggleSelect(user.userId)"
                                                class="w-4 h-4 rounded border-white/20 text-primary focus:ring-primary" />
                                        </td>
                                        <td class="py-4 px-4 sm:px-5 cursor-pointer" @click="openUserDetail(user)">
                                            <h4 class="font-black text-sm text-white hover:text-primary transition-colors">{{ user.userName }}</h4>
                                            <p class="text-xs text-white/40 mt-0.5">{{ user.userEmail }}</p>
                                        </td>
                                        <td class="py-4 px-4 sm:px-5">
                                            <span class="font-bold text-sm text-white/80">{{ user.whatsappContact }}</span>
                                        </td>
                                        <td class="py-4 px-4 sm:px-5">
                                            <div class="flex items-center gap-2">
                                                <div
                                                    class="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-sm border border-white/10 shrink-0">
                                                    <i :class="user.icon"></i>
                                                </div>
                                                <span class="font-bold text-sm text-white">{{ user.serviceName }}</span>
                                            </div>
                                        </td>
                                        <td class="py-4 px-4 sm:px-5">
                                            <span v-if="user.status === 'active'"
                                                class="inline-block px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                                Active
                                            </span>
                                            <span v-else-if="user.status === 'pending'"
                                                class="inline-block px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                                Pending
                                            </span>
                                            <span v-else
                                                class="inline-block px-2.5 py-1 bg-white/5 text-white/30 border border-white/5 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                                No Sub
                                            </span>
                                        </td>
                                        <td class="py-4 px-4 sm:px-5">
                                            <div v-if="user.status === 'active' && user.expireDate" class="whitespace-nowrap">
                                                <p class="text-sm font-black text-white/90">{{ getDaysRemaining(user.expireDate) }}d
                                                </p>
                                                <p class="text-[10px] text-white/40 mt-0.5">{{
                                                    new Date(user.expireDate).toLocaleDateString() }}</p>
                                            </div>
                                            <span v-else class="text-xs text-white/20 font-bold">--</span>
                                        </td>
                                        <td class="py-4 px-4 sm:px-5 text-right whitespace-nowrap">
                                            <button v-if="user.status === 'pending'" @click="adminStore.activateSubscription(user.userId)"
                                                class="bg-emerald-500 text-white px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all active:scale-95">
                                                Activate
                                            </button>
                                            <button v-else @click="openUserDetail(user)"
                                                class="bg-white/5 text-white/60 px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                    <tr v-if="filteredUsers.length === 0">
                                        <td :colspan="activeTab === 'pending' ? 7 : 6"
                                            class="py-16 text-center text-white/30 font-bold uppercase tracking-widest">
                                            <div class="flex flex-col items-center gap-3">
                                                <i class="fa-solid fa-users-slash text-2xl text-white/10"></i>
                                                <span>No users match your search</span>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    </div>

    <!-- User Detail Modal -->
    <Teleport to="body">
        <div v-if="showUserModal" @click.self="showUserModal = false"
            class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div class="bg-secondary border border-white/5 rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl">
                <div class="sticky top-0 bg-secondary border-b border-white/5 p-6 flex items-center justify-between">
                    <h2 class="text-xl font-black uppercase tracking-tight italic">
                        {{ adminStore.selectedUserDetail?.name || selectedRow?.userName || 'User Detail' }}
                    </h2>
                    <button @click="showUserModal = false" class="text-white/40 hover:text-white text-xl">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>

                <div v-if="adminStore.isDetailLoading" class="flex items-center justify-center py-16">
                    <svg class="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                </div>

                <div v-else-if="adminStore.selectedUserDetail" class="p-6 space-y-6">
                    <div class="grid grid-cols-2 gap-4 p-4 bg-black/20 rounded-2xl">
                        <div>
                            <p class="text-[10px] font-black uppercase tracking-widest text-white/40">Email</p>
                            <p class="text-sm font-bold text-white mt-1 break-all">{{ adminStore.selectedUserDetail.email }}</p>
                        </div>
                        <div>
                            <p class="text-[10px] font-black uppercase tracking-widest text-white/40">WhatsApp</p>
                            <p class="text-sm font-bold text-white mt-1">{{ adminStore.selectedUserDetail.whatsapp }}</p>
                        </div>
                        <div>
                            <p class="text-[10px] font-black uppercase tracking-widest text-white/40">Role</p>
                            <p class="text-sm font-bold text-white mt-1 uppercase">{{ adminStore.selectedUserDetail.role }}</p>
                        </div>
                        <div>
                            <p class="text-[10px] font-black uppercase tracking-widest text-white/40">Joined</p>
                            <p class="text-sm font-bold text-white mt-1">{{ new Date(adminStore.selectedUserDetail.createdAt).toLocaleDateString() }}</p>
                        </div>
                    </div>

                    <div v-if="adminStore.selectedUserDetail.subscriptions.length > 0">
                        <h3 class="text-sm font-black uppercase tracking-widest text-white/60 mb-3">Subscriptions</h3>
                        <div class="space-y-2">
                            <div v-for="sub in adminStore.selectedUserDetail.subscriptions" :key="sub.id"
                                class="flex items-center justify-between p-3 bg-black/20 rounded-xl">
                                <div class="flex items-center gap-3">
                                    <i :class="sub.icon" class="text-lg text-white/60"></i>
                                    <div>
                                        <p class="text-sm font-bold text-white">{{ sub.serviceName }}</p>
                                        <p class="text-[10px] text-white/40">₦{{ sub.price.toLocaleString() }}/mo</p>
                                    </div>
                                </div>
                                <div class="text-right">
                                    <span :class="sub.status === 'active' ? 'text-emerald-400' : sub.status === 'pending' ? 'text-primary' : 'text-white/30'"
                                        class="text-[10px] font-black uppercase tracking-widest">{{ sub.status }}</span>
                                    <p v-if="sub.nextBilling" class="text-[9px] text-white/30 mt-0.5">Expires {{ new Date(sub.nextBilling).toLocaleDateString() }}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div v-if="adminStore.selectedUserDetail.payments.length > 0">
                        <h3 class="text-sm font-black uppercase tracking-widest text-white/60 mb-3">Payments (last 20)</h3>
                        <div class="space-y-2">
                            <div v-for="p in adminStore.selectedUserDetail.payments" :key="p.id"
                                class="flex items-center justify-between p-3 bg-black/20 rounded-xl">
                                <div class="flex items-center gap-3">
                                    <i class="fa-solid fa-credit-card text-white/40"></i>
                                    <div>
                                        <p class="text-xs font-bold text-white">{{ p.reference.slice(0, 16) }}...</p>
                                        <p class="text-[9px] text-white/40">{{ new Date(p.createdAt).toLocaleDateString() }}</p>
                                    </div>
                                </div>
                                <div class="text-right">
                                    <p class="text-sm font-black text-white">₦{{ p.amount.toLocaleString() }}</p>
                                    <span :class="p.status === 'success' ? 'text-emerald-400' : 'text-red-400'"
                                        class="text-[9px] font-black uppercase tracking-widest">{{ p.status }}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div v-if="adminStore.selectedUserDetail.activities.length > 0">
                        <h3 class="text-sm font-black uppercase tracking-widest text-white/60 mb-3">Activity Timeline</h3>
                        <div class="space-y-2">
                            <div v-for="a in adminStore.selectedUserDetail.activities" :key="a.id"
                                class="flex items-center justify-between p-3 bg-black/20 rounded-xl">
                                <div class="flex items-center gap-3">
                                    <i :class="a.type === 'payment' ? 'fa-solid fa-credit-card' : 'fa-solid fa-arrow-trend-up'"
                                        class="text-white/40"></i>
                                    <div>
                                        <p class="text-xs font-bold text-white">{{ a.service }}</p>
                                        <p class="text-[9px] text-white/40">{{ a.date }}</p>
                                    </div>
                                </div>
                                <div class="text-right">
                                    <p class="text-sm font-bold text-white">{{ a.amount }}</p>
                                    <span :class="a.status === 'Completed' ? 'text-emerald-400' : 'text-primary'"
                                        class="text-[9px] font-black uppercase tracking-widest">{{ a.status }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </Teleport>

</template>

<style scoped>
::-webkit-scrollbar { height: 6px; width: 6px; }
::-webkit-scrollbar-track { background: rgba(15, 23, 42, 0.3); }
::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.4); border-radius: 10px; }
::-webkit-scrollbar-thumb:hover { background: rgba(99, 102, 241, 0.7); }
</style>