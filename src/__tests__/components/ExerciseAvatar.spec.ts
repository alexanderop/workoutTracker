import { render } from 'vitest-browser-vue'
import { page } from 'vitest/browser'
import { describe, expect, it } from 'vitest'
import ExerciseAvatar from '@/exercises/ui/ExerciseAvatar.vue'
import { createTestImageBlob } from '@/__tests__/factories/image'

const exerciseIconTestIdPattern = /^exercise-icon-/

describe('ExerciseAvatar', () => {
  it('uses a bundled pilot icon for a known canonical exercise name', async () => {
    render(ExerciseAvatar, { props: { name: 'Bench Press' } })

    await expect.element(page.getByTestId('exercise-icon-barbell-bench-press')).toBeVisible()
    await expect.element(page.getByText('BP')).toHaveClass('sr-only')
  })

  it('resolves a bundled pilot icon through an explicit alias', async () => {
    render(ExerciseAvatar, { props: { name: 'Strict Press' } })

    await expect.element(page.getByTestId('exercise-icon-barbell-overhead-press')).toBeVisible()
  })

  it('falls back to initials for an unknown exercise', async () => {
    render(ExerciseAvatar, { props: { name: 'Moon Lift' } })

    await expect.element(page.getByText('ML')).toBeVisible()
    await expect.element(page.getByTestId(exerciseIconTestIdPattern)).not.toBeInTheDocument()
  })

  it('prioritizes an uploaded image over a bundled icon', async () => {
    const image = await createTestImageBlob()
    render(ExerciseAvatar, { props: { name: 'Bench Press', image } })

    const uploadedImage = page.getByRole('img', { name: 'Bench Press' })
    await expect.element(uploadedImage).toBeVisible()
    const imageElement = await uploadedImage.element()
    const source = imageElement.getAttribute('src')
    expect(source?.startsWith('blob:')).toBe(true)
    await expect
      .element(page.getByTestId('exercise-icon-barbell-bench-press'))
      .not.toBeInTheDocument()
  })

  it('preserves the existing size API', async () => {
    const { container } = render(ExerciseAvatar, { props: { name: 'Moon Lift', size: 'xl' } })

    const avatar = container.firstElementChild
    expect(avatar?.classList.contains('h-14')).toBe(true)
    expect(avatar?.classList.contains('w-14')).toBe(true)
  })
})
