import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ClickFXType, ClickFXConfig } from './types'
import { DEFAULT_CONFIG } from './types'
import { emitBurst } from './emitter'

const STORAGE_KEY = 'garlic-claw:click-fx'

interface PersistedState {
  enabled: boolean
  type: ClickFXType
  config: ClickFXConfig
}

function readPersisted(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { enabled: false, type: 'none', config: { ...DEFAULT_CONFIG } }
    const parsed = JSON.parse(raw)
    return {
      enabled: parsed.enabled ?? false,
      type: parsed.type ?? 'none',
      config: { ...DEFAULT_CONFIG, ...parsed.config },
    }
  } catch {
    return { enabled: false, type: 'none', config: { ...DEFAULT_CONFIG } }
  }
}

export const useClickFxStore = defineStore('clickFx', () => {
  const persisted = readPersisted()

  const enabled = ref(persisted.enabled)
  const type = ref<ClickFXType>(persisted.type)
  const config = ref<ClickFXConfig>(persisted.config)

  const hasActiveEffect = computed(() => enabled.value && type.value !== 'none')

  function persist(): void {
    const state: PersistedState = {
      enabled: enabled.value,
      type: type.value,
      config: { ...config.value },
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }

  function setEnabled(v: boolean): void {
    enabled.value = v
    persist()
  }

  function setType(t: ClickFXType): void {
    type.value = t
    persist()
  }

  function setConfig(c: Partial<ClickFXConfig>): void {
    config.value = { ...config.value, ...c }
    persist()
  }

  function resetAll(): void {
    enabled.value = false
    type.value = 'none'
    config.value = { ...DEFAULT_CONFIG }
    persist()
  }

  function trigger(x: number, y: number): void {
    if (!hasActiveEffect.value) return
    emitBurst(type.value, x, y, config.value)
  }

  function testFire(): void {
    const t = type.value
    if (t === 'none') return
    emitBurst(t, window.innerWidth / 2, window.innerHeight / 2, config.value)
  }

  return {
    enabled,
    type,
    config,
    hasActiveEffect,
    setEnabled,
    setType,
    setConfig,
    resetAll,
    trigger,
    testFire,
  }
})
