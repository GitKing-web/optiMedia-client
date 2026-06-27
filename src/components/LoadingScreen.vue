<script setup lang="ts">
</script>

<template>
    <div class="fixed inset-0 z-[100] bg-secondary flex flex-col items-center justify-center pointer-events-none">
        <div class="relative flex flex-col items-center">
            <!-- Outer Glow -->
            <div class="absolute inset-0 bg-primary/20 rounded-full blur-3xl animate-pulse-slow"></div>

            <!-- Logo Container -->
            <div
                class="relative bg-white/5 p-8 rounded-[2.5rem] border border-white/10 backdrop-blur-xl shadow-2xl animate-float">
                <img src="/images/logo.jpeg" alt="Logo"
                    class="h-24 w-24 object-contain rounded-2xl shadow-inner animate-scale-in" />

                <!-- Orbiting dots -->
                <div class="absolute inset-0 border border-primary/20 rounded-[2.5rem] animate-spin-slow">
                    <div
                        class="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary rounded-full shadow-lg shadow-primary/50">
                    </div>
                </div>
            </div>

            <!-- Text -->
            <div class="mt-12 overflow-hidden">
                <h2 class="text-white text-xl font-black tracking-[0.3em] uppercase italic animate-text-reveal">
                    OptiMedia <span class="text-primary tracking-normal not-italic ml-2">Solutions</span>
                </h2>
                <div class="h-0.5 w-full bg-white/10 mt-2 rounded-full overflow-hidden">
                    <div class="h-full bg-primary w-1/3 rounded-full animate-progress-loading"></div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.animate-pulse-slow {
    animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {

    0%,
    100% {
        opacity: 0.1;
        transform: scale(1);
    }

    50% {
        opacity: 0.3;
        transform: scale(1.2);
    }
}

.animate-float {
    animation: float 3s ease-in-out infinite;
}

@keyframes float {

    0%,
    100% {
        transform: translateY(0);
    }

    50% {
        transform: translateY(-15px);
    }
}

.animate-scale-in {
    animation: scaleIn 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes scaleIn {
    from {
        transform: scale(0.5);
        opacity: 0;
    }

    to {
        transform: scale(1);
        opacity: 1;
    }
}

.animate-spin-slow {
    animation: spin 3s linear infinite;
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}

.animate-text-reveal {
    animation: textReveal 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes textReveal {
    from {
        transform: translateY(20px);
        opacity: 0;
        filter: blur(5px);
    }

    to {
        transform: translateY(0);
        opacity: 1;
        filter: blur(0);
    }
}

.animate-progress-loading {
    animation: progress 2s ease-in-out infinite;
}

@keyframes progress {
    0% {
        transform: translateX(-100%);
    }

    100% {
        transform: translateX(300%);
    }
}
</style>
