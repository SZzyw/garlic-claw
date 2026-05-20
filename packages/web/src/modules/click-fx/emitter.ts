import { animate, utils, type JSAnimation } from 'animejs'
import type { ClickFXType, ClickFXConfig } from './types'

const Z_INDEX = '2500'

function createContainer(): HTMLDivElement {
  const el = document.createElement('div')
  el.style.cssText = `position:fixed;left:0;top:0;pointer-events:none;z-index:${Z_INDEX};`
  document.body.appendChild(el)
  return el
}

function place(
  container: HTMLDivElement,
  x: number,
  y: number,
  w: number,
  h: number,
  extraStyles: string[],
): HTMLDivElement {
  const el = document.createElement('div')
  el.style.cssText = [
    `position:absolute`,
    `left:${x - w / 2}px`,
    `top:${y - h / 2}px`,
    `width:${w}px`,
    `height:${h}px`,
    ...extraStyles,
  ].join(';')
  container.appendChild(el)
  return el
}

// ── Aurora Pulse: visionOS-style ambient glow ──

function emitAuroraPulse(x: number, y: number, cfg: ClickFXConfig): void {
  const container = createContainer()
  const intensity = cfg.intensity / 100
  const speedFactor = 0.6 + (cfg.speed / 250)
  const count = Math.round(2 + (cfg.particles / 100) * 3)
  const anims: JSAnimation[] = []

  // Soft luminous core
  const core = place(container, x, y, 16, 16, [
    `border-radius:50%`,
    `background:radial-gradient(circle, hsla(0,0%,100%,0.6) 0%, hsla(210,20%,90%,0.25) 35%, transparent 70%)`,
    `filter:blur(6px)`,
  ])
  anims.push(animate(core, {
    scale: [0.2, 2.5 * intensity, 3.5 * intensity],
    opacity: [0, 0.8, 0],
    duration: 1600 * speedFactor,
    ease: 'inOutSine',
  }))

  // Iridescent glow rings — subtle warm→cool shift
  const hues = [195, 210, 225, 185, 240]
  for (let i = 0; i < count; i++) {
    const hue = hues[i % hues.length] + utils.random(-8, 8)
    const size = 20 + i * 10
    const blur = 4 + i * 2

    const ring = place(container, x, y, size, size, [
      `border-radius:50%`,
      `background:radial-gradient(circle, hsla(${hue},25%,92%,0.25) 0%, hsla(${hue},20%,85%,0.08) 45%, transparent 72%)`,
      `border:1px solid hsla(${hue},18%,88%,0.3)`,
      `box-shadow:0 0 ${10 + i * 4}px hsla(${hue},20%,88%,0.2), 0 0 ${20 + i * 8}px hsla(${hue},12%,82%,0.08)`,
      `filter:blur(${blur}px)`,
      `opacity:0`,
    ])
    const anim = animate(ring, {
      scale: [0.2, 2 + i * 0.7, 3 + i * 1],
      opacity: [0, 0.4 - i * 0.07, 0],
      duration: (1100 + i * 200) * speedFactor,
      delay: i * 140,
      ease: 'outCubic',
    })
    anims.push(anim)
  }

  const last = anims[anims.length - 1]
  if (last) last.then(() => container.remove())
  else container.remove()
}

// ── Ripple: pond water ripple ──

