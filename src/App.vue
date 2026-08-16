<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import Navbar from './components/Navbar.vue'
import LoadingScreen from './components/LoadingScreen.vue'
import { useAuthStore } from './stores/auth'

const route = useRoute()
const isReady = ref(false)
const authStore = useAuthStore()

watch(
    () => authStore.isHydrated,
    (hydrated) => {
        if (hydrated) {
            isReady.value = true
        }
    },
    { immediate: true },
)

onMounted(async () => {
    if (!authStore.isHydrated) {
        try {
            await authStore.fetchCurrentUser()
        } catch {
            // No session (or invalid session); store resets state.
        }
    }

    // Give the content at least a brief moment to settle for a smoother transition,
    // but never reveal before hydration is complete.
    if (!isReady.value) {
        isReady.value = true
    }
})
</script>

<template>
    <div class="min-h-screen flex flex-col overflow-x-hidden">
        <Transition name="fade-overlay">
            <LoadingScreen v-if="!isReady" />
        </Transition>

        <div :class="{ 'opacity-0 scale-95 blur-sm': !isReady, 'opacity-100 scale-100 blur-0': isReady }"
            class="flex-1 flex flex-col transition-all duration-700 cubic-bezier(0.16, 1, 0.3, 1)">
            <Navbar v-if="!route.meta.hideNavbar" />
            <main class="flex-1">
                <RouterView />
            </main>
            <footer v-if="!route.meta.hideFooter" class="bg-muted py-6 text-center text-secondary/60 text-sm border-t">
                &copy; 2026 optiMedia Subscription Management
            </footer>
        </div>
    </div>
</template>

<style>
/* Global Transitions */
.fade-overlay-leave-active {
  transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-overlay-leave-to {
  opacity: 0;
  transform: scale(1.1);
  filter: blur(10px);
}

.cubic-bezier\(0\.16\,\ 1\,\ 0\.3\,\ 1\) {
  transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
}
</style>
