<template>
  <ThemeProvider>
    <Teleport to="body">
      <BackgroundLayer />
      <AtmosphereLayer />
      <GlassNoiseDef />
    </Teleport>
    <ClickFxListener />
    <div class="app-content">
      <router-view />
    </div>
  </ThemeProvider>
</template>

<script setup lang="ts">
import ThemeProvider from '@/shared/providers/ThemeProvider.vue'
import BackgroundLayer from '@/modules/appearance/components/BackgroundLayer.vue'
import AtmosphereLayer from '@/modules/atmosphere/components/AtmosphereLayer.vue'
import GlassNoiseDef from '@/shared/components/GlassNoiseDef.vue'
import ClickFxListener from '@/modules/click-fx/ClickFxListener.vue'
</script>

<style>
.app-content {
  position: relative;
  z-index: 1;
  min-height: 100vh;
}
</style>
