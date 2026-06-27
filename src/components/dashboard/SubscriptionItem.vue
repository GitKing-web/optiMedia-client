<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
    name: string
    price: number
    status: 'active' | 'pending' | 'expired' | 'canceled'
    icon: string
    activeDate?: string // ISO string when it became active
    durationDays?: number
    isActive: boolean
}>()


const countdown = ref('')
let timer: any = null

function updateCountdown() {
    if (props.status !== 'active' || !props.activeDate || !props.durationDays) {
        countdown.value = props.status === 'pending' ? 'Activating account...' : 'Expired'
        return
    }

    const start = new Date(props.activeDate)
    const end = new Date(start.getTime() + props.durationDays * 24 * 60 * 60 * 1000)
    const now = new Date()
    const diff = end.getTime() - now.getTime()

    if (diff <= 0) {
        countdown.value = 'Expires soon'
        return
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

    if (days > 0) {
        countdown.value = `Expires in ${days}d ${hours}h`
    } else {
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        countdown.value = `Expires in ${hours}h ${minutes}m`
    }
}

onMounted(() => {
    updateCountdown()
    timer = setInterval(updateCountdown, 60000) // Update every minute
})

onUnmounted(() => {
    if (timer) clearInterval(timer)
})
</script>

<template>
    <div @click="$emit('select')"
        class="group relative flex items-center justify-between p-5 rounded-3xl border transition-all duration-500 cursor-pointer overflow-hidden"
        :class="isActive ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10' : 'border-secondary/5 bg-white hover:border-primary/30 hover:bg-muted'">
        <div class="flex items-center gap-4 relative z-10">
            <div
                :class="`h-12 w-12 rounded-2xl flex items-center justify-center text-xl transition-transform duration-500 group-hover:scale-110 ${isActive ? 'bg-primary text-white' : 'bg-muted text-secondary'}`">
                <i :class="icon"></i>
            </div>
            <div>
                <h4 class="font-bold text-secondary text-sm group-hover:text-primary transition-colors">{{ name }}</h4>
                <p class="text-[11px] text-secondary/40 font-medium">{{ countdown }}</p>
            </div>
        </div>

        <div class="text-right relative z-10">
            <p class="font-black text-secondary text-sm">₦{{ price.toLocaleString() }}</p>
            <span
                :class="`text-[9px] font-black uppercase tracking-widest ${status === 'active' ? 'text-tertiary' : status === 'pending' ? 'text-[#ffd700]' : 'text-red-500'}`">
                ● {{ status }}
            </span>
        </div>

        <!-- Progress Mini Bar -->
        <div v-if="status === 'active'" class="absolute bottom-0 left-0 h-1 bg-primary/20 w-full overflow-hidden">
            <div class="h-full bg-primary animate-pulse w-1/3"></div>
        </div>
    </div>
</template>
