<template>
    <div
        class="skeleton-shimmer relative overflow-hidden bg-white/5"
        :style="{ width: width, height: height, borderRadius: radius }"
        role="presentation"
        aria-hidden="true"
    />
</template>

<script setup lang="ts">
withDefaults(
    defineProps<{
        width?: string
        height?: string
        radius?: string
    }>(),
    {
        width: '100%',
        height: '1rem',
        radius: '0.75rem',
    },
)
</script>

<style scoped>
.skeleton-shimmer {
  background-image: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.04) 0%,
    rgba(255, 255, 255, 0.12) 50%,
    rgba(255, 255, 255, 0.04) 100%
  );
  background-size: 400px 100%;
  animation: shimmer 1.6s infinite linear;
}
</style>
