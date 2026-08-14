<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const name = ref('')
const email = ref('')
const whatsapp = ref('')
const password = ref('')
const confirmPassword = ref('')
const agreeTerms = ref(false)
const showPassword = ref(false)

const touched = ref<Record<string, boolean>>({
    name: false,
    email: false,
    whatsapp: false,
    password: false,
    confirmPassword: false,
    terms: false
})
const submitError = ref('')

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function normalizeWhatsApp(value: string) {
    return value.replace(/\D/g, '')
}

const errors = computed(() => {
    const errs: Record<string, string> = {
        name: '',
        email: '',
        whatsapp: '',
        password: '',
        confirmPassword: '',
        terms: ''
    }

    if (name.value.trim()) {
        if (name.value.trim().length < 3) {
            errs.name = 'Your name must be at least 3 characters long.'
        }
    }
    if (email.value.trim()) {
        if (!EMAIL_RE.test(email.value.trim())) {
            errs.email = 'That doesn\u2019t look like a valid email address.'
        }
    }
    if (whatsapp.value) {
        const digits = normalizeWhatsApp(whatsapp.value)
        if (digits.length < 10) {
            errs.whatsapp = 'WhatsApp number must have at least 10 digits.'
        } else if (!/^\+?\d+$/.test(whatsapp.value.trim()) && !/^\d+$/.test(whatsapp.value.trim())) {
            errs.whatsapp = 'Please enter numbers only (and a + prefix if including country code).'
        }
    }
    if (password.value) {
        if (password.value.length < 6) {
            errs.password = 'Password must be at least 6 characters long.'
        } else if (!/(?=.*[A-Za-z])(?=.*\d)/.test(password.value)) {
            errs.password = 'Use a mix of letters and numbers for a stronger password.'
        }
    }
    if (confirmPassword.value) {
        if (confirmPassword.value !== password.value) {
            errs.confirmPassword = 'Passwords do not match.'
        }
    }
    if (!agreeTerms.value) {
        errs.terms = 'Please accept the Terms of Service to continue.'
    }

    return errs
})

const passwordStrength = computed(() => {
    const value = password.value
    if (!value) return 0
    let score = 0
    if (value.length >= 6) score++
    if (value.length >= 10) score++
    if (/(?=.*[A-Z])(?=.*[a-z])/.test(value)) score++
    if (/(?=.*\d)/.test(value) && /[^A-Za-z0-9]/.test(value)) score++
    return Math.min(score, 4)
})

const isFormValid = computed(() => {
    return name.value.trim().length >= 3 &&
        EMAIL_RE.test(email.value.trim()) &&
        normalizeWhatsApp(whatsapp.value).length >= 10 &&
        password.value.length >= 6 &&
        password.value === confirmPassword.value &&
        agreeTerms.value &&
        !errors.value.name && !errors.value.email && !errors.value.whatsapp &&
        !errors.value.password && !errors.value.confirmPassword
})

function onBlur(field: keyof typeof touched.value | 'terms') {
    touched.value[field as string] = true
}

function errorFor(field: string) {
    if (!touched.value[field]) return ''
    return errors.value[field] || ''
}

function strengthLabel() {
    if (!password.value) return ''
    const labels = ['Very weak', 'Weak', 'Okay', 'Good', 'Strong']
    return labels[passwordStrength.value]
}

const strengthColor = computed(() => {
    const map = ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-emerald-400', 'bg-emerald-500']
    return map[passwordStrength.value]
})

async function handleRegister() {
    touched.value = { name: true, email: true, whatsapp: true, password: true, confirmPassword: true, terms: true }
    submitError.value = ''

    if (!isFormValid.value) return

    try {
        const res = await authStore.register({
            name: name.value.trim(),
            email: email.value.trim(),
            whatsapp: whatsapp.value.trim(),
            password: password.value
        })

        if (res.user.emailVerified) {
            router.push(res.user.role === 'admin' ? '/admin' : '/dashboard')
        } else {
            router.push({ path: '/verify-email', query: { email: res.user.email } })
        }
    } catch {
        submitError.value = authStore.authError || 'Registration failed. Please try again.'
    }
}
</script>

