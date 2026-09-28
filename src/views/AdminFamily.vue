<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import Skeleton from '../components/Skeleton.vue'
import { useAdminStore, type FamilyAccount, type FamilyMember, type FamilySlot } from '../stores/admin'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const adminStore = useAdminStore()
const authStore = useAuthStore()

const showAccountModal = ref(false)
const showSlotModal = ref(false)
const editMode = ref(false)
const activeAccount = ref<FamilyAccount | null>(null)
const targetSlot = ref<FamilySlot | null>(null)
const busy = ref(false)
const message = ref('')

const pageSearch = ref('')

const memberSearch = ref('')
const memberResults = ref<FamilyMember[]>([])
const isMemberSearching = ref(false)
const defaultMonths = ref(1)

interface QueuedMember {
    key: string
    memberName: string
    memberEmail: string
    memberContact: string
    months: number
    notes: string
}

const queuedMembers = ref<QueuedMember[]>([])

const accountForm = ref({
    id: '',
    label: '',
    serviceName: '',
    masterEmail: '',
    masterPassword: '',
    capacity: 6,
    monthlyCost: '' as string | number,
    renewalDate: '',
    notes: '',
})

const totals = computed(() => {
    const accounts = adminStore.familyAccounts
    return {
        accounts: accounts.length,
        slots: accounts.reduce((sum, a) => sum + a.capacity, 0),
        occupied: accounts.reduce((sum, a) => sum + a.summary.occupied, 0),
        vacant: accounts.reduce((sum, a) => sum + a.summary.vacant, 0),
    }
})

// Accounts shown on the page: alphabetically ordered (A–Z, case-insensitive) and
// filtered by the page search (label, service, master email or any member).
const visibleAccounts = computed(() => {
    const term = pageSearch.value.trim().toLowerCase()
    const sorted = [...adminStore.familyAccounts].sort((a, b) =>
        a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }),
    )
    if (!term) return sorted
    return sorted.filter((account) => {
        if (
            account.label.toLowerCase().includes(term) ||
            account.serviceName.toLowerCase().includes(term) ||
            account.masterEmail.toLowerCase().includes(term)
        ) {
            return true
        }
        return account.slots.some(
            (slot) =>
                (slot.memberName || '').toLowerCase().includes(term) ||
                (slot.memberEmail || '').toLowerCase().includes(term) ||
                (slot.memberContact || '').toLowerCase().includes(term),
        )
    })
})

const vacantSlotCount = computed(
    () => activeAccount.value?.slots.filter((slot) => slot.status === 'vacant').length ?? 0,
)

onMounted(() => {
    adminStore.fetchFamilyAccounts()
})

let searchTimer: ReturnType<typeof setTimeout> | null = null
watch(memberSearch, (value) => {
    if (searchTimer) clearTimeout(searchTimer)
    searchTimer = setTimeout(() => {
        runMemberSearch(value)
    }, 250)
})

async function runMemberSearch(value: string) {
    isMemberSearching.value = true
    try {
        memberResults.value = await adminStore.searchFamilyMembers(value)
    } catch {
        memberResults.value = []
    } finally {
        isMemberSearching.value = false
    }
}

function openCreate() {
    editMode.value = false
    accountForm.value = {
        id: '',
        label: '',
        serviceName: '',
        masterEmail: '',
        masterPassword: '',
        capacity: 6,
        monthlyCost: '',
        renewalDate: '',
        notes: '',
    }
    showAccountModal.value = true
}

function openEdit(account: FamilyAccount) {
    editMode.value = true
    accountForm.value = {
        id: account.id,
        label: account.label,
        serviceName: account.serviceName,
        masterEmail: account.masterEmail,
        masterPassword: account.masterPassword || '',
        capacity: account.capacity,
        monthlyCost: account.monthlyCost ?? '',
        renewalDate: account.renewalDate ? account.renewalDate.slice(0, 10) : '',
        notes: account.notes || '',
    }
    showAccountModal.value = true
}

