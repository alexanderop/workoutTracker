import pluginVueI18n from '@intlify/eslint-plugin-vue-i18n'
import pluginVitest from '@vitest/eslint-plugin'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import pluginImportX from 'eslint-plugin-import-x'
import pluginOxlint from 'eslint-plugin-oxlint'
import pluginVue from 'eslint-plugin-vue'
import { globalIgnores } from 'eslint/config'

// To allow more languages other than `ts` in `.vue` files, uncomment the following lines:
// import { configureVueProject } from '@vue/eslint-config-typescript'
// configureVueProject({ scriptLangs: ['ts', 'tsx'] })
// More info at https://github.com/vuejs/eslint-config-typescript/#advanced-setup

export default defineConfigWithVueTs(
  {
    ignores: ['.claude/**', '**/dev-dist/**', '**/dist/**', '**/dist-ssr/**', '**/coverage/**', '**/node_modules/**'],
  },

  {
    name: 'app/files-to-lint',
    files: ['**/*.{ts,mts,tsx,vue}'],
  },

  globalIgnores(['**/dev-dist/**', '**/dist/**', '**/dist-ssr/**', '**/coverage/**']),

  pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,

  {
    files: ['src/**/*.vue'],
    rules: {
      'vue/multi-word-component-names': [
        'error',
        {
          ignores: ['App', 'Layout'],
        },
      ],
      'vue/component-definition-name-casing': ['error', 'PascalCase'],
      'vue/component-name-in-template-casing': [
        'error',
        'PascalCase',
        {
          registeredComponentsOnly: false,
        },
      ],
      'vue/match-component-file-name': [
        'error',
        {
          extensions: ['vue'],
          shouldMatchCase: true,
        },
      ],
      'vue/prop-name-casing': ['error', 'camelCase'],
      'vue/attribute-hyphenation': ['error', 'always'],
      'vue/custom-event-name-casing': ['error', 'kebab-case'],
      'vue/max-template-depth': ['error', { maxDepth: 8 }],
      'vue/max-props': ['error', { maxProps: 6 }],

      // Dead code detection
      'vue/no-unused-properties': ['error', {
        groups: ['props', 'data', 'computed', 'methods'],
      }],
      'vue/no-unused-refs': 'error',
      'vue/no-unused-emit-declarations': 'error',

      // Explicit APIs
      'vue/require-expose': 'warn',
      'vue/require-explicit-slots': 'warn',
    },
  },

  {
    name: 'app/shadcn-ui-components',
    files: ['src/components/ui/**/*.vue'],
    rules: {
      'vue/multi-word-component-names': 'off',
      'vue/max-props': 'off',
      'vue/no-unused-properties': 'off',
      'vue/no-unused-refs': 'off',
      'vue/no-unused-emit-declarations': 'off',
      'vue/require-expose': 'off',
      'vue/require-explicit-slots': 'off',
    },
  },

  // Prevent direct DOM manipulation in application code - use Vue template refs
  {
    name: 'app/no-direct-dom-manipulation',
    files: ['src/**/*.{ts,vue}'],
    ignores: ['src/**/__tests__/**'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'CallExpression[callee.object.name="document"][callee.property.name="getElementById"]',
          message: 'Use Vue template refs (useTemplateRef) instead of document.getElementById().',
        },
        {
          selector: 'CallExpression[callee.object.name="document"][callee.property.name=/^querySelector(All)?$/]',
          message: 'Use Vue template refs (useTemplateRef) instead of document.querySelector*().',
        },
        {
          selector: 'CallExpression[callee.object.name="document"][callee.property.name=/^getElementsBy/]',
          message: 'Use Vue template refs (useTemplateRef) instead of document.getElementsBy*().',
        },
      ],
    },
  },

  {
    name: 'app/typescript-style-guide',
    files: ['src/**/*.{ts,vue}'],
    rules: {
      // Limit cyclomatic complexity per function
      'complexity': ['warn', { max: 10 }],

      // No type assertions with `as` (except `as const`)
      '@typescript-eslint/consistent-type-assertions': [
        'error',
        {
          assertionStyle: 'never',
        },
      ],

      // No `enum` - use literal unions or `as const` objects
      // No `else` or `else if` - prefer early returns or ternary operators
      // No native try/catch - use tryCatch() utility
      // No hardcoded route strings - use RouteNames
      'no-restricted-syntax': [
        'error',
        {
          selector: 'TSEnumDeclaration',
          message: 'Use literal unions or `as const` objects instead of enums.',
        },
        {
          selector: 'IfStatement > IfStatement.alternate',
          message: 'Avoid `else if`. Prefer early returns or ternary operators.',
        },
        {
          selector: 'IfStatement > :not(IfStatement).alternate',
          message: 'Avoid `else`. Prefer early returns or ternary operators.',
        },
        {
          selector: 'TryStatement',
          message: 'Use tryCatch() from @/lib/tryCatch instead of try/catch. Returns Result<T> tuple: [error, null] | [null, data].',
        },
        {
          selector: 'CallExpression[callee.property.name="push"][callee.object.name="router"] > Literal:first-child',
          message: 'Use named routes with RouteNames instead of hardcoded path strings. Example: router.push({ name: RouteNames.Home })',
        },
        {
          selector: 'CallExpression[callee.property.name="push"][callee.object.name="router"] > TemplateLiteral:first-child',
          message: 'Use named routes with RouteNames instead of template literals. Example: router.push({ name: RouteNames.WorkoutDetail, params: { id } })',
        },
        {
          selector: 'CallExpression[callee.name="navigateTo"] > Literal:first-child',
          message: 'Use named routes with RouteNames instead of hardcoded path strings. Example: navigateTo({ name: RouteNames.Home })',
        },
      ],
    },
  },

  {
    ...pluginVitest.configs.recommended,
    files: ['src/**/__tests__/*'],
  },

  // Allow native try/catch in tryCatch utility implementation
  {
    name: 'app/try-catch-utility-exception',
    files: ['src/lib/tryCatch.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'TSEnumDeclaration',
          message: 'Use literal unions or `as const` objects instead of enums.',
        },
        {
          selector: 'IfStatement > IfStatement.alternate',
          message: 'Avoid `else if`. Prefer early returns or ternary operators.',
        },
        {
          selector: 'IfStatement > :not(IfStatement).alternate',
          message: 'Avoid `else`. Prefer early returns or ternary operators.',
        },
        // TryStatement intentionally omitted - this file implements the tryCatch utility
        {
          selector: 'CallExpression[callee.property.name="push"][callee.object.name="router"] > Literal:first-child',
          message: 'Use named routes with RouteNames instead of hardcoded path strings. Example: router.push({ name: RouteNames.Home })',
        },
        {
          selector: 'CallExpression[callee.property.name="push"][callee.object.name="router"] > TemplateLiteral:first-child',
          message: 'Use named routes with RouteNames instead of template literals. Example: router.push({ name: RouteNames.WorkoutDetail, params: { id } })',
        },
        {
          selector: 'CallExpression[callee.name="navigateTo"] > Literal:first-child',
          message: 'Use named routes with RouteNames instead of hardcoded path strings. Example: navigateTo({ name: RouteNames.Home })',
        },
      ],
    },
  },

  // Enforce integration testing - ban direct component mounting
  {
    name: 'app/enforce-integration-tests',
    files: ['src/**/__tests__/**/*.{ts,spec.ts}'],
    ignores: ['src/__tests__/helpers/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@testing-library/vue',
              importNames: ['render'],
              message: 'Use createTestApp() from @/__tests__/helpers/createTestApp instead of render().',
            },
            {
              name: '@vue/test-utils',
              importNames: ['mount', 'shallowMount'],
              message: 'Use createTestApp() from @/__tests__/helpers/createTestApp instead of mounting components directly.',
            },
          ],
        },
      ],
    },
  },

  // Feature boundary enforcement - prevent cross-feature imports
  {
    name: 'app/feature-boundaries',
    files: ['src/**/*.{ts,vue}'],
    ignores: ['src/**/__tests__/**'],
    plugins: {
      'import-x': pluginImportX,
    },
    settings: {
      'import-x/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
      },
    },
    rules: {
      'import-x/no-restricted-paths': ['error', {
        zones: [
          // === CROSS-FEATURE ISOLATION ===
          // Features cannot import from other features (strict Bulletproof compliance)
          { target: './src/features/workout', from: './src/features', except: ['./workout'] },
          { target: './src/features/exercises', from: './src/features', except: ['./exercises'] },
          { target: './src/features/settings', from: './src/features', except: ['./settings'] },
          { target: './src/features/timers', from: './src/features', except: ['./timers'] },
          { target: './src/features/templates', from: './src/features', except: ['./templates'] },

          // === UNIDIRECTIONAL FLOW ===
          // Shared code cannot import from features or views
          {
            target: ['./src/components', './src/composables', './src/lib', './src/db', './src/types', './src/stores'],
            from: ['./src/features', './src/views'],
          },

          // Features cannot import from views (views are the top-level orchestrators)
          { target: './src/features', from: './src/views' },
        ],
      }],
    },
  },

  // Vue i18n - enforce translation usage (no-raw-text)
  {
    name: 'app/vue-i18n',
    files: ['src/**/*.vue'],
    plugins: {
      '@intlify/vue-i18n': pluginVueI18n,
    },
    rules: {
      '@intlify/vue-i18n/no-raw-text': ['warn', {
        ignorePattern: '^[-#:()&+×/°′″%]+$',
        ignoreText: ['kg', 'lbs', 'cm', 'ft/in', '—', '•', '✓', '›', '→', '·', 'Close'],
        attributes: {
          '/.+/': ['title', 'aria-label', 'aria-placeholder', 'placeholder', 'alt'],
        },
      }],
    },
  },

  ...pluginOxlint.buildFromOxlintConfigFile('./.oxlintrc.json'),
  skipFormatting,
  {
    ignores: ['.claude/**'],
  },
)
