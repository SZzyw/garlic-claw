<template>
  <div class="bg-settings">
    <!-- ═══ Presets 2×2 grid ═══ -->
    <section class="bg-section">
      <span class="bg-section-label">预设</span>
      <div class="bg-preset-grid">
        <button
          v-for="preset in presets"
          :key="preset.id"
          class="bg-preset-card"
          :class="{ active: isPresetActive(preset.id) }"
          @click="selectPreset(preset.id)"
        >
          <span
            class="bg-preset-preview"
            :style="{ background: getPresetGradientCSS(preset.id) }"
          />
          <span class="bg-preset-label">{{ preset.label }}</span>
        </button>
      </div>
    </section>

    <!-- ═══ Upload ═══ -->
    <section class="bg-section">
      <span class="bg-section-label">上传</span>
      <div
        class="bg-upload-zone"
        :class="{ 'drag-active': dragActive }"
        @dragenter="handleDragEnter"
        @dragleave="handleDragLeave"
        @dragover="handleDragOver"
        @drop="handleDrop"
        @click="triggerFileInput"
      >
        <input
          ref="fileInput"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style="display: none"
          @change="handleFileSelect"
        />
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        <span class="bg-upload-text">拖拽图片到此处或点击上传</span>
      </div>
      <p v-if="uploadedFileName" class="bg-upload-name">
        已上传：{{ uploadedFileName }}
      </p>
      <p v-if="uploadError" class="bg-upload-error">{{ uploadError }}</p>
    </section>

    <!-- ═══ Fit mode ═══ -->
    <section class="bg-section">
      <span class="bg-section-label">适应方式</span>
      <div class="bg-mode-row">
        <button
          v-for="(label, mode) in DISPLAY_MODE_LABELS"
          :key="mode"
          class="bg-mode-chip"
          :class="{ active: displayMode === mode }"
          @click="setDisplayMode(mode)"
        >
          {{ label }}
        </button>
      </div>
    </section>

    <!-- ═══ Solid color ═══ -->
    <section class="bg-section">
      <span class="bg-section-label">纯色</span>
      <div class="bg-color-row">
        <input
          type="color"
          class="bg-color-input"
          :value="currentColorText() !== '—' ? currentColorText() : '#1a2332'"
          @input="onColorInput"
        />
        <span class="bg-color-value">{{ currentColorText() }}</span>
      </div>
    </section>

    <!-- ═══ Clear ═══ -->
    <button class="bg-clear" @click="clear">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
        <path d="M3 3v5h5"/>
      </svg>
      清除壁纸
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { DISPLAY_MODE_LABELS } from '@/shared/background/types'
import { backgroundPresets } from '@/shared/background/presets'
import { useBackgroundSource } from '@/modules/appearance/composables/useBackgroundSource'
import { useBackgroundUpload } from '@/modules/appearance/composables/useBackgroundUpload'

const {
  displayMode,
  isPresetActive,
  currentColor: currentColorText,
  selectPreset,
  setSolidColor,
  setDisplayMode,
  clear,
  getPresetGradientCSS,
} = useBackgroundSource()

const {
  dragActive,
  uploadedFileName,
  error: uploadError,
  handleDragEnter,
  handleDragLeave,
  handleDragOver,
  handleDrop,
  handleFileSelect,
} = useBackgroundUpload()

const fileInput = ref<HTMLInputElement | null>(null)
const presets = backgroundPresets

function triggerFileInput(): void {
  fileInput.value?.click()
}

function onColorInput(event: Event): void {
  const color = (event.target as HTMLInputElement).value
  setSolidColor(color)
}
</script>

<style scoped>
.bg-settings {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.bg-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.bg-section-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--gc-muted-foreground);
  opacity: 0.7;
}

/* ── Presets ── */
.bg-preset-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.bg-preset-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
  padding: 8px;
  border: 1px solid var(--gc-glass-border);
  border-radius: 12px;
  background: var(--gc-glass-bg);
  cursor: pointer;
  font-family: inherit;
  color: var(--gc-foreground);
  transition:
    border-color var(--gc-transition-fast),
    background var(--gc-transition-fast);
}

.bg-preset-card:hover {
  border-color: var(--gc-border);
}

.bg-preset-card.active {
  border-color: var(--gc-accent);
  background: color-mix(in oklch, var(--gc-accent) 12%, transparent);
}

.bg-preset-preview {
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 8px;
  border: 1px solid var(--gc-glass-border);
  overflow: hidden;
}

.bg-preset-label {
  font-size: 12px;
  font-weight: 500;
}

/* ── Upload zone ── */
.bg-upload-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px;
  border: 2px dashed var(--gc-glass-border);
  border-radius: 12px;
  cursor: pointer;
  color: var(--gc-muted-foreground);
  transition:
    border-color var(--gc-transition-fast),
    background var(--gc-transition-fast),
    transform var(--gc-transition-fast);
}

.bg-upload-zone:hover {
  border-color: var(--gc-border);
  background: var(--gc-glass-bg);
}

.bg-upload-zone.drag-active {
  border-color: var(--gc-accent);
  background: color-mix(in oklch, var(--gc-accent) 6%, transparent);
  transform: scale(1.02);
}

.bg-upload-text {
  font-size: 12px;
  font-weight: 500;
}

.bg-upload-name {
  font-size: 11px;
  color: var(--gc-accent);
  margin: 0;
}

.bg-upload-error {
  font-size: 11px;
  color: var(--gc-destructive, #e0556a);
  margin: 0;
}

/* ── Fit mode ── */
.bg-mode-row {
  display: flex;
  gap: 6px;
}

.bg-mode-chip {
  flex: 1;
  padding: 7px 10px;
  border: 1px solid var(--gc-glass-border);
  border-radius: 8px;
  background: var(--gc-glass-bg);
  color: var(--gc-muted-foreground);
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  font-family: inherit;
  transition:
    border-color var(--gc-transition-fast),
    background var(--gc-transition-fast),
    color var(--gc-transition-fast);
}

.bg-mode-chip:hover {
  border-color: var(--gc-accent);
}

.bg-mode-chip.active {
  border-color: var(--gc-accent);
  background: var(--gc-accent-bg);
  color: var(--gc-accent);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--gc-accent) 15%, transparent);
}

/* ── Color picker ── */
.bg-color-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.bg-color-input {
  width: 36px;
  height: 36px;
  border: 1px solid var(--gc-glass-border);
  border-radius: 8px;
  padding: 3px;
  cursor: pointer;
  background: transparent;
}

.bg-color-input::-webkit-color-swatch-wrapper {
  padding: 0;
}

.bg-color-input::-webkit-color-swatch {
  border-radius: 5px;
  border: none;
}

.bg-color-input::-moz-color-swatch {
  border-radius: 5px;
  border: none;
}

.bg-color-value {
  font-size: 12px;
  font-family: 'SF Mono', 'JetBrains Mono', monospace;
  color: var(--gc-muted-foreground);
}

/* ── Clear ── */
.bg-clear {
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

.bg-clear:hover {
  border-color: var(--gc-accent);
  color: var(--gc-accent);
  background: var(--gc-interactive-hover-bg);
}
</style>
