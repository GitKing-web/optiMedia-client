<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue'
import { RouterLink, useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useSiteStore } from '../stores/site'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const siteStore = useSiteStore()
const isMenuOpen = ref(false)

function toggleMenu() {
    isMenuOpen.value = !isMenuOpen.value
}

function closeMenu() {
    isMenuOpen.value = false
}

async function handleLogout() {
    await authStore.logout()
    closeMenu()
    router.push('/')
}

watch(isMenuOpen, (open) => {
    document.body.style.overflow = open ? 'hidden' : ''
})

watch(() => route.fullPath, () => closeMenu())

onBeforeUnmount(() => {
    document.body.style.overflow = ''
})
</script>

<template>
    <nav
        class="bg-secondary/95 backdrop-blur-md text-white px-4 sm:px-6 lg:px-8 py-4 shadow-xl sticky top-0 z-50 border-b border-white/5 w-full">
        <div class="flex justify-between items-center">
            <!-- Logo -->
            <RouterLink to="/" class="flex items-center gap-2 sm:gap-3 min-w-0">
                <img src="/images/logo.jpeg" alt="optiMedia Logo"
                    class="h-8 w-8 sm:h-10 sm:w-10 object-contain rounded-lg shadow-lg border border-white/10 shrink-0" />
                <span class="text-base sm:text-2xl font-black tracking-tighter uppercase italic truncate">{{ siteStore.siteName }}</span>
            </RouterLink>

            <!-- Desktop Navigation -->
            <div class="hidden md:flex items-center gap-10">
                <RouterLink to="/"
                    class="hover:text-primary transition-colors font-bold uppercase text-sm tracking-widest flex items-center gap-2"
                    active-class="text-primary">
                    Home
                </RouterLink>
                <a href="/#about"
                    class="hover:text-primary transition-colors font-bold uppercase text-sm tracking-widest flex items-center gap-2">
                    About
                </a>
                <a href="/#contact"
                    class="hover:text-primary transition-colors font-bold uppercase text-sm tracking-widest flex items-center gap-2">
                    Contact Us
                </a>
            </div>

            <!-- Desktop Action Button -->
            <div class="hidden md:flex items-center gap-4">
                <div v-if="authStore.isAuthenticated" class="flex items-center gap-2">
                    <RouterLink to="/dashboard"
                        class="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg hover:bg-white/20 transition-all border border-white/10">
                        <i class="fa-solid fa-user text-lg"></i>
                        <span class="text-sm font-bold uppercase tracking-widest">{{ authStore.user?.name || 'Profile' }}</span>
                    </RouterLink>
                    <button @click="handleLogout" :disabled="authStore.isLoggingOut"
                        class="bg-red-500/10 text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-500/20 transition-all border border-red-500/10 text-sm font-bold uppercase tracking-widest disabled:opacity-60 disabled:cursor-not-allowed">
                        <span v-if="authStore.isLoggingOut" class="flex items-center gap-2">
                            <i class="fa-solid fa-spinner fa-spin"></i> Logging out...
                        </span>
                        <span v-else class="flex items-center gap-2">
                            <i class="fa-solid fa-right-from-bracket"></i> Logout
                        </span>
                    </button>
                </div>
                <RouterLink v-else to="/login"
                    class="bg-primary text-white px-8 py-2.5 rounded-xl font-black uppercase text-sm tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/30">
                    Sign In
                </RouterLink>
            </div>

            <!-- Mobile Hamburger Button -->
            <button @click="toggleMenu" class="md:hidden relative z-[70] h-10 w-10 flex items-center justify-center rounded-xl text-white"
                aria-label="Toggle menu" :aria-expanded="isMenuOpen">
                <i :class="isMenuOpen ? 'fa-solid fa-xmark' : 'fa-solid fa-bars'" class="text-2xl"></i>
            </button>
        </div>
    </nav>

    <!-- Mobile Drawer -->
    <Teleport to="body">
        <Transition name="drawer-fade">
            <div v-if="isMenuOpen" class="fixed inset-0 z-[60] md:hidden">
                <!-- Backdrop -->
                <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="closeMenu"></div>

                <!-- Drawer panel -->
                <Transition name="drawer-slide" appear>
                    <aside
                        class="absolute right-0 top-0 h-[100dvh] w-[85vw] max-w-sm bg-secondary border-l border-white/10 shadow-2xl flex flex-col">
                        <!-- Drawer header -->
                        <div class="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
                            <div class="flex items-center gap-2 min-w-0">
                                <img src="/images/logo.jpeg" alt="optiMedia Logo"
                                    class="h-9 w-9 object-contain rounded-lg border border-white/10 shrink-0" />
                                <span class="text-lg font-black tracking-tighter uppercase italic truncate">{{ siteStore.siteName }}</span>
                            </div>
                            <button @click="closeMenu" aria-label="Close menu"
                                class="h-9 w-9 flex items-center justify-center rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-all">
                                <i class="fa-solid fa-xmark text-xl"></i>
                            </button>
                        </div>

                        <!-- Drawer body (scrollable) -->
                        <div class="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-2">
                            <RouterLink to="/" @click="closeMenu"
                                class="flex items-center gap-4 px-4 py-3.5 rounded-2xl text-lg font-black uppercase tracking-widest text-white/80 hover:text-primary hover:bg-white/5 transition-all"
                                active-class="text-primary bg-white/5">
                                <i class="fa-solid fa-house w-6 text-base opacity-60"></i>
                                Home
                            </RouterLink>
                            <a href="/#about" @click="closeMenu"
                                class="flex items-center gap-4 px-4 py-3.5 rounded-2xl text-lg font-black uppercase tracking-widest text-white/80 hover:text-primary hover:bg-white/5 transition-all">
                                <i class="fa-solid fa-circle-info w-6 text-base opacity-60"></i>
                                About
                            </a>
                            <a href="/#contact" @click="closeMenu"
                                class="flex items-center gap-4 px-4 py-3.5 rounded-2xl text-lg font-black uppercase tracking-widest text-white/80 hover:text-primary hover:bg-white/5 transition-all">
                                <i class="fa-solid fa-envelope w-6 text-base opacity-60"></i>
                                Contact Us
                            </a>

                            <template v-if="authStore.isAuthenticated">
                                <RouterLink to="/subscriptions" @click="closeMenu"
                                    class="flex items-center gap-4 px-4 py-3.5 rounded-2xl text-lg font-black uppercase tracking-widest text-white/80 hover:text-primary hover:bg-white/5 transition-all"
                                    active-class="text-primary bg-white/5">
                                    <i class="fa-solid fa-layer-group w-6 text-base opacity-60"></i>
                                    Subscriptions
                                </RouterLink>
                                <RouterLink to="/dashboard" @click="closeMenu"
                                    class="flex items-center gap-4 px-4 py-3.5 rounded-2xl text-lg font-black uppercase tracking-widest text-white/80 hover:text-primary hover:bg-white/5 transition-all"
                                    active-class="text-primary bg-white/5">
                                    <i class="fa-solid fa-gauge-high w-6 text-base opacity-60"></i>
                                    Dashboard
                                </RouterLink>
                            </template>
                        </div>

                        <!-- Drawer footer (pinned) -->
                        <div class="shrink-0 border-t border-white/10 p-5 space-y-3 bg-black/20">
                            <div v-if="authStore.isAuthenticated">
                                <div class="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 mb-3">
                                    <div
                                        class="h-9 w-9 shrink-0 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center text-sm font-black uppercase text-primary">
                                        {{ (authStore.user?.name || 'U').charAt(0) }}
                                    </div>
                                    <div class="min-w-0">
                                        <p class="text-sm font-black truncate">{{ authStore.user?.name || 'Profile' }}</p>
                                        <p class="text-[10px] font-bold uppercase tracking-widest text-white/40">
                                            {{ authStore.user?.email || '' }}
                                        </p>
                                    </div>
                                </div>
                                <button @click="handleLogout" :disabled="authStore.isLoggingOut"
                                    class="w-full flex items-center justify-center gap-3 bg-red-500/10 text-red-400 px-6 py-3.5 rounded-2xl hover:bg-red-500/20 transition-all border border-red-500/10 disabled:opacity-60 disabled:cursor-not-allowed">
                                    <i :class="authStore.isLoggingOut ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-right-from-bracket'"
                                        class="text-lg"></i>
                                    <span class="font-black uppercase tracking-widest text-sm">
                                        {{ authStore.isLoggingOut ? 'Logging out...' : 'Logout' }}
                                    </span>
                                </button>
                            </div>
                            <RouterLink v-else to="/login" @click="closeMenu"
                                class="w-full block bg-primary text-white px-8 py-4 rounded-2xl font-black uppercase text-sm tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/40 text-center">
                                Sign In
                            </RouterLink>
                        </div>
                    </aside>
                </Transition>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped>
.drawer-fade-enter-active,
.drawer-fade-leave-active {
    transition: opacity 0.3s ease;
}

.drawer-fade-enter-from,
.drawer-fade-leave-to {
    opacity: 0;
}

.drawer-slide-enter-active,
.drawer-slide-leave-active {
    transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.drawer-slide-enter-from,
.drawer-slide-leave-to {
    transform: translateX(100%);
}
</style>
