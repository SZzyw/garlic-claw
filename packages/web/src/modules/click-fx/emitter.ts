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

// ── Aurora Pulse: flowing aurora-like energy with bloom, color drift & mist ──

function emitAuroraPulse(x: number, y: number, cfg: ClickFXConfig): void {
  const container = createContainer()
  const intensity = cfg.intensity / 100
  const speedFactor = 0.7 + (cfg.speed / 300)
  const anims: JSAnimation[] = []

  // Vibrant rainbow palette — distinct colors visible in all modes
  const vividHues = [340, 195, 280, 155, 220, 320, 175, 260, 140, 200, 290, 165]

  // ═══ 1. Central bloom — soft luminous core, slow decay ═══
  const bloom = place(container, x, y, 14, 14, [
    `border-radius:50%`,
    `background:radial-gradient(circle,
      hsla(0,0%,100%,0.8) 0%,
      hsla(280,90%,80%,0.55) 18%,
      hsla(200,85%,68%,0.3) 45%,
      transparent 78%)`,
    `filter:blur(7px)`,
    `opacity:0`,
  ])
  anims.push(animate(bloom, {
    scale: [0.08, 2.0 + intensity * 1.5, 3.5 + intensity * 2.5],
    opacity: [0, 0.9, 0.25, 0],
    duration: 2800 * speedFactor,
    ease: 'inOutSine',
  }))

  // ═══ 2. Aurora curtain ribbons — vibrant colored flowing bands ═══
  const ribbonCount = 5 + Math.round(intensity * 3)
  for (let r = 0; r < ribbonCount; r++) {
    const hue = vividHues[r % vividHues.length] + utils.random(-8, 8)
    const angle = (Math.PI * 2 * r) / ribbonCount + utils.random(-0.35, 0.35)
    const w = utils.random(40, 100)
    const h = utils.random(10, 26)
    const blur = 8 + utils.random(0, 8)
    const rotateDeg = (angle * 180) / Math.PI

    const ribbon = place(container, x, y, w, h, [
      `border-radius:${utils.random(40,60)}% ${utils.random(30,50)}% ${utils.random(20,40)}% ${utils.random(35,55)}%`,
      `background:linear-gradient(${utils.random(0,360)}deg,
        hsla(${hue},90%,75%,0.55) 0%,
        hsla(${hue + 25},85%,68%,0.3) 40%,
        hsla(${hue - 15},80%,58%,0.1) 100%)`,
      `filter:blur(${blur}px)`,
      `transform:rotate(${rotateDeg}deg)`,
      `opacity:0`,
    ])
    anims.push(animate(ribbon, {
      scale: [0.03, 1.2 + intensity * 1.0, 2.5 + intensity * 1.8],
      rotate: [rotateDeg, rotateDeg + utils.random(-30, 30)],
      opacity: [0, 0.6, 0.15, 0],
      duration: (2400 + r * 280) * speedFactor,
      delay: r * 130,
      ease: 'inOutSine',
    }))
  }

  // ═══ 3. Drifting mist — slow atmospheric color patches ═══
  const mistCount = 3 + Math.round(intensity * 2)
  for (let m = 0; m < mistCount; m++) {
    const hue = vividHues[m * 2 % vividHues.length] + utils.random(-10, 10)
    const mx = utils.random(-30, 30)
    const my = utils.random(-30, 30)
    const size = utils.random(22, 48)

    const mist = place(container, x, y, size, size, [
      `border-radius:${utils.random(35,65)}% ${utils.random(40,60)}% ${utils.random(30,55)}% ${utils.random(40,60)}%`,
      `background:radial-gradient(circle at ${utils.random(30,70)}% ${utils.random(30,70)}%,
        hsla(${hue},85%,78%,0.35) 0%,
        hsla(${hue + 15},75%,68%,0.16) 50%,
        transparent 100%)`,
      `filter:blur(${utils.random(12, 18)}px)`,
      `opacity:0`,
    ])
    anims.push(animate(mist, {
      translateX: [0, mx, mx * 1.7],
      translateY: [0, my, my * 1.7],
      scale: [0.08, 1.4 + intensity * 1.0, 2.8 + intensity * 2.0],
      opacity: [0, 0.45, 0.06, 0],
      duration: (3000 + m * 350) * speedFactor,
      delay: m * 220 + utils.random(0, 120),
      ease: 'inOutSine',
    }))
  }

  // ═══ 4. Tiny sparkle points — colored specks through the aurora ═══
  const sparkleCount = 6 + Math.round(cfg.particles * 0.3)
  for (let s = 0; s < sparkleCount; s++) {
    const angle = utils.random(0, Math.PI * 2)
    const dist = utils.random(12, 55) * (0.5 + intensity * 0.5)
    const sx = Math.cos(angle) * dist
    const sy = Math.sin(angle) * dist
    const hue = vividHues[Math.floor(utils.random(0, vividHues.length))]

    const dot = place(container, x, y, 2, 2, [
      `border-radius:50%`,
      `background:hsl(${hue},90%,80%)`,
      `box-shadow:0 0 6px hsl(${hue},100%,65%), 0 0 12px hsla(${hue},90%,55%,0.5)`,
      `opacity:0`,
    ])
    anims.push(animate(dot, {
      translateX: [0, sx, sx * 1.6],
      translateY: [0, sy, sy * 1.6],
      scale: [0, 0.8, 0],
      opacity: [0, 0.75, 0],
      duration: (2000 + utils.random(0, 700)) * speedFactor,
      delay: utils.random(100, 350),
      ease: 'inOutSine',
    }))
  }

  const last = anims[anims.length - 1]
  if (last) last.then(() => container.remove())
  else container.remove()
}

