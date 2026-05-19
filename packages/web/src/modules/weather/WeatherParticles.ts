/**
 * WeatherParticles — Self-contained canvas particle engine.
 *
 * All motion physics computed internally per-frame.
 * No external dependencies beyond shared types and quality/theme helpers.
 */

import type { WeatherType } from '@/shared/atmosphere/weather'
import type { DepthLayer, ThemeColors } from './particles/types'
import { sampleThemeColors, alphaColor } from './particles/themeColors'
import { getQualityConfig, LAYER_CONFIGS } from './particles/quality'
import type { QualityConfig } from './particles/types'
import type { LayerConfig } from './particles/types'
import { Z_LAYERS } from './particles/types'

// ═══════════════════════════════════════════════════════════════
// Particle types
// ═══════════════════════════════════════════════════════════════

interface SnowParticle {
  x: number; y: number
  layer: DepthLayer
  radius: number
  rotation: number; rotSpeed: number
  swayPhase: number; swayAmp: number
  speed: number
  opacity: number
  kind: 'crystal' | 'fuzzy' | 'distant'
  crystalArms: number
}

interface RainParticle {
  x: number; y: number
  layer: DepthLayer
  length: number
  speed: number
  opacity: number
  trailLength: number
}

interface SakuraParticle {
  x: number; y: number
  layer: DepthLayer
  size: number
  rotation: number; rotSpeed: number
  swayPhase: number; swayAmp: number
  speed: number
  opacity: number
  petalHue: number
}

// ═══════════════════════════════════════════════════════════════
// Internal wind/forces — self-contained, no external modules
// ═══════════════════════════════════════════════════════════════

interface WindFrame {
  dt: number
  time: number
  windX: number
  windY: number
  turbulence: number
  breathing: number
}

/** Base wind strength per weather type (0–1). Matches WEATHER_PRESETS.baseWind. */
const BASE_WIND: Record<string, number> = {
  rain: 0.5, snow: 0.3, fog: 0.15, storm: 0.8,
  night: 0.1, sunset: 0.2, sakura: 0.35, dust: 0.25,
  aurora: 0.1, clear: 0,
}

function computeWind(weather: WeatherType, intensity: number, time: number, dt: number): WindFrame {
  const baseWind = BASE_WIND[weather] ?? 0
  const windStrength = baseWind * intensity

  // Mood-driven turbulence amplitude
  const isStormy = weather === 'storm'
  const isGentle = weather === 'sakura' || weather === 'snow'
  const turbAmp = isStormy ? 0.8 : isGentle ? 0.12 : 0.2

  // Multi-layer sine stack for non-periodic fluctuation
  const turbulence = turbAmp * intensity * (
    Math.sin(time * 1.7) * 0.6 +
    Math.sin(time * 3.1 + 1.2) * 0.3 +
    Math.sin(time * 5.3 + 2.8) * 0.1
  )

  // Ultra-low frequency breathing (~8s cycle)
  const breathing = Math.sin(time * 0.785) * intensity

  // Wind: base + gust from turbulence
  const gustBoost = turbulence * 200
  const windX = windStrength * 100 + gustBoost
  const windY = turbulence * 15

  return { dt, time, windX, windY, turbulence: Math.abs(turbulence), breathing }
}

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════

const SNOW_BASE_COUNT = 80
const RAIN_BASE_COUNT = 120
const SAKURA_BASE_COUNT = 40

// ═══════════════════════════════════════════════════════════════
// WeatherParticles Engine
// ═══════════════════════════════════════════════════════════════

export class WeatherParticles {
  // Canvases
  private bgCanvas: HTMLCanvasElement | null = null
  private bgCtx: CanvasRenderingContext2D | null = null
  private fgCanvas: HTMLCanvasElement | null = null
  private fgCtx: CanvasRenderingContext2D | null = null

  // State
  private rafId: number | null = null
  private running = false
  private paused = false
  private lastTime = 0
  private weatherType: WeatherType = 'clear'
  private intensity = 0.5

  // Particles
  private snowParticles: SnowParticle[] = []
  private rainParticles: RainParticle[] = []
  private sakuraParticles: SakuraParticle[] = []

  // Storm
  private lightningUntil = 0
  private lightningAlpha = 0
  private lightningBgAlpha = 0

  // Wind — computed per-frame
  private wind: WindFrame = { dt: 0, time: 0, windX: 0, windY: 0, turbulence: 0, breathing: 0 }

