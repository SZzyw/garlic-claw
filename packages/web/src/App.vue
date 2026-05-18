<template>
  <ThemeProvider>
    <Teleport to="body">
      <WallpaperLayer />
      <AtmosphereLayer />
      <GlassNoiseDef />
    </Teleport>
    <ScreenEffectsRenderer />
    <ScreenEffectsFloatingToggle />
    <div class="app-content">
      <router-view />
    </div>
  </ThemeProvider>
</template>

<script setup lang="ts">
import ThemeProvider from '@/shared/providers/ThemeProvider.vue'
import WallpaperLayer from '@/modules/appearance/components/WallpaperLayer.vue'
import AtmosphereLayer from '@/modules/atmosphere/components/AtmosphereLayer.vue'
import GlassNoiseDef from '@/shared/components/GlassNoiseDef.vue'
import ScreenEffectsRenderer from '@/modules/screen-effects/components/ScreenEffectsRenderer.vue'
import ScreenEffectsFloatingToggle from '@/modules/screen-effects/components/ScreenEffectsFloatingToggle.vue'
import { useScreenEffectsStore } from '@/modules/screen-effects/store/screen-effects'

// ── Screen effects: independent from AppearanceSystem v3 pipeline ──
// Appearance/atmosphere/material stores are initialized by ThemeProvider.
// ThemeProvider calls appearance.init() → atmosphere.init() → material.init() → startPipeline().
// Init order is not a dependency — pipeline handles empty/default bridges gracefully.
const fxStore = useScreenEffectsStore()
fxStore.init()
</script>

<style>
.app-content {
  position: relative;
  z-index: 1;
  min-height: 100vh;
}
</style>
