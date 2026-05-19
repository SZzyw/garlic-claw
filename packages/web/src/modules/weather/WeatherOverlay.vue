<template>
  <Transition name="weather-overlay" appear>
    <div
      v-if="active"
      class="weather-overlay"
      :class="[`weather-overlay--${weather}`, { 'is-light': isLight }]"
      :style="overlayStyle"
    >
      <!-- Fog: multi-layer depth fog -->
      <template v-if="weather === 'fog'">
        <div class="fog-layer fog-layer--back" :style="fogBackStyle" />
        <div class="fog-layer fog-layer--mid" :style="fogMidStyle" />
        <div class="fog-layer fog-layer--front" :style="fogFrontStyle" />
      </template>

      <!-- Night: subtle starfield shimmer -->
      <template v-if="weather === 'night'">
        <div class="night-vignette" :style="nightVignetteStyle" />
      </template>

      <!-- Sunset: warm glow band -->
      <template v-if="weather === 'sunset'">
        <div class="sunset-band" :style="sunsetBandStyle" />
      </template>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { weatherRuntime } from './weatherRuntime'
import { sampleThemeColors } from './particles/themeColors'
import type { WeatherType } from '@/shared/atmosphere/weather'

const weather = computed<WeatherType>(() => weatherRuntime.current)
const intensity = computed(() => weatherRuntime.intensity)
const theme = computed(() => sampleThemeColors())
const isLight = computed(() => !theme.value.isDark)

const active = computed(() =>
  weather.value !== 'clear' && !weatherRuntime.hasParticles,
)

// ── Main overlay gradient ──
const overlayStyle = computed(() => {
  const w = weather.value
  const i = intensity.value
  const t = theme.value

  if (t.isDark) {
    // Dark mode: luminous, translucent overlays
    const gradients: Partial<Record<WeatherType, string>> = {
      fog: `linear-gradient(180deg,
        color-mix(in oklch, var(--gc-surface-base) 80%, var(--atmosphere-1, oklch(60% 0.02 215))) 0%,
        color-mix(in oklch, var(--gc-surface-base) 45%, var(--atmosphere-2, oklch(55% 0.04 215))) 30%,
        color-mix(in oklch, var(--gc-surface-base) 20%, var(--atmosphere-3, oklch(50% 0.06 215))) 60%,
        transparent 100%)`,
      night: `linear-gradient(180deg,
        color-mix(in oklch, var(--gc-surface-base) 65%, oklch(20% 0.08 250)) 0%,
        color-mix(in oklch, var(--gc-surface-base) 75%, oklch(15% 0.06 250)) 50%,
        transparent 100%)`,
      sunset: `linear-gradient(180deg,
        color-mix(in oklch, var(--gc-surface-base) 70%, oklch(60% 0.18 25)) 0%,
        color-mix(in oklch, var(--gc-surface-base) 82%, oklch(55% 0.15 15)) 40%,
        transparent 85%)`,
    }
    return { background: gradients[w] ?? 'transparent', opacity: i }
  }

  // Light mode: contrast-rich, shadow-enhancing overlays
  const lightGradients: Partial<Record<WeatherType, string>> = {
    fog: `linear-gradient(180deg,
      color-mix(in oklch, var(--gc-surface-base) 90%, oklch(70% 0.04 215)) 0%,
      color-mix(in oklch, var(--gc-surface-base) 65%, oklch(60% 0.06 215)) 25%,
      color-mix(in oklch, var(--gc-surface-base) 45%, oklch(50% 0.08 215)) 55%,
      transparent 100%)`,
    night: `linear-gradient(180deg,
      color-mix(in oklch, var(--gc-surface-base) 80%, oklch(15% 0.04 260)) 0%,
      color-mix(in oklch, var(--gc-surface-base) 85%, oklch(10% 0.03 260)) 45%,
      transparent 90%)`,
    sunset: `linear-gradient(180deg,
      color-mix(in oklch, var(--gc-surface-base) 82%, oklch(65% 0.20 30)) 0%,
      color-mix(in oklch, var(--gc-surface-base) 88%, oklch(58% 0.16 20)) 35%,
      transparent 80%)`,
  }
  return { background: lightGradients[w] ?? 'transparent', opacity: Math.min(1, i * 1.2) }
})

// ── Fog: multi-layer drifting fog banks ──
const fogBackStyle = computed(() => ({
  opacity: 0.3 * intensity.value,
  animationDuration: `${40 / Math.max(0.3, intensity.value)}s`,
}))

const fogMidStyle = computed(() => ({
  opacity: 0.5 * intensity.value,
  animationDuration: `${30 / Math.max(0.3, intensity.value)}s`,
}))

