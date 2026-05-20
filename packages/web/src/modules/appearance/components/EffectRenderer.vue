<template>
  <div class="effect-renderer">
    <!-- Blur: duplicated static media + gradient depth mask -->
    <div
      v-if="overlays.blur && source.kind !== 'none' && source.kind !== 'video'"
      class="overlay overlay--blur"
    >
      <img
        v-if="source.kind === 'image'"
        :src="source.url"
        alt=""
        class="overlay--blur__media"
      />
      <div
        v-else-if="source.kind === 'gradient'"
        class="overlay--blur__media"
        :style="{ background: gradientCSS }"
      />
      <div
        v-else-if="source.kind === 'color'"
        class="overlay--blur__media"
        :style="{ background: source.color }"
      />
    </div>

    <!-- Vignette: ultra-subtle edge darkening, always on -->
    <div class="overlay overlay--vignette" />

    <!-- Dim: dynamic rgba mask -->
    <div v-if="overlays.dim" class="overlay overlay--dim" :style="dimStyle" />

    <!-- Glow: asymmetric aura + drift animation -->
    <div v-if="overlays.glow" class="overlay overlay--glow" :style="glowStyle" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { BackgroundSource, BackgroundOverlays, BackgroundAdjustments } from '@/shared/background/types'
import { getGradientCSS } from '@/shared/background/presets'

const props = defineProps<{
  source: BackgroundSource
  overlays: BackgroundOverlays
  adjustments: BackgroundAdjustments
}>()

const gradientCSS = computed(() => {
  if (props.source.kind === 'gradient') return getGradientCSS(props.source.presetId)
  return ''
})

// ── Easing helpers ──
function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3
}
function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2
}

// ── Dim: eased brightness→opacity mapping ──
const dimStyle = computed(() => {
  const b = props.adjustments.brightness / 100
  const t = Math.max(0, Math.min(1, (1.5 - b) / 1.2))
  const eased = easeOutCubic(t)
  const opacity = 0.12 + eased * 0.35
  return {
    background: `rgba(0, 0, 0, ${opacity.toFixed(3)})`,
    transition: 'background 1s cubic-bezier(0.4, 0, 0.2, 1)',
  }
})

// ── Glow: asymmetric aura + dynamic blend mode ──
const glowStyle = computed(() => {
  const b = props.adjustments.brightness / 100

  let blendMode: string
  if (b > 1.3) blendMode = 'multiply'
  else if (b > 1.05) blendMode = 'overlay'
  else if (b < 0.7) blendMode = 'screen'
  else if (b < 0.9) blendMode = 'lighten'
  else blendMode = 'soft-light'

  const midDist = 1 - Math.abs(b - 1)
  const easedIntensity = easeInOutSine(midDist)
  const glowOpacity = 0.50 + easedIntensity * 0.45

  const upperLeft = `radial-gradient(
    ellipse 48% 36% at 28% 22%,
    color-mix(in oklch, var(--gc-accent, oklch(62% 0.14 186)) 26%, transparent) 0%,
    color-mix(in oklch, var(--gc-accent, oklch(62% 0.14 186)) 7%, transparent) 55%,
    transparent 100%
  )`
  const lowerRight = `radial-gradient(
    ellipse 55% 34% at 72% 58%,
    color-mix(in oklch, var(--gc-accent, oklch(62% 0.14 186)) 18%, transparent) 0%,
    color-mix(in oklch, var(--gc-accent, oklch(62% 0.14 186)) 5%, transparent) 60%,
    transparent 100%
  )`
  const bottomAmbient = `radial-gradient(
    ellipse 78% 50% at 50% 75%,
    color-mix(in oklch, var(--gc-accent, oklch(62% 0.14 186)) 12%, transparent) 0%,
    transparent 75%
  )`

  return {
    background: `${upperLeft}, ${lowerRight}, ${bottomAmbient}`,
    mixBlendMode: blendMode as 'multiply' | 'overlay' | 'screen' | 'lighten' | 'soft-light',
    opacity: glowOpacity,
    transition: 'opacity 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
  }
})
</script>

<style scoped>
.effect-renderer {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
}

.overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

/* ── Blur: duplicated static media + gradient depth mask ── */
.overlay--blur {
  overflow: hidden;
  mask-image: radial-gradient(
    ellipse 65% 55% at 50% 50%,
    rgba(0, 0, 0, 0.75) 0%,
    rgba(0, 0, 0, 0.92) 65%,
    rgba(0, 0, 0, 1) 100%
  );
  -webkit-mask-image: radial-gradient(
    ellipse 65% 55% at 50% 50%,
    rgba(0, 0, 0, 0.75) 0%,
    rgba(0, 0, 0, 0.92) 65%,
    rgba(0, 0, 0, 1) 100%
  );
  transition: opacity 1s cubic-bezier(0.4, 0, 0.2, 1);
}

.overlay--blur__media {
  position: absolute;
  inset: -16px;
  width: calc(100% + 32px);
  height: calc(100% + 32px);
  object-fit: cover;
  filter: blur(20px) brightness(1.08) saturate(1.2);
  opacity: 0.85;
}

/* ── Vignette ── */
.overlay--vignette {
  background: radial-gradient(
    ellipse 75% 60% at 50% 50%,
    transparent 30%,
    rgba(0, 0, 0, 0.08) 60%,
    rgba(0, 0, 0, 0.18) 100%
  );
}

/* ── Glow drift ── */
.overlay--glow {
  animation: glow-drift 26s ease-in-out infinite;
  will-change: transform;
}

@keyframes glow-drift {
  0%, 100% { transform: translate(0, 0) scale(1); }
  20% { transform: translate(0.35%, -0.25%) scale(1.004); }
  40% { transform: translate(-0.28%, 0.42%) scale(1.002); }
  60% { transform: translate(0.22%, 0.18%) scale(1.005); }
  80% { transform: translate(-0.32%, -0.35%) scale(1.003); }
}
</style>
