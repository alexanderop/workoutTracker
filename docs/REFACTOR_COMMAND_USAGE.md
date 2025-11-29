# Using the `/refactor-component` Slash Command

The `/refactor-component` slash command automatically refactors large Vue components using proven design patterns. This guide explains how to use it effectively.

## Quick Start

### Basic Usage

```bash
/refactor-component src/views/MyComponent.vue
```

The command will:
1. Analyze the component
2. Detect applicable design patterns
3. Generate composables and child components
4. Refactor the main component
5. Provide a summary of changes

### Example

```bash
/refactor-component src/views/ActiveWorkout.vue
```

Output:
```
✅ Refactoring Complete

📊 Improvements:
  • Component size reduced by 88%
  • 6 reusable child components created
  • 2 state/logic composables extracted
  • 2 pure utility functions extracted

📁 Files Created:
  + src/lib/workout-utils.ts
  + src/composables/useWorkout.ts
  + src/composables/useRestTimer.ts
  + src/components/workout/WorkoutHeader.vue
  + src/components/workout/ExerciseCarousel.vue
  + src/components/workout/SetTable.vue
  + src/components/workout/PreviousHistory.vue
  + src/components/workout/RestTimerWidget.vue
  + src/components/workout/WorkoutAddExerciseDialog.vue

📝 Files Modified:
  ~ src/views/ActiveWorkout.vue (520 → 62 lines)

⚙️  Recommended Next Steps:
  1. Run: pnpm type-check
  2. Run: pnpm lint
  3. Run: pnpm test
  4. Review components for domain-specific adjustments
```

## When to Use

Use `/refactor-component` when:

✅ **Component is too large** (>300 lines)
- Hard to understand at a glance
- Takes long to find specific logic
- Multiple responsibilities mixed together

✅ **Component has too much state**
- Many `ref()` declarations
- State logic scattered throughout
- Difficult to trace state changes

✅ **Component mixes UI and logic**
- Business logic in template or component
- Hard to test separate concerns
- Difficult to reuse logic elsewhere

✅ **Component is monolithic**
- Single file doing too many things
- No clear separation of concerns
- Hard to modify without breaking things

### Don't use when:

❌ Component is already well-factored (<200 lines)
❌ Component is a simple presentational component
❌ Component has custom, domain-specific patterns
❌ Component structure already optimized for your needs

## How It Works

### Phase 1: Analysis

The command reads your component and analyzes:

- **Component size** - Total lines of code
- **State complexity** - Number of refs/computed/watchers
- **Logic complexity** - Number of functions and their complexity
- **Template complexity** - Conditionals, loops, nesting
- **Responsibilities** - What different sections do

### Phase 2: Pattern Detection

Based on analysis, identifies which patterns to apply:

```
Pattern Detection Results:
├─ Long Components (520 lines > 300) ✓
├─ Data Store (multiple state refs) ✓
├─ Thin Composables (timer logic) ✓
├─ Extract Conditional (v-if branches) ✓
├─ List Component (v-for with content) ✓
└─ Controller Component (orchestrator) ✓
```

### Phase 3: File Generation

Creates extracted files:

1. **Utility Functions** (`src/lib/`)
   - Pure functions extracted from component
   - No Vue dependencies
   - Fully testable

2. **Composables** (`src/composables/`)
   - State management extracted
   - Business logic extracted
   - Reusable across components

3. **Child Components** (`src/components/{domain}/`)
   - UI sections extracted
   - Props for data input
   - Events for actions
   - Single responsibility each

4. **Updated Main Component**
   - Now acts as orchestrator
   - Imports composables and child components
   - Minimal template
   - Focused on coordination

### Phase 4: Validation

Checks that all generated files:
- Are valid TypeScript/Vue syntax
- Have proper type annotations
- Use correct import paths
- Have no circular dependencies
- Follow project conventions

### Phase 5: Reporting

Provides summary including:
- Size reduction metrics
- Files created/modified
- Recommended next steps
- Testing recommendations

## File Organization

The refactored structure follows these conventions:

```
src/
├── lib/
│   ├── utils.ts              # Shared utilities
│   └── {feature}-utils.ts    # Feature-specific utilities
├── composables/
│   ├── use{Feature}.ts       # State & logic composables
│   └── use{Feature}{Sub}.ts  # Sub-feature composables
├── components/
│   ├── ui/                   # Reusable UI library
│   └── {feature}/
│       ├── {Feature}Header.vue
│       ├── {Feature}Content.vue
│       ├── {Feature}Footer.vue
│       └── {Feature}Dialog.vue
├── views/
│   └── {Feature}.vue         # Controller/orchestrator
└── stores/ (if using Pinia)
    └── {feature}.ts
```

## Naming Conventions

### Composables
- Prefix with `use`
- Camel case: `useWorkout`, `useRestTimer`
- Descriptive: `useWorkoutState`, `useWorkoutLogic`

