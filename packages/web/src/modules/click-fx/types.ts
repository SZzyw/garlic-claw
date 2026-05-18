export type ClickFXType = 'none' | 'firework' | 'ripple' | 'sakura-burst'

export interface ClickFXConfig {
  intensity: number // 0-100
  particles: number // 0-100
  speed: number // 0-100
}

export interface ClickEvent {
  type: ClickFXType
  x: number
  y: number
  config?: Partial<ClickFXConfig>
}

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number // 0-1, 1 = born, 0 = dead
  maxLife: number // ms
  born: number // timestamp
  hue: number
  saturation: number
  lightness: number
  size: number
}

export interface Burst {
  type: ClickFXType
  particles: Particle[]
  born: number
  x: number
  y: number
  update(now: number): void
  render(ctx: CanvasRenderingContext2D): void
  isAlive(now: number): boolean
}