// ── Ripple: vivid water ripple with highlight/shadow band pairs ──

function emitRipple(x: number, y: number, cfg: ClickFXConfig): void {
  const container = createContainer()
  const intensity = cfg.intensity / 100
  const speedFactor = 0.6 + (cfg.speed / 250)
  const anims: JSAnimation[] = []
  const rings = 5
  const baseDuration = 1300 * speedFactor
  const maxScale = 2.2 + intensity * 4.5

  // ── Central droplet impact flash ──
  const flash = place(container, x, y, 8, 8, [
    `border-radius:50%`,
    `background:radial-gradient(circle, hsla(0,0%,100%,0.95) 0%, hsla(200,25%,92%,0.5) 35%, transparent 70%)`,
    `box-shadow:0 0 8px hsla(200,20%,95%,0.7), 0 0 20px hsla(200,15%,88%,0.35)`,
    `opacity:0`,
  ])
  anims.push(animate(flash, {
    scale: [0, 1.3, 0],
    opacity: [0, 0.9, 0],
    duration: 220 * speedFactor,
    ease: 'outQuad',
  }))

  // ── Crown splash: tiny droplets ejecting upward ──
  for (let d = 0; d < 8; d++) {
    const angle = (Math.PI * 2 * d) / 8 + utils.random(-0.25, 0.25)
    const dist = utils.random(10, 24) * (0.5 + intensity * 0.5)
    const dx = Math.cos(angle) * dist
    const dy = Math.sin(angle) * dist - utils.random(6, 16)
    const drop = place(container, x, y, 3, 3, [
      `border-radius:50%`,
      `background:radial-gradient(circle at 30% 30%, hsla(0,0%,100%,0.9) 0%, hsla(200,20%,88%,0.5) 100%)`,
      `box-shadow:0 0 3px hsla(200,15%,90%,0.4)`,
      `opacity:0`,
    ])
    anims.push(animate(drop, {
      translateX: [0, dx],
      translateY: [0, dy, dy + 10],
      scale: [0, 0.6, 0],
      opacity: [0, 0.75, 0],
      duration: utils.random(350, 600) * speedFactor,
      delay: utils.random(15, 60),
      ease: 'outQuad',
    }))
  }

  // ── Ripple band pairs: dark trough + bright crest ──
  for (let i = 0; i < rings; i++) {
    const hue = 200 + utils.random(-6, 6)
    const baseSize = 18 + i * 7
    const peak = maxScale - i * 0.4
    const delay = i * 85

    // Dark displacement band — the water trough (shadow)
    const dark = place(container, x, y, baseSize, baseSize, [
      `border-radius:50%`,
      `border:${1.4 - i * 0.1}px solid hsla(${hue},18%,40%,${0.38 - i * 0.04})`,
      `box-shadow:0 0 ${5 + i}px hsla(${hue},12%,25%,${0.08 - i * 0.008})`,
      `opacity:0`,
    ])
    anims.push(animate(dark, {
      scale: [0.04, peak, peak * 0.83, peak * 0.88],
      opacity: [0, 0.42 - i * 0.04, 0.12, 0],
      duration: baseDuration,
      delay,
      ease: 'outCubic',
    }))

    // Bright reflection band — light catching the crest, slightly offset
    const bright = place(container, x, y, baseSize + 2, baseSize + 2, [
      `border-radius:50%`,
      `border:${1.0 - i * 0.08}px solid hsla(${hue},12%,82%,${0.32 - i * 0.035})`,
      `box-shadow:
        0 0 ${6 + i * 2}px hsla(${hue},8%,78%,${0.14 - i * 0.015}),
        0 0 ${10 + i * 3}px hsla(${hue},5%,72%,${0.06 - i * 0.007})`,
      `opacity:0`,
    ])
    anims.push(animate(bright, {
      scale: [0.04, peak * 0.96, peak * 0.80, peak * 0.85],
      opacity: [0, 0.36 - i * 0.04, 0.08, 0],
      duration: baseDuration * 0.93,
      delay: delay + 35,
      ease: 'outCubic',
    }))
  }

  // ── Ambient water glow ──
  const glow = place(container, x, y, 12, 12, [
    `border-radius:50%`,
    `background:radial-gradient(circle, hsla(200,25%,88%,0.1) 0%, hsla(200,20%,80%,0.04) 50%, transparent 100%)`,
    `filter:blur(10px)`,
    `opacity:0`,
  ])
  anims.push(animate(glow, {
    scale: [0, maxScale + 2, maxScale + 5],
    opacity: [0, 0.45, 0],
    duration: baseDuration * 1.15,
    ease: 'outQuad',
  }))

  const last = anims[anims.length - 1]
  if (last) last.then(() => container.remove())
  else container.remove()
}

