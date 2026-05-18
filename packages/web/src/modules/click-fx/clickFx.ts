/**
 * ClickFX — event-driven interaction effects module.
 *
 * This module owns configuration state and the event queue.
 * It does NOT touch DOM, canvas, or requestAnimationFrame.
 * All rendering is delegated to ClickFxRenderer.
 *
 * No Pinia store. No localStorage. State resets on page refresh.
 */
import type { ClickFXType, ClickFXConfig, ClickEvent } from './types'

// ── Module-level state (NOT a Pinia store, NOT persisted) ──

let enabled = false
let currentType: ClickFXType = 'none'
let config: ClickFXConfig = { intensity: 50, particles: 50, speed: 50 }
const eventQueue: ClickEvent[] = []
let renderer: import('./ClickFxRenderer').ClickFxRenderer | null = null

// ── Public API ──

export const clickFx = {
  setEnabled(v: boolean): void {
    enabled = v
  },

  setType(t: ClickFXType): void {
    currentType = t
  },

  setConfig(c: Partial<ClickFXConfig>): void {
    Object.assign(config, c)
  },

  /**
   * Emit a click event into the queue.
   *
   * Flow: emit → eventQueue.push → renderer.wake → spawn burst → render
   * Events are frozen (immutable). Queue is push-only.
   * No DOM access. No rAF call. No canvas reference.
   */
  emit(event: ClickEvent): void {
    if (!enabled || currentType === 'none') return

    const effectiveType = event.type ?? currentType
    if (effectiveType === 'none') return

    const frozen: ClickEvent = Object.freeze({
      type: effectiveType,
      x: event.x,
      y: event.y,
      config: Object.freeze({ ...config, ...event.config }),
    })
    eventQueue.push(frozen)

    if (renderer) {
      renderer.wake()
    } else {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      import('./ClickFxRenderer').then((m) => {
        renderer = new m.ClickFxRenderer(eventQueue)
        renderer.wake()
      })
    }
  },

  /** Convenience: emit using current type + config at (x, y). */
  trigger(x: number, y: number): void {
    this.emit({ type: currentType, x, y })
  },
}
