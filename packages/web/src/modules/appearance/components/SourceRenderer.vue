<template>
  <div v-if="source.kind !== 'none'" class="source-renderer" :style="rootStyle">
    <!-- Color -->
    <div
      v-if="source.kind === 'color'"
      class="source-renderer__color"
      :style="{ backgroundColor: source.color }"
    />

    <!-- Gradient -->
    <div
      v-else-if="source.kind === 'gradient'"
      class="source-renderer__gradient"
      :style="{ background: gradientCSS }"
    />

    <!-- Image -->
    <img
      v-else-if="source.kind === 'image'"
      :src="source.url"
      alt=""
      class="source-renderer__img"
      :style="imgStyle"
    />

    <!-- Video -->
    <video
      v-else-if="source.kind === 'video'"
      :src="source.url"
      autoplay
      loop
      muted
      playsinline
      class="source-renderer__video"
      :style="imgStyle"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { BackgroundSource, DisplayMode, BackgroundAdjustments } from '@/shared/background/types'
import { OBJECT_FIT_MAP } from '@/shared/background/types'
import { getGradientCSS } from '@/shared/background/presets'

const props = defineProps<{
  source: BackgroundSource
  displayMode: DisplayMode
  adjustments: BackgroundAdjustments
}>()

const objectFit = computed(() => OBJECT_FIT_MAP[props.displayMode] ?? 'cover')

const imgStyle = computed(() => ({ 'object-fit': objectFit.value } as Record<string, string>))

const gradientCSS = computed(() => {
  if (props.source.kind === 'gradient') {
    return getGradientCSS(props.source.presetId)
  }
  return ''
})

const filterStyle = computed(() => {
  const a = props.adjustments
  const parts: string[] = []
  if (a.blur > 0) parts.push(`blur(${a.blur}px)`)
  parts.push(`opacity(${a.opacity})`)
  parts.push(`saturate(${a.saturation / 100})`)
  parts.push(`brightness(${a.brightness / 100})`)
  parts.push(`contrast(${a.contrast / 100})`)
  return parts.join(' ')
})

const rootStyle = computed(() => {
  const style: Record<string, string> = {
    filter: filterStyle.value,
  }
  if (props.displayMode === 'fit') {
    style.background = '#000'
  }
  return style
})
</script>

<style scoped>
.source-renderer {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}

.source-renderer__color,
.source-renderer__gradient {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.source-renderer__img,
.source-renderer__video {
  display: block;
  width: 100%;
  height: 100%;
}

.source-renderer__img {
  object-fit: cover;
}

.source-renderer__video {
  object-fit: cover;
}
</style>
