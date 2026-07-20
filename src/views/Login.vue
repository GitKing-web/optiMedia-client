<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const identifier = ref('') // Email or WhatsApp
const password = ref('')
const rememberMe = ref(false)
const showPassword = ref(false)

const errors = ref({
    identifier: '',
    password: ''
})
const submitError = ref('')

const isFormValid = computed(() => {
    return identifier.value.length > 0 && password.value.length >= 6
})

async function handleLogin() {
    submitError.value = ''
    errors.value = {
        identifier: '',
        password: ''
    }

    let hasError = false

    if (!identifier.value) {
        errors.value.identifier = 'Please enter your email or WhatsApp number'
        hasError = true
    }
    if (password.value.length < 6) {
        errors.value.password = 'Password must be at least 6 characters'
        hasError = true
    }

    if (!hasError) {
        try {
            const res = await authStore.login(identifier.value, password.value)
            router.push(res.user.role === 'admin' ? '/admin' : '/dashboard')
        } catch {
            submitError.value = authStore.authError || 'Login failed'
        }
    }
}
</script>

<template>
    <div class="min-h-screen flex flex-col md:flex-row bg-white">
        <!-- Left Side: Inspiration Section (Same as Register for consistency) -->
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
                    Welcome back to the <br />
                    <span class="text-primary">future of digital.</span>
                </h1>
                <p class="text-white/60 text-lg max-w-md">
                    Access your subscriptions, manage your marketplace listings, and save more every day.
                </p>
            </div>

            <div class="relative z-10">
                <div class="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-sm mb-8">
                    <div class="flex gap-1 text-primary mb-4">
                        <i class="fa-solid fa-star" v-for="i in 5" :key="i"></i>
                    </div>
                    <p class="text-white/80 italic mb-6">
                        "Seamless premium accounts handling!, I've never had an issue with my subscriptions since
                        joining."
                    </p>
                    <div class="flex items-center gap-3">
                        <div
                            class="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold">
                            J</div>
                        <div>
                            <p class="font-bold text-sm">Joshxx</p>
                            <p class="text-white/40 text-xs uppercase tracking-widest">Youtube and Netflix subscriber
                                since 2024</p>
                        </div>
                    </div>
                </div>

                <div class="flex items-center gap-6 opacity-40 grayscale">
                    <span class="text-xs font-bold uppercase tracking-widest mr-2">Visa</span>
                    <i class="fa-brands fa-paypal text-xl"></i>
                    <i class="fa-brands fa-google-pay text-2xl"></i>
                    <i class="fa-brands fa-apple-pay text-2xl"></i>
                </div>
            </div>
        </div>

        <!-- Right Side: Form Section -->
        <div class="flex-1 flex flex-col justify-center items-center p-8 md:p-16 relative">
            <div class="w-full max-w-md">
                <!-- Mobile Logo -->
                <div class="md:hidden flex justify-center mb-8">
                    <img src="/images/logo.jpeg" alt="Logo" class="h-12 w-12 rounded-xl shadow-lg" />
                </div>

                <div class="mb-10">
                    <h2 class="text-3xl font-black text-secondary mb-2">Login to OptiMedia Solutions</h2>
                    <p class="text-secondary/60">Enter your credentials to access your account.</p>
                </div>

                <p v-if="submitError" class="mb-6 text-sm font-semibold text-red-500">{{ submitError }}</p>

                <form @submit.prevent="handleLogin" class="space-y-6">
                    <!-- Identifier (Email or WhatsApp) -->
                    <div>
                        <label
                            class="block text-[10px] font-black uppercase tracking-widest text-secondary/60 mb-2 px-1">Email
                            or WhatsApp Number</label>
                        <div class="relative">
                            <i
                                class="fa-solid fa-user-tag absolute left-4 top-1/2 -translate-y-1/2 text-secondary/30"></i>
                            <input v-model="identifier" type="text" placeholder="Email or WhatsApp"
                                class="w-full bg-muted/50 border border-secondary/5 rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                                :class="{ 'border-red-500': errors.identifier }" />
                        </div>
                        <p v-if="errors.identifier" class="text-red-500 text-[11px] mt-1 px-1">{{ errors.identifier }}
                        </p>
                    </div>

                    <!-- Password -->
                    <div>
                        <div class="flex justify-between items-center mb-2 px-1">
                            <label
                                class="text-[10px] font-black uppercase tracking-widest text-secondary/60">Password</label>
                            <RouterLink to="/forgot-password"
                                class="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">Forgot
                                password?</RouterLink>
                        </div>
                        <div class="relative">
                            <i class="fa-solid fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-secondary/30"></i>
                            <input v-model="password" :type="showPassword ? 'text' : 'password'" placeholder="••••••••"
                                class="w-full bg-muted/50 border border-secondary/5 rounded-xl py-3.5 pl-12 pr-12 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                                :class="{ 'border-red-500': errors.password }" />
                            <button type="button" @click="showPassword = !showPassword"
                                class="absolute right-4 top-1/2 -translate-y-1/2 text-secondary/30 hover:text-secondary transition-colors">
                                <i :class="showPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"></i>
                            </button>
                        </div>
                        <p v-if="errors.password" class="text-red-500 text-[11px] mt-1 px-1">{{ errors.password }}</p>
                    </div>

                    <!-- Remember Me -->
                    <div class="flex items-center gap-3 py-1 px-1">
                        <input v-model="rememberMe" type="checkbox" id="remember"
                            class="w-5 h-5 rounded border-secondary/20 text-primary focus:ring-primary cursor-pointer" />
                        <label for="remember" class="text-xs text-secondary/60 select-none cursor-pointer">
                            Keep me logged in
                        </label>
                    </div>

                    <!-- Submit Button -->
                    <button type="submit" :disabled="!isFormValid || authStore.isLoading"
                        class="w-full bg-primary text-white py-4 rounded-xl font-black uppercase tracking-widest hover:brightness-110 active:scale-[0.98] transition-all shadow-xl shadow-primary/30 mt-4 h-14 flex items-center justify-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed">
                        <template v-if="authStore.isLoading">
                            <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                            </svg>
                            Signing In...
                        </template>
                        <template v-else>
                            Sign In
                            <i class="fa-solid fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
                        </template>
                    </button>
                </form>

                <p class="mt-8 text-center text-sm font-medium text-secondary/60">
                    New to OptiMedia Solutions?
                    <RouterLink to="/register"
                        class="text-primary font-black uppercase tracking-widest hover:underline ml-1">Create Account
                    </RouterLink>
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
