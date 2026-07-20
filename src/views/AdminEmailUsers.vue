<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminStore, type AdminUserRow } from '../stores/admin'

const router = useRouter()
const adminStore = useAdminStore()

const mode = ref<'all' | 'selected'>('all')
const subject = ref('')
const html = ref('')
const sending = ref(false)
const result = ref('')

const selectedUserIds = ref<Set<string>>(new Set())
const searchQuery = ref('')

const filteredUsers = computed(() => {
    const q = searchQuery.value.toLowerCase().trim()
    if (!q) return adminStore.users
    return adminStore.users.filter(
        (u) =>
            u.userName.toLowerCase().includes(q) ||
            u.userEmail.toLowerCase().includes(q) ||
            u.whatsappContact.includes(q),
    )
})

const recipientCount = computed(() => {
    if (mode.value === 'all') return adminStore.users.length
    return selectedUserIds.value.size
})

function toggleUser(id: string) {
    const next = new Set(selectedUserIds.value)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    selectedUserIds.value = next
}

function toggleAll() {
    if (selectedUserIds.value.size === filteredUsers.value.length) {
        selectedUserIds.value = new Set()
    } else {
        selectedUserIds.value = new Set(filteredUsers.value.map((u) => u.userId))
    }
}

async function send() {
    if (!subject.value || !html.value || recipientCount.value === 0) return
    sending.value = true
    result.value = ''
    try {
        const payload: { subject: string; html: string; userIds?: string[] } = { subject: subject.value, html: html.value }
        if (mode.value === 'selected') {
            payload.userIds = Array.from(selectedUserIds.value)
        }
        const res = await adminStore.sendEmail(payload)
        result.value = `Sent to ${res.sent} of ${res.total} recipients${res.failed > 0 ? ` (${res.failed} failed)` : ''}`
    } catch (e) {
        result.value = e instanceof Error ? e.message : 'Failed to send'
    } finally {
        sending.value = false
    }
}