// ── Sakura: 5-petal blossoms with stamen center, blooming then drifting ──

function emitSakuraRipple(x: number, y: number, cfg: ClickFXConfig): void {
  const container = createContainer()
  const intensity = cfg.intensity / 100
  const speedFactor = 0.6 + (cfg.speed / 200)
  const anims: JSAnimation[] = []
  const flowerCount = Math.round(2 + (cfg.particles / 100) * 4)

  for (let f = 0; f < flowerCount; f++) {
    const flowerAngle = utils.random(0, Math.PI * 2)
    const flowerDist = utils.random(20, 100) * intensity
    const flowerX = Math.cos(flowerAngle) * flowerDist
    const flowerY = Math.sin(flowerAngle) * flowerDist - flowerDist * 0.15
    const flowerRotate = utils.random(-60, 60)
    const flowerDelay = utils.random(0, 100)
    const flowerDuration = utils.random(2200, 3400) * speedFactor
    const baseHue = utils.random(348, 356)
    const petalCount = 5

    // Stamens — tiny center cluster with pale filaments
    for (let s = 0; s < 4; s++) {
      const sa = (Math.PI * 2 * s) / 4 + utils.random(-0.2, 0.2)
      const sr = utils.random(3, 5)
      const sx = Math.cos(sa) * sr
      const sy = Math.sin(sa) * sr
      const stamen = document.createElement('div')
      stamen.style.cssText = [
        `position:absolute`,
        `left:${x - 0.8}px`,
        `top:${y - 3}px`,
        `width:1.6px`,
        `height:6px`,
        `border-radius:40%`,
        `background:hsl(${baseHue + 10},50%,60%)`,
        `opacity:0`,
      ].join(';')
      container.appendChild(stamen)
      const anim = animate(stamen, {
        translateX: [0, sx + flowerX],
        translateY: [0, sy + flowerY],
        scale: [0, 0.7, 0],
        opacity: [0, 0.45, 0],
        duration: flowerDuration * 0.55,
        delay: flowerDelay + s * 10,
        ease: 'outCubic',
      })
      anims.push(anim)
    }

    for (let p = 0; p < petalCount; p++) {
      const petalAngle = (Math.PI * 2 * p) / petalCount + utils.random(-0.1, 0.1)
      const petalRadius = utils.random(10, 18)
      const px = Math.cos(petalAngle) * petalRadius
      const py = Math.sin(petalAngle) * petalRadius
      const hue = baseHue + utils.random(-4, 4)
      const sat = utils.random(30, 55)
      const lit = utils.random(82, 95)
      // Petal dimensions: taller and wider, sakura shape
      const pw = utils.random(14, 22)
      const ph = utils.random(24, 38)

      // Sakura petal: oval with cleft at tip via asymmetric border-radius
      // The real sakura petal is ovate with a split at the apex
      const cleft = utils.random(15, 25)
      const petal = document.createElement('div')
      petal.style.cssText = [
        `position:absolute`,
        `left:${x - pw / 2}px`,
        `top:${y - ph * 0.6}px`,
        `width:${pw}px`,
        `height:${ph}px`,
        `border-radius:${50 - cleft}% ${50 + cleft}% ${cleft}% ${cleft}% / 60% 60% 40% 40%`,
        `background:linear-gradient(170deg, hsl(${hue},${sat + 10}%,${lit + 8}%) 0%, hsl(${hue},${sat + 5}%,${lit + 2}%) 25%, hsl(${hue},${sat}%,${lit}%) 55%, hsl(${hue - 3},${sat + 8}%,${lit - 6}%) 100%)`,
        `box-shadow:0 0 ${pw * 0.8}px hsla(${hue},${sat}%,${lit - 5}%,0.2), inset 0 0 ${pw}px hsla(${hue},${sat + 10}%,${lit + 5}%,0.12)`,
        `opacity:0`,
      ].join(';')
      container.appendChild(petal)

      const driftX = px + flowerX + utils.random(-45, 45) * intensity
      const driftY = py + flowerY + utils.random(30, 110) * intensity
      const swayX = driftX + utils.random(-30, 30)
      const driftRotate = flowerRotate + utils.random(-160, 160)

      const anim = animate(petal, {
        translateX: [
          { to: px, duration: flowerDuration * 0.15, ease: 'outExpo' },
          { to: driftX, duration: flowerDuration * 0.38, ease: 'outQuad' },
          { to: swayX, duration: flowerDuration * 0.47, ease: 'inOutSine' },
        ],
        translateY: [
          { to: py, duration: flowerDuration * 0.15, ease: 'outExpo' },
          { to: driftY, duration: flowerDuration * 0.38, ease: 'outQuad' },
          { to: driftY + utils.random(30, 80), duration: flowerDuration * 0.47, ease: 'inQuad' },
        ],
        scale: [0, 0.9, 0.55, 0],
        rotate: [0, driftRotate],
        opacity: [0, 0.75, 0.45, 0],
        duration: flowerDuration,
        delay: flowerDelay + p * 18,
        ease: 'linear',
      })
      anims.push(anim)
    }
  }

  const last = anims[anims.length - 1]
  if (last) last.then(() => container.remove())
  else container.remove()
}

