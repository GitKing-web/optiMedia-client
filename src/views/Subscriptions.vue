<script setup lang="ts">
import { useSubscriptionStore } from '../stores/subscription'
import { useRouter } from 'vue-router'

const subStore = useSubscriptionStore()
const router = useRouter()

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
    <div class="min-h-screen bg-muted/30 px-4 sm:px-6 lg:p-12 py-8 lg:py-12 flex flex-col justify-start">
        <header class="flex justify-between items-center mb-8 sm:mb-12">
            <div>
                <button @click="router.push('/dashboard')"
                    class="text-xs font-black uppercase tracking-widest text-primary hover:underline flex items-center gap-2 mb-4">
                    <i class="fa-solid fa-arrow-left"></i>
                    Back to Dashboard
                </button>
                <h1 class="text-2xl sm:text-4xl font-black text-secondary tracking-tight">Subscription Catalog</h1>
                <p class="text-secondary/40 text-sm sm:text-base font-medium mt-1">Select a premium service to upgrade your digital
                    experience.</p>
            </div>
        </header>

        <!-- Catalog Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <div v-for="service in subStore.availableServices" :key="service.id" @click="handleSelect(service.name)"
                class="group relative bg-white/60 backdrop-blur-md p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] border border-secondary/5 hover:border-primary/20 transition-all duration-500 cursor-pointer flex flex-col justify-between shadow-sm hover:shadow-2xl lg:hover:-translate-y-2 overflow-hidden">
                
                <!-- Hover Glow (Desktop Only) -->
                <div
                    class="hidden lg:block absolute -right-16 -top-16 w-36 h-36 bg-primary/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                </div>

                <div>
                    <!-- Icon Box (Now has default color for mobile visibility) -->
                    <div
                        class="h-14 w-14 sm:h-16 sm:w-16 bg-primary/10 text-primary rounded-[1.2rem] sm:rounded-[1.8rem] flex items-center justify-center text-2xl sm:text-3xl lg:group-hover:bg-primary lg:group-hover:text-white transition-all duration-500 mb-6 sm:mb-8 shadow-sm">
                        <i :class="service.icon"></i>
                    </div>

                    <h3
                        class="text-xl sm:text-2xl font-black text-secondary lg:group-hover:text-primary transition-colors mb-2 tracking-tight">
                        {{ service.name }}
                    </h3>

                    <p class="text-xs sm:text-sm font-semibold text-secondary/40 leading-relaxed mb-6 sm:mb-8">
                        {{ service.description.split('.')[0] + '.' }}
                    </p>
                </div>

                <div class="flex items-center justify-between border-t border-secondary/5 pt-4 sm:pt-6 mt-2">
                    <div>
                        <p class="text-[10px] font-black uppercase tracking-widest text-secondary/30 mb-0.5">Price</p>
                        <p class="text-lg sm:text-xl font-black text-secondary">
                            ₦{{ service.price.toLocaleString() }}<span
                                class="text-xs font-bold text-secondary/30">/mo</span>
                        </p>
                    </div>

                    <!-- Chevron Button (Now has default color) -->
                    <div
                        class="h-10 w-10 rounded-xl bg-primary/10 text-primary lg:group-hover:bg-primary lg:group-hover:text-white flex items-center justify-center transition-all duration-500">
                        <i class="fa-solid fa-chevron-right text-sm"></i>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped></style>