async function saveAccount() {
    if (!accountForm.value.label.trim() || !accountForm.value.serviceName.trim() || !accountForm.value.masterEmail.trim()) {
        message.value = 'Label, service and master email are required.'
        return
    }

    busy.value = true
    message.value = ''
    try {
        const payload = {
            label: accountForm.value.label.trim(),
            serviceName: accountForm.value.serviceName.trim(),
            masterEmail: accountForm.value.masterEmail.trim(),
            masterPassword: accountForm.value.masterPassword || null,
            capacity: Number(accountForm.value.capacity) || 6,
            monthlyCost: accountForm.value.monthlyCost === '' ? null : Number(accountForm.value.monthlyCost),
            renewalDate: accountForm.value.renewalDate || null,
            notes: accountForm.value.notes || null,
        }

        if (editMode.value) {
            await adminStore.updateFamilyAccount(accountForm.value.id, payload)
        } else {
            await adminStore.createFamilyAccount(payload)
        }
        showAccountModal.value = false
    } catch (e) {
        message.value = e instanceof Error ? e.message : 'Unable to save account.'
    } finally {
        busy.value = false
    }
}

function openAddMembers(account: FamilyAccount, slot: FamilySlot | null = null) {
    activeAccount.value = account
    targetSlot.value = slot
    queuedMembers.value = []
    memberSearch.value = ''
    memberResults.value = []
    defaultMonths.value = 1
    message.value = ''
    showSlotModal.value = true
    runMemberSearch('')
}

function openAssign(account: FamilyAccount, slot: FamilySlot) {
    openAddMembers(account, slot)
}

function isAlreadyQueued(user: FamilyMember) {
    const email = user.email.toLowerCase()
    const name = user.name.toLowerCase()
    return queuedMembers.value.some(
        (member) => member.memberEmail.toLowerCase() === email || member.memberName.toLowerCase() === name,
    )
}

function addMemberFromUser(user: FamilyMember) {
    if (isAlreadyQueued(user)) return
    queuedMembers.value.push({
        key: `user-${user.id}`,
        memberName: user.name,
        memberEmail: user.email,
        memberContact: user.whatsapp || '',
        months: defaultMonths.value,
        notes: '',
    })
    memberSearch.value = ''
    memberResults.value = []
}

function addManualMember() {
    queuedMembers.value.push({
        key: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        memberName: '',
        memberEmail: '',
        memberContact: '',
        months: defaultMonths.value,
        notes: '',
    })
}

function removeQueuedMember(key: string) {
    queuedMembers.value = queuedMembers.value.filter((member) => member.key !== key)
}

function applyDefaultMonths() {
    queuedMembers.value.forEach((member) => {
        member.months = defaultMonths.value
    })
}

async function saveMembers() {
    if (!activeAccount.value) return

    const members = queuedMembers.value
        .map((member, index) => ({
            memberName: member.memberName.trim(),
            memberEmail: member.memberEmail.trim() || undefined,
            memberContact: member.memberContact.trim() || undefined,
            months: Number(member.months) || 1,
            notes: member.notes.trim() || undefined,
            slotId: index === 0 ? targetSlot.value?.id : undefined,
        }))
        .filter((member) => member.memberName)

    if (members.length === 0) {
        message.value = 'Add at least one member before saving.'
        return
    }

    busy.value = true
    message.value = ''
    try {
        await adminStore.bulkAssignFamilySlots(activeAccount.value.id, members)
        showSlotModal.value = false
    } catch (e) {
        message.value = e instanceof Error ? e.message : 'Unable to add members.'
    } finally {
        busy.value = false
    }
}

async function extend(account: FamilyAccount, slot: FamilySlot, months: number) {
    busy.value = true
    try {
        await adminStore.extendFamilySlot(account.id, slot.id, months)
    } finally {
        busy.value = false
    }
}

async function vacate(account: FamilyAccount, slot: FamilySlot) {
    if (!confirm(`Free slot ${slot.slotNumber} (${slot.memberName || 'member'})?`)) return
    busy.value = true
    try {
        await adminStore.vacateFamilySlot(account.id, slot.id)
    } finally {
        busy.value = false
    }
}

async function cleanup(account: FamilyAccount) {
    if (!confirm(`Remove all expired members from ${account.label}?`)) return
    busy.value = true
    try {
        await adminStore.cleanupFamilySlots(account.id)
    } finally {
        busy.value = false
    }
}

