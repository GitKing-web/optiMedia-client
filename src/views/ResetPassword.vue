<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { apiFetch } from '../lib/api'

const route = useRoute()
const router = useRouter()

const token = (route.query.token as string) || ''
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const loading = ref(false)
const error = ref('')
const success = ref('')

const isValid = computed(() => password.value.length >= 6 && password.value === confirmPassword.value)

async function handleReset() {
  if (!token) {
    error.value = 'Invalid or missing reset token.'
    return
  }

  if (password.value.length < 6) {
    error.value = 'Password must be at least 6 characters.'
    return
  }

  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match.'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const data = await apiFetch<{ message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password: password.value }),
    })
    success.value = data.message
    setTimeout(() => router.push('/login'), 3000)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Something went wrong.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex flex-col md:flex-row bg-white">
    <div
      class="hidden md:flex md:w-1/2 bg-[#0f172a] text-white p-12 flex-col justify-between relative overflow-hidden">
      <div class="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl -mr-48 -mt-48"></div>
      <div class="absolute bottom-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -ml-32 -mb-32"></div>

      <div class="relative z-10">
        <RouterLink to="/" class="flex items-center gap-3 mb-20">
          <img src="/images/logo.jpeg" alt="Logo"
            class="h-10 w-10 rounded-lg shadow-lg border border-white/10" />
          <span class="text-xl font-black tracking-tight uppercase">OptiMedia Solutions</span>
        </RouterLink>

        <h1 class="text-5xl font-black mb-6 leading-tight">
          Almost there! <br />
          <span class="text-primary">Set a new password.</span>
        </h1>
        <p class="text-white/60 text-lg max-w-md">
          Choose a strong password you haven't used before.
        </p>
      </div>

      <div class="relative z-10">
        <div class="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-sm mb-8">
          <div class="flex gap-1 text-primary mb-4">
            <i class="fa-solid fa-star" v-for="i in 5" :key="i"></i>
          </div>
          <p class="text-white/80 italic mb-6">
            "Seamless premium accounts handling! I've never had an issue with my subscriptions since joining."
          </p>
          <div class="flex items-center gap-3">
            <div class="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold">J</div>
            <div>
              <p class="font-bold text-sm">Joshxx</p>
              <p class="text-white/40 text-xs uppercase tracking-widest">Youtube and Netflix subscriber since 2024</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="flex-1 flex flex-col justify-center items-center p-8 md:p-16 relative">
      <div class="w-full max-w-md">
        <div class="md:hidden flex justify-center mb-8">
          <img src="/images/logo.jpeg" alt="Logo" class="h-12 w-12 rounded-xl shadow-lg" />
        </div>

        <template v-if="!success">
          <div class="mb-10">
            <h2 class="text-3xl font-black text-secondary mb-2">Reset Password</h2>
            <p class="text-secondary/60">Enter your new password below.</p>
          </div>

          <p v-if="error" class="mb-6 text-sm font-semibold text-red-500">{{ error }}</p>
          <p v-if="!token" class="mb-6 text-sm font-semibold text-red-500">Invalid reset link. No token found.</p>

          <form @submit.prevent="handleReset" class="space-y-6">
            <div>
              <label class="block text-[10px] font-black uppercase tracking-widest text-secondary/60 mb-2 px-1">New Password</label>
              <div class="relative">
                <i class="fa-solid fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-secondary/30"></i>
                <input v-model="password" :type="showPassword ? 'text' : 'password'" placeholder="At least 6 characters"
                  class="w-full bg-muted/50 border border-secondary/5 rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium" />
              </div>
            </div>

            <div>
              <label class="block text-[10px] font-black uppercase tracking-widest text-secondary/60 mb-2 px-1">Confirm Password</label>
              <div class="relative">
                <i class="fa-solid fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-secondary/30"></i>
                <input v-model="confirmPassword" :type="showPassword ? 'text' : 'password'" placeholder="Repeat password"
                  class="w-full bg-muted/50 border border-secondary/5 rounded-xl py-3.5 pl-12 pr-12 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium" />
                <button type="button" @click="showPassword = !showPassword"
                  class="absolute right-4 top-1/2 -translate-y-1/2 text-secondary/30 hover:text-secondary transition-colors">
                  <i :class="showPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"></i>
                </button>
              </div>
            </div>

            <button type="submit" :disabled="!isValid || loading || !token"
              class="w-full bg-primary text-white py-4 rounded-xl font-black uppercase tracking-widest hover:brightness-110 active:scale-[0.98] transition-all shadow-xl shadow-primary/30 h-14 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed">
              <span v-if="loading">Resetting...</span>
              <template v-else>
                Reset Password
                <i class="fa-solid fa-arrow-right"></i>
              </template>
            </button>
          </form>
        </template>

        <template v-else>
          <div class="text-center">
            <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <i class="fa-solid fa-check text-green-600 text-2xl"></i>
            </div>
            <h2 class="text-2xl font-black text-secondary mb-2">Password reset!</h2>
            <p class="text-secondary/60 mb-8">{{ success }} Redirecting to login...</p>
          </div>
        </template>

        <p class="mt-8 text-center text-sm font-medium text-secondary/60">
          <RouterLink to="/login" class="text-primary font-black uppercase tracking-widest hover:underline">Back to Login</RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.focus\:ring-primary\/20:focus {
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.2);
}
</style>
