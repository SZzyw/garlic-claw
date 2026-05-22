import { ref } from 'vue'
import { useBackgroundSource } from './useBackgroundSource'
import type { Slide } from '@/shared/background/types'
import { DEFAULT_INTERVAL_SEC, MAX_SLIDESHOW_PHOTOS } from '@/shared/background/types'
import { useUiStore } from '@/shared/stores/ui'

const MAX_DIMENSION = 8192
const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export function useBackgroundUpload() {
  const { setUploadedImage, setSlideshow } = useBackgroundSource()

  const dragActive = ref(false)
  let dragEnterCount = 0

  const uploadedFileName = ref<string | null>(null)
  const error = ref<string | null>(null)

  // ── Drag handlers ──
  function handleDragEnter(event: DragEvent): void {
    event.preventDefault()
    dragEnterCount++
    dragActive.value = true
  }

  function handleDragLeave(event: DragEvent): void {
    event.preventDefault()
    dragEnterCount--
    if (dragEnterCount <= 0) {
      dragEnterCount = 0
      dragActive.value = false
    }
  }

  function handleDragOver(event: DragEvent): void {
    event.preventDefault()
  }

  function handleDrop(event: DragEvent): void {
    event.preventDefault()
    dragEnterCount = 0
    dragActive.value = false

    const files = event.dataTransfer?.files
    if (files && files.length > 0) {
      processFiles(Array.from(files))
    }
  }

  // ── Click-to-browse ──
  function handleFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement
    const files = input.files
    if (files && files.length > 0) {
      processFiles(Array.from(files))
    }
    input.value = ''
  }

  // ── File processing (single or multi) ──
  // Blob URL lifecycle is managed by the background store, not this composable
  function processFiles(files: File[]): void {
    error.value = null

    const valid: File[] = []
    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        error.value = '仅支持 JPG、PNG、WEBP 格式'
        continue
      }
      if (file.size > MAX_FILE_SIZE) {
        error.value = `文件过大（${(file.size / 1024 / 1024).toFixed(1)}MB），上限 20MB`
        continue
      }
      valid.push(file)
    }

    if (valid.length === 0) return

    const clamped = valid.slice(0, MAX_SLIDESHOW_PHOTOS)
    if (valid.length > MAX_SLIDESHOW_PHOTOS) {
      useUiStore().notify(`最多 ${MAX_SLIDESHOW_PHOTOS} 张图片，已截取前 ${MAX_SLIDESHOW_PHOTOS} 张`, 'error')
    }

    const slides: Slide[] = []
    let loadedCount = 0
    const total = clamped.length

    for (const file of clamped) {
      const objectURL = URL.createObjectURL(file)

      const img = new Image()
      img.onload = () => {
        loadedCount++

        if (img.naturalWidth > MAX_DIMENSION || img.naturalHeight > MAX_DIMENSION) {
          error.value = `图片尺寸过大（${img.naturalWidth}×${img.naturalHeight}），上限 ${MAX_DIMENSION}px`
          URL.revokeObjectURL(objectURL)
          return
        }

        slides.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          url: objectURL,
        })

        if (loadedCount === total) {
          if (slides.length === 0) return

          if (slides.length === 1) {
            setUploadedImage(slides[0].url, valid[0].name, valid[0].size, img.naturalWidth, img.naturalHeight)
            uploadedFileName.value = valid[0].name
          } else {
            setSlideshow(slides, DEFAULT_INTERVAL_SEC)
            uploadedFileName.value = `${slides.length} 张照片`
          }
          error.value = null
        }
      }

      img.onerror = () => {
        loadedCount++
        error.value = '图片加载失败'
        URL.revokeObjectURL(objectURL)
      }

      img.src = objectURL
    }
  }

  function clearError(): void {
    error.value = null
  }

  return {
    dragActive,
    uploadedFileName,
    error,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    handleFileSelect,
    clearError,
  }
}