### Child Components
- Feature prefix: `WorkoutHeader`, `ExerciseCarousel`
- Section suffix: `{Feature}{Section}.vue`
- Example: `SetTable.vue`, `PreviousHistory.vue`

### Utilities
- Feature-specific: `workout-utils.ts`, `timer-utils.ts`
- Describe purpose: `calculate10RM()`, `formatTime()`

## After Refactoring

Once refactoring completes:

### 1. Type Check
```bash
pnpm type-check
```
Verify all TypeScript is correct.

### 2. Lint
```bash
pnpm lint
```
Check code style and quality.

### 3. Test
```bash
pnpm test
```
Run existing tests to ensure nothing broke.

### 4. Review
- Look at generated files
- Check if domain logic needs adjustments
- Consider adding specific business rules
- Update component documentation

### 5. Deploy
```bash
git add .
git commit -m "refactor: improve component structure using design patterns"
git push
```

## Troubleshooting

### "Component is too complex to analyze"

The refactoring command has limits. For extremely complex components:
1. Manually split into logical sections first
2. Run refactoring on smaller components
3. Combine results

### "Types don't match"

Run type-check to see specific errors:
```bash
pnpm type-check
```

Common issues:
- Incorrect prop types passed to components
- Missing type annotations on extracted functions
- Circular imports between modules

**Fix:** Edit generated files to add proper types, or adjust component prop interfaces.

### "Some functionality is missing"

If functionality seems lost:
1. Check generated composable for all methods
2. Check component template for all event handlers
3. Verify all state properties are exposed
4. Check imports are correct

**Fix:** If something was missed, edit files to restore functionality. This should rarely happen.

### "Tests are failing"

Generated components are structurally different but functionally identical.

**Fix:**
1. Update tests to reflect new component structure
2. Test composables separately
3. Update mount paths in test files
4. Adjust prop/emit expectations

## Advanced Usage

### Selective Refactoring

If you only want certain patterns applied:

1. Run `/refactor-component` to see what would be created
2. Manually apply only the patterns you want
3. Copy generated code as reference
4. Delete unwanted generated files

### Custom Adjustments

After refactoring:

1. Adjust composables to match your state management
2. Add domain-specific logic to components
3. Customize naming if it doesn't match your conventions
4. Add additional props/emits as needed
5. Integrate with your store (Pinia, etc.) if needed

### Iterative Refactoring

Refactor can be run multiple times:

1. First pass: Break up monolithic component
2. Second pass: Optimize individual components
3. Third pass: Extract shared utilities
4. Final pass: Polish and optimize

## Best Practices

### Do's

✅ Use `/refactor-component` on components > 300 lines
✅ Run type-check after refactoring
✅ Review generated files carefully
✅ Test everything works after refactoring
✅ Commit refactoring separately from feature changes
✅ Use generated code as a starting point
✅ Adapt generated code to your specific needs

### Don'ts

❌ Don't refactor components that are already well-structured
❌ Don't use refactored components without review
❌ Don't skip type-checking or linting
❌ Don't commit without testing
❌ Don't blindly accept all generated code
❌ Don't refactor during active feature development
❌ Don't run on multiple components simultaneously (review each before next)

## Integration with Your Workflow

### In Your Development Process

1. **Identify large components** during code review
2. **Run `/refactor-component`** when refactoring is needed
3. **Review the changes** carefully
4. **Test the refactored component** thoroughly
5. **Commit and deploy** as a refactoring changeset

### In Your CI/CD

Consider adding a pre-commit hook to flag components > 300 lines:
```bash
# .git/hooks/pre-commit
git diff --cached --name-only | grep -E '\.vue$' | while read file; do
  lines=$(wc -l < "$file")
  if [ "$lines" -gt 300 ]; then
    echo "⚠️  $file is $lines lines - consider refactoring"
  fi
done
```

## FAQ

**Q: Will refactoring break my component?**
A: No. The refactored component maintains all original functionality. Always test after refactoring.

**Q: Can I preview changes before applying?**
A: The command outputs a summary showing what would be created. Review before accepting.

**Q: What if I don't like the refactoring?**
A: You can easily undo with git. The original file remains if you want to keep it.

**Q: Can I customize the refactoring?**
A: Yes! Treat generated files as a starting point. Edit them to match your needs exactly.

**Q: How long does refactoring take?**
A: Typically seconds to a minute depending on component size. Agent does the work automatically.

**Q: Can I refactor multiple components at once?**
A: Run the command separately for each component. Review and test each one.

**Q: Will it work with my custom setup?**
A: The refactoring follows Vue 3 Composition API conventions. Should work with most setups. Adjust as needed.

**Q: What if my component uses Options API?**
A: The refactoring assumes Composition API (`<script setup>`). Convert first, then refactor.

## More Information

For detailed information about the design patterns used:
- See: `docs/REFACTORING_PATTERNS.md`

For patterns from the original article:
- See: [12 Design Patterns in Vue](https://michaelthiessen.com/vue-design-patterns)
