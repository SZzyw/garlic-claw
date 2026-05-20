<template>
  <div class="ix-settings">
    <!-- Master toggle -->
    <section class="slider-section">
      <span class="slider-section__label">总开关</span>
      <div class="ix-master-card">
        <div class="ix-master-info">
          <span class="ix-master-name">点击特效</span>
          <span class="ix-master-desc">启用后在点击位置播放瞬时粒子动画</span>
        </div>
        <button
          type="button"
          class="ix-toggle"
          :class="{ active: store.enabled }"
          role="switch"
          :aria-checked="store.enabled"
          @click="toggleEnabled"
        >
          <span class="ix-toggle-knob" />
        </button>
      </div>
    </section>

    <!-- Type selection -->
    <section class="slider-section">
      <span class="slider-section__label">效果类型</span>
      <div class="ix-type-grid">
        <button
          v-for="t in types"
          :key="t.id"
          class="ix-type-chip"
          :class="{ active: store.type === t.id }"
          :disabled="!store.enabled"
          @click="selectType(t.id)"
        >
          {{ t.label }}
        </button>
      </div>
    </section>

    <!-- Test fire -->
    <button
      class="ix-test-btn"
      :disabled="store.type === 'none' || !store.enabled"
      @click="store.testFire()"
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
        <polygon points="5,3 19,12 5,21" />
      </svg>
      测试效果
    </button>

    <!-- Sliders -->
    <section class="slider-section">
      <span class="slider-section__label">参数</span>
      <div class="ix-sliders">
        <div class="slider-group">
          <div class="slider-group__header">
            <label class="slider-group__label">强度</label>
            <span class="slider-group__value">{{ store.config.intensity }}</span>
          </div>
          <div class="slider-group__track">
            <input
              type="range"
              class="slider"
              min="0"
              max="100"
              :value="store.config.intensity"
              :disabled="!store.enabled"
              @input="onIntensity"
            />
          </div>
        </div>
        <div class="slider-group">
          <div class="slider-group__header">
            <label class="slider-group__label">粒子数</label>
            <span class="slider-group__value">{{ store.config.particles }}</span>
          </div>
          <div class="slider-group__track">
            <input
              type="range"
              class="slider"
              min="0"
              max="100"
              :value="store.config.particles"
              :disabled="!store.enabled"
              @input="onParticles"
            />
          </div>
        </div>
        <div class="slider-group">
          <div class="slider-group__header">
            <label class="slider-group__label">速度</label>
            <span class="slider-group__value">{{ store.config.speed }}</span>
          </div>
          <div class="slider-group__track">
            <input
              type="range"
              class="slider"
              min="0"
              max="100"
              :value="store.config.speed"
              :disabled="!store.enabled"
              @input="onSpeed"
            />
          </div>
        </div>
      </div>
    </section>

    <button class="slider-reset" @click="resetAll">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
        <path d="M3 3v5h5"/>
      </svg>
      重置全部
    </button>
  </div>
</template>

<script setup lang="ts">
import { useClickFxStore } from '@/modules/click-fx/store'
import type { ClickFXType } from '@/modules/click-fx/types'

const store = useClickFxStore()

const types: { id: ClickFXType; label: string }[] = [
  { id: 'none', label: '无' },
  { id: 'aurora-pulse', label: '极光脉冲' },
  { id: 'ripple', label: '涟漪' },
  { id: 'sakura-ripple', label: '樱花涟漪' },
  { id: 'glass-ripple', label: '玻璃波纹' },
  { id: 'shockwave', label: '冲击波' },
]

function toggleEnabled(): void {
  store.setEnabled(!store.enabled)
}

function selectType(t: ClickFXType): void {
  store.setType(t)
}

function onIntensity(event: Event): void {
  store.setConfig({ intensity: Number((event.target as HTMLInputElement).value) })
}

function onParticles(event: Event): void {
  store.setConfig({ particles: Number((event.target as HTMLInputElement).value) })
}

function onSpeed(event: Event): void {
  store.setConfig({ speed: Number((event.target as HTMLInputElement).value) })
}

function resetAll(): void {
  store.resetAll()
}
</script>

<style scoped>
.ix-settings {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.slider-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.slider-section__label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--gc-muted-foreground);
  opacity: 0.7;
}

/* ── Master card ── */
.ix-master-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-radius: 12px;
  background: var(--gc-glass-bg);
  border: 1px solid var(--gc-glass-border);
}

.ix-master-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ix-master-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--gc-foreground);
}

