<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSubscriptionStore } from '../stores/subscription'

const subStore = useSubscriptionStore()
const router = useRouter()

onMounted(() => {
    if (subStore.availableServices.length === 0) {
        subStore.fetchServices().catch(() => null)
    }
})

function handleSelect(slug: string) {
    router.push(`/subscriptions/${slug}`)
}
</script>

<template>
    <div class="min-h-screen bg-secondary text-white flex flex-col">
        <div class="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-8 flex flex-col">
            <header class="mb-8 lg:mb-12">
                <button
                    @click="router.push('/dashboard')"
                    class="text-[10px] font-black uppercase tracking-widest text-primary hover:underline flex items-center gap-2 mb-4 cursor-pointer"
                >
                    <i class="fa-solid fa-arrow-left"></i>
                    Back to Dashboard
                </button>
                <h1 class="text-3xl sm:text-5xl font-black tracking-tight uppercase italic">
                    Subscription Catalog
                </h1>
                <p class="text-white/40 text-sm sm:text-base font-medium mt-2 max-w-xl leading-relaxed">
                    Select a premium service to upgrade your digital experience.
                </p>
            </header>

            <div v-if="subStore.isLoading && subStore.availableServices.length === 0" class="flex items-center justify-center py-24">
                <div class="flex flex-col items-center gap-4">
                    <svg class="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    <p class="text-white/40 text-sm font-bold uppercase tracking-widest">Loading services...</p>
                </div>
            </div>

            <div v-else-if="subStore.availableServices.length === 0" class="flex flex-col items-center justify-center py-24 text-center">
                <div class="h-20 w-20 bg-white/5 rounded-3xl flex items-center justify-center mb-6">
                    <i class="fa-solid fa-box-open text-3xl text-white/20"></i>
                </div>
                <h3 class="text-2xl font-black text-white mb-2">No services available</h3>
                <p class="text-white/40 text-sm max-w-md">Services will appear here once they are added to the catalog.</p>
            </div>

            <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-8 pb-12 flex-1">
                <div
                    v-for="service in subStore.availableServices"
                    :key="service.id"
                    @click="handleSelect(service.slug)"
                    class="group relative bg-white/5 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-white/5 hover:border-primary/30 transition-all duration-500 cursor-pointer flex flex-col justify-between shadow-sm hover:shadow-2xl hover:-translate-y-1 overflow-hidden"
                >
                    <div class="absolute -right-20 -top-20 w-40 h-40 bg-primary/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                    <div class="flex flex-col gap-4">
                        <div class="h-14 w-14 sm:h-16 sm:w-16 bg-white/5 text-white/80 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl border border-white/5 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all duration-500 shrink-0">
                            <i :class="service.icon"></i>
                        </div>

                        <div>
                            <h3 class="text-xl sm:text-2xl font-black text-white group-hover:text-primary transition-colors tracking-tight uppercase italic">
                                {{ service.name }}
                            </h3>
                            <p class="text-sm text-white/40 leading-relaxed mt-2 line-clamp-2">
                                {{ service.description }}
                            </p>
                        </div>
                    </div>

                    <div class="flex items-center justify-between border-t border-white/5 pt-5 mt-6 shrink-0">
                        <div>
                            <p class="text-[9px] font-black uppercase tracking-widest text-white/30 mb-0.5">Monthly</p>
                            <p class="text-lg sm:text-xl font-black text-white">
                                ₦{{ service.price.toLocaleString() }}
                            </p>
                        </div>

                        <div class="h-10 w-10 rounded-xl bg-white/5 text-white/40 border border-white/5 group-hover:bg-primary group-hover:text-white group-hover:border-primary flex items-center justify-center transition-all duration-500">
                            <i class="fa-solid fa-chevron-right text-sm"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
