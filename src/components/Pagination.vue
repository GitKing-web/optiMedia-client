<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
    defineProps<{
        page: number
        totalPages: number
        total?: number
        pageSize?: number
    }>(),
    { total: 0, pageSize: 10 },
)

const emit = defineEmits<{ (e: 'update:page', page: number): void }>()

const range = computed(() => {
    if (props.total === 0) return { from: 0, to: 0 }
    const from = (props.page - 1) * props.pageSize + 1
    const to = Math.min(props.page * props.pageSize, props.total)
    return { from, to }
})

const pages = computed<(number | '...')[]>(() => {
    const total = props.totalPages
    const current = props.page
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

    const items: (number | '...')[] = [1]
    const start = Math.max(2, current - 1)
    const end = Math.min(total - 1, current + 1)

    if (start > 2) items.push('...')
    for (let i = start; i <= end; i++) items.push(i)
    if (end < total - 1) items.push('...')
    items.push(total)

    return items
})

function go(page: number) {
    if (page < 1 || page > props.totalPages || page === props.page) return
    emit('update:page', page)
}
</script>

<template>
    <div v-if="totalPages > 1 || total > 0"
        class="flex flex-col sm:flex-row items-center justify-between gap-3 mt-5 px-1">
        <p class="text-[11px] font-bold uppercase tracking-widest text-white/40">
            Showing {{ range.from }}–{{ range.to }} of {{ total }}
        </p>
        <div v-if="totalPages > 1" class="flex items-center gap-1.5">
            <button @click="go(page - 1)" :disabled="page <= 1"
                class="h-9 px-3 rounded-lg bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-all text-xs font-black uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed">
                <i class="fa-solid fa-chevron-left"></i>
            </button>
            <template v-for="(item, index) in pages" :key="`${item}-${index}`">
                <span v-if="item === '...'" class="px-2 text-white/30 text-xs">…</span>
                <button v-else @click="go(item)"
                    class="h-9 min-w-9 px-3 rounded-lg transition-all text-xs font-black"
                    :class="item === page ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'">
                    {{ item }}
                </button>
            </template>
            <button @click="go(page + 1)" :disabled="page >= totalPages"
                class="h-9 px-3 rounded-lg bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-all text-xs font-black uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed">
                <i class="fa-solid fa-chevron-right"></i>
            </button>
        </div>
    </div>
</template>
