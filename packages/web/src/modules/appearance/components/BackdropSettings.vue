<template>
  <div class="bd-settings">
    <!-- ═══ 叠层调节 ═══ -->
    <section class="bd-section">
      <span class="bd-section-label">叠层调节</span>
      <div class="bd-sliders">
        <!-- 叠层深度 -->
        <div class="bd-slider-group">
          <div class="bd-slider-group__header">
            <label class="bd-slider-group__label">叠层深度</label>
            <span class="bd-slider-group__value">{{ overlayDepth }}%</span>
          </div>
          <div class="bd-slider-group__track">
            <input
              type="range"
              class="bd-slider"
              min="0"
              max="100"
              :value="overlayDepth"
              @input="onOverlayDepthInput"
            />
          </div>
        </div>

        <!-- 壁纸透明度 -->
        <div class="bd-slider-group">
          <div class="bd-slider-group__header">
            <label class="bd-slider-group__label">壁纸透明度</label>
            <span class="bd-slider-group__value">{{ wallpaperOpacity }}%</span>
          </div>
          <div class="bd-slider-group__track">
            <input
              type="range"
              class="bd-slider"
              min="0"
              max="100"
              :value="wallpaperOpacity"
              @input="onWallpaperOpacityInput"
            />
          </div>
        </div>

        <!-- 背景模糊 -->
        <div class="bd-slider-group">
          <div class="bd-slider-group__header">
            <label class="bd-slider-group__label">背景模糊</label>
            <span class="bd-slider-group__value">{{ bgBlur }}px</span>
          </div>
          <div class="bd-slider-group__track">
            <input
              type="range"
              class="bd-slider"
              min="0"
              max="50"
              :value="bgBlur"
              @input="onBgBlurInput"
            />
          </div>
        </div>
      </div>
    </section>

  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useBackgroundStore } from '@/shared/stores/background'

const store = useBackgroundStore()

const overlayDepth = computed(() => Math.round(store.overlayIntensity * 100))
const wallpaperOpacity = computed(() => Math.round(store.adjustments.opacity * 100))
const bgBlur = computed(() => Math.round(store.adjustments.blur))

function onOverlayDepthInput(event: Event): void {
  const value = Number((event.target as HTMLInputElement).value) / 100
  store.setOverlayIntensity(value)
}

function onWallpaperOpacityInput(event: Event): void {
  const value = Number((event.target as HTMLInputElement).value) / 100
  store.setAdjustment('opacity', value)
}

function onBgBlurInput(event: Event): void {
  const value = Number((event.target as HTMLInputElement).value)
  store.setAdjustment('blur', value)
}
</script>

<style scoped>
.bd-settings {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.bd-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.bd-section-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--gc-muted-foreground);
  opacity: 0.7;
}

.bd-sliders {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 14px;
  border-radius: 12px;
  background: var(--gc-glass-bg);
  border: 1px solid var(--gc-glass-border);
}

/* ── Slider group (mirrors ScreenEffectsSettings pattern) ── */
.bd-slider-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.bd-slider-group__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.bd-slider-group__label {
  font-size: 12px;
  font-weight: 500;
  color: var(--gc-foreground);
}

.bd-slider-group__value {
  font-size: 11px;
  font-weight: 600;
  color: var(--gc-accent);
  font-variant-numeric: tabular-nums;
  min-width: 36px;
  text-align: right;
}

.bd-slider-group__track {
  position: relative;
  height: 24px;
  display: flex;
  align-items: center;
}

/* ── Slider (mirrors ScreenEffectsSettings pattern) ── */
.bd-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 4px;
  border-radius: 2px;
  background: var(--gc-muted);
  outline: none;
  cursor: pointer;
}

.bd-slider::-webkit-slider-runnable-track {
  height: 4px;
  border-radius: 2px;
  background: linear-gradient(
    to right,
    var(--gc-muted) 0%,
    var(--gc-accent) 100%
  );
}

.bd-slider::-moz-range-track {
  height: 4px;
  border-radius: 2px;
  background: linear-gradient(
    to right,
    var(--gc-muted) 0%,
    var(--gc-accent) 100%
  );
}

.bd-slider::-webkit-slider-thumb {
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

.bd-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.bd-slider::-webkit-slider-thumb:active {
  transform: scale(0.9);
}

.bd-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--gc-card);
  border: 1.5px solid var(--gc-accent);
  cursor: pointer;
  box-shadow: 0 1px 4px var(--gc-shadow-color);
}
</style>
