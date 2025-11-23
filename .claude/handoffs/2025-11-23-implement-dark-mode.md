# Implement Dark Mode Feature with VueUse and shadcn/ui

## 1. Primary Request and Intent

Implement a dark mode toggle feature using TDD (Test-Driven Development) methodology. The user wants:
- A working dark mode feature in a Vue 3 + Vite application
- Users can toggle dark/light mode from the Settings page
- Implementation using VueUse's `useDark()` composable and shadcn/ui's Switch component
- E2E test that verifies the feature works correctly (test created but currently failing)

## 2. Key Technical Concepts

- **Test-Driven Development (TDD)**: Start with failing E2E test, then implement to make it pass
- **VueUse Composables**: `useDark()` for dark mode state management with auto-persistence, `useToggle()` for toggle functionality
- **shadcn/ui Switch Component**: Binary toggle UI component from shadcn/ui
- **Tailwind CSS Dark Mode**: Uses `dark` class on html element for dark mode styles
- **localStorage Persistence**: VueUse's useDark automatically persists theme preference
- **System Preference Fallback**: VueUse respects `prefers-color-scheme` media query when no saved preference exists

## 3. Files and Code Sections

### `/e2e/theme-toggle.spec.ts`
- **Status**: CREATED and FAILING (as expected in TDD)
- **Why important**: The test that defines what the feature should do
- **What it tests**:
  - User can navigate to `/settings`
  - Find element with `data-testid="theme-toggle"`
  - Click toggle to apply/remove `dark` class on html element
  - Theme persists on page reload

**Code**:
```typescript
import { test, expect } from '@playwright/test'

test('user can toggle dark mode theme in settings', async ({ page }) => {
  // Navigate to settings page
  await page.goto('/settings')

  // Check that the settings page is loaded
  await expect(page.locator('h1')).toContainText('Settings')

  // Find the theme toggle
  const themeToggle = page.locator('[data-testid="theme-toggle"]')
  await expect(themeToggle).toBeVisible()

  // Initially, the page should be in light mode (default)
  const html = page.locator('html')
  await expect(html).not.toHaveClass('dark')

  // Click the toggle to switch to dark mode
  await themeToggle.click()

  // Verify dark mode is applied
  await expect(html).toHaveClass('dark')

  // Click toggle again to switch back to light mode
  await themeToggle.click()

  // Verify light mode is applied
  await expect(html).not.toHaveClass('dark')

  // Verify theme persists on page reload
  await page.reload()
  await expect(html).not.toHaveClass('dark')
})
```

### `/src/views/Settings.vue`
- **Current state**: Has Theme card section but is empty (no toggle yet)
- **What needs to change**: Add Switch component with dark mode toggle logic
- **Current relevant code**:
```vue
<Card>
  <CardHeader>
    <CardTitle class="text-lg">Theme</CardTitle>
    <CardDescription>Choose your preferred theme</CardDescription>
  </CardHeader>
</Card>
```

### `/src/components/Layout.vue`
- **Why important**: The html element where `dark` class will be applied
- **Current structure**: Uses Tailwind CSS classes like `bg-background`, `text-foreground` that respond to dark mode

### `/package.json`
- **Key dependency**: `@vueuse/core` v14.0.0 already installed
- **Key dependency**: shadcn/ui components available (need to install Switch if not present)

## 4. Problem Solving

**Test Failure Analysis** (expected):
- The test failed because:
  1. `[data-testid="theme-toggle"]` element doesn't exist yet
  2. No logic to apply `dark` class to html element
  3. No persistence mechanism in place
- This is correct behavior for TDD - test should fail first

## 5. Next Steps

1. **Install Switch component**: Run `pnpm dlx shadcn-vue@latest add switch` to install the Switch component from shadcn/ui
2. **Update Settings.vue** to include the Switch component with VueUse integration:
   - Import `useDark` and `useToggle` from @vueuse/core
   - Import `Switch` from @/components/ui/switch
   - Import `Label` from @/components/ui/label
   - Create reactive dark mode state
   - Add Switch element with `data-testid="theme-toggle"`
   - Bind to toggle function
3. **Run the E2E test** to verify it passes: `pnpm test:e2e e2e/theme-toggle.spec.ts`
4. **Verify theme applies correctly** in both light and dark modes
