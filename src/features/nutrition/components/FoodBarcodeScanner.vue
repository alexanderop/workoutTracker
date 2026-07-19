<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import { tryCatch } from '@/lib/tryCatch'

// The BarcodeDetector API is not in TypeScript's DOM lib yet.
type DetectedBarcode = { rawValue: string }
type BarcodeDetectorLike = { detect(source: HTMLVideoElement): Promise<Array<DetectedBarcode>> }
type BarcodeDetectorConstructor = new (options?: { formats?: Array<string> }) => BarcodeDetectorLike

/** Retail food packaging uses the EAN/UPC family of barcodes. */
const FOOD_BARCODE_FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e']

const emit = defineEmits<{ detected: [barcode: string]; cancel: [] }>()
const { t } = useI18n()

const videoRef = useTemplateRef('video')
const cameraFailed = ref(false)

let stream: MediaStream | null = null
let pollId: ReturnType<typeof globalThis.setInterval> | undefined
let stopped = false
let detecting = false

function isDetectorConstructor(value: unknown): value is BarcodeDetectorConstructor {
  return typeof value === 'function'
}

function getDetectorConstructor(): BarcodeDetectorConstructor | undefined {
  const candidate: unknown = Reflect.get(globalThis, 'BarcodeDetector')
  return isDetectorConstructor(candidate) ? candidate : undefined
}

function stopTracks(mediaStream: MediaStream) {
  for (const track of mediaStream.getTracks()) track.stop()
}

function stopCamera() {
  if (pollId !== undefined) globalThis.clearInterval(pollId)
  pollId = undefined
  if (stream) stopTracks(stream)
  stream = null
  if (videoRef.value) videoRef.value.srcObject = null
}

async function detectOnce(detector: BarcodeDetectorLike) {
  const video = videoRef.value
  if (detecting || stopped || !video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
    return
  }
  detecting = true
  const [, barcodes] = await tryCatch(detector.detect(video))
  detecting = false
  const barcode = barcodes?.[0]?.rawValue
  if (!barcode || stopped) return
  stopped = true
  stopCamera()
  emit('detected', barcode)
}

onMounted(async () => {
  const DetectorConstructor = getDetectorConstructor()
  const mediaDevices = globalThis.navigator.mediaDevices
  if (!DetectorConstructor || mediaDevices === undefined) {
    cameraFailed.value = true
    return
  }
  const detector = new DetectorConstructor({ formats: FOOD_BARCODE_FORMATS })
  const [error, mediaStream] = await tryCatch(
    mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }),
  )
  if (error) {
    cameraFailed.value = true
    return
  }
  if (stopped || !videoRef.value) {
    stopTracks(mediaStream)
    return
  }
  stream = mediaStream
  videoRef.value.srcObject = mediaStream
  await tryCatch(videoRef.value.play())
  pollId = globalThis.setInterval(() => {
    void detectOnce(detector)
  }, 300)
})

onBeforeUnmount(() => {
  stopped = true
  stopCamera()
})
</script>

<template>
  <div class="space-y-3">
    <video
      ref="video"
      class="aspect-[4/3] w-full rounded-md bg-muted object-cover"
      autoplay
      muted
      playsinline
    />
    <p v-if="cameraFailed" role="alert" class="text-sm text-destructive">
      {{ t('nutrition.food.scanCameraFailed') }}
    </p>
    <p v-else class="text-sm text-muted-foreground">{{ t('nutrition.food.scanHint') }}</p>
    <Button type="button" variant="outline" class="w-full" @click="emit('cancel')">
      {{ t('common.buttons.cancel') }}
    </Button>
  </div>
</template>
