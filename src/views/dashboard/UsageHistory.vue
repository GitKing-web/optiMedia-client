<script setup lang="ts">
import { ref } from 'vue'

const transactions = ref([
    { id: 'tx101', serviceName: 'Netflix Premium', icon: 'fa-solid fa-play', amount: 2500, status: 'success', reference: 'OPT-NET-98234X', date: '2026-07-01' },
    { id: 'tx102', serviceName: 'Spotify Premium', icon: 'fa-brands fa-spotify', amount: 1000, status: 'pending', reference: 'OPT-SPO-11204C', date: '2026-07-09' },
    { id: 'tx103', serviceName: 'YouTube Premium', icon: 'fa-brands fa-youtube', amount: 1500, status: 'failed', reference: 'OPT-YUT-44912B', date: '2026-06-15' }
])
</script>

<template>
    <div class="flex-1 flex flex-col">
        <!-- Fixed `rounded-[2rem]` to v4 canonical `rounded-4xl` -->
        <div v-if="transactions.length > 0" class="bg-black/10 rounded-4xl border border-white/5 p-6 sm:p-8 flex-1 overflow-x-auto">
            <table class="w-full text-left border-collapse min-w-150">
                <thead>
                    <tr class="border-b border-white/5 text-white/40 text-[10px] font-black uppercase tracking-widest">
                        <th class="pb-4 px-4">Service Details</th>
                        <th class="pb-4 px-4">Billing Reference</th>
                        <th class="pb-4 px-4">Date Cleared</th>
                        <th class="pb-4 px-4">Transaction Amount</th>
                        <th class="pb-4 px-4 text-right">Invoice Status</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-white/5">
                    <tr v-for="tx in transactions" :key="tx.id" class="hover:bg-white/5 transition-all group">
                        <td class="py-5 px-4 flex items-center gap-4">
                            <div class="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/10">
                                <i :class="tx.icon"></i>
                            </div>
                            <span class="font-black text-sm text-white uppercase italic">{{ tx.serviceName }}</span>
                        </td>
                        <td class="py-5 px-4 font-mono text-xs text-white/60 tracking-wider">{{ tx.reference }}</td>
                        <td class="py-5 px-4 text-sm font-bold text-white/40">{{ tx.date }}</td>
                        <td class="py-5 px-4 text-sm font-black text-white">₦{{ tx.amount.toLocaleString() }}</td>
                        <td class="py-5 px-4 text-right">
                            <span v-if="tx.status === 'success'" class="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest">Cleared</span>
                            <span v-else-if="tx.status === 'pending'" class="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-lg text-[9px] font-black uppercase tracking-widest">Processing</span>
                            <span v-else class="px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest">Declined</span>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Fixed `rounded-[2rem]` to v4 canonical `rounded-4xl` -->
        <div v-else class="bg-black/10 rounded-4xl border border-white/5 p-8 flex flex-col items-center justify-center flex-1 min-h-87.5">
            <div class="h-16 w-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5 mb-6 text-white/40">
                <i class="fa-solid fa-receipt text-2xl"></i>
            </div>
            <h3 class="text-xl font-black tracking-tight mb-2 uppercase italic">No history available</h3>
            <p class="text-white/40 text-sm font-medium mb-6 text-center max-w-sm">No recorded billing files or invoices found under this identifier profile.</p>
        </div>
    </div>
</template>