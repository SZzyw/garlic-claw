export type ClickFXType = 'none' | 'aurora-pulse' | 'ripple' | 'sakura-ripple' | 'glass-ripple' | 'shockwave'

export interface ClickFXConfig {
  intensity: number // 0-100
  particles: number // 0-100
  speed: number // 0-100
}

export const DEFAULT_CONFIG: ClickFXConfig = {
  intensity: 50,
  particles: 50,
  speed: 50,
}
