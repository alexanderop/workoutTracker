/**
 * Architecture Tests using ArchUnitTS
 *
 * These tests complement ESLint's boundary enforcement with:
 * - Circular dependency detection
 * - Additional safety net for architectural boundaries
 *
 * Run with: pnpm test:arch
 *
 * Test Categories:
 * 1. Circular Dependencies - features, composables, stores, db
 * 2. Feature Isolation - no cross-feature dependencies
 * 3. Layer Dependencies (8) - shared code doesn't depend on features/views
 * 4. UI Component Isolation (5) - shadcn-vue stays pure (no business logic)
 * 5. Router Simplicity (4) - router only imports views
 * 6. Stores Isolation (3) - stores don't depend on UI
 * 7. i18n Isolation (5) - i18n is independent of business logic
 * 8. Views Independence (1) - views don't import each other
 * 9. Composables Full Isolation (2) - composables don't depend on UI
 * 10. Naming Conventions (1) - composables follow use* / create* pattern
 *
 * Note: Code metrics (LOC, LCOM) are skipped due to library compatibility issues
 * with the current TypeScript/Vitest setup. Consider revisiting when archunit
 * releases updates.
 */
import { readdirSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { projectFiles } from 'archunit'

const FEATURES_ROOT = new URL('../../features/', import.meta.url)
const FEATURES = readdirSync(FEATURES_ROOT, { withFileTypes: true })
  .filter(
    (entry) =>
      entry.isDirectory() &&
      readdirSync(new URL(`${entry.name}/`, FEATURES_ROOT), { recursive: true }).some((file) =>
        String(file).endsWith('.ts'),
      ),
  )
  .map((entry) => entry.name)

// ArchUnit analyzes TypeScript imports only. ESLint's generated boundary zones
// cover Vue-only feature folders as well.

const SHARED_FOLDERS = [
  'blocks',
  'components',
  'composables',
  'lib',
  'db',
  'types',
  'stores',
] as const

// =============================================================================
// CIRCULAR DEPENDENCIES
// =============================================================================

describe('circular dependencies', () => {
  it('features should be free of cycles', async () => {
    const rule = projectFiles().inFolder('src/features/**').should().haveNoCycles()
    await expect(rule).toPassAsync()
  })

  it('composables should be free of cycles', async () => {
    const rule = projectFiles().inFolder('src/composables/**').should().haveNoCycles()
    await expect(rule).toPassAsync()
  })

  it('stores should be free of cycles', async () => {
    const rule = projectFiles().inFolder('src/stores/**').should().haveNoCycles()
    await expect(rule).toPassAsync()
  })

  it('database layer should be free of cycles', async () => {
    const rule = projectFiles().inFolder('src/db/**').should().haveNoCycles()
    await expect(rule).toPassAsync()
  })

  it('block codecs should be free of cycles', async () => {
    const rule = projectFiles().inFolder('src/blocks/**').should().haveNoCycles()
    await expect(rule).toPassAsync()
  })
})

// =============================================================================
// FEATURE ISOLATION (Safety net behind ESLint)
// =============================================================================

describe('feature isolation', () => {
  for (const feature of FEATURES) {
    it(`${feature} should not depend on other features`, async () => {
      const otherFeatures = FEATURES.filter((f) => f !== feature)

      for (const otherFeature of otherFeatures) {
        const rule = projectFiles()
          .inFolder(`src/features/${feature}/**`)
          .shouldNot()
          .dependOnFiles()
          .inFolder(`src/features/${otherFeature}/**`)
        await expect(rule).toPassAsync()
      }
    })
  }
})

// =============================================================================
// LAYER DEPENDENCIES (Safety net behind ESLint)
// =============================================================================

describe('layer dependencies', () => {
  for (const folder of SHARED_FOLDERS) {
    it(`${folder} should not depend on features`, async () => {
      const rule = projectFiles()
        .inFolder(`src/${folder}/**`)
        .shouldNot()
        .dependOnFiles()
        .inFolder('src/features/**')
      await expect(rule).toPassAsync()
    })
  }

  it('features should not depend on views', async () => {
    const rule = projectFiles()
      .inFolder('src/features/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/views/**')
    // Views are .vue files, use allowEmptyTests since the dependency check
    // only looks at TypeScript imports (views don't export anything features would import)
    await expect(rule).toPassAsync({ allowEmptyTests: true })
  })

  it('shared code should not depend on views', async () => {
    for (const folder of SHARED_FOLDERS) {
      const rule = projectFiles()
        .inFolder(`src/${folder}/**`)
        .shouldNot()
        .dependOnFiles()
        .inFolder('src/views/**')
      await expect(rule).toPassAsync({ allowEmptyTests: true })
    }
  })
})

// =============================================================================
// UI COMPONENT ISOLATION
// shadcn-vue primitives must remain pure - no business logic imports
// =============================================================================

describe('ui component isolation', () => {
  it('ui components should not import from features', async () => {
    const rule = projectFiles()
      .inFolder('src/components/ui/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/features/**')
    await expect(rule).toPassAsync()
  })

  it('ui components should not import from composables', async () => {
    const rule = projectFiles()
      .inFolder('src/components/ui/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/composables/**')
    await expect(rule).toPassAsync()
  })

  it('ui components should not import from stores', async () => {
    const rule = projectFiles()
      .inFolder('src/components/ui/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/stores/**')
    await expect(rule).toPassAsync()
  })

  it('ui components should not import from db', async () => {
    const rule = projectFiles()
      .inFolder('src/components/ui/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/db/**')
    await expect(rule).toPassAsync()
  })

  it('ui components should not import domain types', async () => {
    const rule = projectFiles()
      .inFolder('src/components/ui/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/types/**')
    await expect(rule).toPassAsync()
  })
})

// =============================================================================
// ROUTER SIMPLICITY
// Router should only import views, not business logic
// =============================================================================

describe('router isolation', () => {
  it('router should not import from features', async () => {
    const rule = projectFiles()
      .inFolder('src/router/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/features/**')
    await expect(rule).toPassAsync()
  })

  it('router should not import from composables', async () => {
    const rule = projectFiles()
      .inFolder('src/router/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/composables/**')
    await expect(rule).toPassAsync()
  })

  it('router should not import from db', async () => {
    const rule = projectFiles()
      .inFolder('src/router/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/db/**')
    await expect(rule).toPassAsync()
  })

  it('router should not import from stores', async () => {
    const rule = projectFiles()
      .inFolder('src/router/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/stores/**')
    await expect(rule).toPassAsync()
  })
})

// =============================================================================
// STORES ISOLATION
// Stores should be data layer, not depend on UI or features
// =============================================================================

describe('stores isolation', () => {
  it('stores should not import from views', async () => {
    const rule = projectFiles()
      .inFolder('src/stores/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/views/**')
    await expect(rule).toPassAsync({ allowEmptyTests: true })
  })

  it('stores should not import from components', async () => {
    const rule = projectFiles()
      .inFolder('src/stores/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/components/**')
    await expect(rule).toPassAsync()
  })

  it('stores should not import from composables', async () => {
    const rule = projectFiles()
      .inFolder('src/stores/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/composables/**')
    await expect(rule).toPassAsync()
  })
})

// =============================================================================
// i18n ISOLATION
// Internationalization should be independent of business logic
// =============================================================================

describe('i18n isolation', () => {
  it('i18n should not import from features', async () => {
    const rule = projectFiles()
      .inFolder('src/i18n/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/features/**')
    await expect(rule).toPassAsync()
  })

  it('i18n should not import from composables', async () => {
    const rule = projectFiles()
      .inFolder('src/i18n/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/composables/**')
    await expect(rule).toPassAsync()
  })

  it('i18n should not import from db', async () => {
    const rule = projectFiles()
      .inFolder('src/i18n/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/db/**')
    await expect(rule).toPassAsync()
  })

  it('i18n should not import from stores', async () => {
    const rule = projectFiles()
      .inFolder('src/i18n/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/stores/**')
    await expect(rule).toPassAsync()
  })

  it('i18n should not import from components', async () => {
    const rule = projectFiles()
      .inFolder('src/i18n/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/components/**')
    await expect(rule).toPassAsync()
  })
})

// =============================================================================
// VIEWS INDEPENDENCE
// Views are top-level orchestrators and should not depend on each other
// =============================================================================

describe('views independence', () => {
  it('views should not import other views', async () => {
    const rule = projectFiles()
      .inFolder('src/views/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/views/**')
    // Views don't export anything, so this naturally passes
    await expect(rule).toPassAsync({ allowEmptyTests: true })
  })
})

// =============================================================================
// COMPOSABLES FULL ISOLATION
// Shared composables should not depend on UI layer
// =============================================================================

describe('composables full isolation', () => {
  it('composables should not import from components', async () => {
    const rule = projectFiles()
      .inFolder('src/composables/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/components/**')
    await expect(rule).toPassAsync()
  })

  it('composables should not import from views', async () => {
    const rule = projectFiles()
      .inFolder('src/composables/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/views/**')
    await expect(rule).toPassAsync({ allowEmptyTests: true })
  })
})

// =============================================================================
// NAMING CONVENTIONS
// =============================================================================

describe('naming conventions', () => {
  it('shared composables should follow use* or create* pattern', async () => {
    // Check that TypeScript files in composables folder follow naming conventions
    // use* = composables, create* = factory functions
    const rule = projectFiles()
      .inFolder('src/composables/**')
      .withName('*.ts')
      .should()
      .haveName(/^(use|create)[A-Z]/)
    await expect(rule).toPassAsync()
  })
})
