import { describe, expect, it } from 'vitest'
import { convertImageToWebP } from '@/lib/imageConversion'
import { createTestImageFile } from '../factories'

async function createSizedImageFile(width: number, height: number): Promise<File> {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')
  if (!context) throw new Error('Failed to get canvas 2D context')
  context.fillStyle = '#4A90D9'
  context.fillRect(0, 0, width, height)

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => {
      if (!b) {
        reject(new Error('Failed to create image blob'))
        return
      }
      resolve(b)
    }, 'image/png')
  })
  return new File([blob], 'sized.png', { type: 'image/png' })
}

async function getBlobDimensions(blob: Blob): Promise<{ width: number; height: number }> {
  const bitmap = await createImageBitmap(blob)
  const dimensions = { width: bitmap.width, height: bitmap.height }
  bitmap.close()
  return dimensions
}

describe('convertImageToWebP', () => {
  it('converts a PNG file to a WebP blob', async () => {
    const file = await createTestImageFile('avatar.png')

    const result = await convertImageToWebP(file)

    expect(result.success).toBe(true)
    if (!result.success) throw new Error('Expected conversion to succeed')
    expect(result.blob.type).toBe('image/webp')
    expect(result.blob.size).toBeGreaterThan(0)
  })

  it('keeps small images at their original dimensions', async () => {
    const file = await createSizedImageFile(200, 150)

    const result = await convertImageToWebP(file)

    if (!result.success) throw new Error('Expected conversion to succeed')
    await expect(getBlobDimensions(result.blob)).resolves.toEqual({ width: 200, height: 150 })
  })

  it('resizes landscape images above 1024px preserving aspect ratio', async () => {
    const file = await createSizedImageFile(2048, 1024)

    const result = await convertImageToWebP(file)

    if (!result.success) throw new Error('Expected conversion to succeed')
    await expect(getBlobDimensions(result.blob)).resolves.toEqual({ width: 1024, height: 512 })
  })

  it('resizes portrait images above 1024px preserving aspect ratio', async () => {
    const file = await createSizedImageFile(512, 2048)

    const result = await convertImageToWebP(file)

    if (!result.success) throw new Error('Expected conversion to succeed')
    await expect(getBlobDimensions(result.blob)).resolves.toEqual({ width: 256, height: 1024 })
  })

  it('rejects files larger than the 10MB input limit', async () => {
    const oversized = new File([new ArrayBuffer(10 * 1024 * 1024 + 1)], 'huge.png', {
      type: 'image/png',
    })

    await expect(convertImageToWebP(oversized)).resolves.toEqual({
      success: false,
      error: 'file-too-large',
    })
  })

  it('rejects files with disallowed MIME types', async () => {
    const svg = new File(['<svg xmlns="http://www.w3.org/2000/svg"/>'], 'sneaky.svg', {
      type: 'image/svg+xml',
    })

    await expect(convertImageToWebP(svg)).resolves.toEqual({
      success: false,
      error: 'invalid-image',
    })
  })

  it('rejects files that claim to be images but are not decodable', async () => {
    const corrupt = new File(['not actually a png'], 'corrupt.png', { type: 'image/png' })

    await expect(convertImageToWebP(corrupt)).resolves.toEqual({
      success: false,
      error: 'invalid-image',
    })
  })
})
