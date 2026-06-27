<script setup lang="ts">
import { ref, computed } from 'vue'
import { useSubscriptionStore, type Service } from '../stores/subscription'
import { useRouter } from 'vue-router'

const subStore = useSubscriptionStore()
const router = useRouter()

const selectedId = ref(subStore.availableServices[0].id)
const selectedService = computed(() => {
    return subStore.availableServices.find(s => s.id === selectedId.value) || subStore.availableServices[0]
})

function handleSubscribe(service: Service) {
    subStore.requestSubscription(service)
    alert(`Request for ${service.name} sent! It will show as pending on your dashboard.`)
    router.push('/dashboard')
}
</script>

<template>
    <div class="min-h-screen bg-muted/30 relative flex flex-col overflow-x-hidden">
        <!-- Background Transitions -->
        <div class="absolute inset-0 z-0 pointer-events-none">
            <Transition name="bg-fade">
                <div :key="selectedService.bg"
                    class="absolute inset-0 bg-cover bg-center opacity-[0.8] transition-all duration-1000 scale-100 blur-md"
                    :style="{ backgroundImage: `url(${selectedService.bg})` }"></div>
            </Transition>
            <div class="absolute inset-0 bg-gradient-to-b from-muted/5 via-transparent to-muted/10"></div>
        </div>

        <div class="relative z-10 p-6 lg:p-12 flex-1 flex flex-col">
            <header class="flex justify-between items-center mb-12">
                <div>
                    <button @click="router.push('/dashboard')"
                        class="text-xs font-black uppercase tracking-widest text-primary hover:underline flex items-center gap-2 mb-4">
                        <i class="fa-solid fa-arrow-left"></i>
                        Back to Dashboard
                    </button>
                    <h1 class="text-4xl font-black text-secondary tracking-tight">Subscription Catalog</h1>
                    <p class="text-secondary/40 font-medium mt-1">Select a premium service to upgrade your digital
                        experience.</p>
                </div>
            </header>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 flex-1 items-stretch">
                <!-- Service List -->
                <div class="space-y-4">
                    <div v-for="service in subStore.availableServices" :key="service.id"
                        @click="selectedId = service.id"
                        class="group p-6 rounded-[2rem] border transition-all duration-500 cursor-pointer flex items-center justify-between"
                        :class="selectedId === service.id ? 'bg-white border-primary shadow-2xl shadow-primary/10' : 'bg-white/50 border-secondary/5 hover:bg-white hover:border-primary/20'">
                        <div class="flex items-center gap-5">
                            <div
                                :class="`h-14 w-14 rounded-2xl flex items-center justify-center text-2xl transition-all duration-500 ${selectedId === service.id ? 'bg-primary text-white scale-110' : 'bg-muted text-secondary/40 group-hover:text-primary'}`">
                                <i :class="service.icon"></i>
                            </div>
                            <div>
                                <h3
                                    class="font-black text-secondary group-hover:text-primary transition-colors text-lg">
                                    {{ service.name }}</h3>
                                <p class="text-sm font-bold text-secondary/30">₦{{ service.price.toLocaleString()
                                }}/month</p>
                            </div>
                        </div>
                        <i class="fa-solid fa-chevron-right transition-transform duration-500"
                            :class="selectedId === service.id ? 'translate-x-2 text-primary' : 'text-secondary/20'"></i>
                    </div>
                </div>

                <!-- Preview Panel -->
                <div class="relative min-h-[600px] lg:min-h-0">
                    <Transition name="panel-slide" mode="out-in">
                        <div :key="selectedService.id"
                            class="absolute inset-0 bg-secondary rounded-[3rem] p-10 lg:p-14 text-white flex flex-col justify-between shadow-4xl overflow-hidden group border border-white/5">
                            <!-- Background Image Tint Inside Panel -->
                            <div class="absolute inset-0 z-0 opacity-20 transition-all duration-1000 scale-105"
                                :style="{ backgroundImage: `url(${selectedService.bg})`, backgroundSize: 'cover', backgroundPosition: 'center' }">
                            </div>
                            <div
                                class="absolute inset-0 bg-gradient-to-t from-secondary via-secondary/80 to-transparent z-[1]">
                            </div>

                            <div class="relative z-10">
                                <div
                                    class="h-20 w-20 bg-white/10 rounded-3xl flex items-center justify-center text-4xl mb-10 backdrop-blur-xl border border-white/10">
                                    <i :class="selectedService.icon"></i>
                                </div>
                                <h2 class="text-5xl font-black mb-6 tracking-tighter leading-none">{{
                                    selectedService.name }}</h2>
                                <p class="text-white/60 text-lg leading-relaxed max-w-sm mb-10 font-bold italic">
                                    "{{ selectedService.description }}"
                                </p>

                                <div class="flex flex-wrap gap-4">
                                    <div v-for="tag in ['Official Account', 'Full Warranty', 'Instant Activation']"
                                        :key="tag"
                                        class="px-4 py-2 rounded-full border border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-widest text-white/40">
                                        {{ tag }}
                                    </div>
                                </div>
                            </div>

                            <div class="relative z-10 pt-12 border-t border-white/10">
                                <div class="flex items-end justify-between mb-8">
                                    <div>
                                        <p class="text-[10px] font-black uppercase tracking-widest text-primary mb-1">
                                            Exclusive Value</p>
                                        <h3 class="text-4xl font-black">₦{{ selectedService.price.toLocaleString() }}
                                            <span class="text-sm font-medium text-white/30">/ month</span>
                                        </h3>
                                    </div>
                                </div>
                                <button @click="handleSubscribe(selectedService)"
                                    class="w-full bg-primary text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:brightness-110 active:scale-[0.98] transition-all shadow-xl shadow-primary/30 flex items-center justify-center gap-3 group/btn">
                                    Subscribe Now
                                    <i
                                        class="fa-solid fa-arrow-right group-hover/btn:translate-x-1 transition-transform"></i>
                                </button>
                            </div>
                        </div>
                    </Transition>
                </div>
            </div>
        </div>
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

.panel-slide-enter-active,
.panel-slide-leave-active {
    transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

.panel-slide-enter-from {
    opacity: 0;
    transform: translateY(30px);
}

.panel-slide-leave-to {
    opacity: 0;
    transform: translateY(-30px);
}
</style>
