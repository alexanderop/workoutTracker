import type { Rule } from 'eslint'
import type { Node, Literal, TemplateLiteral } from 'estree'

// Type guard for TemplateLiteral nodes
function isTemplateLiteral(node: Node): node is TemplateLiteral {
  return node.type === 'TemplateLiteral'
}

// Tailwind color palette names (excluding semantic colors)
// Status colors are allowed: green/emerald (success), red (error), amber/yellow (warning)
const HARDCODED_COLORS = [
  'slate',
  'gray',
  'zinc',
  'neutral',
  'stone',
  // 'red', - allowed for error states
  'orange',
  // 'amber', - allowed for warning states
  // 'yellow', - allowed for warning states
  'lime',
  // 'green', - allowed for success states
  // 'emerald', - allowed for success states
  'teal',
  'cyan',
  'sky',
  'blue',
  'indigo',
  'violet',
  'purple',
  'fuchsia',
  'pink',
  'rose',
]

// Tailwind utilities that accept colors
const COLOR_UTILITIES = [
  'bg',
  'text',
  'border',
  'ring',
  'outline',
  'shadow',
  'accent',
  'caret',
  'fill',
  'stroke',
  'decoration',
  'divide',
  'from',
  'via',
  'to',
  'placeholder',
]

// Build regex pattern for hardcoded color classes
// Matches: bg-red-500, hover:bg-slate-50, dark:text-gray-100, etc.
const colorPattern = HARDCODED_COLORS.join('|')
const utilityPattern = COLOR_UTILITIES.join('|')

function isLiteral(node: Node): node is Literal {
  return node.type === 'Literal'
}

function findHardcodedColors(value: string): Array<string> {
  const matches: Array<string> = []
  const regex = new RegExp(
    String.raw`(?:^|\s|:|/)((${utilityPattern})-(?:${colorPattern})-\d{2,3}(?:\/\d+)?)`,
    'g',
  )
  let match
  while ((match = regex.exec(value)) !== null) {
    matches.push(match[1])
  }
  return matches
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Forbid hardcoded Tailwind color classes, prefer semantic colors',
    },
    messages: {
      noHardcodedColor:
        'Avoid hardcoded color "{{color}}". Use semantic classes like bg-muted, text-foreground, border-border, etc.',
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename ?? context.getFilename()

    // Only check Vue files
    if (!filename.endsWith('.vue')) {
      return {}
    }

    return {
      // Check string literals in template and script
      Literal(node: Node) {
        if (!isLiteral(node)) return
        if (typeof node.value !== 'string') return

        const hardcodedColors = findHardcodedColors(node.value)
        for (const color of hardcodedColors) {
          context.report({
            node,
            messageId: 'noHardcodedColor',
            data: { color },
          })
        }
      },

      // Check template literals (backtick strings)
      TemplateLiteral(node: Rule.Node) {
        if (!isTemplateLiteral(node)) return

        for (const quasi of node.quasis) {
          const hardcodedColors = findHardcodedColors(quasi.value.raw)
          for (const color of hardcodedColors) {
            context.report({
              node,
              messageId: 'noHardcodedColor',
              data: { color },
            })
          }
        }
      },
    }
  },
}

export default rule
