<script setup lang="ts">
defineProps<{
    title: string
    value: string
    change?: string
    isPositive?: boolean
    icon: string
    color: string
}>()
</script>

<template>
    <div class="bg-white p-6 rounded-3xl border border-secondary/5 shadow-sm hover:shadow-md transition-shadow">
        <div class="flex justify-between items-start mb-4">
            <div :class="`h-12 w-12 rounded-2xl flex items-center justify-center text-xl bg-${color}/10 text-${color}`">
                <i :class="icon"></i>
            </div>
            <div v-if="change"
                :class="`px-3 py-1 rounded-full text-[10px] font-bold ${isPositive ? 'bg-tertiary/10 text-tertiary' : 'bg-red-500/10 text-red-500'}`">
                {{ change }}
            </div>
        </div>
        <div>
            <p class="text-[10px] font-black uppercase tracking-[0.2em] text-secondary/40 mb-1">{{ title }}</p>
            <h3 class="text-2xl font-black text-secondary">{{ value }}</h3>
        </div>
    </div>
</template>

<style scoped>
/* Ensure tailwind dynamic colors work if needed, though Tailwind 4 handles them differently. 
   Using explicit classes or inline styles might be safer for highly dynamic content. */
</style>
