<template>
  <div v-if="store.isActive" class="bg-root">
    <!-- ═══ Cinematic cross-dissolve: old + new SourceRenderer overlap ═══ -->
    <Transition name="bg-dissolve">
      <SourceRenderer
        :key="sourceKey"
        :source="store.activeResolvedSource"
        :display-mode="store.displayMode"
        :adjustments="store.adjustments"
      />
    </Transition>

    <!-- ═══ Effect renderer ═══ -->
    <EffectRenderer
      :source="store.activeResolvedSource"
      :overlay-intensity="store.overlayIntensity"
      :adjustments="store.adjustments"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useBackgroundStore } from '@/shared/stores/background'
import SourceRenderer from './SourceRenderer.vue'
import EffectRenderer from './EffectRenderer.vue'

const store = useBackgroundStore()

const sourceKey = computed(() => {
  const s = store.activeResolvedSource
  if (s.kind === 'none') return 'none'
  if (s.kind === 'image' || s.kind === 'video') return s.url
  if (s.kind === 'gradient') return `gradient:${s.presetId}`
  if (s.kind === 'color') return `color:${s.color}`
  return ''
})
</script>

<style scoped>
.bg-root {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}

.bg-root,
.bg-root * {
  pointer-events: none;
}
</style>

<!-- Transition styles must be unscoped — they target child component root elements -->
<style>
/* ── Cinematic cross-dissolve ── */
.bg-dissolve-enter-active,
.bg-dissolve-leave-active {
  transition: opacity 3s cubic-bezier(0.25, 0.1, 0.25, 1);
}

.bg-dissolve-enter-from {
  opacity: 0;
}

.bg-dissolve-leave-to {
  opacity: 0;
}

.bg-dissolve-leave-active {
  position: absolute !important;
  inset: 0;
  z-index: 1;
}

.bg-dissolve-enter-active {
  z-index: 0;
}
</style>
