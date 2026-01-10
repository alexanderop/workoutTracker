# Settings Feature Mutation Testing Results

**Date**: 2026-01-08
**Target**: Settings feature integration tests
**Test File**: `src/__tests__/integration/settings-preferences.spec.ts`

## Summary

| Metric | Value |
|--------|-------|
| Total Mutations | 13 |
| Killed | 5 |
| Survived | 8 |
| **Score** | **38%** |

## Surviving Mutants (Action Required)

| # | File | Line | Original | Mutated | Why Survived |
|---|------|------|----------|---------|--------------|
| 1 | `stores/settings.ts` | 65 | `Math.max(volume, 0.5)` | `Math.max(volume, 0.4)` | No test for minimum volume boundary |
| 2 | `stores/settings.ts` | 65 | `Math.min(Math.max(volume, 0.5), 1)` | `Math.min(volume, 1)` | No test verifies minimum clamping |
| 3 | `composables/useTheme.ts` | 26 | `newMode === 'dark'` | `newMode !== 'dark'` | No test checks `document.documentElement.classList` |
| 4 | `composables/useLanguage.ts` | 16 | `settings.language === undefined` | `settings.language !== undefined` | No test for first-visit auto-detection |
| 5 | `stores/settings.ts` | 22 | `if (isLoading.value) return` | `if (!isLoading.value) return` | No test for concurrent load guard |
| 6 | `stores/settings.ts` | 28 | `if (error) return` | `if (!error) return` | No test for error handling path |
| 7 | `composables/useLanguage.ts` | 41 | `settings.setLanguage(locale)` | removed | Dead code - component calls store directly |
| 8 | `composables/useLanguage.ts` | 29 | `document.documentElement.lang = locale` | removed | No test verifies `<html lang="">` attribute |

## Killed Mutants (Tests Effective)

| # | File | Line | Original | Mutated | Killed By |
|---|------|------|----------|---------|-----------|
| 1 | `composables/useTheme.ts` | 16 | `colorMode.value === 'dark'` | `!==` | `toggles dark mode and persists preference` |
| 2 | `composables/useTheme.ts` | 18 | `value ? 'dark' : 'light'` | swapped | `toggles dark mode and persists preference` |
| 3 | `composables/useLanguage.ts` | 8 | `browserLang === 'de'` | `!==` | Integration tests (locale detection) |
| 4 | `stores/settings.ts` | 41 | `getSettingsRepository().set(...)` | removed | `switches from kg to lbs and persists` |

## Suggested Tests to Add

### 1. Dark Mode DOM Class Verification

```typescript
it('adds dark class to html element when dark mode enabled', async () => {
  const { common, cleanup } = await createTestApp()
  await common.navigateToSettings()

  const themeToggle = page.getByTestId('theme-toggle')
  const initialIsDark = document.documentElement.classList.contains('dark')

  await userEvent.click(themeToggle)

  await expect.poll(() =>
    document.documentElement.classList.contains('dark')
  ).toBe(!initialIsDark)

  cleanup()
})
```

### 2. Language HTML Attribute Verification

```typescript
it('sets html lang attribute when language changes to German', async () => {
  const { common, getByRole, findByText, cleanup } = await createTestApp()
  await common.navigateToSettings()

  await expect.element(page.getByRole('heading', { name: 'Settings' })).toBeVisible()

  const languageSelect = getByRole('combobox', { name: /language/i })
  await userEvent.click(languageSelect)
  const germanOption = await findByText('Deutsch')
  await userEvent.click(germanOption)

  await expect.poll(() => document.documentElement.lang).toBe('de')

  cleanup()
})
```

### 3. Volume Slider Boundary Tests

```typescript
it('volume slider has minimum value constraint of 50%', async () => {
  const { common, cleanup } = await createTestApp()
  await common.navigateToSettings()

  const volumeSlider = page.getByTestId('timer-sound-volume-slider')
  await expect.element(volumeSlider).toBeVisible()

  // Verify minimum value attribute exists
  await expect.poll(async () => {
    const el = await volumeSlider.element()
    return el.getAttribute('min')
  }).toBeTruthy()

  cleanup()
})

it('persists volume value to database when changed', async () => {
  const { common, cleanup } = await createTestApp()
  await common.navigateToSettings()

  const volumeSlider = page.getByTestId('timer-sound-volume-slider')
  const sliderEl = await volumeSlider.element()
  if (sliderEl instanceof HTMLInputElement) {
    sliderEl.value = '0.7'
    sliderEl.dispatchEvent(new Event('change', { bubbles: true }))
  }

  await expect.poll(async () => {
    const settings = await db.settings.toArray()
    const volumeSetting = settings.find((s) => s.key === 'timerSoundVolume')
    return volumeSetting?.value
  }).toBe(0.7)

  cleanup()
})
```

### 4. Settings Loading from Database

```typescript
it('settings load from database on app initialization', async () => {
  // Pre-populate database with non-default settings
  await db.settings.put({ key: 'weightUnit', value: 'lbs' })

  const { common, getByRole, cleanup } = await createTestApp()
  await common.navigateToSettings()

  const lbsButton = getByRole('button', { name: /pounds/i })
  await expect.poll(async () => {
    const el = await lbsButton.element()
    return el.dataset.state
  }).toBe('on')

  cleanup()
})
```

## Code Quality Finding

**Dead Code Detected**: `useLanguage.setLanguage()` is exported but never called.

The component `SettingsAppearanceSection.vue:23` calls `settingsStore.setLanguage(value)` directly instead of `useLanguage().setLanguage()`.

**Recommendation**: Either:
1. Remove `setLanguage` from `useLanguage` composable
2. Update component to use the composable's method for consistency

## Notes

- The watcher in `useTheme.ts` that syncs DOM class may be redundant since VueUse's `useColorMode` with `attribute: 'class'` already manages the class
- Consider investigating if the watcher can be removed entirely
