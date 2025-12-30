/**
 * Image conversion utilities for converting images to WebP format
 * with size constraints using the Canvas API.
 */

import { tryCatch } from './tryCatch'

const MAX_SIZE_BYTES = 1024 * 1024 // 1MB output limit
const MAX_INPUT_SIZE_BYTES = 10 * 1024 * 1024 // 10MB input limit
const MAX_DIMENSION = 1024 // Maximum width/height in pixels
const WEBP_QUALITY = 0.8 // WebP quality setting (0-1)

// Whitelist of allowed MIME types for security
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp'])

export type ConversionResult =
  | { success: true; blob: Blob }
  | { success: false; error: 'file-too-large' | 'conversion-failed' | 'invalid-image' }

/**
 * Loads a File as an HTMLImageElement.
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.addEventListener('load', () => {
      URL.revokeObjectURL(url)
      resolve(img)
    })

    img.addEventListener('error', () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    })

    img.src = url
  })
}

/**
 * Calculates new dimensions to fit within max bounds while maintaining aspect ratio.
 */
function calculateResizedDimensions(
  width: number,
  height: number,
  maxDimension: number,
): { width: number; height: number } {
  if (width <= maxDimension && height <= maxDimension) {
    return { width, height }
  }

  const aspectRatio = width / height

  if (width > height) {
    return {
      width: maxDimension,
      height: Math.round(maxDimension / aspectRatio),
    }
  }

  return {
    width: Math.round(maxDimension * aspectRatio),
    height: maxDimension,
  }
}

/**
 * Converts a canvas to a WebP Blob.
 */
function canvasToWebPBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to create WebP blob'))
          return
        }
        resolve(blob)
      },
      'image/webp',
      quality,
    )
  })
}

/**
 * Converts an image file to WebP format with size constraints.
 *
 * - Resizes large images to fit within MAX_DIMENSION (1024px)
 * - Converts to WebP format with 0.8 quality
 * - Rejects if final size exceeds 1MB
 *
 * @param file - The image file to convert
 * @returns ConversionResult with either the converted Blob or an error
 */
export async function convertImageToWebP(file: File): Promise<ConversionResult> {
  // Validate input file size first (prevents memory exhaustion)
  if (file.size > MAX_INPUT_SIZE_BYTES) {
    return { success: false, error: 'file-too-large' }
  }

  // Validate MIME type (security: prevent SVG with scripts, etc.)
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return { success: false, error: 'invalid-image' }
  }

  // Load the image
  const [loadError, img] = await tryCatch(loadImage(file))
  if (loadError || !img) {
    return { success: false, error: 'invalid-image' }
  }

  // Calculate resized dimensions
  const { width, height } = calculateResizedDimensions(img.width, img.height, MAX_DIMENSION)

  // Create canvas and draw resized image
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')
  if (!context) {
    return { success: false, error: 'conversion-failed' }
  }

  context.drawImage(img, 0, 0, width, height)

  // Convert to WebP
  const [convertError, webpBlob] = await tryCatch(canvasToWebPBlob(canvas, WEBP_QUALITY))
  if (convertError || !webpBlob) {
    return { success: false, error: 'conversion-failed' }
  }

  // Check size limit
  if (webpBlob.size > MAX_SIZE_BYTES) {
    return { success: false, error: 'file-too-large' }
  }

  return { success: true, blob: webpBlob }
}
