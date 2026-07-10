<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<template>
    <div class="space-y-8">
        <!-- Metrics Stats Counters Grid Layout -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div class="bg-black/10 p-6 rounded-3xl border border-white/5 relative flex items-center justify-between">
                <div>
                    <p class="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Tax / Monthly Spend</p>
                    <h3 class="text-3xl font-black">₦18,490</h3>
                </div>
                <span class="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 px-3 py-1 rounded-full">-12% vs last month</span>
            </div>
            <!-- <div class="bg-black/10 p-6 rounded-3xl border border-white/5 relative flex items-center justify-between">
                <div>
                    <p class="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Financial Health</p>
                    <h3 class="text-3xl font-black text-emerald-400">Excellent</h3>
                </div>
                <span class="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 px-3 py-1 rounded-full">Very Good</span>
            </div> -->
            <div class="bg-black/10 p-6 rounded-3xl border border-white/5 relative flex items-center justify-between">
                <div>
                    <p class="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Active Services</p>
                    <h3 class="text-3xl font-black">0 Services</h3>
                </div>
                <span class="text-[10px] font-bold bg-white/5 text-white/60 border border-white/5 px-3 py-1 rounded-full">No changes</span>
            </div>
        </div>

        <!-- Fixed `rounded-[2rem]` to v4 canonical `rounded-4xl` -->
        <div class="bg-black/10 rounded-4xl border border-white/5 p-8 flex flex-col items-center justify-center min-h-87.5">
            <div class="h-16 w-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5 mb-6 text-white/40">
                <i class="fa-solid fa-box-open text-2xl"></i>
            </div>
            <h3 class="text-xl font-black tracking-tight mb-2 uppercase italic">No active subscriptions</h3>
            <p class="text-white/40 text-sm font-medium mb-6 text-center max-w-sm">You haven't subscribed to any services yet. Start exploring our catalog to get active.</p>
            <button @click="router.push('/subscriptions')"
                class="bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-xs px-8 py-4 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center gap-2">
                Browse Services
                <i class="fa-solid fa-arrow-right"></i>
            </button>
        </div>
    </div>
</template>