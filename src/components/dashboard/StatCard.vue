<script setup lang="ts">
defineProps<{
    title: string
    value: string
    change?: string
    isPositive?: boolean
    icon: string
    color?: string
}>()
</script>

<template>
    <div class="bg-white/5 backdrop-blur-md p-6 rounded-4xl border border-white/10 shadow-sm transition-all hover:border-white/20">
        <div class="flex justify-between items-start mb-4">
            <div class="h-12 w-12 rounded-2xl flex items-center justify-center text-xl bg-primary/10 text-primary border border-primary/20">
                <i :class="icon"></i>
            </div>
            <div v-if="change"
                :class="`px-3 py-1 rounded-full text-[10px] font-bold tracking-tight ${isPositive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`">
                {{ change }}
            </div>
        </div>
        <div>
            <p class="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-1">{{ title }}</p>
            <h3 class="text-2xl sm:text-3xl font-black text-white italic tracking-tight">{{ value }}</h3>
        </div>
    </div>
</template>

<style scoped>
</style>