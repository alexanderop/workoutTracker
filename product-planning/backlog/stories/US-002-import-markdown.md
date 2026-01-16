# User Story: US-002

## Import Workout from Markdown File

### User Story

As a **Serious Sarah** (power user who tracks everything meticulously),
I want to **import a previously exported workout from a markdown file**,
So that I can **restore my workout data from backups or share workouts between devices**.

### Acceptance Criteria

- [ ] **Given** I am on the workout history page, **When** I tap the import button, **Then** a file picker opens allowing me to select a `.md` file
- [ ] **Given** I select a valid workout markdown file, **When** the file is processed, **Then** the workout is saved to the database and I am navigated to the workout detail view
- [ ] **Given** I select an invalid file (wrong format, missing frontmatter, unsupported version), **When** the file is processed, **Then** I see a clear error message explaining what went wrong
- [ ] **Given** the import is successful, **When** I view the workout, **Then** all blocks, sets, and metadata are correctly restored
- [ ] **Given** I am offline, **When** I import a workout, **Then** the import still works (offline-first)

### Definition of Done

- [ ] Code complete and reviewed
- [ ] Unit tests written and passing
- [ ] Integration tests passing (roundtrip: export → import → verify)
- [ ] Documentation updated
- [ ] Accessibility requirements met (import button has proper labels)
- [ ] Works offline

### Technical Notes

- The `parseWorkoutMarkdown()` function in `markdownImport.ts` already exists and handles parsing
- Need to create a converter from `ParsedWorkout` → `DbCompletedWorkout` to save to Dexie
- UI should follow existing pattern from `WorkoutDetailView.vue` (copy button)
- Use hidden `<input type="file" accept=".md">` triggered by button click
- Handle the `ParseResult<T>` error union type properly for user-friendly error messages

### Design/UX Notes

- Import button should use `Upload` icon from lucide-vue-next
- Place near existing UI elements in the workout history page header
- Error dialog should match existing `ErrorDialog` component style

### Story Points

**5 points** - Medium-high complexity:
- UI component work (file input, button, error handling)
- Data transformation layer (ParsedWorkout → DbCompletedWorkout)
- Testing the roundtrip
- i18n strings

### Epic

E1: Core Workout Tracking

### Dependencies

- Existing `markdownImport.ts` parser ✅
- Existing `markdownExport.ts` for roundtrip testing ✅

### Open Questions

- Should we support importing multiple files at once? (suggest: no, keep it simple for v1)
- Should duplicate detection be added? (suggest: no for v1, allow duplicates)

---

*Created: 2026-01-13*
*Last Updated: 2026-01-13*
