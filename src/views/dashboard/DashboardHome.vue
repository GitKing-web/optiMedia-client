<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import StatCard from '../../components/dashboard/StatCard.vue'
import SubscriptionItem from '../../components/dashboard/SubscriptionItem.vue'
import HistoryTable from '../../components/dashboard/HistoryTable.vue'
import { useAuthStore } from '../../stores/auth'
import { useSubscriptionStore } from '../../stores/subscription'

const router = useRouter()
const authStore = useAuthStore()
const subStore = useSubscriptionStore()

const monthlySpend = computed(() => `₦${(subStore.metrics?.monthlySpend || 0).toLocaleString()}`)
const activeServicesValue = computed(() => `${subStore.metrics?.activeServices || 0} Services`)
const activeAndPending = computed(() => subStore.activeAndPending)
const activities = computed(() => subStore.activities)
const selectedSubscription = computed(() => activeAndPending.value[0] || null)

onMounted(async () => {
    await Promise.all([
        subStore.fetchDashboard().catch(() => null),
        subStore.fetchServices().catch(() => null)
    ])
})
</script>

<template>
    <div v-if="subStore.isLoading && !subStore.metrics" class="flex items-center justify-center py-24">
        <div class="flex flex-col items-center gap-4">
            <svg class="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            <p class="text-white/40 text-sm font-bold uppercase tracking-widest">Loading dashboard...</p>
        </div>
    </div>
    <div v-else class="space-y-8">
        <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard
                title="Monthly Spend"
                :value="monthlySpend"
                change="Live from your dashboard"
                :isPositive="true"
                icon="fa-solid fa-chart-line-up"
                color="primary"
            />
            <StatCard
                title="Financial Health"
                :value="subStore.metrics?.financialHealth || 'New'"
                change="Calculated from active plans"
                :isPositive="true"
                icon="fa-solid fa-shield-heart"
                color="tertiary"
            />
            <StatCard
                title="Active Services"
                :value="activeServicesValue"
                change="Synced with backend"
                :isPositive="true"
                icon="fa-solid fa-layer-group"
                color="orange-500"
            />
        </section>

        <section class="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div class="xl:col-span-2 space-y-8">
                <div class="bg-white/40 backdrop-blur-md p-4 sm:p-6 lg:p-8 rounded-[1.8rem] sm:rounded-[2.5rem] border border-white shadow-sm h-full">
                    <div class="flex justify-between items-center mb-8">
                        <h3 class="text-lg sm:text-xl font-black text-secondary">Active Subscriptions</h3>
                        <button @click="router.push('/subscriptions')" class="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">
                            Manage All
                        </button>
                    </div>

                    <div v-if="activeAndPending.length === 0" class="flex flex-col items-center justify-center py-12 text-center px-4">
                        <div class="h-16 w-16 sm:h-20 sm:w-20 bg-muted rounded-2xl sm:rounded-[2rem] flex items-center justify-center mb-6">
                            <i class="fa-solid fa-box-open text-2xl sm:text-3xl text-secondary/20"></i>
                        </div>
                        <h4 class="text-lg sm:text-xl font-bold text-secondary mb-2">No active subscriptions</h4>
                        <p class="text-secondary/40 text-xs sm:text-sm max-w-xs mb-8">
                            You haven’t subscribed to any services yet. Start exploring our catalog.
                        </p>
                        <button
                            @click="router.push('/subscriptions')"
                            class="w-full sm:w-auto bg-primary text-white px-8 py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-primary/30"
                        >
                            Browse Services
                        </button>
                    </div>

                    <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <SubscriptionItem
                            v-for="sub in activeAndPending"
                            :key="sub.id"
                            :name="sub.name"
                            :price="sub.price"
                            :status="sub.status"
                            :icon="sub.icon"
                            :activeDate="sub.activeDate"
                            :durationDays="sub.durationDays"
                            :isActive="selectedSubscription?.id === sub.id"
                            @select="router.push('/subscriptions')"
                        />
                        <div
                            @click="router.push('/subscriptions')"
                            class="flex items-center justify-center p-5 rounded-3xl border border-dashed border-secondary/20 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group h-full min-h-[84px]"
                        >
                            <p class="text-xs font-black uppercase tracking-widest text-secondary/40 group-hover:text-primary flex items-center justify-center gap-2 text-center">
                                <i class="fa-solid fa-plus-circle text-lg"></i>
                                Request New Service
                            </p>
                        </div>
                    </div>
                </div>

                <HistoryTable :activities="activities" />
            </div>

            <div class="space-y-8">
                <div class="bg-white rounded-3xl border border-secondary/5 shadow-sm p-6">
                    <p class="text-[10px] font-black uppercase tracking-widest text-secondary/40 mb-2">Account</p>
                    <h3 class="text-xl font-black text-secondary">{{ authStore.user?.name || 'Guest User' }}</h3>
                    <p class="text-sm text-secondary/60 mt-1">{{ authStore.user?.email || 'No email loaded' }}</p>
                    <p class="text-xs uppercase tracking-widest font-black text-primary mt-4">
                        {{ authStore.isAdmin ? 'Admin Access' : 'Customer Access' }}
                    </p>
                </div>
            </div>
        </section>
    </div>
</template>
