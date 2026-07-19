/**
 * Minimal typing for the BarcodeDetector API, which TypeScript's DOM lib
 * does not include yet.
 */
type DetectedBarcode = { rawValue: string }
export type BarcodeDetectorLike = {
  detect: (source: HTMLVideoElement) => Promise<Array<DetectedBarcode>>
}
type BarcodeDetectorConstructor = new (options?: { formats?: Array<string> }) => BarcodeDetectorLike

function isDetectorConstructor(value: unknown): value is BarcodeDetectorConstructor {
  return typeof value === 'function'
}

export function getBarcodeDetectorConstructor(): BarcodeDetectorConstructor | undefined {
  const candidate: unknown = Reflect.get(globalThis, 'BarcodeDetector')
  return isDetectorConstructor(candidate) ? candidate : undefined
}

export function isBarcodeScanSupported(): boolean {
  return (
    getBarcodeDetectorConstructor() !== undefined && globalThis.navigator.mediaDevices !== undefined
  )
}
