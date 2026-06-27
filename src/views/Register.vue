<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

const router = useRouter()

const name = ref('')
const email = ref('')
const whatsapp = ref('')
const password = ref('')
const confirmPassword = ref('')
const agreeTerms = ref(false)
const showPassword = ref(false)

const errors = ref({
    name: '',
    email: '',
    whatsapp: '',
    password: '',
    confirmPassword: '',
    terms: ''
})

const isFormValid = computed(() => {
    return name.value.length >= 3 &&
        email.value.includes('@') &&
        whatsapp.value.length >= 10 &&
        password.value.length >= 6 &&
        password.value === confirmPassword.value &&
        agreeTerms.value
})

function handleRegister() {
    // Reset errors
    errors.value = {
        name: '',
        email: '',
        whatsapp: '',
        password: '',
        confirmPassword: '',
        terms: ''
    }

    let hasError = false

    if (name.value.length < 3) {
        errors.value.name = 'Name must be at least 3 characters'
        hasError = true
    }
    if (!email.value.includes('@')) {
        errors.value.email = 'Please enter a valid email'
        hasError = true
    }
    if (whatsapp.value.length < 10) {
        errors.value.whatsapp = 'Please enter a valid WhatsApp number'
        hasError = true
    }
    if (password.value.length < 6) {
        errors.value.password = 'Password must be at least 6 characters'
        hasError = true
    }
    if (password.value !== confirmPassword.value) {
        errors.value.confirmPassword = 'Passwords do not match'
        hasError = true
    }
    if (!agreeTerms.value) {
        errors.value.terms = 'You must agree to the terms'
        hasError = true
    }

    if (!hasError) {
        console.log('Registering...', { name: name.value, email: email.value, whatsapp: whatsapp.value })
        // Simulate registration
        alert('Registration successful! (Demo)')
        router.push('/login')
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

                <form @submit.prevent="handleRegister" class="space-y-5">
                    <!-- Full Name -->
                    <div>
                        <label
                            class="block text-[10px] font-black uppercase tracking-widest text-secondary/60 mb-2 px-1">Full
                            Name</label>
                        <div class="relative">
                            <i class="fa-solid fa-user absolute left-4 top-1/2 -translate-y-1/2 text-secondary/30"></i>
                            <input v-model="name" type="text" placeholder="John Doe"
                                class="w-full bg-muted/50 border border-secondary/5 rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                                :class="{ 'border-red-500': errors.name }" />
                        </div>
                        <p v-if="errors.name" class="text-red-500 text-[11px] mt-1 px-1">{{ errors.name }}</p>
                    </div>

                    <!-- Email -->
                    <div>
                        <label
                            class="block text-[10px] font-black uppercase tracking-widest text-secondary/60 mb-2 px-1">Email
                            Address</label>
                        <div class="relative">
                            <i
                                class="fa-solid fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-secondary/30"></i>
                            <input v-model="email" type="email" placeholder="john@example.com"
                                class="w-full bg-muted/50 border border-secondary/5 rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                                :class="{ 'border-red-500': errors.email }" />
                        </div>
                        <p v-if="errors.email" class="text-red-500 text-[11px] mt-1 px-1">{{ errors.email }}</p>
                    </div>

                    <!-- WhatsApp Number -->
                    <div>
                        <label
                            class="block text-[10px] font-black uppercase tracking-widest text-secondary/60 mb-2 px-1">WhatsApp
                            Number</label>
                        <div class="relative">
                            <i
                                class="fa-brands fa-whatsapp absolute left-4 top-1/2 -translate-y-1/2 text-secondary/30"></i>
                            <input v-model="whatsapp" type="tel" placeholder="+234 000 000 0000"
                                class="w-full bg-muted/50 border border-secondary/5 rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                                :class="{ 'border-red-500': errors.whatsapp }" />
                        </div>
                        <p v-if="errors.whatsapp" class="text-red-500 text-[11px] mt-1 px-1">{{ errors.whatsapp }}</p>
                    </div>

                    <!-- Password -->
                    <div>
                        <label
                            class="block text-[10px] font-black uppercase tracking-widest text-secondary/60 mb-2 px-1">Password</label>
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

                    <!-- Confirm Password -->
                    <div v-if="password">
                        <label
                            class="block text-[10px] font-black uppercase tracking-widest text-secondary/60 mb-2 px-1">Confirm
                            Password</label>
                        <div class="relative">
                            <i
                                class="fa-solid fa-shield-check absolute left-4 top-1/2 -translate-y-1/2 text-secondary/30"></i>
                            <input v-model="confirmPassword" type="password" placeholder="••••••••"
                                class="w-full bg-muted/50 border border-secondary/5 rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                                :class="{ 'border-red-500': errors.confirmPassword }" />
                        </div>
                        <p v-if="errors.confirmPassword" class="text-red-500 text-[11px] mt-1 px-1">{{
                            errors.confirmPassword }}</p>
                    </div>

                    <!-- Terms -->
                    <div class="flex items-center gap-3 py-2 px-1">
                        <input v-model="agreeTerms" type="checkbox" id="terms"
                            class="w-5 h-5 rounded border-secondary/20 text-primary focus:ring-primary cursor-pointer" />
                        <label for="terms" class="text-xs text-secondary/60 select-none">
                            I agree to the <a href="#" class="text-primary font-bold hover:underline">Terms of
                                Service</a> and <a href="#" class="text-primary font-bold hover:underline">Privacy
                                Policy</a>.
                        </label>
                    </div>
                    <p v-if="errors.terms" class="text-red-500 text-[11px] px-1">{{ errors.terms }}</p>

                    <!-- Submit Button -->
                    <button type="submit" :disabled="!isFormValid"
                        class="w-full bg-primary text-white py-4 rounded-xl font-black uppercase tracking-widest hover:brightness-110 active:scale-[0.98] transition-all shadow-xl shadow-primary/30 mt-4 h-14 flex items-center justify-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed">
                        Create Account
                        <i class="fa-solid fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
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