onMounted(() => {
    if (adminStore.users.length === 0) {
        adminStore.fetchUsers('all')
    }
})
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
                <div
                    class="flex items-center gap-4 px-6 py-4 rounded-2xl bg-primary text-white shadow-xl shadow-primary/20 font-bold text-sm tracking-tight">
                    <i class="fa-solid fa-envelope text-lg"></i>
                    Email Users
                </div>
            </nav>
            <div class="mt-auto pt-6 border-t border-white/5 flex flex-col gap-2">
                <button @click="adminStore.downloadCSV()"
                    class="w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl font-bold text-sm tracking-tight text-white/40 hover:text-white hover:bg-white/5 transition-all text-left">
                    <i class="fa-solid fa-download text-lg"></i>
                    Export CSV
                </button>
                <button @click="router.push('/dashboard')"
                    class="w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl font-bold text-sm tracking-tight text-white/40 hover:text-white hover:bg-white/5 transition-all text-left">
                    <i class="fa-solid fa-arrow-left text-lg"></i>
                    Dashboard
                </button>
            </div>
        </aside>

        <main class="flex-1 p-4 sm:p-6 lg:p-8 2xl:p-12 overflow-x-hidden flex flex-col gap-6">
            <div>
                <h1 class="text-3xl sm:text-4xl font-black tracking-tight uppercase italic">Email Users</h1>
                <p class="text-white/40 text-sm font-medium mt-1">Send an email to all users or select specific recipients.</p>
            </div>

            <div class="grid grid-cols-1 xl:grid-cols-2 gap-6 flex-1">
                <div class="bg-black/20 rounded-3xl border border-white/5 p-4 sm:p-6 lg:p-8 flex flex-col gap-5">
                    <h3 class="text-sm font-black uppercase tracking-widest text-white/60">Recipients</h3>

                    <div class="flex gap-2">
                        <button @click="mode = 'all'"
                            class="px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                            :class="mode === 'all' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white/5 text-white/60 hover:text-white'">
                            All Users ({{ adminStore.users.length }})
                        </button>
                        <button @click="mode = 'selected'"
                            class="px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                            :class="mode === 'selected' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white/5 text-white/60 hover:text-white'">
                            Selected ({{ selectedUserIds.size }})
                        </button>
                    </div>

                    <div v-if="mode === 'selected'" class="relative">
                        <i class="fa-solid fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20 text-sm"></i>
                        <input v-model="searchQuery" type="text" placeholder="Filter users..."
                            class="w-full bg-black/20 border border-white/5 rounded-xl py-2.5 pl-9 pr-4 text-sm text-white placeholder-white/20 focus:outline-none focus:border-primary/30 transition-all" />
                    </div>

                    <div v-if="mode === 'selected'" class="flex-1 overflow-y-auto max-h-[300px] space-y-1">
                        <label class="flex items-center gap-2 px-1 py-2 border-b border-white/5 cursor-pointer sticky top-0 bg-secondary">
                            <input type="checkbox" :checked="selectedUserIds.size === filteredUsers.length && filteredUsers.length > 0"
                                @change="toggleAll"
                                class="w-4 h-4 rounded border-white/20 text-primary focus:ring-primary" />
                            <span class="text-[10px] font-black uppercase tracking-widest text-white/40">Select All</span>
                        </label>
                        <label v-for="user in filteredUsers" :key="user.userId"
                            class="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-all cursor-pointer">
                            <input type="checkbox" :checked="selectedUserIds.has(user.userId)"
                                @change="toggleUser(user.userId)"
                                class="w-4 h-4 rounded border-white/20 text-primary focus:ring-primary shrink-0" />
                            <div class="min-w-0 flex-1">
                                <p class="text-sm font-bold text-white truncate">{{ user.userName }}</p>
                                <p class="text-[10px] text-white/40 truncate">{{ user.userEmail }}</p>
                            </div>
                        </label>
                        <p v-if="filteredUsers.length === 0" class="text-center text-white/30 py-8 text-xs font-bold uppercase tracking-widest">
                            No users match
                        </p>
                    </div>

                    <div class="p-4 bg-black/30 rounded-2xl text-center">
                        <p class="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Recipients</p>
                        <p class="text-2xl font-black text-primary">{{ recipientCount }}</p>
                    </div>
                </div>

                <div class="bg-black/20 rounded-3xl border border-white/5 p-4 sm:p-6 lg:p-8 flex flex-col gap-5">
                    <h3 class="text-sm font-black uppercase tracking-widest text-white/60">Message</h3>

                    <div>
                        <label class="text-[10px] font-black uppercase tracking-widest text-white/60 mb-1.5 block">Subject</label>
                        <input v-model="subject" type="text" placeholder="Announcement: New services available"
                            class="w-full bg-black/20 border border-white/5 rounded-xl py-3 px-4 text-sm text-white placeholder-white/20 focus:outline-none focus:border-primary/30 transition-all" />
                    </div>

                    <div class="flex-1 flex flex-col">
                        <label class="text-[10px] font-black uppercase tracking-widest text-white/60 mb-1.5 block">HTML Body</label>
                        <textarea v-model="html" rows="10" placeholder="<h2>Hello!</h2><p>We have new services available...</p>"
                            class="flex-1 bg-black/20 border border-white/5 rounded-xl py-3 px-4 text-sm text-white placeholder-white/20 focus:outline-none focus:border-primary/30 transition-all font-mono resize-y min-h-[200px]"></textarea>
                    </div>

                    <button @click="send" :disabled="sending || !subject || !html || recipientCount === 0"
                        class="w-full bg-primary text-white py-3.5 rounded-xl font-black uppercase tracking-widest text-sm hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                        <span v-if="sending">Sending...</span>
                        <span v-else>Send to {{ recipientCount }} {{ recipientCount === 1 ? 'user' : 'users' }}</span>
                    </button>

                    <p v-if="result" class="text-sm font-semibold text-center"
                        :class="result.includes('failed') || result.includes('Failed') ? 'text-red-400' : 'text-emerald-400'">
                        {{ result }}
                    </p>
                </div>
            </div>
        </main>
    </div>
</template>

<style scoped>
::-webkit-scrollbar { height: 6px; width: 6px; }
::-webkit-scrollbar-track { background: rgba(15, 23, 42, 0.3); }
::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.4); border-radius: 10px; }
::-webkit-scrollbar-thumb:hover { background: rgba(99, 102, 241, 0.7); }
</style>
