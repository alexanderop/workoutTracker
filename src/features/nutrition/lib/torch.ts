/**
 * Torch (flashlight) control on a camera track, which TypeScript's DOM lib
 * does not type — it's a non-standard capability/constraint exposed by
 * Chromium-based browsers on `MediaStreamTrack`.
 */
export type MediaTrackCapabilitiesWithTorch = MediaTrackCapabilities & { torch?: boolean }
type MediaTrackConstraintSetWithTorch = MediaTrackConstraintSet & { torch?: boolean }

export function trackSupportsTorch(track: MediaStreamTrack): boolean {
  const capabilities: MediaTrackCapabilitiesWithTorch | undefined = track.getCapabilities?.()
  return capabilities?.torch === true
}

export function setTrackTorch(track: MediaStreamTrack, on: boolean): Promise<void> {
  const constraints: MediaTrackConstraintSetWithTorch = { torch: on }
  return track.applyConstraints({ advanced: [constraints] })
}
