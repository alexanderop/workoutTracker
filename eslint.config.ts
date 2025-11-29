import pluginVitest from '@vitest/eslint-plugin'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import pluginOxlint from 'eslint-plugin-oxlint'
import pluginVue from 'eslint-plugin-vue'
import { globalIgnores } from 'eslint/config'

// To allow more languages other than `ts` in `.vue` files, uncomment the following lines:
// import { configureVueProject } from '@vue/eslint-config-typescript'
// configureVueProject({ scriptLangs: ['ts', 'tsx'] })
// More info at https://github.com/vuejs/eslint-config-typescript/#advanced-setup

export default defineConfigWithVueTs(
  {
    ignores: ['.claude/**', '**/dist/**', '**/dist-ssr/**', '**/coverage/**', '**/node_modules/**'],
  },

  {
    name: 'app/files-to-lint',
    files: ['**/*.{ts,mts,tsx,vue}'],
  },

  globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/coverage/**']),

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
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'vue',
              importNames: ['reactive'],
              message: 'Use ref() instead of reactive() for consistent reactivity patterns.',
            },
          ],
        },
      ],
    },
  },

  {
    name: 'app/shadcn-ui-components',
    files: ['src/components/ui/**/*.vue'],
    rules: {
      'vue/multi-word-component-names': 'off',
    },
  },

  {
    name: 'app/typescript-style-guide',
    files: ['src/**/*.{ts,vue}'],
    rules: {
      // No `any` - use `unknown` + type guards
      '@typescript-eslint/no-explicit-any': 'error',

      // Use `type` over `interface`
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],

      // Use `Array<T>` syntax, not `T[]`
      '@typescript-eslint/array-type': ['error', { default: 'generic' }],

      // Separate `import type` from regular imports
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
      ],

      // No type assertions with `as` (except `as const`)
      '@typescript-eslint/consistent-type-assertions': [
        'error',
        {
          assertionStyle: 'never',
        },
      ],

      // No `enum` - use literal unions or `as const` objects
      // No `else` or `else if` - prefer early returns or ternary operators
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
      ],

      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'vue',
              importNames: ['reactive'],
              message: 'Use ref() instead of reactive() for consistent reactivity patterns.',
            },
          ],
        },
      ],
    },
  },

  {
    ...pluginVitest.configs.recommended,
    files: ['src/**/__tests__/*'],
  },
  ...pluginOxlint.configs['flat/recommended'],
  skipFormatting,
  {
    ignores: ['.claude/**'],
  },
)
