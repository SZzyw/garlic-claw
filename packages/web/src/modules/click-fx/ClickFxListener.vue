<template>
  <div />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useClickFxStore } from './store'

const store = useClickFxStore()

function onMouseDown(event: MouseEvent): void {
  // Exclude clicks inside the appearance control panel or floating overlays
  if (event.target instanceof Element) {
    if (event.target.closest('.cc-overlay')) return
    if (event.target.closest('.theme-panel')) return
  }
  store.trigger(event.clientX, event.clientY)
}

onMounted(() => {
  document.addEventListener('mousedown', onMouseDown)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', onMouseDown)
})
</script>
