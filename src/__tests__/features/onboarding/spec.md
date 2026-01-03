# Onboarding Feature Test Specification

## Feature: First-Time User Onboarding

As a first-time user of the Workout Tracker app
I want to see an onboarding flow that introduces key features
So that I can understand how to use the app effectively

---

## Feature: Fresh Install Onboarding

### Scenario: First-time user is redirected to onboarding on fresh install

```gherkin
Given a fresh database with no user data
  And onboarding has not been completed
When the user navigates to the home page "/"
Then the user should be redirected to "/onboarding"
  And the Welcome slide should be displayed
  And the "Skip to App" button should be visible
  And the "Start Tour" button should be visible
  And the progress bar should show 0% completion
```

### Scenario: Onboarding route renders with proper layout

```gherkin
Given onboarding has not been completed
When the user navigates to "/onboarding"
Then the view should render with fixed full-screen positioning
  And the background should match the app theme
  And the carousel should be visible
  And keyboard navigation should be enabled
```

---

## Feature: Slide Navigation

### Scenario: Navigate through all slides using Next button

```gherkin
Given the user is on the Welcome slide (slide 1)
When the user clicks the "Next" button
Then the user should see the PWA Installation slide (slide 2)
  And the progress bar should update to 20%
  And the Back button should become visible

When the user clicks the "Next" button
Then the user should see the Quick Workout slide (slide 3)
  And the progress bar should update to 40%

When the user clicks the "Next" button
Then the user should see the Templates slide (slide 4)
  And the progress bar should update to 60%

When the user clicks the "Next" button
Then the user should see the Benchmarks slide (slide 5)
  And the progress bar should update to 80%

When the user clicks the "Next" button
Then the user should see the Checklist slide (slide 6)
  And the progress bar should update to 100%
  And the "Let's Go" button should replace the "Next" button
```

### Scenario: Navigate backwards using Back button

```gherkin
Given the user is on slide 3 (Quick Workout)
  And the Back button is visible
When the user clicks the "Back" button
Then the user should see slide 2 (PWA Installation)
  And the progress bar should update to 20%
```

### Scenario: Back button is hidden on first slide

```gherkin
Given the user is on the Welcome slide (slide 1)
Then the Back button should not be visible
  And only the "Skip to App" and "Start Tour" buttons should be visible
```

### Scenario: Navigate using keyboard arrow keys

```gherkin
Given the user is on slide 2 (PWA Installation)
When the user presses the Right Arrow key
Then the user should advance to slide 3 (Quick Workout)

When the user presses the Left Arrow key
Then the user should return to slide 2 (PWA Installation)
```

### Scenario: Navigate using swipe gestures on mobile

```gherkin
Given the user is on slide 2 (PWA Installation)
  And the user is on a touch-enabled device
When the user swipes left on the carousel
Then the user should advance to slide 3 (Quick Workout)

When the user swipes right on the carousel
Then the user should return to slide 2 (PWA Installation)
```

### Scenario: Navigation stops at boundaries (no loop)

```gherkin
Given the user is on the Welcome slide (slide 1)
When the user presses the Left Arrow key
Then the user should remain on slide 1
  And no animation should occur

Given the user is on the Checklist slide (slide 6)
When the user presses the Right Arrow key
Then the user should remain on slide 6
  And no animation should occur
```

---

## Feature: Skip Onboarding

### Scenario: Skip onboarding from Welcome slide

```gherkin
Given the user is on the Welcome slide (slide 1)
  And onboarding has not been completed
When the user clicks the "Skip to App" button
Then onboarding should be marked as completed in the database
  And the user should be navigated to the home page "/"
  And the onboarding route should no longer be accessible
```

### Scenario: Skip button is always visible during onboarding

```gherkin
Given the user is on any onboarding slide
Then the "Skip" or "Skip to App" button should be visible in the header
When the user clicks the skip button
Then onboarding should be marked as completed
  And the user should be navigated to the home page
```

### Scenario: Skip behavior is silent (no prompts or reminders)

```gherkin
Given the user skipped onboarding
When the user uses the app
Then no onboarding reminder badges should be shown
  And no prompts to complete onboarding should appear
  And all app features should be fully accessible
```

---

## Feature: Complete Onboarding

### Scenario: Complete onboarding using "Let's Go" button

```gherkin
Given the user has navigated to the final Checklist slide (slide 6)
When the user clicks the "Let's Go" button
Then onboarding should be marked as completed in the database
  And the user should be navigated to the home page "/"
```

### Scenario: Complete onboarding via checklist item click

