/**
 * ClickFxRenderer — owns ALL canvas, rAF, and DOM lifecycle.
 *
 * This is the ONLY module in ClickFX that:
 *   - Creates/destroys <canvas> elements
 *   - Calls requestAnimationFrame / cancelAnimationFrame
 *   - Accesses CanvasRenderingContext2D
 *   - Mounts/removes elements from the DOM
 *
 * Idle auto-release: when eventQueue + bursts are empty for 1000ms,
 * the renderer stops and removes the canvas.
 *
 * Visibility: on hidden (tab switch / lock screen), sleeps immediately.
 * On visible, wakes if events are pending.
 *
 * DPR: capped at 2 to prevent GPU overcommit on 3x/4x mobile displays.
 * Burst: hard lifetime cap at 2000ms.
 */
import type { ClickEvent, Burst, Particle } from './types'

const IDLE_TIMEOUT = 1000
const BURST_MAX_AGE = 2000
const MAX_DPR = 2

// ── Burst Implementations ──

function createFireworkBurst(event: ClickEvent): Burst {
  const intensity = event.config?.intensity ?? 50
  const particleCount = event.config?.particles ?? 50
  const speedMult = event.config?.speed ?? 50
  const count = Math.round((particleCount / 100) * 40)
  const parts: Particle[] = []
  const now = performance.now()
  const hue = (event.x * 0.3 + event.y * 0.2) % 360

  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.3
    const v = (80 + Math.random() * 200) * (speedMult / 100)
    const life = 800 + Math.random() * 700
    parts.push({
      x: event.x,
      y: event.y,
      vx: Math.cos(angle) * v,
      vy: Math.sin(angle) * v,
      life: 1,
      maxLife: life,
      born: now,
      hue: hue + (Math.random() - 0.5) * 40,
      saturation: 0.5 + Math.random() * 0.4,
      lightness: 55 + Math.random() * 25,
      size: 2 + Math.random() * 3,
    })
  }

  return {
    type: 'firework',
    particles: parts,
    born: now,
    x: event.x,
    y: event.y,
    update(t: number): void {
      for (const p of this.particles) {
        const elapsed = (t - p.born) / 1000
        p.x += p.vx * 0.016
        p.y += p.vy * 0.016 + 80 * elapsed * 0.016
        p.vx *= 0.98
        p.vy *= 0.98
        p.life = 1 - (t - p.born) / p.maxLife
        p.size *= 0.995
      }
    },
    render(ctx: CanvasRenderingContext2D): void {
      for (const p of this.particles) {
        if (p.life <= 0) continue
        ctx.globalAlpha = p.life * (intensity / 100)
        ctx.fillStyle = `oklch(${p.lightness}% ${p.saturation} ${p.hue})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, Math.max(0.5, p.size), 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
    },
    isAlive(t: number): boolean {
      return t - this.born < BURST_MAX_AGE && this.particles.some((p) => p.life > 0)
    },
  }
}

function createRippleBurst(event: ClickEvent): Burst {
  const intensity = event.config?.intensity ?? 50
  const hue = (event.x * 0.2 + event.y * 0.3) % 360
  const maxRadius = 80 + (intensity / 100) * 120

  return {
    type: 'ripple',
    particles: [],
    born: performance.now(),
    x: event.x,
    y: event.y,
    update(_t: number): void { /* ripple uses age-based render */ },
    render(ctx: CanvasRenderingContext2D): void {
      const age = performance.now() - this.born
      if (age > 1000) return

      const progress = age / 1000
      const radius = progress * maxRadius
      const alpha = (1 - progress) * (intensity / 100) * 0.6

      ctx.globalAlpha = alpha
      ctx.strokeStyle = `oklch(70% 0.15 ${hue})`
      ctx.lineWidth = 2 * (1 - progress * 0.7)
      ctx.beginPath()
      ctx.arc(this.x, this.y, radius, 0, Math.PI * 2)
      ctx.stroke()
      ctx.globalAlpha = 1
    },
    isAlive(t: number): boolean {
      return t - this.born < 1000
    },
  }
}

function createSakuraBurstBurst(event: ClickEvent): Burst {
  const intensity = event.config?.intensity ?? 50
  const particleCount = event.config?.particles ?? 50
  const speedMult = event.config?.speed ?? 50
  const count = Math.round((particleCount / 100) * 24)
  const parts: Particle[] = []
  const now = performance.now()

  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.6
    const v = (60 + Math.random() * 180) * (speedMult / 100)
    const life = 1200 + Math.random() * 800
    const hueShift = (Math.random() - 0.5) * 30
    parts.push({
      x: event.x,
      y: event.y,
      vx: Math.cos(angle) * v,
      vy: Math.sin(angle) * v - 40,
      life: 1,
      maxLife: life,
      born: now,
      hue: 340 + hueShift,
      saturation: 0.3 + Math.random() * 0.3,
      lightness: 65 + Math.random() * 20,
      size: 3 + Math.random() * 5,
    })
  }

  return {
    type: 'sakura-burst',
    particles: parts,
    born: now,
    x: event.x,
    y: event.y,
    update(t: number): void {
      for (const p of this.particles) {
        const elapsed = (t - p.born) / 1000
        p.x += p.vx * 0.016 + Math.sin(elapsed * 2 + p.born) * 0.5
        p.y += p.vy * 0.016 + 30 * 0.016
        p.vx *= 0.995
        p.vy *= 0.995
        p.life = 1 - (t - p.born) / p.maxLife
      }
    },
    render(ctx: CanvasRenderingContext2D): void {
      for (const p of this.particles) {
        if (p.life <= 0) continue
        ctx.globalAlpha = p.life * (intensity / 100) * 0.8
        ctx.fillStyle = `oklch(${p.lightness}% ${p.saturation} ${p.hue})`
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.life * 3)
        ctx.beginPath()
        ctx.ellipse(0, 0, p.size, p.size * 0.4, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }
      ctx.globalAlpha = 1
    },
    isAlive(t: number): boolean {
      return t - this.born < BURST_MAX_AGE && this.particles.some((p) => p.life > 0)
    },
  }
}

// ── Renderer ──

export class ClickFxRenderer {
  private canvas: HTMLCanvasElement | null = null
  private ctx: CanvasRenderingContext2D | null = null
  private bursts: Burst[] = []
  private rafId: number | null = null
  private lastActivity = 0
  private running = false
  private readonly eventQueue: ClickEvent[]
  private visHandler: (() => void) | null = null

  constructor(eventQueue: ClickEvent[]) {
    this.eventQueue = eventQueue
    this.bindVisibility()
  }

  /** Wake the renderer. Called by clickFx.emit(). */
  wake(): void {
    if (document.hidden) return
    this.lastActivity = performance.now()
    if (!this.running) {
      this.createCanvas()
      this.running = true
      this.rafId = requestAnimationFrame(this.loop)
    }
  }

  // ── Private ──

  private loop = (now: number): void => {
    // 1. Consume event queue → spawn bursts
    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift()!
      this.bursts.push(this.createBurst(event))
      this.lastActivity = now
    }

    // 2. Update and render
    if (this.ctx) {
      this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)

      this.bursts = this.bursts.filter((burst) => {
        if (!burst.isAlive(now)) return false
        burst.update(now)
        burst.render(this.ctx!)
        return true
      })
    }

    // Update debug
    const dbg = (window as any).__GC_DEBUG__
    if (dbg) dbg.activeBursts = this.bursts.length

    // 3. Idle check: no events + no bursts + timeout → sleep
    if (this.eventQueue.length === 0 && this.bursts.length === 0) {
      if (now - this.lastActivity > IDLE_TIMEOUT) {
        this.sleep()
        return
      }
    }

    this.rafId = requestAnimationFrame(this.loop)
  }

  private createBurst(event: ClickEvent): Burst {
    switch (event.type) {
      case 'firework':
        return createFireworkBurst(event)
      case 'ripple':
        return createRippleBurst(event)
      case 'sakura-burst':
        return createSakuraBurstBurst(event)
      default:
        return createFireworkBurst(event)
    }
  }

  private createCanvas(): void {
    if (this.canvas) return

    const canvas = document.createElement('canvas')
    canvas.style.cssText =
      'position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:2500;'
    document.body.appendChild(canvas)

    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
    canvas.width = window.innerWidth * dpr
    canvas.height = window.innerHeight * dpr

    const ctx = canvas.getContext('2d', { alpha: true })!
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    this.canvas = canvas
    this.ctx = ctx
  }

  private destroyCanvas(): void {
    if (this.canvas) {
      this.canvas.remove()
      this.canvas = null
      this.ctx = null
    }
    const dbg = (window as any).__GC_DEBUG__
    if (dbg) dbg.activeBursts = 0
  }

  private sleep(): void {
    this.running = false
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
    this.destroyCanvas()
  }

  // ── Visibility lifecycle ──

  private bindVisibility(): void {
    this.visHandler = () => {
      if (document.hidden) {
        // Tab hidden → sleep immediately, release GPU resources
        this.sleep()
      }
      // On visible: renderer stays asleep until next wake() call from emit()
    }
    document.addEventListener('visibilitychange', this.visHandler)
  }

  /** Release all resources. Call when module is fully disposed. */
  dispose(): void {
    this.sleep()
    if (this.visHandler) {
      document.removeEventListener('visibilitychange', this.visHandler)
      this.visHandler = null
    }
  }
}
