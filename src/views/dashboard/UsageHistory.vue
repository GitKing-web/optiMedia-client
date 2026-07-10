<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useSubscriptionStore } from '../../stores/subscription'

const subStore = useSubscriptionStore()

const activities = computed(() => subStore.activities)

onMounted(async () => {
    if (activities.value.length === 0) {
        await subStore.fetchDashboard().catch(() => null)
    }
})
</script>

<template>
    <div class="flex-1 flex flex-col">
        <div v-if="activities.length > 0" class="bg-black/10 rounded-4xl border border-white/5 p-6 sm:p-8 flex-1 overflow-x-auto">
            <table class="w-full text-left border-collapse min-w-150">
                <thead>
                    <tr class="border-b border-white/5 text-white/40 text-[10px] font-black uppercase tracking-widest">
                        <th class="pb-4 px-4">Description</th>
                        <th class="pb-4 px-4">Type</th>
                        <th class="pb-4 px-4">Status</th>
                        <th class="pb-4 px-4 text-right">Amount</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-white/5">
                    <tr v-for="item in activities" :key="item.id" class="hover:bg-white/5 transition-all group">
                        <td class="py-5 px-4">
                            <div class="flex items-center gap-4">
                                <div class="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/10">
                                    <i :class="item.icon"></i>
                                </div>
                                <div>
                                    <span class="font-black text-sm text-white uppercase italic">{{ item.service }}</span>
                                    <p class="text-[11px] text-white/40 mt-1">{{ item.date }}</p>
                                </div>
                            </div>
                        </td>
                        <td class="py-5 px-4 text-sm font-bold text-white/50 uppercase tracking-widest">
                            {{ item.type }}
                        </td>
                        <td class="py-5 px-4">
                            <span v-if="item.status === 'Completed'" class="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest">
                                Cleared
                            </span>
                            <span v-else class="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-lg text-[9px] font-black uppercase tracking-widest">
                                Processing
                            </span>
                        </td>
                        <td class="py-5 px-4 text-right">
                            <p class="font-black text-sm text-white">{{ item.amount }}</p>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div v-else class="bg-black/10 rounded-4xl border border-white/5 p-8 flex flex-col items-center justify-center flex-1 min-h-87.5">
            <div class="h-16 w-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5 mb-6 text-white/40">
                <i class="fa-solid fa-receipt text-2xl"></i>
            </div>
            <h3 class="text-xl font-black tracking-tight mb-2 uppercase italic">No history available</h3>
            <p class="text-white/40 text-sm font-medium mb-6 text-center max-w-sm">
                Your payment and subscription activity will appear here once you complete a checkout.
            </p>
        </div>
    </div>
</template>
