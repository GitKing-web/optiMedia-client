<script setup lang="ts">
defineProps<{
    activities: {
        id: string
        type: 'payment' | 'subscription'
        service: string
        amount: string
        status: string
        date: string
        icon: string
    }[]
}>()
</script>

<template>
    <div class="bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 shadow-xl overflow-hidden">
        <div class="p-6 border-b border-white/10 flex justify-between items-center">
            <h3 class="text-lg font-black text-white uppercase italic tracking-tight">Recent Activity</h3>
            <button class="text-[10px] font-black uppercase tracking-widest text-primary hover:underline cursor-pointer">
                View All
            </button>
        </div>
        <div class="overflow-x-auto">
            <table class="w-full text-left">
                <thead>
                    <tr class="bg-white/2 border-b border-white/5">
                        <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40">
                            Description</th>
                        <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40 text-center">
                            Type</th>
                        <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40 text-center">
                            Status</th>
                        <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40 text-right">
                            Amount</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-white/5">
                    <tr v-for="item in activities" :key="item.id" class="hover:bg-white/5 transition-colors">
                        <td class="px-6 py-4">
                            <div class="flex items-center gap-3">
                                <div class="h-10 w-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-sm text-white shrink-0">
                                    <i :class="item.icon"></i>
                                </div>
                                <div class="w-full">
                                    <p class="font-bold text-sm text-white">{{ item.service }}</p>
                                    <p class="text-[11px] text-white/40 font-medium mt-0.5">{{ item.date }}</p>
                                </div>
                            </div>
                        </td>
                        <td class="px-6 py-4 text-center">
                            <span class="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/60">
                                {{ item.type }}
                            </span>
                        </td>
                        <td class="px-6 py-4 text-center">
                            <span
                                :class="`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${item.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`">
                                {{ item.status }}
                            </span>
                        </td>
                        <td class="px-6 py-4 text-right">
                            <p :class="`font-black text-sm ${item.amount.startsWith('+') ? 'text-emerald-400' : 'text-white'}`">
                                {{ item.amount }}
                            </p>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>