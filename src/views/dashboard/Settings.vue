<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { useAuthStore } from '../../stores/auth'

const authStore = useAuthStore()

const profile = reactive({
    name: authStore.user?.name || '',
    email: authStore.user?.email || '',
    whatsapp: authStore.user?.whatsapp || ''
})

watch(
    () => authStore.user,
    (user) => {
        profile.name = user?.name || ''
        profile.email = user?.email || ''
        profile.whatsapp = user?.whatsapp || ''
    },
    { immediate: true }
)

const roleLabel = computed(() => (authStore.isAdmin ? 'Administrator' : 'Customer'))
</script>

<template>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div class="bg-black/10 rounded-4xl border border-white/5 p-6 sm:p-8">
            <h2 class="text-xl font-black tracking-tight uppercase italic mb-2">Personal Information</h2>
            <p class="text-white/40 text-xs font-bold uppercase tracking-wider mb-8">Profile synced from your account</p>

            <div class="space-y-6">
                <div>
                    <label class="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Full Name</label>
                    <input v-model="profile.name" disabled type="text" class="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3.5 font-bold text-sm text-white/80 focus:outline-none cursor-not-allowed" />
                </div>
                <div>
                    <label class="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Email Address</label>
                    <input v-model="profile.email" disabled type="email" class="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3.5 font-bold text-sm text-white/80 focus:outline-none cursor-not-allowed" />
                </div>
                <div>
                    <label class="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">WhatsApp</label>
                    <input v-model="profile.whatsapp" disabled type="text" class="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3.5 font-mono text-sm text-white/80 focus:outline-none cursor-not-allowed" />
                </div>

                <div class="rounded-2xl border border-white/5 bg-white/5 p-4">
                    <p class="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Role</p>
                    <p class="text-sm font-bold text-white">{{ roleLabel }}</p>
                </div>
            </div>
        </div>

        <div class="bg-black/10 rounded-4xl border border-white/5 p-6 sm:p-8">
            <h2 class="text-xl font-black tracking-tight uppercase italic mb-2">Security</h2>
            <p class="text-white/40 text-xs font-bold uppercase tracking-widest mb-8">Account protection is handled in the backend</p>

            <div class="space-y-5">
                <div class="rounded-2xl border border-white/5 bg-white/5 p-5">
                    <p class="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Session Status</p>
                    <p class="text-sm font-bold text-white/90">{{ authStore.isAuthenticated ? 'Signed in' : 'Signed out' }}</p>
                </div>

                <div class="rounded-2xl border border-white/5 bg-white/5 p-5">
                    <p class="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Next Step</p>
                    <p class="text-sm text-white/80">
                        Update endpoints can be added next if you want profile editing to persist to PostgreSQL.
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>
