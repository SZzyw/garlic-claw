<template>
  <div v-if="store.isActive" class="bg-root">
    <!-- ═══ Crossfade: previous source fading out ═══ -->
    <div
      v-if="prevSource"
      class="bg-crossfade"
      :class="{ 'bg-crossfade--exit': prevSource }"
      @transitionend="onCrossfadeEnd"
    >
      <div class="bg-crossfade__media" :style="prevMediaStyle" />
    </div>

    <!-- ═══ Source renderer: no wrapper, full viewport directly ═══ -->
    <SourceRenderer
      :source="store.source"
      :display-mode="store.displayMode"
      :adjustments="store.adjustments"
    />

    <!-- ═══ Effect renderer ═══ -->
    <EffectRenderer
      :source="store.source"
      :overlays="store.overlays"
      :adjustments="store.adjustments"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useBackgroundStore } from '@/shared/stores/background'
import { getGradientCSS } from '@/shared/background/presets'
import SourceRenderer from './SourceRenderer.vue'
import EffectRenderer from './EffectRenderer.vue'

const store = useBackgroundStore()

// ── Crossfade state ──
const prevSource = ref<string | null>(null)
const prevMediaStyle = ref<Record<string, string>>({})
let crossfadeTimer: ReturnType<typeof setTimeout> | null = null
let sourceDebounce: ReturnType<typeof setTimeout> | null = null
const DEBOUNCE_MS = 100

// ── Track previous media style for crossfade ──
const lastMediaStyle = ref<Record<string, string>>({})

function currentMediaStyle(): Record<string, string> {
  const s = store.source
  if (s.kind === 'gradient') return { background: getGradientCSS(s.presetId) }
  if (s.kind === 'color') return { background: s.color }
  if (s.kind === 'image' || s.kind === 'video') {
    return { backgroundImage: `url(${s.url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
  }
  return {}
}

function onCrossfadeEnd(): void {
  prevSource.value = null
  prevMediaStyle.value = {}
}

watch(
  () => {
    const s = store.source
    if (s.kind === 'none') return null
    if (s.kind === 'image' || s.kind === 'video') return s.url
    if (s.kind === 'gradient') return s.presetId
    if (s.kind === 'color') return s.color
  },
  (newVal, oldVal) => {
    if (sourceDebounce) {
      clearTimeout(sourceDebounce)
      sourceDebounce = null
    }

    const capturedStyle = { ...lastMediaStyle.value }

    sourceDebounce = setTimeout(() => {
      if (oldVal && oldVal !== newVal && capturedStyle.background) {
        prevMediaStyle.value = capturedStyle
        prevSource.value = oldVal
      }

      lastMediaStyle.value = currentMediaStyle()

      if (crossfadeTimer) {
        clearTimeout(crossfadeTimer)
        crossfadeTimer = null
      }

      if (prevSource.value) {
        crossfadeTimer = setTimeout(() => {
          prevSource.value = null
          prevMediaStyle.value = {}
        }, 800)
      }
    }, DEBOUNCE_MS)
  },
  { immediate: true },
)
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

/* ── Crossfade ── */
.bg-crossfade {
  position: absolute;
  inset: 0;
  z-index: 1;
  opacity: 1;
  transition: opacity 600ms cubic-bezier(0.4, 0, 0.2, 1);
}

.bg-crossfade--exit {
  opacity: 0;
}

.bg-crossfade__media {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
</style>
