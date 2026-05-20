import { ref, onUnmounted } from 'vue'
import { useBackgroundSource } from './useBackgroundSource'

const MAX_DIMENSION = 8192
const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export function useBackgroundUpload() {
  const { setUploadedImage } = useBackgroundSource()

  const dragActive = ref(false)
  let dragEnterCount = 0

  const uploadedFileName = ref<string | null>(null)
  const error = ref<string | null>(null)
  let currentObjectURL: string | null = null

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

    const file = event.dataTransfer?.files?.[0]
    if (file) processFile(file)
  }

  // ── Click-to-browse ──
  function handleFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    if (file) processFile(file)
    input.value = ''
  }

  // ── File processing ──
  function processFile(file: File): void {
    error.value = null

    if (!ALLOWED_TYPES.includes(file.type)) {
      error.value = '仅支持 JPG、PNG、WEBP 格式'
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      error.value = `文件过大（${(file.size / 1024 / 1024).toFixed(1)}MB），上限 20MB`
      return
    }

    // Revoke previous object URL
    if (currentObjectURL) {
      URL.revokeObjectURL(currentObjectURL)
      currentObjectURL = null
    }

    const objectURL = URL.createObjectURL(file)
    currentObjectURL = objectURL

    // Preload image before applying
    const img = new Image()
    img.onload = () => {
      if (img.naturalWidth > MAX_DIMENSION || img.naturalHeight > MAX_DIMENSION) {
        error.value = `图片尺寸过大（${img.naturalWidth}×${img.naturalHeight}），上限 ${MAX_DIMENSION}px`
        URL.revokeObjectURL(objectURL)
        if (currentObjectURL === objectURL) currentObjectURL = null
        return
      }

      setUploadedImage(objectURL, file.name, file.size, img.naturalWidth, img.naturalHeight)
      uploadedFileName.value = file.name
      error.value = null
    }

    img.onerror = () => {
      error.value = '图片加载失败'
      URL.revokeObjectURL(objectURL)
      if (currentObjectURL === objectURL) currentObjectURL = null
    }

    img.src = objectURL
  }

  function clearError(): void {
    error.value = null
  }

  onUnmounted(() => {
    if (currentObjectURL) {
      URL.revokeObjectURL(currentObjectURL)
      currentObjectURL = null
    }
  })

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