async function removeAccount(account: FamilyAccount) {
    if (!confirm(`Delete master account "${account.label}" and all its slots? This cannot be undone.`)) return
    busy.value = true
    try {
        await adminStore.deleteFamilyAccount(account.id)
    } finally {
        busy.value = false
    }
}

function slotClasses(status: FamilySlot['status']) {
    if (status === 'vacant') return 'border-emerald-500/40 bg-emerald-500/10'
    if (status === 'expired') return 'border-amber-500/40 bg-amber-500/10'
    return 'border-white/10 bg-black/20'
}

function statusBadge(status: FamilySlot['status']) {
    if (status === 'vacant') return 'bg-emerald-500/20 text-emerald-300'
    if (status === 'expired') return 'bg-amber-500/20 text-amber-300'
    return 'bg-primary/20 text-primary'
}

function formatDate(value: string | null) {
    if (!value) return '—'
    return new Date(value).toLocaleDateString()
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
                    <i class="fa-solid fa-users-gear text-lg"></i>
                    Users
                </button>
                <button @click="router.push('/admin/logs')"
                    class="w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm tracking-tight text-white/40 hover:text-white hover:bg-white/5 transition-all text-left">
                    <i class="fa-solid fa-clock-rotate-left text-lg"></i>
                    Activity Logs
                </button>
                <button @click="router.push('/admin/revenue')"
                    class="w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm tracking-tight text-white/40 hover:text-white hover:bg-white/5 transition-all text-left">
                    <i class="fa-solid fa-chart-line text-lg"></i>
                    Revenue
                </button>
                <button @click="router.push('/admin/email')"
                    class="w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm tracking-tight text-white/40 hover:text-white hover:bg-white/5 transition-all text-left">
                    <i class="fa-solid fa-envelope text-lg"></i>
                    Email Users
                </button>
                <button @click="router.push('/admin/newsletter')"
                    class="w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm tracking-tight text-white/40 hover:text-white hover:bg-white/5 transition-all text-left">
                    <i class="fa-solid fa-envelope-open-text text-lg"></i>
                    Newsletter
                </button>
                <div
                    class="flex items-center gap-4 px-6 py-4 rounded-2xl bg-primary text-white shadow-xl shadow-primary/20 font-bold text-sm tracking-tight">
                    <i class="fa-solid fa-users-rectangle text-lg"></i>
                    Family Slots
                </div>
                <button @click="router.push('/admin/coupons')"
                    class="w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm tracking-tight text-white/40 hover:text-white hover:bg-white/5 transition-all text-left">
                    <i class="fa-solid fa-tags text-lg"></i>
                    Coupons
                </button>
                <button @click="router.push('/admin/settings')"
                    class="w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm tracking-tight text-white/40 hover:text-white hover:bg-white/5 transition-all text-left">
                    <i class="fa-solid fa-gear text-lg"></i>
                    Settings
                </button>
            </nav>
            <div class="mt-auto pt-6 border-t border-white/5 flex flex-col gap-2">
                <button @click="router.push('/dashboard')"
                    class="w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl font-bold text-sm tracking-tight text-white/40 hover:text-white hover:bg-white/5 transition-all text-left">
                    <i class="fa-solid fa-arrow-left text-lg"></i>
                    Dashboard
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
                    <h1 class="text-3xl sm:text-4xl font-black tracking-tight uppercase italic">Family Slots</h1>
                    <p class="text-white/40 text-sm font-medium mt-1">
                        Track master accounts, slot capacity, members and expiry dates.
                    </p>
                </div>
                <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div class="relative">
                        <i class="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm"></i>
                        <input v-model="pageSearch" placeholder="Search accounts or members..."
                            class="w-full sm:w-72 bg-black/30 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-white/30 outline-none focus:border-primary/40" />
                        <button v-if="pageSearch" @click="pageSearch = ''"
                            class="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"
                            title="Clear search" aria-label="Clear search">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                    <button @click="openCreate"
                        class="bg-primary text-white px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/30 whitespace-nowrap">
                        <i class="fa-solid fa-plus mr-2"></i> New Master Account
                    </button>
                </div>
            </div>

            <div v-if="adminStore.isFamilyLoading && adminStore.familyAccounts.length === 0" class="space-y-6">
                <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div v-for="i in 4" :key="i" class="bg-white/5 p-5 rounded-3xl border border-white/10">
                        <Skeleton width="5rem" height="0.8rem" class="mb-3" />
                        <Skeleton width="3rem" height="1.6rem" />
                    </div>
                </div>
                <div v-for="i in 2" :key="i" class="bg-white/5 rounded-3xl border border-white/10 p-6 space-y-4">
                    <Skeleton width="12rem" height="1.2rem" />
                    <Skeleton width="100%" height="6rem" radius="1rem" />
                </div>
            </div>

            <template v-else>
                <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div class="bg-white/5 p-5 rounded-3xl border border-white/10">
                        <p class="text-[10px] font-black uppercase tracking-widest text-white/40">Master Accounts</p>
                        <p class="text-2xl font-black mt-1">{{ totals.accounts }}</p>
                    </div>
                    <div class="bg-white/5 p-5 rounded-3xl border border-white/10">
                        <p class="text-[10px] font-black uppercase tracking-widest text-white/40">Total Slots</p>
                        <p class="text-2xl font-black mt-1">{{ totals.slots }}</p>
                    </div>
                    <div class="bg-white/5 p-5 rounded-3xl border border-white/10">
                        <p class="text-[10px] font-black uppercase tracking-widest text-white/40">Occupied</p>
                        <p class="text-2xl font-black mt-1 text-primary">{{ totals.occupied }}</p>
                    </div>
                    <div class="bg-white/5 p-5 rounded-3xl border border-white/10">
                        <p class="text-[10px] font-black uppercase tracking-widest text-white/40">Vacant</p>
                        <p class="text-2xl font-black mt-1 text-emerald-400">{{ totals.vacant }}</p>
                    </div>
                </div>

                <div v-if="adminStore.familyAccounts.length === 0"
                    class="bg-white/5 rounded-3xl border border-white/10 flex flex-col items-center justify-center py-20 text-center">
                    <div class="h-16 w-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5 mb-6">
                        <i class="fa-solid fa-users-rectangle text-2xl text-white/20"></i>
                    </div>
                    <h3 class="text-xl font-black text-white mb-2">No master accounts yet</h3>
                    <p class="text-white/40 text-sm max-w-md mb-6">
                        Add a master account (e.g. Spotify Family) to start tracking its slots.
                    </p>
                    <button @click="openCreate"
                        class="bg-primary text-white px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:brightness-110 transition-all">
                        Add Master Account
                    </button>
                </div>

                <div v-else-if="visibleAccounts.length === 0"
                    class="bg-white/5 rounded-3xl border border-white/10 flex flex-col items-center justify-center py-16 text-center">
                    <i class="fa-solid fa-magnifying-glass text-2xl text-white/20 mb-4"></i>
                    <h3 class="text-lg font-black text-white mb-1">No matches</h3>
                    <p class="text-white/40 text-sm">No account or member matches "{{ pageSearch }}".</p>
                </div>

                <div v-else class="space-y-6">
                    <div v-for="account in visibleAccounts" :key="account.id"
                        class="bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 shadow-xl overflow-hidden">
                        <div class="p-5 sm:p-6 border-b border-white/5 flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
                            <div class="min-w-0">
                                <div class="flex items-center gap-3 flex-wrap">
                                    <h2 class="text-lg font-black uppercase italic truncate">{{ account.label }}</h2>
                                    <span class="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2.5 py-1 rounded-lg">
                                        {{ account.serviceName }}
                                    </span>
                                    <span v-if="account.summary.vacant > 0"
                                        class="text-[10px] font-black uppercase tracking-widest text-emerald-300 bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                                        {{ account.summary.vacant }} vacant
                                    </span>
                                </div>
                                <p class="text-xs text-white/50 mt-2 break-all">
                                    <i class="fa-solid fa-envelope mr-1"></i>{{ account.masterEmail }}
                                    <span class="mx-2 text-white/20">·</span>
                                    <i class="fa-solid fa-sync mr-1"></i>Renews {{ formatDate(account.renewalDate) }}
                                    <span class="mx-2 text-white/20">·</span>
                                    {{ account.summary.occupied }}/{{ account.capacity }} slots used
                                </p>
                            </div>
                            <div class="flex items-center gap-2 shrink-0">
                                <button @click="openAddMembers(account)"
                                    class="px-3.5 py-2 rounded-lg bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 transition-all text-[10px] font-black uppercase tracking-widest">
                                    <i class="fa-solid fa-user-plus mr-1"></i> Add members
                                </button>
                                <button @click="cleanup(account)"
                                    class="px-3.5 py-2 rounded-lg bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-all text-[10px] font-black uppercase tracking-widest">
                                    <i class="fa-solid fa-broom mr-1"></i> Clean expired
                                </button>
                                <button @click="openEdit(account)"
                                    class="px-3.5 py-2 rounded-lg bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-all text-[10px] font-black uppercase tracking-widest">
                                    <i class="fa-solid fa-pen mr-1"></i> Edit
                                </button>
                                <button @click="removeAccount(account)"
                                    class="px-3.5 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all text-[10px] font-black uppercase tracking-widest">
                                    <i class="fa-solid fa-trash"></i>
                                </button>
                            </div>
                        </div>

                        <div class="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                            <div v-for="slot in account.slots" :key="slot.id"
                                class="rounded-2xl border p-4 flex flex-col gap-3 transition-all"
                                :class="slotClasses(slot.status)">
                                <div class="flex items-center justify-between">
                                    <span class="text-[10px] font-black uppercase tracking-widest text-white/40">
                                        Slot {{ slot.slotNumber }}
                                    </span>
                                    <span class="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded"
                                        :class="statusBadge(slot.status)">
                                        {{ slot.status }}
                                    </span>
                                </div>

                                <div v-if="slot.status === 'vacant'">
                                    <p class="text-sm font-black text-emerald-300 mb-1">Open slot</p>
                                    <p class="text-xs text-white/40 mb-3">Ready to assign a new customer.</p>
                                    <button @click="openAssign(account, slot)"
                                        class="w-full bg-emerald-500 text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all">
                                        <i class="fa-solid fa-user-plus mr-1"></i> Assign member
                                    </button>
                                </div>

                                <div v-else class="flex flex-col gap-3">
                                    <div>
                                        <p class="text-sm font-black text-white truncate">{{ slot.memberName || 'Member' }}</p>
                                        <p v-if="slot.memberEmail" class="text-xs text-white/50 truncate">{{ slot.memberEmail }}</p>
                                        <p v-if="slot.memberContact" class="text-xs text-white/40 truncate">
                                            <i class="fa-brands fa-whatsapp mr-1"></i>{{ slot.memberContact }}
                                        </p>
                                    </div>
                                    <p class="text-[11px] font-bold"
                                        :class="slot.status === 'expired' ? 'text-amber-300' : 'text-white/50'">
                                        Expires {{ formatDate(slot.expireDate) }}
                                        <span v-if="slot.status === 'expired'"> · expired</span>
                                    </p>
                                    <div class="flex items-center gap-2">
                                        <button @click="extend(account, slot, 1)" :disabled="busy"
                                            class="flex-1 bg-white/10 text-white/70 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all disabled:opacity-50">
                                            +1 mo
                                        </button>
                                        <button @click="extend(account, slot, 3)" :disabled="busy"
                                            class="flex-1 bg-white/10 text-white/70 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all disabled:opacity-50">
                                            +3 mo
                                        </button>
                                        <button @click="vacate(account, slot)" :disabled="busy"
                                            class="px-3 bg-white/5 text-white/40 hover:text-red-400 hover:bg-red-500/10 py-2 rounded-lg transition-all disabled:opacity-50"
                                            title="Free slot" aria-label="Free slot">
                                            <i class="fa-solid fa-xmark"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </template>
        </main>
    </div>

    <!-- Account modal -->
    <Teleport to="body">
        <div v-if="showAccountModal" @click.self="showAccountModal = false"
            class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div class="bg-secondary text-white border border-white/10 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8">
                <h2 class="text-xl font-black uppercase tracking-tight italic mb-6">
                    {{ editMode ? 'Edit Master Account' : 'New Master Account' }}
                </h2>
                <div class="space-y-4">
                    <div>
                        <label class="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Label</label>
                        <input v-model="accountForm.label" placeholder="Spotify Family A"
                            class="w-full bg-black/30 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-white/30 outline-none focus:border-primary/40" />
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Service</label>
                            <input v-model="accountForm.serviceName" placeholder="Spotify Family"
                                class="w-full bg-black/30 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-white/30 outline-none focus:border-primary/40" />
                        </div>
                        <div>
                            <label class="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Slots</label>
                            <input v-model="accountForm.capacity" type="number" min="1" max="50"
                                class="w-full bg-black/30 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-white/30 outline-none focus:border-primary/40" />
                        </div>
                    </div>
                    <div>
                        <label class="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Master Email</label>
                        <input v-model="accountForm.masterEmail" type="email" placeholder="master@example.com"
                            class="w-full bg-black/30 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-white/30 outline-none focus:border-primary/40" />
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Master Password</label>
                            <input v-model="accountForm.masterPassword" type="text" placeholder="Optional"
                                class="w-full bg-black/30 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-white/30 outline-none focus:border-primary/40" />
                        </div>
                        <div>
                            <label class="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Renewal Date</label>
                            <input v-model="accountForm.renewalDate" type="date"
                                class="w-full bg-black/30 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-white/30 outline-none focus:border-primary/40 [color-scheme:dark]" />
                        </div>
                    </div>
                    <div>
                        <label class="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Monthly Cost (₦)</label>
                        <input v-model="accountForm.monthlyCost" type="number" min="0" placeholder="Optional"
                            class="w-full bg-black/30 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-white/30 outline-none focus:border-primary/40" />
                    </div>
                    <div>
                        <label class="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Notes</label>
                        <textarea v-model="accountForm.notes" rows="2" placeholder="Optional"
                            class="w-full bg-black/30 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-white/30 outline-none focus:border-primary/40"></textarea>
                    </div>
                    <p v-if="message" class="text-xs font-bold text-red-400">{{ message }}</p>
                </div>
                <div class="flex gap-3 mt-6">
                    <button @click="showAccountModal = false"
                        class="flex-1 bg-white/5 text-white/60 py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-white/10 transition-all">
                        Cancel
                    </button>
                    <button @click="saveAccount" :disabled="busy"
                        class="flex-1 bg-primary text-white py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:brightness-110 transition-all disabled:opacity-60">
                        {{ busy ? 'Saving...' : 'Save' }}
                    </button>
                </div>
            </div>
        </div>
    </Teleport>

    <!-- Add members modal -->
    <Teleport to="body">
        <div v-if="showSlotModal" @click.self="showSlotModal = false"
            class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div class="bg-secondary text-white border border-white/10 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8">
                <div class="flex items-start justify-between gap-4 mb-1">
                    <h2 class="text-xl font-black uppercase tracking-tight italic">Add Members</h2>
                    <span class="text-[10px] font-black uppercase tracking-widest text-emerald-300 bg-emerald-500/10 px-2.5 py-1 rounded-lg shrink-0">
                        {{ vacantSlotCount }} vacant
                    </span>
                </div>
                <p class="text-white/40 text-xs mb-6">
                    {{ activeAccount?.label }}
                    <template v-if="targetSlot"> · starting at slot {{ targetSlot.slotNumber }}</template>
                </p>

                <div class="space-y-3">
                    <label class="block text-[10px] font-black uppercase tracking-widest text-white/40">Find a member</label>
                    <div class="relative">
                        <i class="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm"></i>
                        <input v-model="memberSearch" placeholder="Search by name, email or WhatsApp..."
                            class="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-10 pr-10 text-sm text-white placeholder-white/30 outline-none focus:border-primary/40" />
                        <i v-if="isMemberSearching"
                            class="fa-solid fa-spinner fa-spin absolute right-4 top-1/2 -translate-y-1/2 text-white/30"></i>
                    </div>

                    <div v-if="memberResults.length"
                        class="max-h-44 overflow-y-auto rounded-xl border border-white/10 divide-y divide-white/5">
                        <button v-for="user in memberResults" :key="user.id" type="button" @click="addMemberFromUser(user)"
                            :disabled="isAlreadyQueued(user)"
                            class="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                            <span class="h-9 w-9 rounded-full bg-primary/20 text-primary flex items-center justify-center font-black text-xs shrink-0">
                                {{ (user.name || '?').charAt(0).toUpperCase() }}
                            </span>
                            <span class="min-w-0 flex-1">
                                <span class="block text-sm font-bold text-white truncate">{{ user.name }}</span>
                                <span class="block text-xs text-white/40 truncate">
                                    {{ user.email }}<template v-if="user.whatsapp"> · {{ user.whatsapp }}</template>
                                </span>
                            </span>
                            <i :class="isAlreadyQueued(user) ? 'fa-solid fa-check text-emerald-400' : 'fa-solid fa-plus text-white/40'"></i>
                        </button>
                    </div>
                    <p v-else-if="memberSearch.trim() && !isMemberSearching" class="text-xs text-white/30 px-1">
                        No registered user found. Use "Add manually" below.
                    </p>
                </div>

                <div class="flex flex-wrap items-end gap-3 mt-5">
                    <div>
                        <label class="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Default duration</label>
                        <select v-model.number="defaultMonths" @change="applyDefaultMonths"
                            class="bg-black/30 border border-white/10 rounded-xl py-3 px-4 text-sm text-white outline-none focus:border-primary/40">
                            <option :value="1">1 month</option>
                            <option :value="2">2 months</option>
                            <option :value="3">3 months</option>
                            <option :value="6">6 months</option>
                            <option :value="12">12 months</option>
                        </select>
                    </div>
                    <button @click="addManualMember" type="button"
                        class="bg-white/5 text-white/70 px-4 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all">
                        <i class="fa-solid fa-keyboard mr-1"></i> Add manually
                    </button>
                </div>

                <div v-if="queuedMembers.length" class="mt-5 space-y-3">
                    <p class="text-[10px] font-black uppercase tracking-widest text-white/40">
                        To add ({{ queuedMembers.length }})
                    </p>
                    <div v-for="member in queuedMembers" :key="member.key"
                        class="rounded-2xl border border-white/10 bg-black/20 p-3 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                        <input v-model="member.memberName" placeholder="Full name"
                            class="sm:col-span-4 bg-black/30 border border-white/10 rounded-lg py-2 px-3 text-sm text-white placeholder-white/30 outline-none focus:border-primary/40" />
                        <input v-model="member.memberEmail" placeholder="Email"
                            class="sm:col-span-4 bg-black/30 border border-white/10 rounded-lg py-2 px-3 text-sm text-white placeholder-white/30 outline-none focus:border-primary/40" />
                        <input v-model="member.memberContact" placeholder="WhatsApp"
                            class="sm:col-span-2 bg-black/30 border border-white/10 rounded-lg py-2 px-3 text-sm text-white placeholder-white/30 outline-none focus:border-primary/40" />
                        <select v-model.number="member.months"
                            class="sm:col-span-1 bg-black/30 border border-white/10 rounded-lg py-2 px-2 text-sm text-white outline-none focus:border-primary/40">
                            <option :value="1">1</option>
                            <option :value="2">2</option>
                            <option :value="3">3</option>
                            <option :value="6">6</option>
                            <option :value="12">12</option>
                        </select>
                        <button @click="removeQueuedMember(member.key)" type="button"
                            class="sm:col-span-1 text-white/40 hover:text-red-400 justify-self-end sm:justify-self-center"
                            title="Remove" aria-label="Remove">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>
                <p v-else class="mt-5 text-xs text-white/30">
                    Search above and select members, or add them manually.
                </p>

                <p v-if="message" class="text-xs font-bold text-red-400 mt-4">{{ message }}</p>

                <div class="flex gap-3 mt-6">
                    <button @click="showSlotModal = false"
                        class="flex-1 bg-white/5 text-white/60 py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-white/10 transition-all">
                        Cancel
                    </button>
                    <button @click="saveMembers" :disabled="busy || queuedMembers.length === 0"
                        class="flex-1 bg-primary text-white py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                        {{ busy ? 'Adding...' : `Add ${queuedMembers.length || ''} member${queuedMembers.length === 1 ? '' : 's'}` }}
                    </button>
                </div>
            </div>
        </div>
    </Teleport>
</template>
