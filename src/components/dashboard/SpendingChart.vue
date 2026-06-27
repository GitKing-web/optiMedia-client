<script setup lang="ts">
</script>

<template>
    <div class="bg-white p-8 rounded-3xl border border-secondary/5 shadow-sm h-full flex flex-col">
        <div class="flex justify-between items-center mb-8">
            <div>
                <h3 class="text-lg font-black text-secondary">Spending Trends</h3>
                <p class="text-[11px] text-secondary/40 font-bold uppercase tracking-widest">Monthly analysis</p>
            </div>
            <select class="bg-muted border-none rounded-xl px-4 py-2 text-xs font-bold text-secondary/60 focus:ring-0">
                <option>Last 6 Months</option>
                <option>Last Year</option>
            </select>
        </div>

        <div class="flex-1 min-h-[200px] relative">
            <svg viewBox="0 0 800 300" class="w-full h-full">
                <!-- Grid Lines -->
                <line v-for="i in 4" :key="i" x1="0" :y1="i * 75" x2="800" :y2="i * 75" stroke="currentColor"
                    class="text-secondary/5" stroke-dasharray="4" />

                <!-- Main Path -->
                <path d="M 0 250 Q 100 250 150 180 T 300 120 T 450 200 T 600 80 T 800 150" fill="none"
                    stroke="var(--primary)" stroke-width="4" stroke-linecap="round"
                    class="drop-shadow-lg shadow-primary/50" />

                <!-- Area Gradient -->
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="var(--primary)" stop-opacity="0.2" />
                    <stop offset="100%" stop-color="var(--primary)" stop-opacity="0" />
                </linearGradient>
                <path d="M 0 250 Q 100 250 150 180 T 300 120 T 450 200 T 600 80 T 800 150 L 800 300 L 0 300 Z"
                    fill="url(#chartGradient)" />

                <!-- Data Points -->
                <circle cx="150" cy="180" r="6" fill="white" stroke="var(--primary)" stroke-width="3" />
                <circle cx="300" cy="120" r="6" fill="white" stroke="var(--primary)" stroke-width="3" />
                <circle cx="600" cy="80" r="6" fill="white" stroke="var(--primary)" stroke-width="3" />
            </svg>
        </div>

        <div class="flex justify-between mt-6 px-2">
            <span v-for="month in ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']" :key="month"
                class="text-[10px] font-bold text-secondary/30 uppercase">
                {{ month }}
            </span>
        </div>
    </div>
</template>

<style scoped>
svg {
    filter: drop-shadow(0 10px 10px rgba(99, 102, 241, 0.1));
}
</style>