.ix-master-desc {
  font-size: 11px;
  color: var(--gc-muted-foreground);
}

/* ── Toggle ── */
.ix-toggle {
  position: relative;
  width: 44px;
  height: 26px;
  border: 1px solid var(--gc-glass-border);
  border-radius: 999px;
  background: var(--gc-muted);
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
  transition:
    background var(--gc-transition-fast),
    border-color var(--gc-transition-fast);
}

.ix-toggle.active {
  background: var(--gc-accent);
  border-color: var(--gc-accent);
}

.ix-toggle-knob {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--gc-card);
  box-shadow: 0 1px 3px var(--gc-shadow-color);
  transition: transform var(--gc-transition-fast);
}

.ix-toggle.active .ix-toggle-knob {
  transform: translateX(18px);
}

/* ── Type chips ── */
.ix-type-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}

.ix-type-chip {
  padding: 8px 6px;
  border-radius: 10px;
  border: 1px solid var(--gc-glass-border);
  background: var(--gc-glass-bg);
  color: var(--gc-muted-foreground);
  font-size: 12px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition:
    border-color var(--gc-transition-fast),
    background var(--gc-transition-fast),
    color var(--gc-transition-fast);
}

.ix-type-chip:hover:not(:disabled) {
  border-color: var(--gc-accent);
  color: var(--gc-foreground);
}

.ix-type-chip.active {
  border-color: var(--gc-accent);
  background: var(--gc-accent-bg);
  color: var(--gc-accent);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--gc-accent) 15%, transparent);
}

.ix-type-chip:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* ── Test button ── */
.ix-test-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  align-self: flex-start;
  padding: 5px 12px;
  border-radius: 8px;
  border: 1px solid var(--gc-accent);
  background: transparent;
  color: var(--gc-accent);
  font-size: 11px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition:
    background var(--gc-transition-fast),
    transform var(--gc-transition-fast);
}

.ix-test-btn:hover:not(:disabled) {
  background: var(--gc-accent-bg);
  transform: scale(1.03);
}

.ix-test-btn:active:not(:disabled) {
  transform: scale(0.97);
}

.ix-test-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

/* ── Sliders ── */
.ix-sliders {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.slider-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.slider-group__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.slider-group__label {
  font-size: 12px;
  font-weight: 500;
  color: var(--gc-foreground);
}

.slider-group__value {
  font-size: 11px;
  font-weight: 600;
  color: var(--gc-accent);
  font-variant-numeric: tabular-nums;
  min-width: 32px;
  text-align: right;
}

.slider-group__track {
  position: relative;
  height: 24px;
  display: flex;
  align-items: center;
}

.slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 4px;
  border-radius: 2px;
  background: var(--gc-muted);
  outline: none;
  cursor: pointer;
}

.slider:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.slider::-webkit-slider-runnable-track {
  height: 4px;
  border-radius: 2px;
  background: linear-gradient(
    to right,
    var(--gc-muted) 0%,
    var(--gc-accent) 100%
  );
}

.slider::-moz-range-track {
  height: 4px;
  border-radius: 2px;
  background: linear-gradient(
    to right,
    var(--gc-muted) 0%,
    var(--gc-accent) 100%
  );
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--gc-card);
  border: 1.5px solid var(--gc-accent);
  cursor: pointer;
  box-shadow:
    0 1px 4px var(--gc-shadow-color),
    0 0 6px var(--gc-glow);
  margin-top: -6px;
  transition: transform var(--gc-transition-fast);
}

.slider::-webkit-slider-thumb:hover:not(:disabled) {
  transform: scale(1.2);
}

.slider::-webkit-slider-thumb:active:not(:disabled) {
  transform: scale(0.9);
}

.slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--gc-card);
  border: 1.5px solid var(--gc-accent);
  cursor: pointer;
  box-shadow: 0 1px 4px var(--gc-shadow-color);
}

/* ── Reset ── */
.slider-reset {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  align-self: flex-start;
  padding: 5px 12px;
  border-radius: 8px;
  border: 1px solid var(--gc-glass-border);
  background: transparent;
  color: var(--gc-muted-foreground);
  font-size: 11px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition:
    border-color var(--gc-transition-fast),
    color var(--gc-transition-fast),
    background var(--gc-transition-fast);
}

.slider-reset:hover {
  border-color: var(--gc-accent);
  color: var(--gc-accent);
  background: var(--gc-interactive-hover-bg);
}
</style>
