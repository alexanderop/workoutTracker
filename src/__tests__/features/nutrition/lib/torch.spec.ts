import { describe, expect, it, vi } from 'vitest'
import type { MediaTrackCapabilitiesWithTorch } from '@/features/nutrition/lib/torch'
import { setTrackTorch, trackSupportsTorch } from '@/features/nutrition/lib/torch'

function createVideoTrack(): MediaStreamTrack {
  const canvas = document.createElement('canvas')
  canvas.width = 4
  canvas.height = 4
  const stream = canvas.captureStream(0)
  const track = stream.getVideoTracks()[0]
  if (!track) throw new Error('expected canvas.captureStream to produce a video track')
  return track
}

describe('trackSupportsTorch', () => {
  it('reports no support when the track capabilities omit torch', () => {
    expect(trackSupportsTorch(createVideoTrack())).toBe(false)
  })

  it('reports support when the track capabilities include torch', () => {
    const track = createVideoTrack()
    const capabilities: MediaTrackCapabilitiesWithTorch = { torch: true }
    vi.spyOn(track, 'getCapabilities').mockReturnValue(capabilities)

    expect(trackSupportsTorch(track)).toBe(true)
  })
})

describe('setTrackTorch', () => {
  it('applies a torch constraint matching the requested state', async () => {
    const track = createVideoTrack()
    const applyConstraints = vi.spyOn(track, 'applyConstraints').mockResolvedValue(undefined)

    await setTrackTorch(track, true)

    expect(applyConstraints).toHaveBeenCalledWith({ advanced: [{ torch: true }] })
  })
})
