# Fix Timed Block Exercise List Tests

## 1. Primary Request and Intent
The user asked to fix failing tests in `src/__tests__/integration/timed-block-exercise-list.spec.ts`. After the initial i18n fix, the user clarified that tests should NOT render components in isolation - they should use `createTestApp` and test through user behavior (following the project's "only write integration tests" guideline). The tests are being rewritten to navigate to the AMRAP config dialog and test the exercise list behavior there.

## 2. Key Technical Concepts
- **Integration testing with createTestApp**: Project requires full app integration tests, not isolated component tests
- **Exercise picker overlay vs dialog mode**: The `WorkoutExercisePicker` component has two presentation modes - "dialog" and "overlay". Overlay mode doesn't use `role="dialog"` so `common.selectExercise()` doesn't work.
- **WorkoutTimedBlockExerciseList**: Shared component used in AMRAP/EMOM/ForTime config dialogs for managing exercises with reps/load inputs
- **Multiple inputs in dialog**: AMRAP dialog has duration input (number) + exercise reps (number) + exercise load (text), need to scope queries correctly

## 3. Files and Code Sections

### `src/__tests__/integration/timed-block-exercise-list.spec.ts`
- **Why important**: The main test file being fixed/rewritten
- **Changes made**: Completely rewritten from isolated component test to integration test using createTestApp
- **Current status**: 2/7 tests passing, need to fix input element scoping
- **Code snippet** (current helper that needs improvement):
```typescript
// Helper to add exercise via the overlay picker (not dialog mode)
async function addExerciseViaOverlay(
  app: Awaited<ReturnType<typeof createTestApp>>,
  exerciseName: string,
) {
  const { user, common, getByRole } = app

  // Click Add Exercise button in the config dialog
  await user.click(common.getDialogButton('Add Exercise'))

  // Wait for overlay to appear (it has a search input)
  await waitFor(() => {
    const inputs = screen.getAllByRole('textbox')
    expect(inputs.length).toBeGreaterThan(0)
  })

  // Find the search input in the overlay (the second textbox, after the duration input)
  const inputs = screen.getAllByRole('textbox')
  const searchInput = inputs[inputs.length - 1]
  if (!searchInput) throw new Error('Search input not found')

  await user.type(searchInput, exerciseName)

  // Wait for filtered results and click the exercise button
  await waitFor(() => {
    expect(screen.queryByText(exerciseName)).toBeTruthy()
  })

  // Find and click the exercise button (it's a button containing the exercise name)
  const buttons = screen.getAllByRole('button')
  const exerciseButton = buttons.find((btn) => btn.textContent?.includes(exerciseName))
  if (!exerciseButton) throw new Error(`Exercise button for ${exerciseName} not found`)

  await user.click(exerciseButton)

  // Wait for exercise to appear in the list (overlay should close in multi mode but exercise stays)
  await waitFor(() => {
    const dialog = getByRole('dialog')
    expect(dialog.textContent).toContain(exerciseName)
  })
}
```

### `src/features/workout/components/WorkoutExercisePicker.vue`
- **Why important**: The exercise picker has "overlay" mode that doesn't use role="dialog", which complicates testing
- **Changes made**: Briefly added `role="dialog"` to overlay but reverted as it broke other tests (multiple dialogs found)
- **Key observation**: Overlay mode renders as plain div, not dialog element

### `src/features/workout/components/WorkoutTimedBlockExerciseList.vue`
- **Why important**: The component being tested - renders exercise list with reps/load inputs
- **Structure**: Each exercise row has a number input (reps) and text input (load) inside div with class `bg-secondary/30`

### `src/features/workout/components/WorkoutAmrapConfig.vue`
- **Why important**: Contains a duration input (type="number") that conflicts with finding exercise reps input
- **Key observation**: Need to scope input queries to exercise list section, not whole dialog

## 4. Problem Solving

### Solved
- Initial i18n error: Added i18n plugin to render calls

### Ongoing
- **Input element scoping**: Tests can't find the correct inputs because:
  - Dialog has duration input (number) AND exercise reps input (number)
  - Need to find inputs specifically within the exercise list section (class `bg-secondary/30`)
- **Vue cleanup crashes**: "Cannot read properties of null (reading 'insertBefore')" during test cleanup - likely dialog teardown issue

## 5. Pending Tasks
- Fix remaining 5 failing tests by properly scoping input element queries
- The inputs need to be found within the exercise list section specifically

## 6. Current Work
Was about to update the tests to find inputs more specifically within the exercise list section. The `WorkoutTimedBlockExerciseList` component wraps each exercise in a div with class `bg-secondary/30`. Need to:
1. After adding an exercise, find the exercise row element
2. Query for inputs within that specific row, not the whole dialog

Last test run showed:
- 2 passing: "shows empty message" and "displays exercise name after adding"
- 5 failing: Input finding issues and cleanup crashes

## 7. Next Step
Update the failing tests to scope input queries to the exercise list section. For example, instead of:
```typescript
const repInput = dialog.querySelector('input[type="number"]')
```
Use:
```typescript
// Find the exercise row first (has class bg-secondary/30)
const exerciseRows = dialog.querySelectorAll('.bg-secondary\\/30')
const lastRow = exerciseRows[exerciseRows.length - 1]
const repInput = lastRow?.querySelector('input[type="number"]')
```

This should fix the "shows reps and load inputs" and "allows setting reps/load value" tests. The cleanup crashes may need `flushPromises()` or await on cleanup.

## Test Commands
```bash
pnpm test:unit timed-block-exercise-list   # Run the specific test file
pnpm test:unit timed-block-workflows       # Run related tests to ensure no regression
```
