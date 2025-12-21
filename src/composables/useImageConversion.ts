import { computed, readonly, ref, type ComputedRef, type Ref } from 'vue'
import { convertImageToWebP, type ConversionResult } from '@/lib/imageConversion'

type ErrorCode = 'file-too-large' | 'conversion-failed' | 'invalid-image'

type ConversionState =
  | { status: 'idle' }
  | { status: 'converting' }
  | { status: 'success'; blob: Blob }
  | { status: 'error'; error: ErrorCode }

type UseImageConversionReturn = {
  state: Readonly<Ref<ConversionState>>
  isConverting: ComputedRef<boolean>
  hasError: ComputedRef<boolean>
  errorMessage: ComputedRef<string | undefined>
  convertedBlob: ComputedRef<Blob | undefined>
  convert: (file: File) => Promise<ConversionResult>
  reset: () => void
}

const ERROR_MESSAGES: Record<ErrorCode, string> = {
  'file-too-large': 'Image exceeds 1MB after conversion. Please use a smaller image.',
  'conversion-failed': 'Failed to convert image. Please try a different file.',
  'invalid-image': 'Invalid image file. Please select a valid image.',
}

/**
 * Composable for converting images to WebP format with reactive state.
 *
 * Provides:
 * - Automatic WebP conversion with size/dimension limits
 * - Reactive state tracking (idle, converting, success, error)
 * - Error messages for user feedback
 */
export function useImageConversion(): UseImageConversionReturn {
  const state = ref<ConversionState>({ status: 'idle' })

  const isConverting = computed(() => state.value.status === 'converting')

  const hasError = computed(() => state.value.status === 'error')

  const errorMessage = computed(() => {
    if (state.value.status !== 'error') return undefined
    return ERROR_MESSAGES[state.value.error]
  })

  const convertedBlob = computed(() => {
    if (state.value.status !== 'success') return undefined
    return state.value.blob
  })

  async function convert(file: File): Promise<ConversionResult> {
    state.value = { status: 'converting' }

    const result = await convertImageToWebP(file)

    state.value = result.success ? { status: 'success', blob: result.blob } : { status: 'error', error: result.error };

    return result
  }

  function reset(): void {
    state.value = { status: 'idle' }
  }

  return {
    state: readonly(state),
    isConverting,
    hasError,
    errorMessage,
    convertedBlob,
    convert,
    reset,
  }
}
