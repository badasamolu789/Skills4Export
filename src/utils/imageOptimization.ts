export type OptimizedImageFile = {
  file: File
  wasOptimized: boolean
  originalSize: number
  optimizedSize: number
}

export type ImageOptimizationOptions = {
  maxDimension?: number
  quality?: number
  outputType?: 'image/webp' | 'image/jpeg'
  outputExtension?: 'webp' | 'jpg'
}

const DEFAULT_MAX_DIMENSION = 1600
const DEFAULT_QUALITY = 0.86
const PAGE_AVATAR_MAX_DIMENSION = 1280
const MIN_SIZE_SAVINGS_RATIO = 0.95

const canvasToBlob = (canvas: HTMLCanvasElement, type: string, quality: number) =>
  new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, type, quality)
  })

const getOptimizedFileName = (name: string, extension: string) => {
  const baseName = name.replace(/\.[^.]+$/, '') || 'page-avatar'
  return `${baseName}.${extension}`
}

export const isOptimizableImageFile = (file?: File | null) =>
  Boolean(file && ['image/jpeg', 'image/png', 'image/webp'].includes(file.type))

export const optimizeImageFile = async (
  file: File,
  options: ImageOptimizationOptions = {},
): Promise<OptimizedImageFile> => {
  if (!isOptimizableImageFile(file)) {
    return {
      file,
      wasOptimized: false,
      originalSize: file.size,
      optimizedSize: file.size,
    }
  }

  if (typeof document === 'undefined' || typeof createImageBitmap === 'undefined') {
    return {
      file,
      wasOptimized: false,
      originalSize: file.size,
      optimizedSize: file.size,
    }
  }

  const bitmap = await createImageBitmap(file)
  const maxDimension = options.maxDimension ?? DEFAULT_MAX_DIMENSION
  const outputType = options.outputType ?? 'image/webp'
  const outputExtension = options.outputExtension ?? (outputType === 'image/jpeg' ? 'jpg' : 'webp')
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height))
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')
  if (!context) {
    bitmap.close()
    return {
      file,
      wasOptimized: false,
      originalSize: file.size,
      optimizedSize: file.size,
    }
  }

  context.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const blob = await canvasToBlob(canvas, outputType, options.quality ?? DEFAULT_QUALITY)
  if (!blob || blob.size >= file.size * MIN_SIZE_SAVINGS_RATIO) {
    return {
      file,
      wasOptimized: false,
      originalSize: file.size,
      optimizedSize: file.size,
    }
  }

  const optimizedFile = new File([blob], getOptimizedFileName(file.name, outputExtension), {
    type: outputType,
    lastModified: Date.now(),
  })

  return {
    file: optimizedFile,
    wasOptimized: true,
    originalSize: file.size,
    optimizedSize: optimizedFile.size,
  }
}

export const optimizePageAvatarFile = (file: File) =>
  optimizeImageFile(file, {
    maxDimension: PAGE_AVATAR_MAX_DIMENSION,
    quality: DEFAULT_QUALITY,
    outputType: 'image/webp',
    outputExtension: 'webp',
  })