function emitRipple(x: number, y: number, cfg: ClickFXConfig): void {
  const container = createContainer()
  const intensity = cfg.intensity / 100
  const speedFactor = 0.6 + (cfg.speed / 250)
  const rings = 5
  const baseDuration = 900 * speedFactor
  const maxScale = 1.8 + intensity * 3.5

  // Central droplet impact
  const impact = place(container, x, y, 6, 6, [
    `border-radius:50%`,
    `background:hsla(200,15%,95%,0.7)`,
    `box-shadow:0 0 4px hsla(200,10%,90%,0.5)`,
  ])
  animate(impact, {
    scale: [0, 1, 0],
    opacity: [0, 0.7, 0],
    duration: 250 * speedFactor,
    ease: 'outQuad',
  })

  for (let i = 0; i < rings; i++) {
    const hue = 200 + utils.random(-8, 8)
    const baseSize = 28 + i * 5
    const peak = maxScale - i * 0.4
    const el = place(container, x, y, baseSize, baseSize, [
      `border-radius:50%`,
      `border:${1.2 - i * 0.12}px solid hsla(${hue},12%,70%,${0.45 - i * 0.05})`,
      `box-shadow:0 0 ${3 + i}px hsla(${hue},8%,65%,0.08)`,
      `opacity:0`,
    ])

    animate(el, {
      scale: [0.1, peak, peak * 0.88, peak * 0.92],
      opacity: [0, 0.35 - i * 0.04, 0.12 - i * 0.02, 0],
      duration: baseDuration,
      delay: i * 70,
      ease: 'outCubic',
    })
  }

  setTimeout(() => container.remove(), baseDuration + rings * 70 + 120)
}

// ── Sakura: 5-petal blossoms with stamen center, blooming then drifting ──

function emitSakuraRipple(x: number, y: number, cfg: ClickFXConfig): void {
  const container = createContainer()
  const intensity = cfg.intensity / 100
  const speedFactor = 0.5 + (cfg.speed / 160)
  const anims: JSAnimation[] = []
  const flowerCount = Math.round(6 + (cfg.particles / 100) * 8)

  for (let f = 0; f < flowerCount; f++) {
    const flowerAngle = utils.random(0, Math.PI * 2)
    const flowerDist = utils.random(15, 80) * intensity
    const flowerX = Math.cos(flowerAngle) * flowerDist
    const flowerY = Math.sin(flowerAngle) * flowerDist - flowerDist * 0.2
    const flowerRotate = utils.random(-40, 40)
    const flowerDelay = utils.random(0, 80)
    const flowerDuration = utils.random(1400, 2200) * speedFactor
    const baseHue = utils.random(348, 356)
    const petalCount = 5

    // Stamens — tiny center cluster
    for (let s = 0; s < 3; s++) {
      const sx = utils.random(-2, 2)
      const sy = utils.random(-2, 2)
      const stamen = document.createElement('div')
      stamen.style.cssText = [
        `position:absolute`,
        `left:${x - 1}px`,
        `top:${y - 3}px`,
        `width:2px`,
        `height:6px`,
        `border-radius:1px`,
        `background:hsl(${baseHue + 20},60%,55%)`,
        `opacity:0`,
      ].join(';')
      container.appendChild(stamen)
      const anim = animate(stamen, {
        translateX: [0, sx + flowerX],
        translateY: [0, sy + flowerY],
        scale: [0, 0.8, 0],
        opacity: [0, 0.5, 0],
        duration: flowerDuration * 0.6,
        delay: flowerDelay + s * 10,
        ease: 'outCubic',
      })
      anims.push(anim)
    }

    for (let p = 0; p < petalCount; p++) {
      const petalAngle = (Math.PI * 2 * p) / petalCount + utils.random(-0.12, 0.12)
      const petalRadius = utils.random(4, 7)
      const px = Math.cos(petalAngle) * petalRadius
      const py = Math.sin(petalAngle) * petalRadius
      const hue = baseHue + utils.random(-5, 5)
      const sat = utils.random(25, 50)
      const lit = utils.random(80, 94)
      const pw = utils.random(5, 9)
      const ph = utils.random(10, 16)

      // Sakura petal: rounded teardrop with cleft illusion via gradient
      const petal = document.createElement('div')
      petal.style.cssText = [
        `position:absolute`,
        `left:${x - pw / 2}px`,
        `top:${y - ph / 2}px`,
        `width:${pw}px`,
        `height:${ph}px`,
        `border-radius:100% 0 100% 0 / 55% 45% 55% 45%`,
        `background:linear-gradient(180deg, hsl(${hue},${sat + 15}%,${lit + 5}%) 0%, hsl(${hue},${sat}%,${lit}%) 40%, hsl(${hue - 5},${sat + 10}%,${lit - 5}%) 100%)`,
        `box-shadow:0 0 ${pw * 1.5}px hsla(${hue},${sat}%,${lit}%,0.35)`,
        `opacity:0`,
      ].join(';')
      container.appendChild(petal)

      const driftX = px + flowerX + utils.random(-30, 30) * intensity
      const driftY = py + flowerY + utils.random(25, 90) * intensity
      const swayX = driftX + utils.random(-20, 20)
      const driftRotate = flowerRotate + utils.random(-120, 120)

      const anim = animate(petal, {
        translateX: [
          { to: px, duration: flowerDuration * 0.18, ease: 'outExpo' },
          { to: driftX, duration: flowerDuration * 0.4, ease: 'outQuad' },
          { to: swayX, duration: flowerDuration * 0.42, ease: 'inOutSine' },
        ],
        translateY: [
          { to: py, duration: flowerDuration * 0.18, ease: 'outExpo' },
          { to: driftY, duration: flowerDuration * 0.4, ease: 'outQuad' },
          { to: driftY + utils.random(20, 60), duration: flowerDuration * 0.42, ease: 'inQuad' },
        ],
        scale: [0, 0.85, 0.6, 0],
        rotate: [0, driftRotate],
        opacity: [0, 0.8, 0.5, 0],
        duration: flowerDuration,
        delay: flowerDelay + p * 12,
        ease: 'linear',
      })
      anims.push(anim)
    }
  }

  const last = anims[anims.length - 1]
  if (last) last.then(() => container.remove())
  else container.remove()
}