```gherkin
Given the user is on the Checklist slide (slide 6)
  And the checklist displays four actionable items:
    | Item                      | Route           |
    | Create your first template| /templates/create|
    | Browse the exercise library| /exercises      |
    | Start a quick workout     | /workout/create |
    | Try a benchmark           | /benchmarks     |
When the user clicks "Create your first template"
Then onboarding should be marked as completed
  And the user should be navigated to "/templates/create"
```

### Scenario: Onboarding completion persists across page reload

```gherkin
Given the user has completed onboarding
  And the onboarding state is saved to IndexedDB
When the user reloads the browser page
  And navigates to the home page "/"
Then the user should see the home page directly
  And the user should not be redirected to onboarding
```

### Scenario: Completed users cannot access onboarding route

```gherkin
Given the user has completed onboarding
When the user manually navigates to "/onboarding"
Then the user should be redirected to the home page "/"
  And the onboarding view should not be displayed
```

---

## Feature: Returning User Detection

### Scenario: Returning user with existing workout data

```gherkin
Given the database contains existing workout data
  And onboarding has not been completed
When the user navigates to the home page
Then the user should be redirected to "/onboarding"
  And the Welcome slide should show "Welcome back!" variant
  And the "Resume Tour" button should be visible (instead of "Start Tour")
  And the "Skip to App" button should be visible
```

### Scenario: Returning user with existing templates

```gherkin
Given the database contains at least one saved template
  And onboarding has not been completed
When the user navigates to the app
Then the "Welcome back!" variant should be displayed
```

### Scenario: Returning user with existing benchmarks

```gherkin
Given the database contains at least one benchmark
  And onboarding has not been completed
When the user navigates to the app
Then the "Welcome back!" variant should be displayed
```

### Scenario: Seeded templates count as existing data

```gherkin
Given the app has seeded popular templates on initialization
  And onboarding has not been completed
When the user navigates to the app
Then the "Welcome back!" variant should be displayed
  And hasExistingData should return true
```

---

## Feature: State Persistence and Resume

### Scenario: Resume onboarding from last position

```gherkin
Given the user is on slide 3 (Quick Workout)
  And the current step is saved to the database
When the user navigates away from onboarding
  And the user returns to "/onboarding"
Then the carousel should instantly jump to slide 3
  And no transition animation should play
  And the progress bar should show 40%
```

### Scenario: Step changes persist to database

```gherkin
Given the user is on slide 2
When the user navigates to slide 4
Then the currentStep (4) should be saved to IndexedDB
  And subsequent visits should resume at slide 4
```

---

## Feature: PWA Detection

### Scenario: PWA installed - skip PWA slide

```gherkin
Given the app is running as an installed PWA
  And matchMedia('display-mode: standalone') returns true
When the user views the onboarding flow
Then the carousel should have 5 slides (not 6)
  And the PWA Installation slide should be skipped
  And the slide progression should be:
    | Slide | Content       |
    | 1     | Welcome       |
    | 2     | Quick Workout |
    | 3     | Templates     |
    | 4     | Benchmarks    |
    | 5     | Checklist     |
```

### Scenario: Browser mode - show PWA slide

```gherkin
Given the app is running in a browser (not installed as PWA)
  And matchMedia('display-mode: standalone') returns false
When the user views the onboarding flow
Then the carousel should have 6 slides
  And the PWA Installation slide should be included as slide 2
```

### Scenario: iOS Safari standalone detection

```gherkin
Given the app is running on iOS Safari
  And navigator.standalone is true
When the app checks PWA status
Then isPWA should return true
  And the PWA Installation slide should be skipped
```

---

## Feature: Data Deletion Preservation

### Scenario: Onboarding state preserved when user deletes all data

```gherkin
Given the user has completed onboarding
  And the user has workout history data
When the user triggers "Delete All Data" from settings
Then all workout data should be deleted
  But the onboarding completed state should be preserved
  And the user should not be redirected to onboarding
  And the user should remain on the home page
```

---

## Feature: Error Handling

### Scenario: Database error during onboarding check - fail open

```gherkin
Given the Dexie database encounters a read error
When the router guard checks onboarding status
Then the guard should fail-open (assume completed)
  And the user should be allowed to access the app
  And the user should not be blocked by the error
```

### Scenario: Composable handles initialization errors gracefully

```gherkin
Given the onboarding composable is initialized
When a database error occurs during initialization
Then isInitialized should still become true
  And the app should remain functional
  And no error should be thrown to the user
```

---

## Feature: Progress Indicator

### Scenario: Progress bar reflects current slide position

