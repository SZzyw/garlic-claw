<template>
  <slot />
</template>

<script setup lang="ts">
import { provide, watch, onMounted, onUnmounted } from 'vue'
import { useAppearanceStore } from '@/shared/stores/appearance'
import { useAtmosphereStore } from '@/shared/stores/atmosphere'
import { useMaterialStore } from '@/shared/stores/material'
import { startPipeline } from '@/shared/theme/pipeline'
import { themePresets } from '@/shared/theme/constants'
import { TOKEN_GROUPS } from '@/shared/theme/groups'
import { THEME_CONTEXT_KEY } from './theme-context'
import type { ThemeContextValue } from './theme-context'

const appearance = useAppearanceStore()
const atmosphere = useAtmosphereStore()
const material = useMaterialStore()

// ── Initialize stores on mount ──
onMounted(() => {
  appearance.init()
  atmosphere.init()
  material.init()
})

// ── Start reactive graph pipeline ──
// Watches three bridges (themeBase + atmosphereLighting + materialConfig)
// and composes them into a single TokenMap applied to :root.
// This replaces the old appearance.tokens watch.
startPipeline()

// ── Sync html class with resolvedMode ──
watch(
  () => appearance.resolvedMode,
  (mode) => {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    if (mode === 'dark') {
      root.classList.remove('light')
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
      root.classList.add('light')
    }
  },
  { immediate: true },
)

// ── Cleanup on unmount ──
onUnmounted(() => {
  // Store's matchMedia listener persists; this is intentional —
  // the store outlives individual provider instances.
})

// ── Provide theme context ──
provide<ThemeContextValue>(THEME_CONTEXT_KEY, {
  preset: appearance.currentPreset,
  presets: themePresets,
  groups: TOKEN_GROUPS,
  mode: appearance.mode,
  resolvedMode: appearance.resolvedMode,
  hue: appearance.effectiveHue,
  saturation: appearance.effectiveSaturation,
  tokens: appearance.tokens,
  setPreset: appearance.setPreset,
  setMode: appearance.setMode,
  setHue: appearance.setHue,
  setSaturation: appearance.setSaturation,
})
</script>
