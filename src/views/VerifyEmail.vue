<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth' // Adjust path if needed

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// 6-digit OTP state array
const otp = reactive<string[]>(['', '', '', '', '', ''])
const inputRefs = ref<HTMLInputElement[]>([])

const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const userEmail = ref('')

// Cooldown timer for resend
const resendTimer = ref(60)
const canResend = ref(false)

let intervalId: any = null

const startResendTimer = () => {
  canResend.value = false
  resendTimer.value = 60
  
  if (intervalId) clearInterval(intervalId)
  
  intervalId = setInterval(() => {
    if (resendTimer.value > 0) {
      resendTimer.value--
    } else {
      canResend.value = true
      clearInterval(intervalId)
    }
  }, 1000)
}

onMounted(() => {
  // Grab email from router query (e.g. /verify-email?email=user@example.com) or auth store
  userEmail.value = (route.query.email as string) || authStore.user?.email || 'your email'
  startResendTimer()
  
  // Auto-focus first input field
  setTimeout(() => {
    inputRefs.value[0]?.focus()
  }, 100)
})

// Handle typing & auto-advancing focus
const handleInput = (index: number, event: Event) => {
  const target = event.target as HTMLInputElement
  const value = target.value

  // Keep only the last typed character
  otp[index] = value.substring(value.length - 1)

  // Move to next input automatically if character entered
  if (value && index < 5) {
    inputRefs.value[index + 1]?.focus()
  }

  // Auto submit when all 6 digits are filled
  if (otp.join('').length === 6) {
    verifyOtp()
  }
}

// Handle keydowns (Backspace & Paste)
const handleKeyDown = (index: number, event: KeyboardEvent) => {
  if (event.key === 'Backspace' && !otp[index] && index > 0) {
    inputRefs.value[index - 1]?.focus()
  }
}

const handlePaste = (event: ClipboardEvent) => {
  event.preventDefault()
  const pastedData = event.clipboardData?.getData('text').trim() || ''
  
  if (/^\d{6}$/.test(pastedData)) {
    pastedData.split('').forEach((char, idx) => {
      otp[idx] = char
    })
    inputRefs.value[5]?.focus()
    verifyOtp()
  }
}

// Verification Handler
const verifyOtp = async () => {
  const code = otp.join('')
  if (code.length < 6) {
    errorMessage.value = 'Please enter all 6 digits.'
    return
  }

  isLoading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    // Replace with your API endpoint (e.g., authStore.verifyEmail(code))
    // await axios.post('/api/auth/verify-email', { email: userEmail.value, code })
    
    successMessage.value = 'Email verified successfully! Redirecting...'
    setTimeout(() => {
      router.push('/dashboard')
    }, 1500)
  } catch (err: any) {
    errorMessage.value = err.response?.data?.message || 'Invalid or expired OTP code. Please try again.'
  } finally {
    isLoading.value = false
  }
}

// Resend OTP Handler
const handleResend = async () => {
  if (!canResend.value) return

  errorMessage.value = ''
  successMessage.value = ''

  try {
    // Replace with your API endpoint (e.g., authStore.resendOtp(userEmail.value))
    // await axios.post('/api/auth/resend-otp', { email: userEmail.value })
    
    successMessage.value = 'A new verification code has been sent to your email.'
    startResendTimer()
  } catch (err: any) {
    errorMessage.value = err.response?.data?.message || 'Failed to resend code. Please try again later.'
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#0b0f17] text-white flex items-center justify-center p-4">
    <!-- Ambient Background Glow -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl"></div>
      <div class="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
    </div>

    <div class="w-full max-w-md bg-[#131b2e] border border-slate-800 rounded-2xl p-8 shadow-2xl relative z-10 backdrop-blur-xl">
      <!-- Icon Header -->
      <div class="flex justify-center mb-6">
        <div class="w-16 h-16 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400 shadow-inner">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
        </div>
      </div>

      <!-- Content Title -->
      <div class="text-center mb-8">
        <h1 class="text-2xl font-bold tracking-tight text-white mb-2">Check your email</h1>
        <p class="text-sm text-slate-400">
          We've sent a 6-digit verification code to <br />
          <span class="font-medium text-slate-200">{{ userEmail }}</span>
        </p>
      </div>

      <!-- Feedback Alerts -->
      <div v-if="errorMessage" class="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs text-center">
        {{ errorMessage }}
      </div>
      <div v-if="successMessage" class="mb-6 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs text-center">
        {{ successMessage }}
      </div>

      <!-- OTP Inputs -->
      <form @submit.prevent="verifyOtp" class="space-y-6">
        <div class="flex justify-between gap-2" @paste="handlePaste">
          <input
            v-for="(digit, index) in otp"
            :key="index"
            :ref="(el) => (inputRefs[index] = el as HTMLInputElement)"
            type="text"
            inputmode="numeric"
            maxlength="1"
            v-model="otp[index]"
            @input="handleInput(index, $event)"
            @keydown="handleKeyDown(index, $event)"
            class="w-12 h-14 text-center text-xl font-bold bg-[#0b0f17] border border-slate-700/80 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-white outline-none transition-all duration-200"
          />
        </div>

        <button
          type="submit"
          :disabled="isLoading || otp.join('').length < 6"
          class="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors duration-200 flex items-center justify-center shadow-lg shadow-indigo-600/20"
        >
          <span v-if="!isLoading">Verify Email</span>
          <span v-else class="flex items-center gap-2">
            <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Verifying...
          </span>
        </button>
      </form>

      <!-- Resend Footer -->
      <div class="mt-8 text-center text-sm text-slate-400">
        Didn't receive the code? 
        <button
          @click="handleResend"
          :disabled="!canResend"
          class="font-medium text-indigo-400 hover:text-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed ml-1"
        >
          <span v-if="canResend">Click to resend</span>
          <span v-else>Resend in {{ resendTimer }}s</span>
        </button>
      </div>
    </div>
  </div>
</template>