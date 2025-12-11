import type { Rule } from 'eslint'
import type { Node, CallExpression, AwaitExpression, MemberExpression, Identifier } from 'estree'

function isCallExpression(node: Node): node is CallExpression {
  return node.type === 'CallExpression'
}

function isAwaitExpression(node: Node): node is AwaitExpression {
  return node.type === 'AwaitExpression'
}

function isMemberExpression(node: Node): node is MemberExpression {
  return node.type === 'MemberExpression'
}

function isIdentifier(node: Node): node is Identifier {
  return node.type === 'Identifier'
}

function isRepositoryMethodCall(node: CallExpression): boolean {
  // Check for chained call: get*Repository().method()
  if (!isMemberExpression(node.callee)) return false

  const memberExpr = node.callee
  if (!isCallExpression(memberExpr.object)) return false

  const objectCall = memberExpr.object
  if (!isIdentifier(objectCall.callee)) return false

  // Match get*Repository pattern
  return /^get\w+Repository$/.test(objectCall.callee.name)
}

function isWrappedInTryCatch(context: Rule.RuleContext, node: Node): boolean {
  const ancestors = context.sourceCode.getAncestors(node)

  // Look for tryCatch(expr) in ancestors
  for (const ancestor of ancestors) {
    if (!isCallExpression(ancestor)) continue
    if (!isIdentifier(ancestor.callee)) continue
    if (ancestor.callee.name === 'tryCatch') return true
  }
  return false
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Require tryCatch() wrapper for repository calls',
    },
    messages: {
      missingTryCatch:
        'Repository calls must be wrapped with tryCatch(). Use: const [error, result] = await tryCatch({{call}})',
    },
    schema: [],
  },
  create(context) {
    return {
      AwaitExpression(node: Node) {
        if (!isAwaitExpression(node)) return

        // Check if awaiting a call expression
        if (!isCallExpression(node.argument)) return

        // Check for get*Repository().method() pattern
        if (!isRepositoryMethodCall(node.argument)) return

        // Check if already wrapped in tryCatch
        if (isWrappedInTryCatch(context, node)) return

        context.report({
          node,
          messageId: 'missingTryCatch',
          data: { call: context.sourceCode.getText(node) },
        })
      },
    }
  },
}

export default rule
