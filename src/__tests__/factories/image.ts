/**
 * Factory functions for creating test image Blobs and Files.
 * Uses canvas.toBlob() to generate valid PNG images.
 */

const DEFAULT_WIDTH = 100
const DEFAULT_HEIGHT = 100
const DEFAULT_COLOR = '#4A90D9'

/**
 * Creates a test image Blob using canvas.
 * Generates a simple colored square PNG image.
 * @returns Promise resolving to a PNG Blob
 */
export async function createTestImageBlob(): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = DEFAULT_WIDTH
  canvas.height = DEFAULT_HEIGHT

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Failed to get canvas 2D context')
  }

  // Draw a simple colored rectangle
  ctx.fillStyle = DEFAULT_COLOR
  ctx.fillRect(0, 0, DEFAULT_WIDTH, DEFAULT_HEIGHT)

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Failed to create image blob'))
        return
      }
      resolve(blob)
    }, 'image/png')
  })
}

/**
 * Creates a test image File with the given filename.
 * @param filename - The name for the File object (e.g., 'test-image.png')
 * @returns Promise resolving to a PNG File
 */
export async function createTestImageFile(filename: string): Promise<File> {
  const blob = await createTestImageBlob()
  return new File([blob], filename, { type: 'image/png' })
}
