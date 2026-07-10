<script setup lang="ts">
import { ref } from 'vue'

const profile = ref({ name: 'Alex K.', email: 'alex.k@gmail.com', whatsappNumber: '+2348101234567' })
const passwordForm = ref({ formerPassword: '', newPassword: '', confirmPassword: '' })

const updateProfile = () => alert('Profile parameters updated.')
const updatePassword = () => alert('Security configuration updated via token verification dispatch.')
</script>

<template>
    <!-- Fixed `rounded-[2rem]` to v4 canonical `rounded-4xl` on cards -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div class="bg-black/10 rounded-4xl border border-white/5 p-6 sm:p-8">
            <h2 class="text-xl font-black tracking-tight uppercase italic mb-2">Personal Information</h2>
            <p class="text-white/40 text-xs font-bold uppercase tracking-wider mb-8">Update your profile parameters</p>
            <form @submit.prevent="updateProfile" class="space-y-6">
                <div>
                    <label class="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Full Name</label>
                    <input v-model="profile.name" type="text" class="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3.5 font-bold text-sm text-white focus:outline-none focus:border-primary transition-all" />
                </div>
                <div>
                    <label class="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Email Address</label>
                    <input v-model="profile.email" type="email" class="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3.5 font-bold text-sm text-white focus:outline-none focus:border-primary transition-all" />
                </div>
                <div>
                    <label class="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">WhatsApp Phone Link</label>
                    <input v-model="profile.whatsappNumber" type="text" class="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3.5 font-mono text-sm text-white focus:outline-none focus:border-primary transition-all" />
                </div>
                <button type="submit" class="w-full bg-white/5 border border-white/10 hover:bg-white hover:text-secondary text-white font-black uppercase tracking-widest text-xs py-4 rounded-xl transition-all">Save Profile Changes</button>
            </form>
        </div>

        <div class="bg-black/10 rounded-4xl border border-white/5 p-6 sm:p-8">
            <h2 class="text-xl font-black tracking-tight uppercase italic mb-2">Change Password</h2>
            <!-- Fixed `tracking-[0.1em]` to v4 canonical `tracking-widest` style hints -->
            <p class="text-white/40 text-xs font-bold uppercase tracking-widest mb-8">Establish secure session credentials</p>
            <form @submit.prevent="updatePassword" class="space-y-6">
                <div>
                    <label class="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Current Password</label>
                    <input v-model="passwordForm.formerPassword" type="password" required class="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-primary transition-all" />
                </div>
                <div>
                    <label class="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">New Password Key</label>
                    <input v-model="passwordForm.newPassword" type="password" required class="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-primary transition-all" />
                </div>
                <div>
                    <label class="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Confirm New Password</label>
                    <input v-model="passwordForm.confirmPassword" type="password" required class="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-primary transition-all" />
                </div>
                <button type="submit" class="w-full bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-xs py-4 rounded-xl transition-all">Dispatch OTP Security Token</button>
            </form>
        </div>
    </div>
</template>