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
    <div class="bg-white rounded-3xl border border-secondary/5 shadow-sm overflow-hidden">
        <div class="p-6 border-b border-secondary/5 flex justify-between items-center">
            <h3 class="text-lg font-black text-secondary">Recent Activity</h3>
            <button class="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">View
                All</button>
        </div>
        <div class="overflow-x-auto">
            <table class="w-full text-left">
                <thead>
                    <tr class="bg-muted/50">
                        <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary/40">
                            Description</th>
                        <th
                            class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary/40 text-center">
                            Type</th>
                        <th
                            class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary/40 text-center">
                            Status</th>
                        <th
                            class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary/40 text-right">
                            Amount</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-secondary/5">
                    <tr v-for="item in activities" :key="item.id" class="hover:bg-muted/30 transition-colors">
                        <td class="px-6 py-4">
                            <div class="flex items-center gap-3">
                                <div class="h-10 w-10 rounded-xl bg-muted flex items-center justify-center text-sm">
                                    <i :class="item.icon"></i>
                                </div>
                                <div class="w-full">
                                    <p class="font-bold text-sm text-secondary">{{ item.service }}</p>
                                    <p class="text-[11px] text-secondary/40 font-medium">{{ item.date }}</p>
                                </div>
                            </div>
                        </td>
                        <td class="px-6 py-4 text-center">
                            <span
                                class="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-secondary/5 text-secondary/60">
                                {{ item.type }}
                            </span>
                        </td>
                        <td class="px-6 py-4 text-center">
                            <span
                                :class="`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${item.status === 'Completed' ? 'bg-tertiary/10 text-tertiary' : 'bg-orange-500/10 text-orange-500'}`">
                                {{ item.status }}
                            </span>
                        </td>
                        <td class="px-6 py-4 text-right">
                            <p
                                :class="`font-black text-sm ${item.amount.startsWith('+') ? 'text-tertiary' : 'text-secondary'}`">
                                {{ item.amount }}
                            </p>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>
