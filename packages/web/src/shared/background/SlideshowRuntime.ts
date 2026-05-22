import type { Slide } from './types'

export class SlideshowRuntime {
  private photos: Slide[] = []
  private currentIndex = 0
  private intervalSec = 10
  private timer: ReturnType<typeof setInterval> | null = null
  private onResolved: (url: string) => void
  private destroyed = false
  private preloading = false

  constructor(onResolved: (url: string) => void) {
    this.onResolved = onResolved
    this.onVisibilityChange = this.onVisibilityChange.bind(this)
  }

  start(photos: Slide[], intervalSec: number): void {
    this.stop()
    this.photos = photos
    this.intervalSec = intervalSec
    this.currentIndex = 0
    this.destroyed = false

    // Show first photo immediately
    this.onResolved(this.photos[0].url)

    // Schedule advance timer
    this.scheduleTimer()
    document.addEventListener('visibilitychange', this.onVisibilityChange)
  }

  stop(): void {
    this.clearTimer()
    document.removeEventListener('visibilitychange', this.onVisibilityChange)
  }

  pause(): void {
    this.clearTimer()
  }

  resume(): void {
    if (this.destroyed) return
    this.scheduleTimer()
  }

  setInterval(sec: number): void {
    this.intervalSec = sec
    if (this.timer !== null) {
      // Restart with new interval
      this.scheduleTimer()
    }
  }

  updatePhotos(photos: Slide[], currentIndex?: number): void {
    this.photos = photos
    if (currentIndex !== undefined) {
      this.currentIndex = Math.min(currentIndex, photos.length - 1)
    } else if (this.currentIndex >= photos.length) {
      this.currentIndex = photos.length - 1
    }
  }

  async advance(): Promise<void> {
    if (this.destroyed || this.photos.length === 0) return
    if (this.preloading) return

    const nextIndex = (this.currentIndex + 1) % this.photos.length
    const nextPhoto = this.photos[nextIndex]

    this.preloading = true

    try {
      // Preload: decode before switching to prevent white flash
      const img = new Image()
      img.src = nextPhoto.url
      await img.decode()
    } catch {
      // If preload fails, still try to advance (browser may have cached it)
    }

    this.preloading = false

    if (this.destroyed) return

    this.currentIndex = nextIndex
    this.onResolved(nextPhoto.url)
  }

  destroy(): void {
    this.destroyed = true
    this.stop()
  }

  private scheduleTimer(): void {
    this.clearTimer()
    if (this.destroyed || this.photos.length <= 1) return

    this.timer = setInterval(() => {
      this.advance()
    }, this.intervalSec * 1000)
  }

  private clearTimer(): void {
    if (this.timer !== null) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  private onVisibilityChange(): void {
    if (document.hidden) {
      this.pause()
    } else {
      this.resume()
    }
  }
}