const fogFrontStyle = computed(() => ({
  opacity: 0.35 * intensity.value,
  animationDuration: `${20 / Math.max(0.3, intensity.value)}s`,
}))

// ── Night: vignette ──
const nightVignetteStyle = computed(() => ({
  opacity: 0.6 * intensity.value,
}))

// ── Sunset: warm glow band ──
const sunsetBandStyle = computed(() => ({
  opacity: 0.5 * intensity.value,
}))
</script>

<style scoped>
.weather-overlay {
  position: fixed;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  will-change: opacity;
}

/* ── Fog layers ── */
.fog-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  will-change: transform;
}

.fog-layer--back {
  background:
    radial-gradient(ellipse 60% 40% at 20% 50%, color-mix(in oklch, var(--atmosphere-2, oklch(60% 0.03 215)) 60%, transparent) 0%, transparent 70%),
    radial-gradient(ellipse 50% 35% at 80% 40%, color-mix(in oklch, var(--atmosphere-2, oklch(60% 0.03 215)) 50%, transparent) 0%, transparent 70%);
  animation: fog-drift-back 40s ease-in-out infinite;
}

.fog-layer--mid {
  background:
    radial-gradient(ellipse 45% 30% at 50% 60%, color-mix(in oklch, var(--atmosphere-1, oklch(65% 0.02 215)) 70%, transparent) 0%, transparent 60%),
    radial-gradient(ellipse 40% 25% at 15% 70%, color-mix(in oklch, var(--atmosphere-1, oklch(65% 0.02 215)) 55%, transparent) 0%, transparent 60%);
  animation: fog-drift-mid 30s ease-in-out infinite;
}

.fog-layer--front {
  background:
    radial-gradient(ellipse 35% 20% at 70% 80%, color-mix(in oklch, var(--atmosphere-3, oklch(55% 0.05 215)) 65%, transparent) 0%, transparent 50%);
  animation: fog-drift-front 20s ease-in-out infinite;
}

/* Light mode: fog uses shadows instead of glow */
.is-light .fog-layer--back {
  background:
    radial-gradient(ellipse 60% 40% at 20% 50%, color-mix(in oklch, var(--atmosphere-2, oklch(55% 0.04 215)) 40%, transparent) 0%, transparent 70%),
    radial-gradient(ellipse 50% 35% at 80% 40%, color-mix(in oklch, var(--atmosphere-2, oklch(55% 0.04 215)) 30%, transparent) 0%, transparent 70%);
}

.is-light .fog-layer--mid {
  background:
    radial-gradient(ellipse 45% 30% at 50% 60%, color-mix(in oklch, var(--atmosphere-1, oklch(60% 0.03 215)) 50%, transparent) 0%, transparent 60%),
    radial-gradient(ellipse 40% 25% at 15% 70%, color-mix(in oklch, var(--atmosphere-1, oklch(60% 0.03 215)) 35%, transparent) 0%, transparent 60%);
}

@keyframes fog-drift-back {
  0%, 100% { transform: translate(0, 0) scale(1); }
  25% { transform: translate(2%, -1%) scale(1.02); }
  50% { transform: translate(-1%, 1.5%) scale(1.04); }
  75% { transform: translate(1.5%, 0.5%) scale(1.01); }
}

@keyframes fog-drift-mid {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(-1.5%, 1%) scale(1.03); }
  66% { transform: translate(1%, -1.5%) scale(1.02); }
}

@keyframes fog-drift-front {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(2.5%, 2%) scale(1.05); }
}

/* ── Night vignette ── */
.night-vignette {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(
    ellipse 70% 55% at 50% 50%,
    transparent 30%,
    rgba(0, 0, 0, 0.12) 65%,
    rgba(0, 0, 0, 0.25) 100%
  );
}

.is-light .night-vignette {
  background: radial-gradient(
    ellipse 70% 55% at 50% 50%,
    transparent 25%,
    rgba(0, 0, 0, 0.18) 60%,
    rgba(0, 0, 0, 0.35) 100%
  );
}

/* ── Sunset glow band ── */
.sunset-band {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(
    180deg,
    transparent 0%,
    color-mix(in oklch, var(--atmosphere-glow, oklch(60% 0.18 25)) 30%, transparent) 40%,
    transparent 70%
  );
}

.is-light .sunset-band {
  background: linear-gradient(
    180deg,
    transparent 0%,
    color-mix(in oklch, var(--atmosphere-glow, oklch(55% 0.20 30)) 40%, transparent) 35%,
    transparent 75%
  );
}

/* ── Transition ── */
.weather-overlay-enter-active {
  transition: opacity 600ms ease-out;
}
.weather-overlay-leave-active {
  transition: opacity 400ms ease-out;
}
.weather-overlay-enter-from,
.weather-overlay-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .fog-layer {
    animation: none;
  }
}
</style>
