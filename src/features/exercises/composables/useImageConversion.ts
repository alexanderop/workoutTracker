import { computed, shallowReadonly, shallowRef, type ComputedRef, type ShallowRef } from 'vue'
import { convertImageToWebP, type ConversionResult } from '@/features/exercises/lib/imageConversion'

type ErrorCode = 'file-too-large' | 'conversion-failed' | 'invalid-image'

type ConversionState =
  | { status: 'idle' }
  | { status: 'converting' }
  | { status: 'success'; blob: Blob }
  | { status: 'error'; error: ErrorCode }

export type UseImageConversionReturn = {
  state: Readonly<ShallowRef<ConversionState>>
  isConverting: ComputedRef<boolean>
  hasError: ComputedRef<boolean>
  convertedBlob: ComputedRef<Blob | undefined>
  convert: (file: File) => Promise<ConversionResult>
  reset: () => void
}

/**
 * Composable for converting images to WebP format with reactive state.
 *
 * Provides:
 * - Automatic WebP conversion with size/dimension limits
 * - Reactive state tracking (idle, converting, success, error)
 */
export function useImageConversion(): UseImageConversionReturn {
  const state = shallowRef<ConversionState>({ status: 'idle' })

  const isConverting = computed(() => state.value.status === 'converting')

  const hasError = computed(() => state.value.status === 'error')

  const convertedBlob = computed(() => {
    if (state.value.status !== 'success') return
    return state.value.blob
  })

  async function convert(file: File): Promise<ConversionResult> {
    state.value = { status: 'converting' }

    const result = await convertImageToWebP(file)

    state.value = result.success
      ? { status: 'success', blob: result.blob }
      : { status: 'error', error: result.error }

    return result
  }

  function reset(): void {
    state.value = { status: 'idle' }
  }

  return {
    state: shallowReadonly(state),
    isConverting,
    hasError,
    convertedBlob,
    convert,
    reset,
  }
}
