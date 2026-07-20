<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const isMenuOpen = ref(false)

function toggleMenu() {
    isMenuOpen.value = !isMenuOpen.value
}

async function handleLogout() {
    await authStore.logout()
    router.push('/')
}
</script>

<template>
    <nav
        class="bg-secondary/95 backdrop-blur-md text-white px-8 py-5 flex justify-between items-center shadow-xl sticky top-0 z-50 border-b border-white/5 w-full">
        <!-- Logo -->
        <div class="flex items-center gap-3">
            <img src="/images/logo.jpeg" alt="optiMedia Logo"
                class="h-8 w-8 sm:h-10 sm:w-10 object-contain rounded-lg shadow-lg border border-white/10" />
            <span class="text-xl sm:text-2xl font-black tracking-tighter uppercase italic">OPTIMEDIA SOLUTIONS</span>
        </div>

        <!-- Desktop Navigation -->
        <div class="hidden md:flex items-center gap-10">
            <RouterLink to="/"
                class="hover:text-primary transition-colors font-bold uppercase text-sm tracking-widest flex items-center gap-2"
                active-class="text-primary">
                Home
            </RouterLink>
            <a href="#about"
                class="hover:text-primary transition-colors font-bold uppercase text-sm tracking-widest flex items-center gap-2">
                About
            </a>
            <a href="#contact"
                class="hover:text-primary transition-colors font-bold uppercase text-sm tracking-widest flex items-center gap-2">
                Contact Us
            </a>
        </div>

        <!-- Desktop Action Button -->
        <div class="hidden md:flex items-center gap-4">
            <div v-if="authStore.isAuthenticated" class="flex items-center gap-2">
                <button
                    class="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg hover:bg-white/20 transition-all border border-white/10">
                    <i class="fa-solid fa-user text-lg"></i>
                    <span class="text-sm font-bold uppercase tracking-widest">{{ authStore.user?.name || 'Profile' }}</span>
                </button>
                <button @click="handleLogout"
                    class="bg-red-500/10 text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-500/20 transition-all border border-red-500/10 text-sm font-bold uppercase tracking-widest">
                    Logout
                </button>
            </div>
            <RouterLink v-else to="/login"
                class="bg-primary text-white px-8 py-2.5 rounded-xl font-black uppercase text-sm tracking-widest hover:brightness-111 active:scale-95 transition-all shadow-lg shadow-primary/30">
                Sign In
            </RouterLink>
        </div>

        <!-- Mobile Hamburger Button -->
        <button @click="toggleMenu" class="md:hidden text-white focus:outline-none z-[60] flex items-center">
            <i :class="isMenuOpen ? 'fa-solid fa-xmark' : 'fa-solid fa-bars'" class="text-3xl"></i>
        </button>

        <!-- Mobile Menu Overlay -->
        <Transition name="slide">
            <div v-if="isMenuOpen" class="fixed inset-0 z-50 md:hidden">
                <!-- Backdrop -->
                <div class="absolute inset-0 bg-secondary/80 backdrop-blur-sm" @click="isMenuOpen = false"></div>

                <!-- Side Drawer -->
                <div
                    class="absolute right-0 top-0 h-screen w-80 bg-secondary border-l border-white/10 shadow-4xl flex flex-col p-10 pt-32 gap-10 animate-slide-in">
                    <div class="flex flex-col gap-8">
                        <RouterLink to="/" @click="isMenuOpen = false"
                            class="text-xl sm:text-2xl font-black uppercase tracking-widest hover:text-primary transition-all flex items-center gap-4"
                            active-class="text-primary">
                            <i class="fa-solid fa-house text-lg sm:text-lg sm:text-xl opacity-50"></i>
                            Home
                        </RouterLink>
                        <a href="#about" @click="isMenuOpen = false"
                            class="text-xl sm:text-2xl font-black uppercase tracking-widest hover:text-primary transition-all flex items-center gap-4 text-white/70">
                            <i class="fa-solid fa-circle-info text-lg sm:text-xl opacity-50"></i>
                            About
                        </a>
                        <a href="#contact" @click="isMenuOpen = false"
                            class="text-xl sm:text-2xl font-black uppercase tracking-widest hover:text-primary transition-all flex items-center gap-4 text-white/70">
                            <i class="fa-solid fa-envelope text-lg sm:text-xl opacity-50"></i>
                            Contact Us
                        </a>
                    </div>

                    <div class="mt-auto pb-10 border-t border-white/10 pt-10">
                        <div v-if="authStore.isAuthenticated" class="space-y-2">
                            <button
                                class="w-full flex items-center gap-3 bg-white/10 px-6 py-4 rounded-2xl hover:bg-white/20 transition-all border border-white/10">
                                <i class="fa-solid fa-user text-xl sm:text-2xl"></i>
                                <span class="text-base sm:text-lg font-black uppercase tracking-widest">{{ authStore.user?.name ||
                                    'Profile' }}</span>
                            </button>
                            <button @click="handleLogout"
                                class="w-full flex items-center gap-3 bg-red-500/10 px-6 py-4 rounded-2xl hover:bg-red-500/20 transition-all border border-red-500/10">
                                <i class="fa-solid fa-right-from-bracket text-xl sm:text-2xl"></i>
                                <span class="text-base sm:text-lg font-black uppercase tracking-widest">Logout</span>
                            </button>
                        </div>
                        <RouterLink v-else to="/login" @click="isMenuOpen = false"
                            class="w-full bg-primary text-white px-8 py-4 rounded-2xl font-black uppercase text-base sm:text-lg tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-3xl shadow-primary/40 text-center">
                            Sign In
                        </RouterLink>
                    </div>
                </div>
            </div>
        </Transition>
    </nav>
</template>

<style scoped>
.slide-enter-active,
.slide-leave-active {
    transition: opacity 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
    opacity: 0;
}

@keyframes slideIn {
    from {
        transform: translateX(100%);
    }

    to {
        transform: translateX(0);
    }
}

.animate-slide-in {
    animation: slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
</style>