// ── Glass Ripple ──

function emitGlassRipple(x: number, y: number, cfg: ClickFXConfig): void {
  const container = createContainer()
  const intensity = cfg.intensity / 100
  const speedFactor = 0.45 + (cfg.speed / 220)
  const rings = Math.round(3 + (cfg.particles / 100) * 2)
  const anims: JSAnimation[] = []

  const highlight = place(container, x, y, 12, 12, [
    `border-radius:50%`,
    `background:radial-gradient(circle, hsla(200,50%,98%,0.7) 0%, hsla(200,40%,85%,0.25) 35%, transparent 65%)`,
    `box-shadow:0 0 8px hsla(200,40%,95%,0.5)`,
    `filter:blur(2px)`,
  ])
  anims.push(animate(highlight, {
    scale: [0, 1.8 * intensity, 0],
    opacity: [0, 0.7, 0],
    duration: 350 * speedFactor,
    ease: 'outQuad',
  }))

  for (let i = 0; i < rings; i++) {
    const size = 20 + i * 6
    const el = place(container, x, y, size, size, [
      `border-radius:50%`,
      `background:radial-gradient(circle, hsla(200,30%,96%,0.12) 0%, hsla(200,20%,88%,0.04) 45%, transparent 70%)`,
      `border:1.5px solid hsla(200,30%,92%,0.75)`,
      `box-shadow:0 0 6px hsla(200,35%,88%,0.45), inset 0 0 3px hsla(200,20%,96%,0.25)`,
      `opacity:0`,
    ])

    const anim = animate(el, {
      scale: [0.3, 1.8 + i * 0.8, 3 + i * 1],
      opacity: [0, 0.55 - i * 0.08, 0],
      duration: (500 + i * 150) * speedFactor,
      delay: i * 70,
      ease: 'outCubic',
    })
    anims.push(anim)
  }

  const last = anims[anims.length - 1]
  if (last) last.then(() => container.remove())
  else container.remove()
}

// ── Shockwave: intense cyber energy ring ──

