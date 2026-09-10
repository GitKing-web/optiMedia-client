<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import Skeleton from '../components/Skeleton.vue'
import { useAdminStore, type FamilyAccount, type FamilySlot } from '../stores/admin'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const adminStore = useAdminStore()
const authStore = useAuthStore()

const showAccountModal = ref(false)
const showSlotModal = ref(false)
const editMode = ref(false)
const activeAccount = ref<FamilyAccount | null>(null)
const activeSlot = ref<FamilySlot | null>(null)
const busy = ref(false)
const message = ref('')

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

const slotForm = ref({
    memberName: '',
    memberEmail: '',
    memberContact: '',
    months: 1,
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

onMounted(() => {
    adminStore.fetchFamilyAccounts()
})

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

function openAssign(account: FamilyAccount, slot: FamilySlot) {
    activeAccount.value = account
    activeSlot.value = slot
    slotForm.value = { memberName: '', memberEmail: '', memberContact: '', months: 1, notes: '' }
    message.value = ''
    showSlotModal.value = true
}

async function saveSlot() {
    if (!activeAccount.value || !activeSlot.value) return
    if (!slotForm.value.memberName.trim()) {
        message.value = 'Member name is required.'
        return
    }

    busy.value = true
    message.value = ''
    try {
        await adminStore.assignFamilySlot(activeAccount.value.id, activeSlot.value.id, {
            memberName: slotForm.value.memberName.trim(),
            memberEmail: slotForm.value.memberEmail.trim(),
            memberContact: slotForm.value.memberContact.trim(),
            months: Number(slotForm.value.months) || 1,
            notes: slotForm.value.notes || undefined,
        })
        showSlotModal.value = false
    } catch (e) {
        message.value = e instanceof Error ? e.message : 'Unable to assign slot.'
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
                <button @click="openCreate"
                    class="bg-primary text-white px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/30">
                    <i class="fa-solid fa-plus mr-2"></i> New Master Account
                </button>
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

                <div v-else class="space-y-6">
                    <div v-for="account in adminStore.familyAccounts" :key="account.id"
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
            <div class="bg-secondary border border-white/10 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8">
                <h2 class="text-xl font-black uppercase tracking-tight italic mb-6">
                    {{ editMode ? 'Edit Master Account' : 'New Master Account' }}
                </h2>
                <div class="space-y-4">
                    <div>
                        <label class="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Label</label>
                        <input v-model="accountForm.label" placeholder="Spotify Family A"
                            class="w-full bg-black/30 border border-white/10 rounded-xl py-3 px-4 text-sm outline-none focus:border-primary/40" />
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Service</label>
                            <input v-model="accountForm.serviceName" placeholder="Spotify Family"
                                class="w-full bg-black/30 border border-white/10 rounded-xl py-3 px-4 text-sm outline-none focus:border-primary/40" />
                        </div>
                        <div>
                            <label class="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Slots</label>
                            <input v-model="accountForm.capacity" type="number" min="1" max="50"
                                class="w-full bg-black/30 border border-white/10 rounded-xl py-3 px-4 text-sm outline-none focus:border-primary/40" />
                        </div>
                    </div>
                    <div>
                        <label class="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Master Email</label>
                        <input v-model="accountForm.masterEmail" type="email" placeholder="master@example.com"
                            class="w-full bg-black/30 border border-white/10 rounded-xl py-3 px-4 text-sm outline-none focus:border-primary/40" />
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Master Password</label>
                            <input v-model="accountForm.masterPassword" type="text" placeholder="Optional"
                                class="w-full bg-black/30 border border-white/10 rounded-xl py-3 px-4 text-sm outline-none focus:border-primary/40" />
                        </div>
                        <div>
                            <label class="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Renewal Date</label>
                            <input v-model="accountForm.renewalDate" type="date"
                                class="w-full bg-black/30 border border-white/10 rounded-xl py-3 px-4 text-sm outline-none focus:border-primary/40" />
                        </div>
                    </div>
                    <div>
                        <label class="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Monthly Cost (₦)</label>
                        <input v-model="accountForm.monthlyCost" type="number" min="0" placeholder="Optional"
                            class="w-full bg-black/30 border border-white/10 rounded-xl py-3 px-4 text-sm outline-none focus:border-primary/40" />
                    </div>
                    <div>
                        <label class="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Notes</label>
                        <textarea v-model="accountForm.notes" rows="2" placeholder="Optional"
                            class="w-full bg-black/30 border border-white/10 rounded-xl py-3 px-4 text-sm outline-none focus:border-primary/40"></textarea>
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

    <!-- Slot assign modal -->
    <Teleport to="body">
        <div v-if="showSlotModal" @click.self="showSlotModal = false"
            class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div class="bg-secondary border border-white/10 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8">
                <h2 class="text-xl font-black uppercase tracking-tight italic mb-1">Assign Slot</h2>
                <p class="text-white/40 text-xs mb-6">
                    {{ activeAccount?.label }} · Slot {{ activeSlot?.slotNumber }}
                </p>
                <div class="space-y-4">
                    <div>
                        <label class="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Member Name</label>
                        <input v-model="slotForm.memberName" placeholder="Full name"
                            class="w-full bg-black/30 border border-white/10 rounded-xl py-3 px-4 text-sm outline-none focus:border-primary/40" />
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Member Email</label>
                            <input v-model="slotForm.memberEmail" type="email" placeholder="member@example.com"
                                class="w-full bg-black/30 border border-white/10 rounded-xl py-3 px-4 text-sm outline-none focus:border-primary/40" />
                        </div>
                        <div>
                            <label class="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">WhatsApp</label>
                            <input v-model="slotForm.memberContact" placeholder="+234..."
                                class="w-full bg-black/30 border border-white/10 rounded-xl py-3 px-4 text-sm outline-none focus:border-primary/40" />
                        </div>
                    </div>
                    <div>
                        <label class="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Duration (months)</label>
                        <select v-model="slotForm.months"
                            class="w-full bg-black/30 border border-white/10 rounded-xl py-3 px-4 text-sm outline-none focus:border-primary/40">
                            <option :value="1">1 month</option>
                            <option :value="2">2 months</option>
                            <option :value="3">3 months</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Notes</label>
                        <input v-model="slotForm.notes" placeholder="Optional"
                            class="w-full bg-black/30 border border-white/10 rounded-xl py-3 px-4 text-sm outline-none focus:border-primary/40" />
                    </div>
                    <p v-if="message" class="text-xs font-bold text-red-400">{{ message }}</p>
                </div>
                <div class="flex gap-3 mt-6">
                    <button @click="showSlotModal = false"
                        class="flex-1 bg-white/5 text-white/60 py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-white/10 transition-all">
                        Cancel
                    </button>
                    <button @click="saveSlot" :disabled="busy"
                        class="flex-1 bg-primary text-white py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:brightness-110 transition-all disabled:opacity-60">
                        {{ busy ? 'Assigning...' : 'Assign' }}
                    </button>
                </div>
            </div>
        </div>
    </Teleport>
</template>
