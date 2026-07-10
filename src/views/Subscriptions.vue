<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSubscriptionStore } from '../stores/subscription'

const subStore = useSubscriptionStore()
const router = useRouter()

onMounted(() => {
    subStore.fetchServices().catch(() => {
        // Page can still render once dashboard data arrives elsewhere.
    })
})

function getSlug(name: string) {
    if (name.toLowerCase().includes('netflix')) return 'netflix'
    if (name.toLowerCase().includes('spotify')) return 'spotify'
    if (name.toLowerCase().includes('amazon')) return 'amazon'
    if (name.toLowerCase().includes('youtube')) return 'youtube'
    if (name.toLowerCase().includes('apple')) return 'apple'
    return name.toLowerCase().replace(/\s+/g, '-')
}

function handleSelect(name: string) {
    const slug = getSlug(name)
    router.push(`/subscriptions/${slug}`)
}
</script>

<template>
    <div class="w-full min-h-screen bg-secondary text-white flex flex-col justify-start px-4 sm:px-8 py-6 lg:p-0">
        <header class="flex justify-between items-center mb-6 sm:mb-10">
            <div class="w-full">
                <button
                    @click="router.push('/dashboard')"
                    class="text-[10px] font-black uppercase tracking-widest text-primary hover:underline flex items-center gap-2 mb-3 cursor-pointer"
                >
                    <i class="fa-solid fa-arrow-left"></i>
                    Back to Dashboard
                </button>
                <h1 class="text-2xl sm:text-4xl font-black tracking-tight uppercase italic wrap-break-word">
                    Subscription Catalog
                </h1>
                <p class="text-white/40 text-xs sm:text-base font-medium mt-1 max-w-xl leading-relaxed">
                    Select a premium service to upgrade your digital experience.
                </p>
            </div>
        </header>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 pb-12">
            <div
                v-for="service in subStore.availableServices"
                :key="service.id"
                @click="handleSelect(service.name)"
                class="group relative bg-black/10 backdrop-blur-md p-5 sm:p-8 lg:p-10 rounded-3xl sm:rounded-4xl border border-white/5 hover:border-primary/20 transition-all duration-500 cursor-pointer flex flex-col justify-between shadow-sm hover:shadow-2xl lg:hover:-translate-y-1.5 overflow-hidden"
            >
                <div class="hidden lg:block absolute -right-16 -top-16 w-36 h-36 bg-primary/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                <div class="flex flex-col flex-1">
                    <div class="h-12 w-12 sm:h-16 sm:w-16 bg-white/5 text-white/80 rounded-xl sm:rounded-2xl flex items-center justify-center text-xl sm:text-3xl border border-white/5 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all duration-500 mb-4 sm:mb-6 shrink-0">
                        <i :class="service.icon"></i>
                    </div>

                    <h3 class="text-lg sm:text-2xl font-black text-white group-hover:text-primary transition-colors mb-1.5 tracking-tight uppercase italic">
                        {{ service.name }}
                    </h3>

                    <p class="text-xs sm:text-sm font-semibold text-white/40 leading-relaxed mb-6 flex-1">
                        {{ service.description.split('.')[0] + '.' }}
                    </p>
                </div>

                <div class="flex items-center justify-between border-t border-white/5 pt-4 mt-2 shrink-0">
                    <div>
                        <p class="text-[9px] font-black uppercase tracking-widest text-white/30 mb-0.5">Price</p>
                        <p class="text-base sm:text-xl font-black text-white">
                            ₦{{ service.price.toLocaleString() }}<span class="text-[10px] sm:text-xs font-bold text-white/30">/mo</span>
                        </p>
                    </div>

                    <div class="h-9 w-9 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-white/5 text-white/40 border border-white/5 group-hover:bg-primary group-hover:text-white group-hover:border-primary flex items-center justify-center transition-all duration-500">
                        <i class="fa-solid fa-chevron-right text-xs sm:text-sm"></i>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
