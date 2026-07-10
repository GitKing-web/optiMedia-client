<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminStore } from '../stores/admin'

const router = useRouter()
const adminStore = useAdminStore()

const totalUsersCount = computed(() => adminStore.summary.totalUsers)
const pendingCount = computed(() => adminStore.summary.pendingCount)
const activeCount = computed(() => adminStore.summary.activeCount)
const expiringCount = computed(() => adminStore.summary.expiringCount)
const filteredUsers = computed(() => adminStore.users)
const activeTab = computed({
    get: () => adminStore.activeTab,
    set: (value) => {
        adminStore.activeTab = value
    }
})

watch(() => adminStore.activeTab, (tab) => {
    adminStore.fetchUsers(tab).catch(() => null)
})

onMounted(async () => {
    await adminStore.refresh()
})

async function activateSubscription(userId: string) {
    await adminStore.activateSubscription(userId)
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
    <aside class="w-full lg:w-72 bg-black/40 border-b lg:border-b-0 lg:border-r border-white/5 flex flex-col p-6 sm:p-8 lg:sticky top-0 h-auto lg:h-screen z-30">
      <div class="flex items-center gap-3 mb-8 lg:mb-12">
        <img src="/images/logo.jpeg" alt="Logo" class="h-10 w-10 rounded-xl animate-pulse" />
        <span class="text-xl font-black tracking-tighter uppercase italic">OPTIMEDIA ADMIN</span>
      </div>
      <nav class="flex flex-col gap-2 flex-1">
        <div class="flex items-center gap-4 px-6 py-4 rounded-2xl bg-primary text-white shadow-xl shadow-primary/20 font-bold text-sm tracking-tight">
          <i class="fa-solid fa-users-gear text-lg"></i>
          Users Database
        </div>
      </nav>
    </aside>

    <main class="flex-1 p-4 sm:p-6 lg:p-12 overflow-x-hidden flex flex-col">
      <header class="flex flex-col md:flex-row justify-between md:items-center gap-6 mb-12 relative z-10">
        <div>
          <h1 class="text-3xl sm:text-4xl font-black tracking-tight uppercase italic">Admin Console</h1>
          <p class="text-white/40 text-sm sm:text-base font-medium mt-1">Manage users, activate subscriptions, and monitor expiration times.</p>
        </div>
        <div class="flex items-center gap-6">
          <button @click="router.push('/dashboard')" class="bg-white/5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest text-white/60 hover:text-white transition-colors">
            Back to Dashboard
          </button>
        </div>
      </header>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12">
        <div class="bg-black/20 p-6 sm:p-8 rounded-[1.8rem] sm:rounded-[2rem] border border-white/5 shadow-lg">
          <p class="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Total Users</p>
          <h3 class="text-3xl sm:text-4xl font-black">{{ totalUsersCount }}</h3>
        </div>
        <div class="bg-black/20 p-6 sm:p-8 rounded-[1.8rem] sm:rounded-[2rem] border border-white/5 shadow-lg">
          <p class="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Pending Subs</p>
          <h3 class="text-3xl sm:text-4xl font-black text-primary">{{ pendingCount }}</h3>
        </div>
        <div class="bg-black/20 p-6 sm:p-8 rounded-[1.8rem] sm:rounded-[2rem] border border-white/5 shadow-lg">
          <p class="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-1">Active Users</p>
          <h3 class="text-3xl sm:text-4xl font-black text-emerald-400">{{ activeCount }}</h3>
        </div>
        <div class="bg-black/20 p-6 sm:p-8 rounded-[1.8rem] sm:rounded-[2rem] border border-white/5 shadow-lg">
          <p class="text-[10px] font-black uppercase tracking-widest text-red-400 mb-1">Expiring in 10d</p>
          <h3 class="text-3xl sm:text-4xl font-black text-red-400">{{ expiringCount }}</h3>
        </div>
      </div>

      <div class="flex-1 bg-black/20 rounded-[2rem] sm:rounded-[2.5rem] border border-white/5 p-4 sm:p-6 lg:p-10 flex flex-col">
        <div class="flex flex-wrap gap-2 sm:gap-4 mb-8">
          <button @click="activeTab = 'all'" class="px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all" :class="activeTab === 'all' ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'bg-white/5 text-white/60 hover:text-white'">
            All ({{ totalUsersCount }})
          </button>
          <button @click="activeTab = 'pending'" class="px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all" :class="activeTab === 'pending' ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'bg-white/5 text-white/60 hover:text-white'">
            Pending ({{ pendingCount }})
          </button>
          <button @click="activeTab = 'active'" class="px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all" :class="activeTab === 'active' ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'bg-white/5 text-white/60 hover:text-white'">
            Active ({{ activeCount }})
          </button>
          <button @click="activeTab = 'expiring'" class="px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all" :class="activeTab === 'expiring' ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'bg-white/5 text-white/60 hover:text-white'">
            Expiring ({{ expiringCount }})
          </button>
        </div>

        <div class="overflow-x-auto -mx-4 sm:-mx-6 lg:mx-0 flex-1">
          <div class="inline-block min-w-full align-middle px-4 sm:px-6 lg:px-0">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-white/5 text-white/40 text-[10px] font-black uppercase tracking-widest">
                  <th class="py-4 px-4 sm:px-6">User Info</th>
                  <th class="py-4 px-4 sm:px-6">WhatsApp Contact</th>
                  <th class="py-4 px-4 sm:px-6">Service Requested</th>
                  <th class="py-4 px-4 sm:px-6">Sub Status</th>
                  <th class="py-4 px-4 sm:px-6">Billing Info / Expiry</th>
                  <th class="py-4 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-white/5">
                <tr v-for="user in filteredUsers" :key="user.userId" class="hover:bg-white/5 transition-all">
                  <td class="py-5 sm:py-6 px-4 sm:px-6">
                    <h4 class="font-black text-sm text-white whitespace-nowrap">{{ user.userName }}</h4>
                    <p class="text-xs text-white/40 mt-0.5 whitespace-nowrap">{{ user.userEmail }}</p>
                  </td>
                  <td class="py-5 sm:py-6 px-4 sm:px-6">
                    <div class="flex items-center gap-2">
                      <i class="fa-brands fa-whatsapp text-emerald-400 text-base"></i>
                      <span class="font-bold text-sm text-white/80 whitespace-nowrap tracking-wide">{{ user.whatsappContact }}</span>
                    </div>
<<<<<<< HEAD
                  </td>
                  <td class="py-5 sm:py-6 px-4 sm:px-6">
                    <div class="flex items-center gap-3">
                      <div class="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center text-md border border-white/10 shadow-sm shrink-0">
                        <i :class="user.icon"></i>
                      </div>
                      <div>
                        <span class="font-bold text-sm text-white whitespace-nowrap">{{ user.serviceName }}</span>
                        <p v-if="user.price > 0" class="text-[10px] text-white/40 mt-0.5 whitespace-nowrap">₦{{ user.price.toLocaleString() }}/mo</p>
                      </div>
=======
                </div>
            </header>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12">
                <div class="bg-black/20 p-6 sm:p-8 rounded-[1.8rem] sm:rounded-4xl border border-white/5 relative overflow-hidden group shadow-lg">
                    <p class="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Total Users</p>
                    <h3 class="text-3xl sm:text-4xl font-black">{{ totalUsersCount }}</h3>
                </div>
                <div class="bg-black/20 p-6 sm:p-8 rounded-[1.8rem] sm:rounded-4xl border border-white/5 relative overflow-hidden group shadow-lg">
                    <p class="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Pending Subs</p>
                    <h3 class="text-3xl sm:text-4xl font-black text-primary">{{ pendingCount }}</h3>
                </div>
                <div class="bg-black/20 p-6 sm:p-8 rounded-[1.8rem] sm:rounded-4xl border border-white/5 relative overflow-hidden group shadow-lg">
                    <p class="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-1">Active Users</p>
                    <h3 class="text-3xl sm:text-4xl font-black text-emerald-400">{{ activeCount }}</h3>
                </div>
                <div class="bg-black/20 p-6 sm:p-8 rounded-[1.8rem] sm:rounded-4xl border border-white/5 relative overflow-hidden group shadow-lg">
                    <p class="text-[10px] font-black uppercase tracking-widest text-red-400 mb-1">Expiring in 10d</p>
                    <h3 class="text-3xl sm:text-4xl font-black text-red-400">{{ expiringCount }}</h3>
                </div>
            </div>

            <div class="flex-1 bg-black/20 rounded-4xl sm:rounded-[2.5rem] border border-white/5 p-4 sm:p-6 lg:p-10 flex flex-col">
                <div class="flex flex-wrap gap-2 sm:gap-4 mb-8">
                    <button @click="activeTab = 'all'"
                        class="px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all"
                        :class="activeTab === 'all' ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'bg-white/5 text-white/60 hover:text-white'">
                        All ({{ totalUsersCount }})
                    </button>
                    <button @click="activeTab = 'pending'"
                        class="px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all"
                        :class="activeTab === 'pending' ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'bg-white/5 text-white/60 hover:text-white'">
                        Pending ({{ pendingCount }})
                    </button>
                    <button @click="activeTab = 'active'"
                        class="px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all"
                        :class="activeTab === 'active' ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'bg-white/5 text-white/60 hover:text-white'">
                        Active ({{ activeCount }})
                    </button>
                    <button @click="activeTab = 'expiring'"
                        class="px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all"
                        :class="activeTab === 'expiring' ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'bg-white/5 text-white/60 hover:text-white'">
                        Expiring ({{ expiringCount }})
                    </button>
                </div>

                <div class="overflow-x-auto -mx-4 sm:-mx-6 lg:mx-0 flex-1">
                    <div class="inline-block min-w-full align-middle px-4 sm:px-6 lg:px-0">
                        <table class="w-full text-left border-collapse">
                            <thead>
                                <tr class="border-b border-white/5 text-white/40 text-[10px] font-black uppercase tracking-widest">
                                    <th class="py-4 px-4 sm:px-6">User Info</th>
                                    <th class="py-4 px-4 sm:px-6">WhatsApp Contact</th>
                                    <th class="py-4 px-4 sm:px-6">Service Requested</th>
                                    <th class="py-4 px-4 sm:px-6">Sub Status</th>
                                    <th class="py-4 px-4 sm:px-6">Billing Info / Expiry</th>
                                    <th class="py-4 px-4 sm:px-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-white/5">
                                <tr v-for="user in filteredUsers" :key="user.userId"
                                    class="hover:bg-white/5 transition-all">
                                    <td class="py-5 sm:py-6 px-4 sm:px-6">
                                        <h4 class="font-black text-sm text-white whitespace-nowrap">{{ user.userName }}</h4>
                                        <p class="text-xs text-white/40 mt-0.5 whitespace-nowrap">{{ user.userEmail }}</p>
                                    </td>
                                    <td class="py-5 sm:py-6 px-4 sm:px-6">
                                        <div class="flex items-center gap-2">
                                            <i class="fa-brands fa-whatsapp text-emerald-400 text-base"></i>
                                            <span class="font-bold text-sm text-white/80 whitespace-nowrap tracking-wide">{{ user.whatsappContact }}</span>
                                        </div>
                                    </td>
                                    <td class="py-5 sm:py-6 px-4 sm:px-6">
                                        <div class="flex items-center gap-3">
                                            <div
                                                class="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center text-md border border-white/10 shadow-sm shrink-0">
                                                <i :class="user.icon"></i>
                                            </div>
                                            <div>
                                                <span class="font-bold text-sm text-white whitespace-nowrap">{{ user.serviceName }}</span>
                                                <p v-if="user.price > 0" class="text-[10px] text-white/40 mt-0.5 whitespace-nowrap">₦{{
                                                    user.price.toLocaleString() }}/mo</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="py-5 sm:py-6 px-4 sm:px-6">
                                        <span v-if="user.status === 'active'"
                                            class="inline-block px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                                            Active
                                        </span>
                                        <span v-else-if="user.status === 'pending'"
                                            class="inline-block px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                                            Pending Action
                                        </span>
                                        <span v-else
                                            class="inline-block px-3 py-1 bg-white/5 text-white/30 border border-white/5 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                                            No Sub
                                        </span>
                                    </td>
                                    <td class="py-5 sm:py-6 px-4 sm:px-6">
                                        <div v-if="user.status === 'active' && user.expireDate" class="whitespace-nowrap">
                                            <p class="text-sm font-black text-white/90">
                                                {{ getDaysRemaining(user.expireDate) }} days remaining
                                            </p>
                                            <p class="text-[10px] text-white/40 mt-1 uppercase tracking-widest">
                                                Expires: {{ new Date(user.expireDate).toLocaleDateString() }}
                                            </p>
                                        </div>
                                        <span v-else class="text-xs text-white/30 uppercase tracking-widest font-bold whitespace-nowrap">
                                            --
                                        </span>
                                    </td>
                                    <td class="py-5 sm:py-6 px-4 sm:px-6 text-right whitespace-nowrap">
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
                                    <td colspan="6"
                                        class="py-12 text-center text-white/30 font-bold uppercase tracking-widest">
                                        No database entries found for this state
                                    </td>
                                </tr>
                            </tbody>
                        </table>
>>>>>>> 6562128ef360ec30ebd304f9fb9f02e7fabfa6f3
                    </div>
                  </td>
                  <td class="py-5 sm:py-6 px-4 sm:px-6">
                    <span v-if="user.status === 'active'" class="inline-block px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                      Active
                    </span>
                    <span v-else-if="user.status === 'pending'" class="inline-block px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                      Pending Action
                    </span>
                    <span v-else class="inline-block px-3 py-1 bg-white/5 text-white/30 border border-white/5 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                      No Sub
                    </span>
                  </td>
                  <td class="py-5 sm:py-6 px-4 sm:px-6">
                    <div v-if="user.status === 'active' && user.expireDate" class="whitespace-nowrap">
                      <p class="text-sm font-black text-white/90">{{ getDaysRemaining(user.expireDate) }} days remaining</p>
                      <p class="text-[10px] text-white/40 mt-1 uppercase tracking-widest">Expires: {{ new Date(user.expireDate).toLocaleDateString() }}</p>
                    </div>
                    <span v-else class="text-xs text-white/30 uppercase tracking-widest font-bold whitespace-nowrap">--</span>
                  </td>
                  <td class="py-5 sm:py-6 px-4 sm:px-6 text-right whitespace-nowrap">
                    <button v-if="user.status === 'pending'" @click="activateSubscription(user.userId)" class="bg-emerald-500 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg active:scale-95">
                      Activate Sub
                    </button>
                    <span v-else class="text-xs text-white/20 uppercase font-black tracking-widest">Locked</span>
                  </td>
                </tr>
                <tr v-if="filteredUsers.length === 0">
                  <td colspan="6" class="py-12 text-center text-white/30 font-bold uppercase tracking-widest">No database entries found for this state</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
::-webkit-scrollbar {
  height: 6px;
  width: 6px;
}
::-webkit-scrollbar-track {
  background: rgba(15, 23, 42, 0.3);
}
::-webkit-scrollbar-thumb {
  background: rgba(99, 102, 241, 0.4);
  border-radius: 10px;
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(99, 102, 241, 0.7);
}
</style>
