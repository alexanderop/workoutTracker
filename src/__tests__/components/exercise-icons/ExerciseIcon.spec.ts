import { render } from 'vitest-browser-vue'
import { page } from 'vitest/browser'
import { describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import {
  ExerciseIcon,
  exerciseIconKeys,
  getExerciseIcon,
  normalizeExerciseIconName,
  resolveExerciseIconKey,
  setExerciseIconOverride,
} from '@/components/exercise-icons'
import { exerciseIconManifest } from '@/components/exercise-icons/manifest'
import { popularExercises } from '@/data/popularExercises'

const exerciseIconTestIdPattern = /^exercise-icon-/

describe('exercise icon inventory', () => {
  it('keeps the generated registry synchronized with the authored manifest', () => {
    expect(exerciseIconKeys).toHaveLength(173)
    expect(exerciseIconKeys).toEqual(exerciseIconManifest.map(({ key }) => key))

    for (const entry of exerciseIconManifest) {
      const resolved = getExerciseIcon(entry.key)
      expect(resolved?.key).toBe(entry.key)
      expect(resolved?.title).toBe(entry.title)
      expect(resolved?.component).toBeTruthy()
    }
  })

  it('has unique stable keys and normalized aliases', () => {
    const keys = exerciseIconManifest.map(({ key }) => key)
    const aliases = exerciseIconManifest.flatMap(({ aliases: entryAliases }) =>
      entryAliases.map(normalizeExerciseIconName),
    )

    expect(new Set(keys).size).toBe(keys.length)
    expect(new Set(aliases).size).toBe(aliases.length)
  })

  it('resolves every explicit alias to its authored key', () => {
    for (const entry of exerciseIconManifest) {
      for (const alias of entry.aliases) {
        expect(resolveExerciseIconKey(alias)).toBe(entry.key)
      }
    }
  })

  it('resolves every built-in popular exercise to a bundled icon', () => {
    for (const exercise of popularExercises) {
      expect(resolveExerciseIconKey(exercise.name), exercise.name).not.toBeNull()
    }
  })

  it('returns null synchronously for an unknown exercise', () => {
    expect(resolveExerciseIconKey('Uncatalogued Moon Lift')).toBeNull()
    expect(getExerciseIcon('Uncatalogued Moon Lift')).toBeNull()
  })

  it('keeps the ten pilot poses first in the authored manifest', () => {
    expect(exerciseIconManifest.slice(0, 10).map(({ title }) => title)).toEqual([
      'Bench Press',
      'Barbell Row',
      'Deadlift',
      'Squat',
      'Overhead Press',
      'Dumbbell Curl',
      'Plank',
      'Kettlebell Swing',
      'Kettlebell Goblet Squat',
      'Kettlebell Turkish Get-up',
    ])
  })
})

describe('ExerciseIcon', () => {
  it('renders decorative artwork with stable data hooks and caller classes', async () => {
    render(ExerciseIcon, {
      props: {
        name: 'Bench Press',
        class: 'size-7 text-primary',
      },
    })

    const icon = page.getByTestId('exercise-icon-barbell-bench-press')
    await expect.element(icon).toHaveAttribute('data-icon', 'barbell-bench-press')
    await expect.element(icon).toHaveAttribute('data-exercise-icon', 'barbell-bench-press')
    await expect.element(icon).toHaveAttribute('aria-hidden', 'true')
    await expect.element(icon).toHaveClass('size-7')
    await expect.element(icon).toHaveClass('text-primary')
  })

  it('uses the canonical title or caller label for labeled artwork', async () => {
    render(ExerciseIcon, {
      props: {
        name: 'Deadlift',
        decorative: false,
      },
    })
    await expect.element(page.getByRole('img', { name: 'Deadlift' })).toBeVisible()

    render(ExerciseIcon, {
      props: {
        name: 'Plank',
        decorative: false,
        label: 'Core hold illustration',
      },
    })
    await expect.element(page.getByRole('img', { name: 'Core hold illustration' })).toBeVisible()
  })

  it('renders no placeholder for an unknown name', async () => {
    render(ExerciseIcon, { props: { name: 'Uncatalogued Moon Lift' } })
    await expect.element(page.getByTestId(exerciseIconTestIdPattern)).not.toBeInTheDocument()
  })

  it('supports a type-safe app override and restores the bundled icon', async () => {
    const OverrideIcon = defineComponent({
      inheritAttrs: false,
      setup(_, { attrs }) {
        return () => h('svg', { ...attrs, 'data-icon-override': 'true' })
      },
    })
    setExerciseIconOverride('bodyweight-plank', OverrideIcon)

    const { rerender } = render(ExerciseIcon, { props: { name: 'Plank' } })
    const overriddenIcon = page.getByTestId('exercise-icon-bodyweight-plank')
    await expect.element(overriddenIcon).toHaveAttribute('data-icon-override', 'true')

    setExerciseIconOverride('bodyweight-plank', null)
    await rerender({ name: 'Forearm Plank' })
    await expect
      .element(page.getByTestId('exercise-icon-bodyweight-plank'))
      .not.toHaveAttribute('data-icon-override')
  })

  it('renders every icon as a consistent 48 by 48 SVG', async () => {
    for (const key of exerciseIconKeys) {
      const { unmount } = render(ExerciseIcon, { props: { name: key } })
      const icon = page.getByTestId(`exercise-icon-${key}`)
      await expect.element(icon).toHaveAttribute('viewBox', '0 0 48 48')
      unmount()
    }
  })
})