function emitShockwave(x: number, y: number, cfg: ClickFXConfig): void {
  const container = createContainer()
  const intensity = cfg.intensity / 100
  const speedFactor = 0.4 + (cfg.speed / 200)
  const anims: JSAnimation[] = []

  // Intense central flash
  const flash = place(container, x, y, 12, 12, [
    `border-radius:50%`,
    `background:white`,
    `box-shadow:0 0 18px white, 0 0 40px hsla(190,100%,70%,0.9), 0 0 70px hsla(200,100%,60%,0.5)`,
  ])
  anims.push(animate(flash, {
    scale: [0, 2.5, 0],
    opacity: [0, 1, 0],
    duration: 220 * speedFactor,
    ease: 'outQuad',
  }))

  // Main energy ring — intense cyan with double glow
  const mainRing = place(container, x, y, 20, 20, [
    `border-radius:50%`,
    `border:2px solid hsla(190,100%,65%,0.95)`,
    `box-shadow:0 0 10px hsla(190,100%,60%,0.9), 0 0 25px hsla(190,100%,50%,0.6), 0 0 45px hsla(200,90%,50%,0.3), inset 0 0 4px hsla(190,100%,80%,0.4)`,
    `opacity:0`,
  ])
  anims.push(animate(mainRing, {
    scale: [0.08, 2.5 * intensity, 4 * intensity],
    opacity: [0, 0.85, 0],
    duration: 550 * speedFactor,
    ease: 'outExpo',
  }))

  // Afterimage — purple-magenta echo ring
  const afterRing = place(container, x, y, 20, 20, [
    `border-radius:50%`,
    `border:1.5px solid hsla(285,90%,60%,0.7)`,
    `box-shadow:0 0 8px hsla(285,80%,55%,0.45), 0 0 20px hsla(290,70%,50%,0.2)`,
    `opacity:0`,
  ])
  anims.push(animate(afterRing, {
    scale: [0.08, 2.8 * intensity, 4.5 * intensity],
    opacity: [0, 0.55, 0],
    duration: 650 * speedFactor,
    delay: 50,
    ease: 'outExpo',
  }))

  // Trail particles — geometric sparks with afterglow
  const sparkCount = Math.round(10 + (cfg.particles / 100) * 10)
  for (let i = 0; i < sparkCount; i++) {
    const angle = (Math.PI * 2 * i) / sparkCount + utils.random(-0.25, 0.25)
    const dist = utils.random(18, 65) * intensity
    const tx = Math.cos(angle) * dist
    const ty = Math.sin(angle) * dist
    const sparkHue = utils.random(185, 215)
    const sparkSize = utils.random(2, 5)

    // Mix of diamond and circle particles
    const isDiamond = utils.random(0, 100) > 40
    const spark = place(container, x, y, sparkSize, sparkSize, [
      `border-radius:${isDiamond ? '1px' : '50%'}`,
      `background:${isDiamond ? 'transparent' : `hsl(${sparkHue},100%,80%)`}`,
      `border:${isDiamond ? `1px solid hsl(${sparkHue},100%,70%)` : 'none'}`,
      `box-shadow:0 0 ${sparkSize * 2}px hsl(${sparkHue},100%,65%), 0 0 ${sparkSize * 4}px hsla(${sparkHue},100%,50%,0.6)`,
      `transform:${isDiamond ? 'rotate(45deg)' : 'none'}`,
      `opacity:0`,
    ])

    const anim = animate(spark, {
      translateX: [0, tx],
      translateY: [0, ty],
      scale: [0, 1.2, 0],
      opacity: [0, 1, 0],
      duration: utils.random(350, 600) * speedFactor,
      delay: utils.random(30, 120),
      ease: 'outExpo',
    })
    anims.push(anim)
  }

  const last = anims[anims.length - 1]
  if (last) last.then(() => container.remove())
  else container.remove()
}

// ── Public API ──

export function emitBurst(
  type: ClickFXType,
  x: number,
  y: number,
  config: ClickFXConfig,
): void {
  switch (type) {
    case 'aurora-pulse':
      emitAuroraPulse(x, y, config)
      break
    case 'ripple':
      emitRipple(x, y, config)
      break
    case 'sakura-ripple':
      emitSakuraRipple(x, y, config)
      break
    case 'glass-ripple':
      emitGlassRipple(x, y, config)
      break
    case 'shockwave':
      emitShockwave(x, y, config)
      break
  }
}
