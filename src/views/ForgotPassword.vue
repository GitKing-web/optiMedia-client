<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { apiFetch } from '../lib/api'

const email = ref('')
const submitted = ref(false)
const loading = ref(false)
const error = ref('')
const success = ref('')

async function handleSubmit() {
  if (!email.value || !email.value.includes('@')) {
    error.value = 'Please enter a valid email address.'
    return
  }

  loading.value = true
  error.value = ''
  success.value = ''

  try {
    const data = await apiFetch<{ message: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: email.value }),
    })
    success.value = data.message
    submitted.value = true
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
          Trouble signing in? <br />
          <span class="text-primary">We've got you.</span>
        </h1>
        <p class="text-white/60 text-lg max-w-md">
          Enter your email and we'll send you a link to reset your password.
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

        <template v-if="!submitted">
          <div class="mb-10">
            <h2 class="text-3xl font-black text-secondary mb-2">Forgot Password</h2>
            <p class="text-secondary/60">Enter the email address associated with your account.</p>
          </div>

          <p v-if="error" class="mb-6 text-sm font-semibold text-red-500">{{ error }}</p>

          <form @submit.prevent="handleSubmit" class="space-y-6">
            <div>
              <label class="block text-[10px] font-black uppercase tracking-widest text-secondary/60 mb-2 px-1">Email Address</label>
              <div class="relative">
                <i class="fa-solid fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-secondary/30"></i>
                <input v-model="email" type="email" placeholder="you@example.com"
                  class="w-full bg-muted/50 border border-secondary/5 rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium" />
              </div>
            </div>

            <button type="submit" :disabled="loading"
              class="w-full bg-primary text-white py-4 rounded-xl font-black uppercase tracking-widest hover:brightness-110 active:scale-[0.98] transition-all shadow-xl shadow-primary/30 h-14 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed">
              <span v-if="loading">Sending...</span>
              <template v-else>
                Send Reset Link
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
            <h2 class="text-2xl font-black text-secondary mb-2">Check your email</h2>
            <p class="text-secondary/60 mb-8">{{ success }}</p>
          </div>
        </template>

        <p class="mt-8 text-center text-sm font-medium text-secondary/60">
          Remember your password?
          <RouterLink to="/login" class="text-primary font-black uppercase tracking-widest hover:underline ml-1">Back to Login</RouterLink>
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