```gherkin
Given the user is on the onboarding view
Then a progress bar should be visible
  And the progress bar should have role="progressbar"
  And aria-valuenow should reflect the current progress percentage:
    | Slide | aria-valuenow |
    | 1     | 0             |
    | 2     | 20            |
    | 3     | 40            |
    | 4     | 60            |
    | 5     | 80            |
    | 6     | 100           |
```

### Scenario: Progress updates when navigating

```gherkin
Given the progress bar shows 0% (slide 1)
When the user clicks the Next button
Then the progress bar should animate to 20%
  And aria-valuenow should update to "20"
```

---

## Feature: Slide Content

### Scenario: Welcome slide displays app branding

```gherkin
Given the user is on the Welcome slide
Then the app logo should be visible
  And the app name "Workout Tracker" should be displayed
  And the "Start Tour" button should be primary/filled style
  And the "Skip to App" button should be secondary/outline style
```

### Scenario: Quick Workout slide shows preview blocks

```gherkin
Given the user is on the Quick Workout slide
Then the title "Build workouts on the fly" should be visible
  And 2-3 OnboardingBlockPreview components should be rendered
  And the previews should be non-interactive (static display)
```

### Scenario: Templates slide shows preview templates

```gherkin
Given the user is on the Templates slide
Then the title "Save your favorites" should be visible
  And OnboardingTemplatePreview components should be rendered
  And sample templates like "Push Day", "Leg Day" should be shown
```

### Scenario: Benchmarks slide shows preview benchmarks

```gherkin
Given the user is on the Benchmarks slide
Then the title "Track your progress" should be visible
  And OnboardingBenchmarkPreview components should be rendered
  And sample benchmarks like "Fran", "Cindy" should be shown
```

### Scenario: Checklist slide shows actionable items

```gherkin
Given the user is on the Checklist slide
Then the title "You're ready!" should be visible
  And four clickable checklist items should be displayed
  And each item should be a navigation link to its feature
  And the "Let's Go" button should be visible
```

---

## Feature: Accessibility

### Scenario: Focus management on slide navigation

```gherkin
Given the user is on slide 1
When the user navigates to slide 2
Then focus should move to the slide 2 heading
  And screen readers should announce the new slide title
```

### Scenario: Keyboard-only navigation is fully supported

```gherkin
Given the user is navigating with keyboard only
Then all interactive elements should be reachable via Tab
  And Arrow keys should navigate between slides
  And Enter should activate buttons and links
  And Escape should not close the onboarding (no modal behavior)
```

---

## Feature: Localization

### Scenario: All onboarding text is localized

```gherkin
Given the user's locale is set to German ("de")
When the user views the onboarding flow
Then all text should be displayed in German
  And button labels should use German translations:
    | English       | German          |
    | Start Tour    | Tour starten    |
    | Skip to App   | Zur App         |
    | Next          | Weiter          |
    | Back          | Zurück          |
    | Let's Go      | Los geht's      |
```

---

## Test Data Requirements

### Database Seeding

| Scenario Type           | Required Seed Data                    |
|------------------------|---------------------------------------|
| Fresh install          | Empty database, onboarding.completed = false |
| Returning user         | At least 1 workout, template, or benchmark |
| Completed onboarding   | onboarding.completed = true           |
| PWA mode               | Mock matchMedia to return true        |

### Preview Data Constants

```typescript
// Use constants from src/features/onboarding/constants/previewData.ts
sampleBlocks: StrengthBlock, AmrapBlock examples
sampleTemplates: "Push Day", "Leg Day", "Full Body"
sampleBenchmarks: "Fran", "Cindy", "Murph"
```

---

## Implementation Checklist

- [ ] Fresh install: verify onboarding appears on first visit
- [ ] Navigate through all slides using Next button
- [ ] Navigate through all slides using keyboard arrows
- [ ] Navigate through all slides using swipe gestures
- [ ] Navigate backwards using Back button
- [ ] Click "Skip to App" - verify marks complete and navigates home
- [ ] Complete onboarding via "Let's Go" button
- [ ] Complete onboarding via checklist item click
- [ ] Verify state persists on page reload
- [ ] Returning user with existing data sees "Welcome back" variant
- [ ] PWA detection skips PWA slide when installed
- [ ] Resume flow restores carousel position
- [ ] Database error handling fails open
- [ ] Progress bar updates on navigation
- [ ] All slides render correct content
- [ ] Focus management works correctly
- [ ] Localization works for all supported languages
- [ ] Run `pnpm test` - verify all integration tests pass
