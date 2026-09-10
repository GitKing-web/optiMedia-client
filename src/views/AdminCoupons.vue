<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import Skeleton from '../components/Skeleton.vue'
import Pagination from '../components/Pagination.vue'
import { useAdminStore, type Coupon } from '../stores/admin'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const adminStore = useAdminStore()
const authStore = useAuthStore()

const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = 8

const showModal = ref(false)
const editMode = ref(false)
const message = ref<{ type: 'success' | 'error'; text: string } | null>(null)

const form = ref({
    id: '',
    code: '',
    type: 'percentage' as 'percentage' | 'fixed',
    value: 10,
    active: true,
    minAmount: '' as string | number,
    maxUses: '' as string | number,
    expiresAt: '',
})

const filtered = computed(() => {
    const q = searchQuery.value.trim().toLowerCase()
    if (!q) return adminStore.coupons
    return adminStore.coupons.filter((c) => c.code.toLowerCase().includes(q))
})

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize)))
const pagedCoupons = computed(() => {
    const start = (currentPage.value - 1) * pageSize
    return filtered.value.slice(start, start + pageSize)
})

watch(searchQuery, () => {
    currentPage.value = 1
})

onMounted(() => {
    adminStore.fetchCoupons()
})

function openCreate() {
    editMode.value = false
    message.value = null
    form.value = { id: '', code: '', type: 'percentage', value: 10, active: true, minAmount: '', maxUses: '', expiresAt: '' }
    showModal.value = true
}

function openEdit(coupon: Coupon) {
    editMode.value = true
    message.value = null
    form.value = {
        id: coupon.id,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        active: coupon.active,
        minAmount: coupon.minAmount ?? '',
        maxUses: coupon.maxUses ?? '',
        expiresAt: coupon.expiresAt ? coupon.expiresAt.slice(0, 10) : '',
    }
    showModal.value = true
}

async function save() {
    if (!form.value.code.trim()) {
        message.value = { type: 'error', text: 'Coupon code is required.' }
        return
    }
    if (!form.value.value || Number(form.value.value) <= 0) {
        message.value = { type: 'error', text: 'Value must be greater than 0.' }
        return
    }

    const payload = {
        code: form.value.code.trim().toUpperCase(),
        type: form.value.type,
        value: Number(form.value.value),
        active: form.value.active,
        minAmount: form.value.minAmount === '' ? null : Number(form.value.minAmount),
        maxUses: form.value.maxUses === '' ? null : Number(form.value.maxUses),
        expiresAt: form.value.expiresAt || null,
    }

    try {
        if (editMode.value) {
            await adminStore.updateCoupon(form.value.id, payload)
        } else {
            await adminStore.createCoupon(payload)
        }
        showModal.value = false
    } catch (e) {
        message.value = { type: 'error', text: e instanceof Error ? e.message : 'Unable to save coupon.' }
    }
}

async function toggleActive(coupon: Coupon) {
    await adminStore.updateCoupon(coupon.id, { active: !coupon.active })
}

async function remove(coupon: Coupon) {
    if (!confirm(`Delete coupon "${coupon.code}"? This cannot be undone.`)) return
    await adminStore.deleteCoupon(coupon.id)
}

function discountLabel(coupon: Coupon) {
    return coupon.type === 'percentage' ? `${coupon.value}% off` : `₦${coupon.value.toLocaleString()} off`
}

async function handleLogout() {
    await authStore.logout()
    router.push('/')
}
</script>