  // Quality & theme
  private quality: QualityConfig = getQualityConfig()
  private theme: ThemeColors = sampleThemeColors()

  // Frame counter for periodic theme re-sampling
  private frameCount = 0

  // ═══ Public API ═══

  start(type: WeatherType, intensity = 0.5): void {
    this.weatherType = type
    this.intensity = intensity
    this.quality = getQualityConfig()
    this.theme = sampleThemeColors()

    if (!this.running) {
      this.createCanvases()
      this.running = true
      this.paused = false
      this.lastTime = performance.now()
      this.bindVisibility()
      this.rafId = requestAnimationFrame(this.loop)
      this.updateDebugRAF(1)
    }
  }

  updateIntensity(v: number): void {
    this.intensity = Math.max(0, Math.min(1, v))
  }

  pause(): void {
    if (!this.running || this.paused) return
    this.paused = true
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
      this.updateDebugRAF(-1)
    }
  }

  resume(): void {
    if (!this.running || !this.paused) return
    this.paused = false
    this.lastTime = performance.now()
    this.rafId = requestAnimationFrame(this.loop)
    this.updateDebugRAF(1)
  }

  stop(): void {
    this.running = false
    this.paused = false
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
      this.updateDebugRAF(-1)
    }
    this.unbindVisibility()
    this.destroyCanvases()
    this.snowParticles = []
    this.rainParticles = []
    this.sakuraParticles = []
  }

  dispose(): void {
    this.stop()
  }

  // ═══ Canvas Lifecycle ═══

  private createCanvases(): void {
    if (!this.bgCanvas) {
      const bg = document.createElement('canvas')
      bg.setAttribute('data-weather-bg', 'true')
      bg.style.cssText = `position:fixed;inset:0;width:100%;height:100%;z-index:${Z_LAYERS.weatherBackground};pointer-events:none;`
      document.body.appendChild(bg)
      this.bgCanvas = bg
      this.bgCtx = bg.getContext('2d')
    }

    if (!this.fgCanvas) {
      const fg = document.createElement('canvas')
      fg.setAttribute('data-weather-fg', 'true')
      fg.style.cssText = `position:fixed;inset:0;width:100%;height:100%;z-index:${Z_LAYERS.weatherForeground};pointer-events:none;`
      document.body.appendChild(fg)
      this.fgCanvas = fg
      this.fgCtx = fg.getContext('2d')
    }

    this.resizeCanvases()
  }

  private destroyCanvases(): void {
    if (this.bgCanvas) { this.bgCanvas.remove(); this.bgCanvas = null; this.bgCtx = null }
    if (this.fgCanvas) { this.fgCanvas.remove(); this.fgCanvas = null; this.fgCtx = null }
  }

  private resizeCanvases(): void {
    const w = window.innerWidth
    const h = window.innerHeight
    for (const c of [this.bgCanvas, this.fgCanvas]) {
      if (c && (c.width !== w || c.height !== h)) {
        c.width = w; c.height = h
      }
    }
  }

  // ═══ Visibility ═══

  private onVisibility = (): void => {
    document.hidden ? this.pause() : this.resume()
  }

  private bindVisibility(): void {
    document.addEventListener('visibilitychange', this.onVisibility)
  }

  private unbindVisibility(): void {
    document.removeEventListener('visibilitychange', this.onVisibility)
  }

  // ═══ Main Loop ═══

  private loop = (now: number): void => {
    if (!this.running || this.paused) return
    const dt = Math.min(now - this.lastTime, 50) / 1000
    this.lastTime = now
    this.frameCount++

    // Compute wind/forces each frame
    this.wind = computeWind(this.weatherType, this.intensity, now / 1000, dt)

    // Periodic theme re-sample (every 120 frames)
    if (this.frameCount % 120 === 0) {
      this.theme = sampleThemeColors()
    }

    this.resizeCanvases()

    const w = this.bgCanvas!.width
    const h = this.bgCanvas!.height

    this.bgCtx!.clearRect(0, 0, w, h)
    this.fgCtx!.clearRect(0, 0, w, h)

    switch (this.weatherType) {
      case 'snow':
        this.tickSnow(w, h, dt)
        break
      case 'rain':
        this.tickRain(w, h, dt)
        break
      case 'storm':
        this.tickRain(w, h, dt)
        this.tickLightning(now, w, h)
        break
      case 'sakura':
        this.tickSakura(w, h, dt)
        break
    }

    this.rafId = requestAnimationFrame(this.loop)
  }

  // ═══ Per-particle motion helpers ═══

  /** Wind drift for a particle at a given depth layer. */
  private windDrift(layer: LayerConfig): number {
    return this.wind.windX * layer.windInfluence
  }

  /** Turbulence jitter for a particle at a given depth layer. */
  private turbJitter(layer: LayerConfig): number {
    return this.wind.turbulence * layer.windInfluence * 20 * (Math.random() - 0.5)
  }

  // ═══════════════════════════════════════════════════════════
  // SNOW — Crystals + Fuzzy + Distant
  // ═══════════════════════════════════════════════════════════

  private tickSnow(w: number, h: number, dt: number): void {
    const count = Math.floor(SNOW_BASE_COUNT * this.quality.particleMultiplier * this.intensity)
    const wf = this.wind

    // Spawn
    while (this.snowParticles.length < count) {
      this.snowParticles.push(this.spawnSnowflake(w, h))
    }
    if (this.snowParticles.length > count) {
      this.snowParticles.length = count
    }

    // Update + render
    for (const p of this.snowParticles) {
      const layer = LAYER_CONFIGS[p.layer]

      // Falling: gravity + wind-vertical + breathing modulation
      const breatheMod = 1 + wf.breathing * 0.3
      p.y += p.speed * layer.speed * dt * 60 * breatheMod + wf.windY * layer.windInfluence * dt
      p.rotation += p.rotSpeed * dt
      p.swayPhase += dt * (1.5 + layer.speed)

      // Horizontal: wind drift + sway + turbulence jitter
      p.x += this.windDrift(layer) * dt
           + Math.sin(p.swayPhase) * p.swayAmp * dt
           + this.turbJitter(layer) * dt

      // Recycle off-screen
      if (p.y > h + 30 || p.x < -40 || p.x > w + 40) {
        Object.assign(p, this.spawnSnowflake(w, h))
        p.layer = p.layer
      }

      this.renderSnowflake(p, layer)
    }
  }

  private spawnSnowflake(w: number, h: number): SnowParticle {
    const layers = this.quality.depthLayers >= 3
      ? ['background', 'midground', 'foreground'] as DepthLayer[]
      : this.quality.depthLayers === 2
        ? ['background', 'foreground'] as DepthLayer[]
        : ['midground'] as DepthLayer[]

    const layer = layers[Math.floor(Math.random() * layers.length)]
    const layerCfg = LAYER_CONFIGS[layer]
    const kindRoll = Math.random()
    const kind: SnowParticle['kind'] = this.quality.crystalSnow
      ? (kindRoll < 0.5 ? 'crystal' : kindRoll < 0.8 ? 'fuzzy' : 'distant')
      : (kindRoll < 0.5 ? 'fuzzy' : 'distant')

    const baseRadius = kind === 'crystal' ? (3 + Math.random() * 5)
      : kind === 'fuzzy' ? (2 + Math.random() * 6)
      : (1 + Math.random() * 2)

    return {
      x: Math.random() * (w + 50) - 25,
      y: Math.random() * -h,
      layer,
      radius: baseRadius * layerCfg.size,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 2,
      swayPhase: Math.random() * Math.PI * 2,
      swayAmp: (15 + Math.random() * 35) * layerCfg.windInfluence,
      speed: (10 + Math.random() * 30) * layerCfg.speed,
      opacity: (0.25 + Math.random() * 0.5) * layerCfg.opacity,
      kind,
      crystalArms: Math.random() < 0.3 ? 8 : 6,
    }
  }

  private renderSnowflake(p: SnowParticle, layer: typeof LAYER_CONFIGS['midground']): void {
    const ctx = (p.layer === 'foreground' ? this.fgCtx : this.bgCtx)!
    const alpha = p.opacity

    if (p.layer === 'background' && this.quality.blurPasses > 0) {
      ctx.filter = `blur(${layer.blur}px)`
    }

    if (p.kind === 'distant') {
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
      ctx.fillStyle = alphaColor(this.theme.snowFill, alpha * 0.6)
      ctx.fill()
    } else if (p.kind === 'fuzzy') {
      for (let i = 0; i < 4; i++) {
        const ox = (Math.sin(i * 2.1) * p.radius * 0.5)
        const oy = (Math.cos(i * 2.1) * p.radius * 0.5)
        ctx.beginPath()
        ctx.arc(p.x + ox, p.y + oy, p.radius * 0.55, 0, Math.PI * 2)
        ctx.fillStyle = alphaColor(this.theme.snowFill, alpha * 0.35)
        ctx.fill()
      }
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.radius * 0.7, 0, Math.PI * 2)
      ctx.fillStyle = alphaColor(this.theme.snowHighlight, alpha * 0.2)
      ctx.fill()
    } else if (p.kind === 'crystal') {
      this.drawCrystal(ctx, p.x, p.y, p.radius, p.rotation, p.crystalArms, alpha)
    }

    ctx.filter = 'none'
  }

  private drawCrystal(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, r: number, rot: number, arms: number, alpha: number,
  ): void {
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(rot)

    const angleStep = (Math.PI * 2) / arms

    for (let i = 0; i < arms; i++) {
      const a = i * angleStep
      const cos = Math.cos(a)
      const sin = Math.sin(a)

      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(cos * r, sin * r)
      ctx.strokeStyle = alphaColor(this.theme.snowStroke, alpha * 0.7)
      ctx.lineWidth = Math.max(0.5, r * 0.15)
      ctx.stroke()

      const bx = cos * r * 0.6
      const by = sin * r * 0.6
      const branchLen = r * 0.25
      for (const side of [-1, 1]) {
        const ba = a + side * Math.PI / 3
        ctx.beginPath()
        ctx.moveTo(bx, by)
        ctx.lineTo(bx + Math.cos(ba) * branchLen, by + Math.sin(ba) * branchLen)
        ctx.strokeStyle = alphaColor(this.theme.snowStroke, alpha * 0.5)
        ctx.lineWidth = Math.max(0.3, r * 0.08)
        ctx.stroke()
      }

      if (r > 3) {
        const ix = cos * r * 0.3
        const iy = sin * r * 0.3
        ctx.beginPath()
        ctx.arc(ix, iy, r * 0.12, 0, Math.PI * 2)
        ctx.fillStyle = alphaColor(this.theme.snowHighlight, alpha * 0.6)
        ctx.fill()
      }
    }

    ctx.beginPath()
    ctx.arc(0, 0, r * 0.18, 0, Math.PI * 2)
    ctx.fillStyle = alphaColor(this.theme.snowHighlight, alpha * 0.8)
    ctx.fill()

    ctx.beginPath()
    ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2)
    ctx.strokeStyle = alphaColor(this.theme.snowStroke, alpha * 0.3)
    ctx.lineWidth = 0.5
    ctx.stroke()

    ctx.restore()
  }

  // ═══════════════════════════════════════════════════════════
  // RAIN — Gradient streaks + specular + wind shear
  // ═══════════════════════════════════════════════════════════

  private tickRain(w: number, h: number, dt: number): void {
    const factor = this.weatherType === 'storm' ? 1.6 : 1
    const count = Math.floor(RAIN_BASE_COUNT * factor * this.quality.particleMultiplier * this.intensity)

    while (this.rainParticles.length < count) {
      this.rainParticles.push(this.spawnRaindrop(w, h))
    }
    if (this.rainParticles.length > count) {
      this.rainParticles.length = count
    }

    for (const p of this.rainParticles) {
      const layer = LAYER_CONFIGS[p.layer]
      const drift = this.windDrift(layer)

      p.y += p.speed * layer.speed * dt
      p.x += drift * dt + this.turbJitter(layer) * dt

      if (p.y > h + 20 || p.x < -20 || p.x > w + 20) {
        Object.assign(p, this.spawnRaindrop(w, h))
      }

      this.renderRaindrop(p, layer, drift)
    }
  }

  private spawnRaindrop(w: number, h: number): RainParticle {
    const layers = this.quality.depthLayers >= 2
      ? ['background', 'foreground'] as DepthLayer[]
      : ['midground'] as DepthLayer[]
    const layer = layers[Math.floor(Math.random() * layers.length)]
    const cfg = LAYER_CONFIGS[layer]

    return {
      x: Math.random() * (w + 80) - 40,
      y: Math.random() * -h * 0.6,
      layer,
      length: (10 + Math.random() * 22) * cfg.size,
      speed: (350 + Math.random() * 550) * cfg.speed,
      opacity: (0.12 + Math.random() * 0.28) * cfg.opacity,
      trailLength: 0.3 + Math.random() * 0.5,
    }
  }

  private renderRaindrop(p: RainParticle, layer: typeof LAYER_CONFIGS['midground'], windDrift: number): void {
    const ctx = (p.layer === 'foreground' ? this.fgCtx : this.bgCtx)!

    if (p.layer === 'background' && this.quality.blurPasses > 0) {
      ctx.filter = `blur(${layer.blur * 0.5}px)`
    }

    const angle = Math.atan2(p.speed, windDrift)
    const len = p.length
    const dx = Math.sin(angle) * len
    const dy = Math.cos(angle) * len

    if (this.quality.gradientRain) {
      const headX = p.x
      const headY = p.y
      const tailX = p.x - dx * p.trailLength
      const tailY = p.y - dy * p.trailLength

      const grad = ctx.createLinearGradient(tailX, tailY, headX, headY)
      grad.addColorStop(0, alphaColor(this.theme.rainFill, 0))
      grad.addColorStop(0.6, alphaColor(this.theme.rainFill, p.opacity * 0.5))
      grad.addColorStop(1, alphaColor(this.theme.rainFill, p.opacity))

      ctx.beginPath()
      ctx.moveTo(tailX, tailY)
      ctx.lineTo(headX, headY)
      ctx.strokeStyle = grad
      ctx.lineWidth = 1 + (p.layer === 'foreground' ? 0.5 : 0)
      ctx.stroke()

      if (this.quality.specularRain && p.layer === 'foreground') {
        ctx.beginPath()
        ctx.arc(headX, headY, 1.5, 0, Math.PI * 2)
        ctx.fillStyle = alphaColor(this.theme.rainHighlight, p.opacity * 0.6)
        ctx.fill()
      }
    } else {
      ctx.beginPath()
      ctx.moveTo(p.x - dx * 0.3, p.y - dy * 0.3)
      ctx.lineTo(p.x + dx * 0.3, p.y + dy * 0.3)
      ctx.strokeStyle = alphaColor(this.theme.rainFill, p.opacity)
      ctx.lineWidth = 1
      ctx.stroke()
    }

    ctx.filter = 'none'
  }

  // ═══ Lightning (storm) ═══

  private tickLightning(now: number, w: number, h: number): void {
    if (now > this.lightningUntil) {
      this.lightningAlpha = Math.max(0, this.lightningAlpha - 0.02)
      this.lightningBgAlpha = Math.max(0, this.lightningBgAlpha - 0.015)

      if (Math.random() < 0.004) {
        this.lightningAlpha = 0.08 + Math.random() * 0.18
        this.lightningBgAlpha = 0.04 + Math.random() * 0.08
        this.lightningUntil = now + 60 + Math.random() * 150
      }
    }

    if (this.lightningAlpha > 0.001 || this.lightningBgAlpha > 0.001) {
      this.fgCtx!.fillStyle = alphaColor(this.theme.lightningColor, this.lightningBgAlpha)
      this.fgCtx!.fillRect(0, 0, w, h)

      if (this.lightningAlpha > 0.01) {
        const lx = w * (0.2 + Math.random() * 0.6)
        const grad = this.fgCtx!.createRadialGradient(lx, h * 0.1, 0, lx, h * 0.3, h * 0.5)
        grad.addColorStop(0, alphaColor(this.theme.lightningColor, this.lightningAlpha))
        grad.addColorStop(1, 'transparent')
        this.fgCtx!.fillStyle = grad
        this.fgCtx!.fillRect(0, 0, w, h)
      }
    }
  }

  // ═══════════════════════════════════════════════════════════
  // SAKURA — Petal particles with rotation + sway + dual-layer
  // ═══════════════════════════════════════════════════════════

  private tickSakura(w: number, h: number, dt: number): void {
    const count = Math.floor(SAKURA_BASE_COUNT * this.quality.particleMultiplier * this.intensity)
    const wf = this.wind

    while (this.sakuraParticles.length < count) {
      this.sakuraParticles.push(this.spawnPetal(w, h))
    }
    if (this.sakuraParticles.length > count) {
      this.sakuraParticles.length = count
    }

    for (const p of this.sakuraParticles) {
      const layer = LAYER_CONFIGS[p.layer]

      // Falling: gentle descent with breathing
      const breatheMod = 1 + wf.breathing * 0.25
      p.y += p.speed * layer.speed * dt * 40 * breatheMod

      // Sway: sinusoidal horizontal oscillation
      p.swayPhase += dt * (1.0 + layer.speed * 0.5)

      // Horizontal: sway + wind drift + light turbulence
      p.x += Math.sin(p.swayPhase) * p.swayAmp * dt
           + this.windDrift(layer) * dt
           + this.turbJitter(layer) * dt * 0.4

      // Rotation
      p.rotation += p.rotSpeed * dt

      // Recycle
      if (p.y > h + 40 || p.x < -50 || p.x > w + 50) {
        Object.assign(p, this.spawnPetal(w, h))
      }

      this.renderPetal(p, layer)
    }
  }

  private spawnPetal(w: number, h: number): SakuraParticle {
    const layers = this.quality.depthLayers >= 2
      ? ['background', 'foreground'] as DepthLayer[]
      : ['midground'] as DepthLayer[]
    const layer = layers[Math.floor(Math.random() * layers.length)]
    const cfg = LAYER_CONFIGS[layer]

    const hueShift = (Math.random() - 0.5) * 20

    return {
      x: Math.random() * (w + 60) - 30,
      y: Math.random() * -h * 0.5,
      layer,
      size: (8 + Math.random() * 16) * cfg.size,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 3,
      swayPhase: Math.random() * Math.PI * 2,
      swayAmp: (30 + Math.random() * 60) * cfg.windInfluence,
      speed: (4 + Math.random() * 12) * cfg.speed,
      opacity: (0.4 + Math.random() * 0.45) * cfg.opacity,
      petalHue: 340 + hueShift,
    }
  }

  private renderPetal(p: SakuraParticle, layer: typeof LAYER_CONFIGS['midground']): void {
    const ctx = (p.layer === 'foreground' ? this.fgCtx : this.bgCtx)!

    if (p.layer === 'background' && this.quality.blurPasses > 0) {
      ctx.filter = `blur(${layer.blur * 0.7}px)`
    }

    ctx.save()
    ctx.translate(p.x, p.y)
    ctx.rotate(p.rotation)

    const r = p.size
    const detail = this.quality.petalDetail
    const h = p.petalHue

    // Petal body — elongated ellipse with pointed tip
    ctx.beginPath()
    ctx.moveTo(0, -r * 0.9)
    ctx.bezierCurveTo(r * 0.5, -r * 0.5, r * 0.6, -r * 0.05, r * 0.35, r * 0.3)
    ctx.bezierCurveTo(r * 0.1, r * 0.45, -r * 0.1, r * 0.45, -r * 0.35, r * 0.3)
    ctx.bezierCurveTo(-r * 0.6, -r * 0.05, -r * 0.5, -r * 0.5, 0, -r * 0.9)
    ctx.closePath()

    const sat = 0.1 + Math.random() * 0.05
    const lum = this.theme.isDark ? 68 + Math.random() * 10 : 52 + Math.random() * 10
    ctx.fillStyle = `oklch(${lum}% ${sat.toFixed(3)} ${h} / ${p.opacity.toFixed(3)})`
    ctx.fill()

    // Vein lines
    if (detail >= 5) {
      ctx.beginPath()
      ctx.moveTo(0, -r * 0.85)
      ctx.lineTo(0, r * 0.35)
      ctx.strokeStyle = `oklch(${lum - 8}% ${(sat * 0.6).toFixed(3)} ${h} / ${(p.opacity * 0.4).toFixed(3)})`
      ctx.lineWidth = 0.5
      ctx.stroke()

      for (let side = -1; side <= 1; side += 2) {
        ctx.beginPath()
        ctx.moveTo(0, -r * 0.3)
        ctx.lineTo(side * r * 0.3, r * 0.15)
        ctx.strokeStyle = `oklch(${lum - 6}% ${(sat * 0.5).toFixed(3)} ${h} / ${(p.opacity * 0.3).toFixed(3)})`
        ctx.lineWidth = 0.4
        ctx.stroke()
      }
    }

    // Edge highlight
    ctx.beginPath()
    ctx.moveTo(0, -r * 0.85)
    ctx.bezierCurveTo(r * 0.45, -r * 0.45, r * 0.55, -r * 0.03, r * 0.3, r * 0.25)
    ctx.strokeStyle = `oklch(${lum + 8}% ${(sat * 0.3).toFixed(3)} ${h} / ${(p.opacity * 0.5).toFixed(3)})`
    ctx.lineWidth = 0.6
    ctx.stroke()

    ctx.restore()
    ctx.filter = 'none'
  }

  // ═══ Debug ═══

  private updateDebugRAF(delta: number): void {
    const gc = (window as any).__GC_DEBUG__
    if (gc) {
      gc.activeRAFCount = Math.max(0, (gc.activeRAFCount ?? 0) + delta)
    }
  }
}

/** Singleton instance. */
export const weatherParticles = new WeatherParticles()