<template>
    <div class="min-h-screen flex flex-col md:flex-row bg-white">
        <!-- Left Side: Inspiration Section -->
        <div
            class="hidden md:flex md:w-1/2 bg-[#0f172a] text-white p-12 flex-col justify-between relative overflow-hidden">
            <!-- Background Decoration -->
            <div class="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl -mr-48 -mt-48"></div>
            <div class="absolute bottom-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -ml-32 -mb-32"></div>

            <div class="relative z-10">
                <RouterLink to="/" class="flex items-center gap-3 mb-20">
                    <img src="/images/logo.jpeg" alt="Logo"
                        class="h-10 w-10 rounded-lg shadow-lg border border-white/10" />
                    <span class="text-xl font-black tracking-tight uppercase">OptiMedia Solutions</span>
                </RouterLink>

                <h1 class="text-5xl font-black mb-6 leading-tight">
                    Join the future of <br />
                    <span class="text-primary">digital consumption.</span>
                </h1>
                <p class="text-white/60 text-lg max-w-md">
                    One account to manage all your premium services. Save thousands per year with our secure,
                    community-driven marketplace.
                </p>
            </div>

            <div class="relative z-10">
                <!-- Testimonial Card -->
                <div class="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-sm mb-8">
                    <div class="flex gap-1 text-primary mb-4">
                        <i class="fa-solid fa-star" v-for="i in 5" :key="i"></i>
                    </div>
                    <p class="text-white/80 italic mb-6">
                        "OptiMedia Solutions completely changed how I handle my monthly subscriptions. Really great
                        customer service"
                    </p>
                    <div class="flex items-center gap-3">
                        <div
                            class="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold">
                            A</div>
                        <div>
                            <p class="font-bold text-sm">Amara</p>
                            <p class="text-white/40 text-xs uppercase tracking-widest">spotify preminum user</p>
                        </div>
                    </div>
                </div>

                <!-- Payment Icons -->
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
                    <h2 class="text-3xl font-black text-secondary mb-2">Create your account</h2>
                    <p class="text-secondary/60">Start your journey with full marketplace access.</p>
                </div>

                <div
                    v-if="submitError"
                    class="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4"
                    role="alert"
                >
                    <i class="fa-solid fa-circle-exclamation text-red-500 mt-0.5"></i>
                    <p class="text-sm font-semibold text-red-600">{{ submitError }}</p>
                </div>

                <form @submit.prevent="handleRegister" novalidate class="space-y-5">
                    <!-- Full Name -->
                    <div>
                        <label
                            class="block text-[10px] font-black uppercase tracking-widest text-secondary/60 mb-2 px-1">Full
                            Name</label>
                        <div class="relative">
                            <i class="fa-solid fa-user absolute left-4 top-1/2 -translate-y-1/2 text-secondary/30"></i>
                            <input v-model="name" type="text" placeholder="John Doe" @blur="onBlur('name')"
                                class="w-full bg-muted/50 border rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                                :class="touched.name && errors.name ? 'border-red-400 ring-2 ring-red-100' : 'border-secondary/5'" />
                            <i v-if="touched.name && errors.name"
                                class="fa-solid fa-circle-exclamation absolute right-4 top-1/2 -translate-y-1/2 text-red-400"></i>
                        </div>
                        <p v-if="errorFor('name')"
                            class="flex items-center gap-1.5 text-red-500 text-[11px] mt-1.5 px-1 font-medium">
                            <i class="fa-solid fa-circle-info"></i>{{ errorFor('name') }}
                        </p>
                    </div>

                    <!-- Email -->
                    <div>
                        <label
                            class="block text-[10px] font-black uppercase tracking-widest text-secondary/60 mb-2 px-1">Email
                            Address</label>
                        <div class="relative">
                            <i
                                class="fa-solid fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-secondary/30"></i>
                            <input v-model="email" type="email" placeholder="john@example.com" @blur="onBlur('email')"
                                class="w-full bg-muted/50 border rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                                :class="touched.email && errors.email ? 'border-red-400 ring-2 ring-red-100' : 'border-secondary/5'" />
                            <i v-if="touched.email && errors.email"
                                class="fa-solid fa-circle-exclamation absolute right-4 top-1/2 -translate-y-1/2 text-red-400"></i>
                        </div>
                        <p v-if="errorFor('email')"
                            class="flex items-center gap-1.5 text-red-500 text-[11px] mt-1.5 px-1 font-medium">
                            <i class="fa-solid fa-circle-info"></i>{{ errorFor('email') }}
                        </p>
                    </div>

                    <!-- WhatsApp Number -->
                    <div>
                        <label
                            class="block text-[10px] font-black uppercase tracking-widest text-secondary/60 mb-2 px-1">WhatsApp
                            Number</label>
                        <div class="relative">
                            <i
                                class="fa-brands fa-whatsapp absolute left-4 top-1/2 -translate-y-1/2 text-secondary/30"></i>
                            <input v-model="whatsapp" type="tel" placeholder="+234 000 000 0000" @blur="onBlur('whatsapp')"
                                class="w-full bg-muted/50 border rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                                :class="touched.whatsapp && errors.whatsapp ? 'border-red-400 ring-2 ring-red-100' : 'border-secondary/5'" />
                            <i v-if="touched.whatsapp && errors.whatsapp"
                                class="fa-solid fa-circle-exclamation absolute right-4 top-1/2 -translate-y-1/2 text-red-400"></i>
                        </div>
                        <p v-if="errorFor('whatsapp')"
                            class="flex items-center gap-1.5 text-red-500 text-[11px] mt-1.5 px-1 font-medium">
                            <i class="fa-solid fa-circle-info"></i>{{ errorFor('whatsapp') }}
                        </p>
                    </div>

                    <!-- Password -->
                    <div>
                        <label
                            class="block text-[10px] font-black uppercase tracking-widest text-secondary/60 mb-2 px-1">Password</label>
                        <div class="relative">
                            <i class="fa-solid fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-secondary/30"></i>
                            <input v-model="password" :type="showPassword ? 'text' : 'password'" placeholder="••••••••" @blur="onBlur('password')"
                                class="w-full bg-muted/50 border rounded-xl py-3.5 pl-12 pr-12 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                                :class="touched.password && errors.password ? 'border-red-400 ring-2 ring-red-100' : 'border-secondary/5'" />
                            <button type="button" @click="showPassword = !showPassword"
                                class="absolute right-4 top-1/2 -translate-y-1/2 text-secondary/30 hover:text-secondary transition-colors">
                                <i :class="showPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"></i>
                            </button>
                        </div>

                        <!-- Password strength indicator -->
                        <div v-if="password" class="mt-2 px-1">
                            <div class="flex gap-1.5">
                                <div v-for="i in 4" :key="i"
                                    class="h-1 flex-1 rounded-full transition-all duration-300"
                                    :class="i <= passwordStrength ? strengthColor : 'bg-secondary/10'"></div>
                            </div>
                            <p v-if="!errors.password" class="text-[11px] mt-1 font-medium"
                                :class="passwordStrength <= 2 ? 'text-secondary/50' : 'text-emerald-600'">
                                Password strength: {{ strengthLabel() }}
                            </p>
                        </div>

                        <p v-if="errorFor('password')"
                            class="flex items-center gap-1.5 text-red-500 text-[11px] mt-1.5 px-1 font-medium">
                            <i class="fa-solid fa-circle-info"></i>{{ errorFor('password') }}
                        </p>
                    </div>

                    <!-- Confirm Password -->
                    <div v-if="password">
                        <label
                            class="block text-[10px] font-black uppercase tracking-widest text-secondary/60 mb-2 px-1">Confirm
                            Password</label>
                        <div class="relative">
                            <i
                                class="fa-solid fa-shield-check absolute left-4 top-1/2 -translate-y-1/2 text-secondary/30"></i>
                            <input v-model="confirmPassword" type="password" placeholder="••••••••" @blur="onBlur('confirmPassword')"
                                class="w-full bg-muted/50 border rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                                :class="touched.confirmPassword && errors.confirmPassword ? 'border-red-400 ring-2 ring-red-100' : 'border-secondary/5'" />
                            <i v-if="touched.confirmPassword && errors.confirmPassword"
                                class="fa-solid fa-circle-exclamation absolute right-4 top-1/2 -translate-y-1/2 text-red-400"></i>
                        </div>
                        <p v-if="errorFor('confirmPassword')"
                            class="flex items-center gap-1.5 text-red-500 text-[11px] mt-1.5 px-1 font-medium">
                            <i class="fa-solid fa-circle-info"></i>{{ errorFor('confirmPassword') }}
                        </p>
                    </div>

                    <!-- Terms -->
                    <div class="flex items-center gap-3 py-2 px-1">
                        <input v-model="agreeTerms" type="checkbox" id="terms" @change="onBlur('terms')"
                            class="w-5 h-5 rounded border-secondary/20 text-primary focus:ring-primary cursor-pointer" />
                        <label for="terms" class="text-xs text-secondary/60 select-none">
                            I agree to the <a href="#" class="text-primary font-bold hover:underline">Terms of
                                Service</a> and <a href="#" class="text-primary font-bold hover:underline">Privacy
                                Policy</a>.
                        </label>
                    </div>
                    <p v-if="errorFor('terms')" class="text-red-500 text-[11px] px-1">{{ errorFor('terms') }}</p>

                    <!-- Submit Button -->
                    <button type="submit" :disabled="!isFormValid || authStore.isLoading"
                        class="w-full bg-primary text-white py-4 rounded-xl font-black uppercase tracking-widest hover:brightness-110 active:scale-[0.98] transition-all shadow-xl shadow-primary/30 mt-4 h-14 flex items-center justify-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed">
                        <template v-if="authStore.isLoading">
                            <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                            </svg>
                            Creating Account...
                        </template>
                        <template v-else>
                            Create Account
                            <i class="fa-solid fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
                        </template>
                    </button>
                </form>

                <p class="mt-8 text-center text-sm font-medium text-secondary/60">
                    Already have an account?
                    <RouterLink to="/login"
                        class="text-primary font-black uppercase tracking-widest hover:underline ml-1">Log in
                    </RouterLink>
                </p>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Optional: Custom focus ring color if not using standard Tailwind focus colors */
.focus\:ring-primary\/20:focus {
    box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.2);
}
</style>