<template>
    <div class="min-h-screen bg-secondary text-white flex flex-col lg:flex-row">
        <aside
            class="w-full lg:w-72 bg-black/40 border-b lg:border-b-0 lg:border-r border-white/5 flex flex-col p-6 sm:p-8 lg:sticky top-0 h-auto lg:h-screen z-30">
            <div class="flex items-center gap-3 mb-8 lg:mb-12">
                <img src="/images/logo.jpeg" alt="Logo" class="h-10 w-10 rounded-xl" />
                <span class="text-xl font-black tracking-tighter uppercase italic">OPTIMEDIA ADMIN</span>
            </div>
            <nav class="flex flex-col gap-2 flex-1">
                <button @click="router.push('/admin')"
                    class="w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm tracking-tight text-white/40 hover:text-white hover:bg-white/5 transition-all text-left">
                    <i class="fa-solid fa-users-gear text-lg"></i> Users
                </button>
                <button @click="router.push('/admin/logs')"
                    class="w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm tracking-tight text-white/40 hover:text-white hover:bg-white/5 transition-all text-left">
                    <i class="fa-solid fa-clock-rotate-left text-lg"></i> Activity Logs
                </button>
                <button @click="router.push('/admin/revenue')"
                    class="w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm tracking-tight text-white/40 hover:text-white hover:bg-white/5 transition-all text-left">
                    <i class="fa-solid fa-chart-line text-lg"></i> Revenue
                </button>
                <button @click="router.push('/admin/email')"
                    class="w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm tracking-tight text-white/40 hover:text-white hover:bg-white/5 transition-all text-left">
                    <i class="fa-solid fa-envelope text-lg"></i> Email Users
                </button>
                <button @click="router.push('/admin/newsletter')"
                    class="w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm tracking-tight text-white/40 hover:text-white hover:bg-white/5 transition-all text-left">
                    <i class="fa-solid fa-envelope-open-text text-lg"></i> Newsletter
                </button>
                <button @click="router.push('/admin/family')"
                    class="w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm tracking-tight text-white/40 hover:text-white hover:bg-white/5 transition-all text-left">
                    <i class="fa-solid fa-users-rectangle text-lg"></i> Family Slots
                </button>
                <div
                    class="flex items-center gap-4 px-6 py-4 rounded-2xl bg-primary text-white shadow-xl shadow-primary/20 font-bold text-sm tracking-tight">
                    <i class="fa-solid fa-tags text-lg"></i> Coupons
                </div>
                <button @click="router.push('/admin/settings')"
                    class="w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm tracking-tight text-white/40 hover:text-white hover:bg-white/5 transition-all text-left">
                    <i class="fa-solid fa-gear text-lg"></i> Settings
                </button>
            </nav>
            <div class="mt-auto pt-6 border-t border-white/5 flex flex-col gap-2">
                <button @click="router.push('/dashboard')"
                    class="w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl font-bold text-sm tracking-tight text-white/40 hover:text-white hover:bg-white/5 transition-all text-left">
                    <i class="fa-solid fa-arrow-left text-lg"></i> Dashboard
                </button>
                <button @click="handleLogout" :disabled="authStore.isLoggingOut"
                    class="w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl font-bold text-sm tracking-tight text-red-400/60 hover:text-red-400 hover:bg-red-500/5 transition-all text-left disabled:opacity-60 disabled:cursor-not-allowed">
                    <i :class="authStore.isLoggingOut ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-right-from-bracket'"
                        class="text-lg"></i>
                    {{ authStore.isLoggingOut ? 'Logging out...' : 'Logout' }}
                </button>
            </div>
        </aside>

        <main class="flex-1 p-4 sm:p-6 lg:p-8 2xl:p-12 overflow-x-hidden flex flex-col">
            <div class="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
                <div>
                    <h1 class="text-3xl sm:text-4xl font-black tracking-tight uppercase italic">Coupons</h1>
                    <p class="text-white/40 text-sm font-medium mt-1">Create and manage discount codes for checkout.</p>
                </div>
                <div class="flex items-center gap-3">
                    <div class="relative w-full sm:w-64">
                        <i class="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm"></i>
                        <input v-model="searchQuery" type="text" placeholder="Search coupons..."
                            class="w-full bg-black/20 border border-white/5 rounded-xl py-2.5 pl-9 pr-4 text-sm text-white placeholder-white/20 focus:outline-none focus:border-primary/30 transition-all" />
                    </div>
                    <button @click="openCreate"
                        class="bg-primary text-white px-5 py-2.5 rounded-xl font-black uppercase text-xs tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/30 whitespace-nowrap">
                        <i class="fa-solid fa-plus mr-2"></i> New
                    </button>
                </div>
            </div>

            <div v-if="adminStore.isCouponsLoading" class="bg-white/5 rounded-3xl border border-white/10 overflow-hidden">
                <div v-for="i in 5" :key="i" class="flex items-center gap-4 px-5 py-4 border-b border-white/5">
                    <Skeleton width="6rem" height="1rem" />
                    <Skeleton width="5rem" height="1rem" />
                    <Skeleton width="4rem" height="1rem" />
                </div>
            </div>

            <div v-else-if="pagedCoupons.length > 0"
                class="bg-white/5 rounded-3xl border border-white/10 shadow-xl overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="w-full text-left">
                        <thead class="border-b border-white/5">
                            <tr class="text-[10px] font-black uppercase tracking-widest text-white/40">
                                <th class="px-5 py-4">Code</th>
                                <th class="px-5 py-4">Discount</th>
                                <th class="px-5 py-4">Usage</th>
                                <th class="px-5 py-4">Expires</th>
                                <th class="px-5 py-4">Status</th>
                                <th class="px-5 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-white/5">
                            <tr v-for="coupon in pagedCoupons" :key="coupon.id" class="hover:bg-white/5 transition-all">
                                <td class="px-5 py-4">
                                    <span class="font-black text-sm tracking-wider text-primary">{{ coupon.code }}</span>
                                    <p v-if="coupon.minAmount != null" class="text-[10px] text-white/30 mt-0.5">
                                        Min ₦{{ coupon.minAmount.toLocaleString() }}
                                    </p>
                                </td>
                                <td class="px-5 py-4 text-sm font-bold">{{ discountLabel(coupon) }}</td>
                                <td class="px-5 py-4 text-sm text-white/60">
                                    {{ coupon.usedCount }}<span v-if="coupon.maxUses != null"> / {{ coupon.maxUses }}</span>
                                </td>
                                <td class="px-5 py-4 text-xs text-white/50">
                                    {{ coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString() : '—' }}
                                </td>
                                <td class="px-5 py-4">
                                    <button @click="toggleActive(coupon)"
                                        class="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg transition-all"
                                        :class="coupon.active ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/10 text-white/40'">
                                        {{ coupon.active ? 'Active' : 'Disabled' }}
                                    </button>
                                </td>
                                <td class="px-5 py-4 text-right whitespace-nowrap">
                                    <button @click="openEdit(coupon)"
                                        class="px-3 py-1.5 rounded-lg bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-all text-[10px] font-black uppercase tracking-widest">
                                        Edit
                                    </button>
                                    <button @click="remove(coupon)"
                                        class="ml-1 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all text-[10px] font-black uppercase tracking-widest">
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div v-else
                class="bg-white/5 rounded-3xl border border-white/10 flex flex-col items-center justify-center py-20 text-center">
                <div class="h-16 w-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5 mb-6">
                    <i class="fa-solid fa-tags text-2xl text-white/20"></i>
                </div>
                <h3 class="text-xl font-black text-white mb-2">{{ searchQuery ? 'No matching coupons' : 'No coupons yet' }}</h3>
                <p class="text-white/40 text-sm max-w-md mb-6">
                    {{ searchQuery ? 'Try a different search term.' : 'Create your first discount code to offer at checkout.' }}
                </p>
                <button v-if="!searchQuery" @click="openCreate"
                    class="bg-primary text-white px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:brightness-110 transition-all">
                    Create Coupon
                </button>
            </div>

            <Pagination v-if="!adminStore.isCouponsLoading && filtered.length > pageSize"
                :page="currentPage" :total-pages="totalPages" :total="filtered.length" :page-size="pageSize"
                @update:page="currentPage = $event" />
        </main>
    </div>

    <!-- Coupon modal -->
    <Teleport to="body">
        <div v-if="showModal" @click.self="showModal = false"
            class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div class="bg-secondary text-white border border-white/10 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8">
                <h2 class="text-xl font-black uppercase tracking-tight italic mb-6">
                    {{ editMode ? 'Edit Coupon' : 'New Coupon' }}
                </h2>
                <div class="space-y-4">
                    <div>
                        <label class="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Code</label>
                        <input v-model="form.code" placeholder="WELCOME10" @input="form.code = form.code.toUpperCase()"
                            class="w-full bg-black/30 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-white/30 outline-none focus:border-primary/40 uppercase tracking-wider" />
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Type</label>
                            <select v-model="form.type"
                                class="w-full bg-black/30 border border-white/10 rounded-xl py-3 px-4 text-sm text-white outline-none focus:border-primary/40">
                                <option value="percentage">Percentage (%)</option>
                                <option value="fixed">Fixed (₦)</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">
                                Value {{ form.type === 'percentage' ? '(%)' : '(₦)' }}
                            </label>
                            <input v-model.number="form.value" type="number" min="1" :max="form.type === 'percentage' ? 100 : undefined"
                                class="w-full bg-black/30 border border-white/10 rounded-xl py-3 px-4 text-sm text-white outline-none focus:border-primary/40" />
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Min Amount (₦)</label>
                            <input v-model="form.minAmount" type="number" min="0" placeholder="Optional"
                                class="w-full bg-black/30 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-white/30 outline-none focus:border-primary/40" />
                        </div>
                        <div>
                            <label class="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Max Uses</label>
                            <input v-model="form.maxUses" type="number" min="1" placeholder="Unlimited"
                                class="w-full bg-black/30 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-white/30 outline-none focus:border-primary/40" />
                        </div>
                    </div>
                    <div>
                        <label class="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Expires On</label>
                        <input v-model="form.expiresAt" type="date"
                            class="w-full bg-black/30 border border-white/10 rounded-xl py-3 px-4 text-sm text-white outline-none focus:border-primary/40 [color-scheme:dark]" />
                    </div>
                    <label class="flex items-center gap-3 cursor-pointer select-none">
                        <input v-model="form.active" type="checkbox"
                            class="w-5 h-5 rounded border-white/20 text-primary focus:ring-primary cursor-pointer" />
                        <span class="text-sm font-bold text-white/70">Active (available at checkout)</span>
                    </label>
                    <p v-if="message" class="text-xs font-bold text-red-400">{{ message.text }}</p>
                </div>
                <div class="flex gap-3 mt-6">
                    <button @click="showModal = false"
                        class="flex-1 bg-white/5 text-white/60 py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-white/10 transition-all">
                        Cancel
                    </button>
                    <button @click="save" :disabled="adminStore.isSavingCoupon"
                        class="flex-1 bg-primary text-white py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:brightness-110 transition-all disabled:opacity-60">
                        {{ adminStore.isSavingCoupon ? 'Saving...' : 'Save' }}
                    </button>
                </div>
            </div>
        </div>
    </Teleport>
</template>