// ── Plasma Burst: electric plasma explosion with ionized sparks & arc lightning ──

function emitGlassRipple(x: number, y: number, cfg: ClickFXConfig): void {
  const container = createContainer()
  const intensity = cfg.intensity / 100
  const speedFactor = 0.5 + (cfg.speed / 220)
  const anims: JSAnimation[] = []
  const xmlns = 'http://www.w3.org/2000/svg'

  function makeSvg(w: number, h: number): SVGSVGElement {
    const svg = document.createElementNS(xmlns, 'svg')
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`)
    svg.setAttribute('width', `${w}`)
    svg.setAttribute('height', `${h}`)
    svg.style.cssText = [
      `position:absolute`, `left:${x - w / 2}px`, `top:${y - h / 2}px`,
      `width:${w}px`, `height:${h}px`, `pointer-events:none`, `overflow:visible`,
    ].join(';')
    container.appendChild(svg)
    return svg
  }

  // ═══ 1. Plasma core — intense white-hot center with electric halo ═══
  const core = place(container, x, y, 10, 10, [
    `border-radius:50%`,
    `background:radial-gradient(circle,
      white 0%,
      hsla(210,100%,88%,0.8) 15%,
      hsla(230,100%,72%,0.4) 40%,
      hsla(260,100%,60%,0.12) 70%,
      transparent 100%)`,
    `box-shadow:
      0 0 10px white,
      0 0 22px hsla(210,100%,70%,0.7),
      0 0 38px hsla(250,100%,60%,0.35),
      0 0 55px hsla(280,100%,55%,0.15)`,
    `opacity:0`,
  ])
  anims.push(animate(core, {
    scale: [0, 1.8 + intensity * 1.5, 0],
    opacity: [0, 1, 0],
    duration: (350 + intensity * 250) * speedFactor,
    ease: 'outExpo',
  }))

  // ═══ 2. Electric arcs — SVG lightning bolts radiating from center ═══
  const arcCount = 6 + Math.round(intensity * 6)
  const arcSvg = makeSvg(160, 160)
  const cx = 80, cy = 80

  for (let a = 0; a < arcCount; a++) {
    const angle = (Math.PI * 2 * a) / arcCount + utils.random(-0.35, 0.35)
    const arcLen = utils.random(40, 72) * (0.5 + intensity * 0.5)
    const segments = 4 + Math.floor(utils.random(0, 5))
    const jitter = 6 + utils.random(0, 16)
    const hue = [200, 215, 250, 270, 290, 320][Math.floor(utils.random(0, 6))]

    // Main arc — zigzag lightning bolt
    let d = `M${cx},${cy}`
    const perpX = Math.cos(angle + Math.PI / 2)
    const perpY = Math.sin(angle + Math.PI / 2)
    for (let s = 1; s <= segments; s++) {
      const progress = s / segments
      const bx = cx + Math.cos(angle) * (arcLen / segments) * s
      const by = cy + Math.sin(angle) * (arcLen / segments) * s
      const offset = (Math.random() - 0.5) * jitter * (1 - progress * 0.55)
      d += ` L${bx + perpX * offset},${by + perpY * offset}`
    }

    const pathEl = document.createElementNS(xmlns, 'path')
    pathEl.setAttribute('d', d)
    pathEl.setAttribute('fill', 'none')
    pathEl.setAttribute('stroke', `hsl(${hue},100%,${72 + utils.random(-8, 8)}%)`)
    pathEl.setAttribute('stroke-width', `${0.2 + utils.random(0, 0.3)}`)
    pathEl.setAttribute('stroke-linecap', 'round')
    pathEl.style.filter = `drop-shadow(0 0 ${4 + intensity * 3}px hsl(${hue},100%,65%)) drop-shadow(0 0 ${8 + intensity * 4}px hsl(${hue},100%,45%))`
    arcSvg.appendChild(pathEl)

    anims.push(animate(pathEl, {
      opacity: [0, 0.9, 0.4, 0],
      duration: (450 + intensity * 350) * speedFactor,
      delay: utils.random(0, 50),
      ease: 'outExpo',
    }))

    // Branch arc — forks from midpoint with 40% probability
    if (Math.random() < 0.4) {
      const midSeg = Math.floor(segments / 2) + 1
      const midProgress = midSeg / segments
      const mbx = cx + Math.cos(angle) * (arcLen / segments) * midSeg
      const mby = cy + Math.sin(angle) * (arcLen / segments) * midSeg
      const mOffset = (Math.random() - 0.5) * jitter * (1 - midProgress * 0.55)
      const mx = mbx + perpX * mOffset
      const my = mby + perpY * mOffset

      const branchAngle = angle + utils.random(-0.7, 0.7)
      const branchLen = arcLen * utils.random(0.25, 0.45)
      const branchSegs = 2 + Math.floor(utils.random(0, 3))
      let bd = `M${mx},${my}`
      const bPerpX = Math.cos(branchAngle + Math.PI / 2)
      const bPerpY = Math.sin(branchAngle + Math.PI / 2)
      for (let s = 1; s <= branchSegs; s++) {
        const bp = s / branchSegs
        const bbx = mx + Math.cos(branchAngle) * (branchLen / branchSegs) * s
        const bby = my + Math.sin(branchAngle) * (branchLen / branchSegs) * s
        const bo = (Math.random() - 0.5) * jitter * 0.6 * (1 - bp * 0.5)
        bd += ` L${bbx + bPerpX * bo},${bby + bPerpY * bo}`
      }

      const bPath = document.createElementNS(xmlns, 'path')
      bPath.setAttribute('d', bd)
      bPath.setAttribute('fill', 'none')
      bPath.setAttribute('stroke', `hsl(${hue},100%,${80 + utils.random(-5, 10)}%)`)
      bPath.setAttribute('stroke-width', `${0.1 + utils.random(0, 0.15)}`)
      bPath.setAttribute('stroke-linecap', 'round')
      bPath.style.filter = `drop-shadow(0 0 3px hsl(${hue},100%,70%))`
      arcSvg.appendChild(bPath)

      anims.push(animate(bPath, {
        opacity: [0, 0.7, 0.25, 0],
        duration: (350 + intensity * 250) * speedFactor,
        delay: utils.random(20, 70),
        ease: 'outExpo',
      }))
    }
  }

  anims.push(animate(arcSvg, {
    scale: [0.5, 1.4 + intensity * 0.7],
    opacity: [0, 1, 0],
    duration: (550 + intensity * 350) * speedFactor,
    ease: 'outExpo',
  }))

  // ═══ 3. Ionized particle sparks — high-velocity glowing specks ═══
  const sparkCount = 18 + Math.round(cfg.particles * 0.65)
  for (let s = 0; s < sparkCount; s++) {
    const angle = utils.random(0, Math.PI * 2)
    const dist = utils.random(15, 85) * (0.35 + intensity * 0.65)
    const dx = Math.cos(angle) * dist
    const dy = Math.sin(angle) * dist
    const hue = [200, 215, 230, 255, 275, 295, 320][Math.floor(utils.random(0, 7))]
    const size = utils.random(1.5, 3.5)

    const spark = place(container, x, y, size, size, [
      `border-radius:50%`,
      `background:radial-gradient(circle at 35% 35%,
        white 0%,
        hsl(${hue},100%,${75 + utils.random(0, 15)}%) 35%,
        hsl(${hue},100%,${50 + utils.random(0, 20)}%) 100%)`,
      `box-shadow:0 0 ${size * 1.6}px hsl(${hue},100%,65%), 0 0 ${size * 3}px hsl(${hue},100%,45%)`,
      `opacity:0`,
    ])

    anims.push(animate(spark, {
      translateX: [0, dx * 0.4, dx],
      translateY: [0, dy * 0.4, dy],
      scale: [0, 1.3, 0.25, 0],
      opacity: [0, 1, 0.45, 0],
      duration: utils.random(300, 750) * speedFactor,
      delay: utils.random(15, 90),
      ease: 'outExpo',
    }))
  }

  // ═══ 4. Plasma energy rings — expanding charged shockwaves ═══
  const ringDefs = [
    { hue: 210, delay: 0 },
    { hue: 260, delay: 40 },
    { hue: 290, delay: 80 },
  ]
  for (const rd of ringDefs) {
    const ringSize = 18 + rd.delay * 0.2
    const ring = place(container, x, y, ringSize, ringSize, [
      `border-radius:50%`,
      `border:${1.2}px solid hsla(${rd.hue},100%,${65}%,0.5)`,
      `box-shadow:
        0 0 ${6}px hsla(${rd.hue},100%,62%,0.45),
        0 0 ${14}px hsla(${rd.hue},100%,50%,0.2),
        inset 0 0 ${4}px hsla(${rd.hue},100%,70%,0.15)`,
      `opacity:0`,
    ])
    anims.push(animate(ring, {
      scale: [0.04, 1.0 + intensity * 0.7, 1.8 + intensity * 1.2],
      opacity: [0, 0.55, 0],
      duration: (550 + intensity * 350) * speedFactor,
      delay: rd.delay,
      ease: 'outExpo',
    }))
  }

  // ═══ 5. Afterglow — soft fading ambient plasma light ═══
  const glow = place(container, x, y, 16, 16, [
    `border-radius:50%`,
    `background:radial-gradient(circle,
      hsla(220,100%,75%,0.15) 0%,
      hsla(250,100%,60%,0.06) 40%,
      transparent 100%)`,
    `filter:blur(12px)`,
    `opacity:0`,
  ])
  anims.push(animate(glow, {
    scale: [0, 6 + intensity * 4, 9 + intensity * 6],
    opacity: [0, 0.5, 0],
    duration: (700 + intensity * 400) * speedFactor,
    delay: 30,
    ease: 'outQuad',
  }))

  const last = anims[anims.length - 1]
  if (last) last.then(() => container.remove())
  else container.remove()
}

// ── Holo Scan: sci-fi holographic scanning ring + HUD reticle ──

function emitShockwave(x: number, y: number, cfg: ClickFXConfig): void {
  const container = createContainer()
  const intensity = cfg.intensity / 100
  const speedFactor = 0.55 + (cfg.speed / 220)
  const anims: JSAnimation[] = []
  const haloHue = 190 // classic hologram cyan

  const xmlns = 'http://www.w3.org/2000/svg'

  function hsvg(w: number, h: number): SVGSVGElement {
    const svg = document.createElementNS(xmlns, 'svg') as unknown as SVGSVGElement
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`)
    svg.setAttribute('width', `${w}`)
    svg.setAttribute('height', `${h}`)
    svg.style.cssText = [
      `position:absolute`,
      `left:${x - w / 2}px`,
      `top:${y - h / 2}px`,
      `width:${w}px`,
      `height:${h}px`,
      `pointer-events:none`,
      `overflow:visible`,
    ].join(';')
    container.appendChild(svg)
    return svg
  }

  function hpath(svg: SVGSVGElement, d: string, stroke: string, sw: number, filter?: string): SVGPathElement {
    const el = document.createElementNS(xmlns, 'path')
    el.setAttribute('d', d)
    el.setAttribute('fill', 'none')
    el.setAttribute('stroke', stroke)
    el.setAttribute('stroke-width', `${sw}`)
    el.setAttribute('stroke-linecap', 'round')
    if (filter) el.style.filter = filter
    svg.appendChild(el)
    return el
  }

  function hline(svg: SVGSVGElement, x1: number, y1: number, x2: number, y2: number, stroke: string, sw: number): SVGLineElement {
    const el = document.createElementNS(xmlns, 'line')
    el.setAttribute('x1', `${x1}`); el.setAttribute('y1', `${y1}`)
    el.setAttribute('x2', `${x2}`); el.setAttribute('y2', `${y2}`)
    el.setAttribute('stroke', stroke)
    el.setAttribute('stroke-width', `${sw}`)
    el.setAttribute('stroke-linecap', 'round')
    svg.appendChild(el)
    return el
  }

  // ═══ 1. Scan rings — expanding holographic circles ═══
  const ringCount = 3 + Math.round(intensity * 3)
  for (let r = 0; r < ringCount; r++) {
    const size = 80
    const svg = hsvg(size, size)
    const cx = size / 2; const cy = size / 2
    const radius = size / 2 - 4
    const dashLen = radius * Math.PI * 2
    const gap = 8 + r * 4

    // Dashed ring for scan-line feel
    const pathEl = document.createElementNS(xmlns, 'circle')
    pathEl.setAttribute('cx', `${cx}`); pathEl.setAttribute('cy', `${cy}`)
    pathEl.setAttribute('r', `${radius}`)
    pathEl.setAttribute('fill', 'none')
    pathEl.setAttribute('stroke', `hsla(${haloHue},100%,${70 - r * 5}%,${0.8 - r * 0.12})`)
    pathEl.setAttribute('stroke-width', `${1.2 + intensity * 0.6}`)
    pathEl.setAttribute('stroke-dasharray', `${dashLen / (6 + r * 2)} ${gap}`)
    pathEl.style.filter = `drop-shadow(0 0 ${3 + r}px hsl(${haloHue},100%,60%))`
    svg.appendChild(pathEl)

    anims.push(animate(svg, {
      scale: [0.08, 0.7 + r * 0.18 + intensity * 0.3],
      opacity: [0, 0.7, 0],
      duration: (600 + intensity * 350 + r * 120) * speedFactor,
      delay: r * 70,
      ease: 'outExpo',
    }))
  }

  // ═══ 2. Radar sweep line — rotating radial line ═══
  const sweepSize = 90
  const sweepSvg = hsvg(sweepSize, sweepSize)
  const scx = sweepSize / 2; const scy = sweepSize / 2
  const sweepEl = document.createElementNS(xmlns, 'line')
  sweepEl.setAttribute('x1', `${scx}`); sweepEl.setAttribute('y1', `${scy}`)
  sweepEl.setAttribute('x2', `${scx}`); sweepEl.setAttribute('y2', `${scy - sweepSize / 2 + 4}`)
  sweepEl.setAttribute('stroke', `hsla(${haloHue},100%,75%,0.7)`)
  sweepEl.setAttribute('stroke-width', '1.2')
  sweepEl.style.filter = `drop-shadow(0 0 6px hsl(${haloHue},100%,65%))`
  sweepSvg.appendChild(sweepEl)

  // Gradient fade on the line tip
  const gradId = `hs-grad-${Math.random().toString(36).slice(2, 6)}`
  const defs = document.createElementNS(xmlns, 'defs')
  const grad = document.createElementNS(xmlns, 'linearGradient')
  grad.setAttribute('id', gradId)
  grad.setAttribute('x1', '0'); grad.setAttribute('y1', '0')
  grad.setAttribute('x2', '0'); grad.setAttribute('y2', '1')
  const stop1 = document.createElementNS(xmlns, 'stop')
  stop1.setAttribute('offset', '0%'); stop1.setAttribute('stop-color', `hsl(${haloHue},100%,80%)`); stop1.setAttribute('stop-opacity', '0.9')
  const stop2 = document.createElementNS(xmlns, 'stop')
  stop2.setAttribute('offset', '100%'); stop2.setAttribute('stop-color', `hsl(${haloHue},100%,50%)`); stop2.setAttribute('stop-opacity', '0')
  grad.appendChild(stop1); grad.appendChild(stop2)
  defs.appendChild(grad); sweepSvg.insertBefore(defs, sweepEl)
  sweepEl.setAttribute('stroke', `url(#${gradId})`)

  anims.push(animate(sweepSvg, {
    rotate: [0, 360],
    scale: [0.08, 0.75 + intensity * 0.35],
    opacity: [0, 0.8, 0.35, 0],
    duration: (700 + intensity * 400) * speedFactor,
    ease: 'outExpo',
  }))

  // ═══ 3. Corner brackets — HUD targeting reticle ═══
  const bracketSize = 60
  const bs = hsvg(bracketSize, bracketSize)
  const b = 6 // bracket arm length
  const m = 5 // margin from corner
  const glow = `drop-shadow(0 0 5px hsl(${haloHue},100%,65%))`
  hpath(bs, `M${m},${m + b} L${m},${m} L${m + b},${m}`, `hsl(${haloHue},100%,78%)`, 1.5, glow)
  hpath(bs, `M${bracketSize - m - b},${m} L${bracketSize - m},${m} L${bracketSize - m},${m + b}`, `hsl(${haloHue},100%,78%)`, 1.5, glow)
  hpath(bs, `M${bracketSize - m},${bracketSize - m - b} L${bracketSize - m},${bracketSize - m} L${bracketSize - m - b},${bracketSize - m}`, `hsl(${haloHue},100%,78%)`, 1.5, glow)
  hpath(bs, `M${m + b},${bracketSize - m} L${m},${bracketSize - m} L${m},${bracketSize - m - b}`, `hsl(${haloHue},100%,78%)`, 1.5, glow)

  anims.push(animate(bs, {
    scale: [0.2, 0.78, 1.1 + intensity * 0.5],
    opacity: [0, 0.8, 0],
    duration: (550 + intensity * 300) * speedFactor,
    delay: 40,
    ease: 'outExpo',
  }))

  // ═══ 4. Crosshair reticle — fine cross lines ═══
  const crossSize = 100
  const cs = hsvg(crossSize, crossSize)
  const cc = crossSize / 2
  const crossLen = 14
  hline(cs, cc, cc - crossLen, cc, cc - 3, `hsla(${haloHue},100%,70%,0.5)`, 0.8)
  hline(cs, cc, cc + 3, cc, cc + crossLen, `hsla(${haloHue},100%,70%,0.5)`, 0.8)
  hline(cs, cc - crossLen, cc, cc - 3, cc, `hsla(${haloHue},100%,70%,0.5)`, 0.8)
  hline(cs, cc + 3, cc, cc + crossLen, cc, `hsla(${haloHue},100%,70%,0.5)`, 0.8)
  // Center dot
  const cdot = document.createElementNS(xmlns, 'circle')
  cdot.setAttribute('cx', `${cc}`); cdot.setAttribute('cy', `${cc}`)
  cdot.setAttribute('r', `${2 + intensity}`)
  cdot.setAttribute('fill', `hsl(${haloHue},100%,85%)`)
  cdot.style.filter = `drop-shadow(0 0 8px hsl(${haloHue},100%,70%)) drop-shadow(0 0 16px hsl(${haloHue},100%,50%))`
  cs.appendChild(cdot)

  anims.push(animate(cs, {
    scale: [0.1, 1, 1.5 + intensity * 0.6],
    opacity: [0, 0.7, 0],
    duration: (500 + intensity * 250) * speedFactor,
    delay: 20,
    ease: 'outExpo',
  }))

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
