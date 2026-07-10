<script setup lang="ts">
<<<<<<< HEAD
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import StatCard from '../components/dashboard/StatCard.vue'
import SubscriptionItem from '../components/dashboard/SubscriptionItem.vue'
import HistoryTable from '../components/dashboard/HistoryTable.vue'
import { useAuthStore } from '../stores/auth'
import { useSubscriptionStore } from '../stores/subscription'
=======
import { ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
>>>>>>> 6562128ef360ec30ebd304f9fb9f02e7fabfa6f3

const router = useRouter()
const route = useRoute()

const userName = ref('Alex K.')

<<<<<<< HEAD
const activeAndPending = computed(() => subStore.activeSubscriptions)
const selectedSub = computed(() => activeAndPending.value.find((subscription) => subscription.id === selectedId.value) || activeAndPending.value[0] || { bg: '' })
const activities = computed(() => subStore.activities)
const spendValue = computed(() => `₦${(subStore.metrics?.monthlySpend || 0).toLocaleString()}`)
const activeServicesValue = computed(() => `${subStore.metrics?.activeServices || 0} Services`)

watch(activeAndPending, (services) => {
  if (services.length > 0 && !selectedId.value) {
    selectedId.value = services[0].id
  }
}, { immediate: true })

onMounted(async () => {
  await Promise.all([
    subStore.fetchDashboard().catch(() => null),
    subStore.fetchServices().catch(() => null),
  ])
})

const menuItems = [
  { name: 'Dashboard', icon: 'fa-solid fa-grid-2', path: '/dashboard' },
  { name: 'Subscriptions', icon: 'fa-solid fa-list-check', path: '/subscriptions' },
  { name: 'Usage History', icon: 'fa-solid fa-chart-line', path: '#' },
  { name: 'Settings', icon: 'fa-solid fa-gear', path: '#' },
]

function navigateTo(path: string) {
  if (path !== '#') {
    router.push(path)
  }
  isSidebarOpen.value = false
}
</script>

<template>
  <div class="min-h-screen bg-muted/30 flex relative">
    <div v-if="isSidebarOpen" class="fixed inset-0 bg-secondary/60 backdrop-blur-sm z-[25] lg:hidden" @click="isSidebarOpen = false"></div>

    <aside
      class="w-72 bg-white border-r border-secondary/5 flex flex-col p-8 fixed inset-y-0 left-0 h-screen z-30 transition-transform duration-500 lg:sticky lg:translate-x-0"
      :class="isSidebarOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <div class="flex items-center justify-between mb-12">
        <div class="flex items-center gap-3">
          <img src="/images/logo.jpeg" alt="Logo" class="h-10 w-10 rounded-xl" />
          <span class="text-xl font-black tracking-tighter uppercase italic">OPTIMEDIA</span>
        </div>
        <button @click="isSidebarOpen = false" class="lg:hidden text-secondary/40 hover:text-secondary">
          <i class="fa-solid fa-xmark text-xl"></i>
        </button>
      </div>

      <nav class="flex-1 flex flex-col gap-2">
        <div
          v-for="item in menuItems"
          :key="item.name"
          @click="navigateTo(item.path)"
          class="flex items-center gap-4 px-6 py-4 rounded-2xl cursor-pointer transition-all font-bold text-sm tracking-tight"
          :class="router.currentRoute.value.path === item.path ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-secondary/40 hover:text-secondary hover:bg-muted'"
        >
          <i :class="item.icon" class="text-lg"></i>
          {{ item.name }}
        </div>
      </nav>

      <div class="mt-auto">
        <div class="bg-secondary p-6 rounded-3xl text-white relative overflow-hidden group">
          <div class="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150"></div>
          <p class="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Status</p>
          <h4 class="font-black text-lg mb-4">Pro Member</h4>
          <button class="w-full bg-white text-secondary py-3 rounded-xl font-black uppercase text-[10px] tracking-widest hover:brightness-110 active:scale-95 transition-all">
            Upgrade Plan
          </button>
        </div>
      </div>
    </aside>

    <main class="flex-1 p-4 sm:p-6 lg:p-10 relative overflow-hidden lg:overflow-visible">
      <div class="lg:hidden flex items-center justify-between mb-8 relative z-10">
        <button @click="isSidebarOpen = true" class="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center border border-secondary/5">
          <i class="fa-solid fa-bars-staggered"></i>
        </button>
        <img src="/images/logo.jpeg" alt="Logo" class="h-8 w-8 rounded-lg" />
      </div>

      <div v-if="activeAndPending.length > 0" class="absolute inset-0 z-0 pointer-events-none">
        <Transition name="bg-fade">
          <div
            :key="selectedSub.bg"
            class="absolute inset-0 bg-cover bg-center opacity-[0.3] transition-all duration-1000 scale-100 blur-xl grayscale-[0.05]"
            :style="{ backgroundImage: `url(${selectedSub.bg})` }"
          ></div>
        </Transition>
        <div class="absolute inset-0 bg-gradient-to-br from-muted/5 via-transparent to-transparent"></div>
      </div>

      <header class="flex flex-col md:flex-row justify-between md:items-center gap-6 mb-12 relative z-10 px-1">
        <div>
          <h1 class="text-2xl sm:text-3xl lg:text-4xl font-black text-secondary tracking-tight">Good morning, {{ authStore.user?.name?.split(' ')[0] || 'Alex' }}</h1>
          <p class="text-secondary/40 text-sm sm:text-base font-medium mt-1">Here's what's happening with your subscriptions today.</p>
        </div>
        <div class="flex items-center justify-between sm:justify-end gap-4 lg:gap-6">
          <button class="h-12 w-12 rounded-2xl bg-white border border-secondary/5 flex items-center justify-center text-xl text-secondary/40 hover:text-primary transition-colors shadow-sm">
            <i class="fa-solid fa-bell"></i>
          </button>
          <div class="flex items-center gap-4 bg-white p-2 pr-4 sm:pr-6 rounded-2xl border border-secondary/5 shadow-sm">
            <div class="h-10 w-10 bg-secondary rounded-xl flex items-center justify-center text-sm font-bold text-white uppercase italic">
              {{ authStore.user?.name?.[0] || 'A' }}
            </div>
            <div>
              <p class="font-black text-sm text-secondary">{{ authStore.user?.name || 'Alex K.' }}</p>
              <p class="text-[10px] font-bold text-primary uppercase tracking-widest">Pro Member</p>
            </div>
          </div>
        </div>
      </header>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-12 relative z-10 px-1">
        <StatCard title="Monthly Spend" :value="spendValue" change="-12% vs last month" :isPositive="true" icon="fa-solid fa-chart-line-up" color="primary" />
        <StatCard title="Financial Health" :value="subStore.metrics?.financialHealth || 'New'" change="Very Good" :isPositive="true" icon="fa-solid fa-shield-heart" color="tertiary" />
        <StatCard title="Active Services" :value="activeServicesValue" change="No changes" :isPositive="true" icon="fa-solid fa-layer-group" color="orange-500" />
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-3 gap-8 relative z-10 px-1">
        <div class="xl:col-span-2 space-y-8">
          <div class="bg-white/40 backdrop-blur-md p-4 sm:p-6 lg:p-8 rounded-[1.8rem] sm:rounded-[2.5rem] border border-white shadow-sm h-full">
            <div class="flex justify-between items-center mb-8">
              <h3 class="text-lg sm:text-xl font-black text-secondary">Active Subscriptions</h3>
              <button @click="router.push('/subscriptions')" class="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">Manage All</button>
            </div>

            <div v-if="activeAndPending.length === 0" class="flex flex-col items-center justify-center py-12 text-center px-4">
              <div class="h-16 w-16 sm:h-20 sm:w-20 bg-muted rounded-2xl sm:rounded-[2rem] flex items-center justify-center mb-6">
                <i class="fa-solid fa-box-open text-2xl sm:text-3xl text-secondary/20"></i>
              </div>
              <h4 class="text-lg sm:text-xl font-bold text-secondary mb-2">No active subscriptions</h4>
              <p class="text-secondary/40 text-xs sm:text-sm max-w-xs mb-8">You haven't subscribed to any services yet. Start exploring our catalog.</p>
              <button @click="router.push('/subscriptions')" class="w-full sm:w-auto bg-primary text-white px-8 py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-primary/30">
                Browse Services
              </button>
            </div>

            <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SubscriptionItem
                v-for="sub in activeAndPending"
                :key="sub.id"
                v-bind="sub"
                :isActive="selectedId === sub.id"
                @select="selectedId = sub.id"
              />
              <div @click="router.push('/subscriptions')" class="flex items-center justify-center p-5 rounded-3xl border border-dashed border-secondary/20 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group h-full min-h-[84px]">
                <p class="text-xs font-black uppercase tracking-widest text-secondary/40 group-hover:text-primary flex items-center justify-center gap-2 text-center">
                  <i class="fa-solid fa-plus-circle text-lg"></i>
                  Request New Service
                </p>
              </div>
            </div>
          </div>

          <HistoryTable :activities="activities" />
        </div>

        <div class="space-y-8"></div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.bg-fade-enter-active,
.bg-fade-leave-active {
  transition: opacity 1.5s ease, transform 1.5s ease;
}

.bg-fade-enter-from {
  opacity: 0;
  transform: scale(1.2);
}

.bg-fade-leave-to {
  opacity: 0;
}
</style>
=======
// Reactive state handle for toggling the mobile sidebar slide overlay
const isMobileNavOpen = ref(false)

const navigateTo = (path: string) => {
    isMobileNavOpen.value = false
    router.push(path)
}

// Close mobile layout automatically if the route changes externally
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
            
            <button @click="isMobileNavOpen = !isMobileNavOpen" 
                class="h-10 w-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-white/80 active:scale-95 transition-all"
                aria-label="Toggle Menu">
                <i v-if="!isMobileNavOpen" class="fa-solid fa-bars text-lg"></i>
                <i v-else class="fa-solid fa-xmark text-lg"></i>
            </button>
        </header>

        <div v-if="isMobileNavOpen" 
            @click="isMobileNavOpen = false" 
            class="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs">
        </div>

        <aside 
            class="fixed inset-y-0 left-0 w-72 bg-secondary border-r border-white/5 flex flex-col p-6 sm:p-8 transform transition-transform duration-300 ease-in-out z-50 lg:translate-x-0 lg:static lg:h-screen lg:z-30 shrink-0"
            :class="isMobileNavOpen ? 'translate-x-0' : '-translate-x-full'">
            
            <div class="hidden lg:flex items-center gap-3 mb-10">
                <span class="text-lg font-black tracking-tighter uppercase italic bg-linear-to-r from-white to-white/60 bg-clip-text text-transparent">OPTIMEDIA</span>
            </div>

            <div class="flex items-center justify-between mb-8 lg:hidden border-b border-white/5 pb-4">
                <span class="text-base font-black tracking-tighter uppercase italic text-white/60">Navigation</span>
                <button @click="isMobileNavOpen = false" class="text-white/40 hover:text-white text-sm font-bold uppercase tracking-wider">Close</button>
            </div>

            <nav class="flex flex-col gap-1.5 flex-1">
                <button @click="navigateTo('/dashboard')"
                    class="w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl font-bold text-sm tracking-tight transition-all text-left"
                    :class="route.name === 'DashboardHome' ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-white/40 hover:text-white hover:bg-white/5'">
                    <i class="fa-solid fa-table-columns text-lg"></i>
                    Dashboard
                </button>
                <button @click="navigateTo('/subscriptions')"
                    class="w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl font-bold text-sm tracking-tight text-white/40 hover:text-white hover:bg-white/5 transition-all text-left">
                    <i class="fa-solid fa-list-ul text-lg"></i>
                    Subscriptions
                </button>
                <button @click="navigateTo('/dashboard/history')"
                    class="w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl font-bold text-sm tracking-tight transition-all text-left"
                    :class="route.name === 'UsageHistory' ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-white/40 hover:text-white hover:bg-white/5'">
                    <i class="fa-solid fa-clock-rotate-left text-lg"></i>
                    Usage History
                </button>
                <button @click="navigateTo('/dashboard/settings')"
                    class="w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl font-bold text-sm tracking-tight transition-all text-left"
                    :class="route.name === 'Settings' ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-white/40 hover:text-white hover:bg-white/5'">
                    <i class="fa-solid fa-gear text-lg"></i>
                    Settings
                </button>
            </nav>

            <div class="mt-auto pt-6 border-t border-white/5">
                <div class="bg-black/30 border border-white/5 rounded-2xl p-5 relative overflow-hidden">
                    <p class="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Status</p>
                    <h4 class="text-base font-black text-white italic mb-4">Pro Member</h4>
                    <button class="w-full bg-white text-secondary py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-white/90 transition-all">
                        Upgrade Plan
                    </button>
                </div>
            </div>
        </aside>

        <main class="flex-1 p-6 lg:p-12 overflow-x-hidden flex flex-col lg:h-screen lg:overflow-y-auto">
            <header class="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-10 relative z-10">
                <div>
                    <h1 class="text-2xl sm:text-3xl font-black tracking-tight uppercase italic">
                        Good morning, {{ userName }}
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
                            A
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
>>>>>>> 6562128ef360ec30ebd304f9fb9f02e7fabfa6f3
