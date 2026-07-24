import type { Ref } from 'vue'
import { computed, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { useImageConversion } from '@/features/exercises/composables/useImageConversion'

type ImageFormState = {
  image: Blob | undefined
  imageError: string | undefined
}

/**
 * Composable for handling image upload with conversion to WebP format.
 * Manages file input triggering, image conversion, and error handling.
 *
 * @param form - Reactive form state with image and imageError properties
 * @returns displayText - Computed text showing uploaded image size
 * @returns trigger - Function to open file picker dialog
 * @returns handleSelect - Event handler for file selection
 */
export function useImageUpload(form: Ref<ImageFormState>) {
  const { t } = useI18n()
  const { convert } = useImageConversion()
  const inputReference = useTemplateRef<HTMLInputElement>('imageInput')

  const displayText = computed(() => {
    if (!form.value.image) return ''
    const sizeKb = Math.round(form.value.image.size / 1024)
    return `${t('exercises.create.imageUploaded')} (${sizeKb} KB)`
  })

  function trigger() {
    inputReference.value?.click()
  }

  async function handleSelect(event: Event) {
    const input = event.target
    if (!(input instanceof HTMLInputElement)) return

    const file = input.files?.[0]
    input.value = '' // Reset for re-selection
    if (!file) return

    form.value.imageError = undefined
    const result = await convert(file)

    if (result.success) {
      form.value.image = result.blob
      return
    }

    const errorMessages: Record<string, string> = {
      'file-too-large': t('exercises.create.errors.imageTooLarge'),
      'invalid-image': t('exercises.create.errors.invalidImage'),
    }
    form.value.imageError =
      errorMessages[result.error] ?? t('exercises.create.errors.conversionFailed')
  }

  return { displayText, trigger, handleSelect }
}
