<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSubscriptionStore } from '../stores/subscription'

const route = useRoute()
const router = useRouter()
const subStore = useSubscriptionStore()

const serviceNameParam = computed(() => {
    return (route.params.name as string) || ''
})

const matchedService = computed(() => {
    const param = serviceNameParam.value.toLowerCase()
    return subStore.availableServices.find(s => {
        const canonical = s.name.toLowerCase()
        const cleanParam = param.split('-')[0] // 'netflix' from 'netflix-premium' or 'netflix'
        return canonical.includes(cleanParam)
    })
})

function handleSubscribe() {
    if (!matchedService.value) return

    subStore.requestSubscription(matchedService.value)
    alert(`Request for ${matchedService.value.name} sent! It will show as pending on your dashboard.`)
    router.push('/dashboard')
}
</script>

<template>
    <div v-if="matchedService"
        class="min-h-screen relative flex items-center justify-center p-6 lg:p-12 overflow-hidden">
        <!-- Dynamic Immersive Background -->
        <div class="absolute inset-0 z-0 pointer-events-none">
            <div class="absolute inset-0 bg-cover bg-center opacity-65 transition-all duration-1000 scale-105 blur-lg"
                :style="{ backgroundImage: `url(${matchedService.bg})` }">
            </div>
            <!-- Darker Radial and Linear gradients overlay for high visibility & premium styling -->
            <div class="absolute inset-0 bg-gradient-to-t from-dark/95 via-secondary/70 to-secondary/40"></div>
            <div class="absolute inset-0 bg-radial-gradient"></div>
        </div>

        <div class="relative z-10 w-full max-w-4xl flex flex-col items-center">
            <!-- Back button & Nav -->
            <div class="w-full flex justify-between items-center mb-8">
                <button @click="router.push('/subscriptions')"
                    class="text-xs font-black uppercase tracking-widest text-primary bg-secondary/80 border border-white/5 px-6 py-3 rounded-2xl hover:bg-white hover:text-secondary hover:scale-105 transition-all flex items-center gap-2 shadow-2xl backdrop-blur-md">
                    <i class="fa-solid fa-arrow-left"></i>
                    Back to Catalog
                </button>
            </div>

            <!-- Detail Presentation Card -->
            <div
                class="w-full bg-secondary/80 backdrop-blur-xl rounded-[3rem] border border-white/10 shadow-5xl overflow-hidden flex flex-col md:flex-row items-stretch p-8 md:p-12 gap-10">
                <!-- Left Panel: Large visual & Identity -->
                <div class="flex-1 flex flex-col justify-between">
                    <div>
                        <!-- Icon Box -->
                        <div
                            class="h-24 w-24 bg-white/10 text-white rounded-[2.2rem] flex items-center justify-center text-5xl mb-8 border border-white/10 shadow-2xl">
                            <i :class="matchedService.icon"></i>
                        </div>
                        <h1 class="text-4xl md:text-5xl font-black text-white mb-6 uppercase tracking-tight italic">{{
                            matchedService.name }}</h1>
                        <p class="text-white/60 text-lg leading-relaxed font-bold mb-8">
                            {{ matchedService.description }}
                        </p>
                    </div>

                    <!-- Tags -->
                    <div class="flex flex-wrap gap-3">
                        <span v-for="tag in ['Official Premium', 'NGN Rates', 'Full Warranty', 'Instant Active']"
                            :key="tag"
                            class="px-4 py-2 rounded-full border border-white/5 bg-white/5 text-[9px] font-black uppercase tracking-widest text-white/40 shadow-inner">
                            {{ tag }}
                        </span>
                    </div>
                </div>

                <!-- Right Panel: Value Proposition & Checkout button -->
                <div
                    class="w-full md:w-80 bg-white/5 border border-white/5 rounded-[2.5rem] p-8 flex flex-col justify-between backdrop-blur-sm">
                    <div class="mb-10 text-center md:text-left">
                        <p class="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Monthly Membership
                        </p>
                        <h2 class="text-5xl font-black text-white tracking-tight">
                            ₦{{ matchedService.price.toLocaleString() }}
                            <span class="text-xs font-bold text-white/30 tracking-normal block md:inline">/ month</span>
                        </h2>
                    </div>

                    <div class="space-y-6 mb-10">
                        <div class="flex items-center gap-4 text-white/60 font-bold text-sm">
                            <i class="fa-solid fa-circle-check text-primary text-xl"></i>
                            Dedicated Profiles
                        </div>
                        <div class="flex items-center gap-4 text-white/60 font-bold text-sm">
                            <i class="fa-solid fa-circle-check text-primary text-xl"></i>
                            No Virtual Cards Required
                        </div>
                        <div class="flex items-center gap-4 text-white/60 font-bold text-sm">
                            <i class="fa-solid fa-circle-check text-primary text-xl"></i>
                            Arbitrage-Optimized Price
                        </div>
                    </div>

                    <button @click="handleSubscribe"
                        class="w-full bg-primary text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:scale-103 active:scale-97 hover:shadow-2xl hover:shadow-primary/40 transition-all flex items-center justify-center gap-3 shadow-xl shadow-primary/30 group">
                        Subscribe Now
                        <i class="fa-solid fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Fallback State -->
    <div v-else class="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-secondary">
        <h2 class="text-3xl font-black text-white mb-4 uppercase italic">Service Not Found</h2>
        <p class="text-white/40 mb-8 max-w-sm font-bold">The service you've requested is not available in our current
            catalog.</p>
        <button @click="router.push('/subscriptions')"
            class="bg-primary text-white px-8 py-4 rounded-2xl font-black uppercase text-sm tracking-widest hover:scale-105 active:scale-95 transition-all">
            Back to Catalog
        </button>
    </div>
</template>

<style scoped>
.bg-radial-gradient {
    background: radial-gradient(circle at center, transparent 0%, rgba(15, 23, 42, 0.8) 100%);
}
</style>
