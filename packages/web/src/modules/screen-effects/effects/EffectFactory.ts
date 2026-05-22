import type { ScreenEffect, EffectType } from './types'
import { GlowParticlesEffect } from './GlowParticlesEffect'
import { FloatingDustEffect } from './FloatingDustEffect'
import { AuroraEffect } from './AuroraEffect'
import { MeteorEffect } from './MeteorEffect'
import { StarfieldEffect } from './StarfieldEffect'

export function createEffect(type: EffectType): ScreenEffect {
  switch (type) {
    case 'glowParticles': return new GlowParticlesEffect()
    case 'floatingDust': return new FloatingDustEffect()
    case 'aurora': return new AuroraEffect()
    case 'meteor': return new MeteorEffect()
    case 'starfield': return new StarfieldEffect()
    default: throw new Error(`Unknown effect type: ${type}`)
  }
}
