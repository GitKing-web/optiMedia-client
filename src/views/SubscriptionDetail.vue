<script setup lang="ts">
import { computed, onMounted } from 'vue'
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

onMounted(() => {
    if (subStore.availableServices.length === 0) {
        subStore.fetchServices().catch(() => {
            // The subscription page will still fall back gracefully if needed.
        })
    }
})

async function handleSubscribe() {
    if (!matchedService.value) return

    try {
        await subStore.requestSubscription(matchedService.value)
        alert(`Request for ${matchedService.value.name} sent! It will show as pending on your dashboard.`)
        router.push('/dashboard')
    } catch {
        alert('Unable to create request right now.')
    }
}
</script>

<template>
    <div v-if="matchedService"
        class="min-h-screen bg-secondary relative flex items-center justify-center px-4 py-8 sm:p-6 lg:p-12 overflow-hidden">
        
        <!-- Dynamic Immersive Background (Enhanced to Pop & Shine Through) -->
        <div class="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            <!-- Background Image: Completely sharp, crystal clear, and elevated opacity -->
            <div class="absolute inset-0 bg-cover bg-center opacity-60 transition-all duration-1000 scale-100 blur-none"
                :style="{ backgroundImage: `url(${matchedService.bg})` }">
            </div>
            <!-- Premium Vignette Gradients: Keeps text perfectly readable while framing the artwork -->
            <div class="absolute inset-0 bg-gradient-to-t from-secondary via-secondary/60 to-black/20"></div>
            <div class="absolute inset-0 bg-gradient-to-r from-secondary/40 via-transparent to-secondary/40"></div>
        </div>

        <div class="relative z-10 w-full max-w-4xl flex flex-col items-center">
            <!-- Back button & Nav -->
            <div class="w-full flex justify-between items-center mb-6 sm:mb-8">
                <button @click="router.push('/subscriptions')"
                    class="text-xs font-black uppercase tracking-widest text-primary bg-secondary/80 border border-white/5 px-5 sm:px-6 py-3 rounded-2xl hover:bg-white hover:text-secondary hover:scale-105 transition-all flex items-center gap-2 shadow-2xl backdrop-blur-md">
                    <i class="fa-solid fa-arrow-left"></i>
                    Back to Catalog
                </button>
            </div>

            <!-- Detail Presentation Card (Made more transparent to let the artwork bleed through) -->
            <div
                class="w-full bg-secondary/40 backdrop-blur-md rounded-[2rem] sm:rounded-[3rem] border border-white/10 shadow-5xl overflow-hidden flex flex-col md:flex-row items-stretch p-6 sm:p-8 md:p-12 gap-8 md:gap-10">
                <!-- Left Panel: Large visual & Identity -->
                <div class="flex-1 flex flex-col justify-between">
                    <div>
                        <!-- Icon Box -->
                        <div
                            class="h-16 w-16 sm:h-24 sm:w-24 bg-white/10 text-white rounded-2xl sm:rounded-[2.2rem] flex items-center justify-center text-3xl sm:text-5xl mb-6 sm:mb-8 border border-white/10 shadow-2xl shrink-0">
                            <i :class="matchedService.icon"></i>
                        </div>
                        <h1 class="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 sm:mb-6 uppercase tracking-tight italic">
                            {{ matchedService.name }}
                        </h1>
                        <p class="text-white/80 text-sm sm:text-base md:text-lg leading-relaxed font-bold mb-6 sm:mb-8 drop-shadow-sm">
                            {{ matchedService.description }}
                        </p>
                    </div>

                    <!-- Tags -->
                    <div class="flex flex-wrap gap-2 sm:gap-3">
                        <span v-for="tag in ['Official Premium', 'NGN Rates', 'Full Warranty', 'Instant Active']"
                            :key="tag"
                            class="px-3 sm:px-4 py-2 rounded-full border border-white/10 bg-black/20 text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-white/60 shadow-inner">
                            {{ tag }}
                        </span>
                    </div>
                </div>

                <!-- Right Panel: Value Proposition & Checkout button -->
                <div
                    class="w-full md:w-80 bg-black/30 border border-white/5 rounded-[1.8rem] sm:rounded-[2.5rem] p-6 sm:p-8 flex flex-col justify-between backdrop-blur-sm">
                    <div class="mb-6 sm:mb-10 text-center md:text-left">
                        <p class="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Monthly Membership</p>
                        <h2 class="text-4xl sm:text-5xl font-black text-white tracking-tight">
                            ₦{{ matchedService.price.toLocaleString() }}
                            <span class="text-xs font-bold text-white/40 tracking-normal block md:inline-block md:mt-0 mt-1">/ month</span>
                        </h2>
                    </div>

                    <div class="space-y-4 sm:space-y-6 mb-8 sm:mb-10">
                        <div class="flex items-center gap-3 sm:gap-4 text-white/80 font-bold text-xs sm:text-sm drop-shadow-sm">
                            <i class="fa-solid fa-circle-check text-primary text-lg sm:text-xl shrink-0"></i>
                            <span>Dedicated Profiles</span>
                        </div>
                        <div class="flex items-center gap-3 sm:gap-4 text-white/80 font-bold text-xs sm:text-sm drop-shadow-sm">
                            <i class="fa-solid fa-circle-check text-primary text-lg sm:text-xl shrink-0"></i>
                            <span>No Virtual Cards Required</span>
                        </div>
                        <div class="flex items-center gap-3 sm:gap-4 text-white/80 font-bold text-xs sm:text-sm drop-shadow-sm">
                            <i class="fa-solid fa-circle-check text-primary text-lg sm:text-xl shrink-0"></i>
                            <span>Arbitrage-Optimized Price</span>
                        </div>
                    </div>

                    <button @click="handleSubscribe"
                        class="w-full bg-primary text-white py-4 sm:py-5 rounded-xl sm:rounded-2xl font-black uppercase tracking-widest hover:scale-103 active:scale-97 hover:shadow-2xl hover:shadow-primary/40 transition-all flex items-center justify-center gap-3 shadow-xl shadow-primary/30 group text-xs sm:text-sm">
                        Subscribe Now
                        <i class="fa-solid fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Fallback State -->
    <div v-else class="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 text-center bg-secondary">
        <h2 class="text-2xl sm:text-3xl font-black text-white mb-4 uppercase italic">Service Not Found</h2>
        <p class="text-white/40 mb-8 max-w-sm text-sm sm:text-base font-bold">The service you've requested is not available in our current catalog.</p>
        <button @click="router.push('/subscriptions')"
            class="bg-primary text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black uppercase text-xs sm:text-sm tracking-widest hover:scale-105 active:scale-95 transition-all">
            Back to Catalog
        </button>
    </div>
</template>

<style scoped></style>
