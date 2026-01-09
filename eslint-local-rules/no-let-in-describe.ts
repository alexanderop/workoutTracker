import type { Rule } from 'eslint'
import type { Node, VariableDeclaration, CallExpression } from 'estree'

function isCallExpression(node: Node): node is CallExpression {
  return node.type === 'CallExpression'
}

function isVariableDeclaration(node: Node): node is VariableDeclaration {
  return node.type === 'VariableDeclaration'
}

function isDescribeCall(node: CallExpression): boolean {
  if (node.callee.type === 'Identifier') {
    return node.callee.name === 'describe'
  }
  return false
}

function hasCallbackArgument(node: CallExpression): boolean {
  const callback = node.arguments[1]
  return Boolean(callback && (callback.type === 'ArrowFunctionExpression' || callback.type === 'FunctionExpression'))
}

/**
 * Disallow `let` declarations in describe blocks.
 *
 * This rule enforces Kent C. Dodds' testing principle of avoiding mutable
 * variables that get assigned in beforeEach hooks. Instead, use setup
 * functions that return values.
 *
 * Bad:
 * ```
 * describe('MyTest', () => {
 *   let foo  // Mutable variable in describe scope
 *   beforeEach(() => { foo = 'bar' })
 *   it('...', () => { expect(foo).toBe('bar') })
 * })
 * ```
 *
 * Good:
 * ```
 * describe('MyTest', () => {
 *   function setup() { return { foo: 'bar' } }  // Setup function
 *   it('...', () => {
 *     const { foo } = setup()  // Local const
 *     expect(foo).toBe('bar')
 *   })
 * })
 * ```
 *
 * @see https://kentcdodds.com/blog/avoid-nesting-when-youre-testing
 */
const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow let declarations in describe blocks - use setup functions instead',
    },
    messages: {
      noLetInDescribe: `Avoid \`let\` in describe blocks.

WHY: Mutable variables assigned in beforeEach create hidden state. Readers must
trace through multiple setup blocks to understand what a test is actually testing.

HOW TO FIX: Replace with a setup function that returns values.

❌ Bad:
  describe('Login', () => {
    let user
    beforeEach(() => { user = createUser() })
    it('works', () => { expect(user.name).toBe('test') })
  })

✅ Good:
  describe('Login', () => {
    function setup() { return { user: createUser() } }
    it('works', () => {
      const { user } = setup()
      expect(user.name).toBe('test')
    })
  })

Each test becomes self-contained and readable without tracing through beforeEach blocks.`,
    },
  },
  create(context) {
    // Track nesting depth - increment when entering describe, decrement when exiting
    let describeDepth = 0

    return {
      CallExpression(node: Node) {
        if (!isCallExpression(node)) return
        if (isDescribeCall(node) && hasCallbackArgument(node)) {
          describeDepth++
        }
      },
      'CallExpression:exit'(node: Node) {
        if (!isCallExpression(node)) return
        if (isDescribeCall(node) && hasCallbackArgument(node)) {
          describeDepth--
        }
      },
      VariableDeclaration(node: Node) {
        if (!isVariableDeclaration(node)) return
        // Only flag `let` declarations when inside a describe block
        if (describeDepth > 0 && node.kind === 'let') {
          context.report({
            node,
            messageId: 'noLetInDescribe',
          })
        }
      },
    }
  },
}

export default rule
