import type { Rule } from 'eslint'
import type { ImportDeclaration, Node } from 'estree'
import path from 'node:path'

/**
 * Vue Composable Validation Rule
 *
 * From Vue docs: A "composable" is a function that leverages Vue's Composition API
 * to encapsulate and reuse stateful logic. Utility functions are stateless and
 * don't need Vue reactivity.
 *
 * This rule ensures files named use*.ts actually import from Vue or VueUse,
 * distinguishing true composables from utility functions that should be renamed.
 */

const VALID_VUE_SOURCES = new Set([
  'vue',
  '@vueuse/core',
  'vue-router',
  'vue-i18n',
])

// Path patterns that indicate Vue ecosystem usage (global state composables)
const VALID_PATH_PATTERNS = [
  /^@\/stores\//,
]

function isImportDeclaration(node: Node): node is ImportDeclaration {
  return node.type === 'ImportDeclaration'
}

function isComposableFilename(filename: string): boolean {
  const basename = path.basename(filename, '.ts')
  return /^use[A-Z]/.test(basename)
}

function hasVueImport(node: ImportDeclaration): boolean {
  const source = node.source.value
  if (typeof source !== 'string') return false

  // Type-only imports count - composables can receive reactive parameters (Ref, ShallowRef, etc.)

  // Check for valid Vue package sources
  if (VALID_VUE_SOURCES.has(source)) {
    return true
  }

  // Check for valid path patterns (e.g., @/stores/*)
  return VALID_PATH_PATTERNS.some((pattern) => pattern.test(source))
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require composable files (use*.ts) to import from Vue or VueUse',
    },
    messages: {
      notAComposable:
        'File "{{filename}}" does not import from Vue ecosystem packages. ' +
        'Composables must use Vue reactivity (ref, computed, watch, lifecycle hooks, etc.). ' +
        'If this is a stateless utility, rename it (e.g., {{suggestedName}}) and move to lib/ or utils/.',
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename ?? context.getFilename()

    // Only check files that match use*.ts pattern
    if (!filename.endsWith('.ts') || !isComposableFilename(filename)) {
      return {}
    }

    let hasValidVueImport = false

    return {
      ImportDeclaration(node: Node) {
        if (!isImportDeclaration(node)) return
        if (hasVueImport(node)) {
          hasValidVueImport = true
        }
      },

      'Program:exit'(node: Node) {
        if (hasValidVueImport) return

        const basename = path.basename(filename, '.ts')
        // Suggest removing 'use' prefix: useTimer -> timer or timerUtils
        const nameWithoutUse = basename.replace(/^use/, '')
        const suggestedName = nameWithoutUse.charAt(0).toLowerCase() + nameWithoutUse.slice(1) + '.ts'

        context.report({
          node,
          messageId: 'notAComposable',
          data: {
            filename: basename + '.ts',
            suggestedName,
          },
        })
      },
    }
  },
}

export default rule
