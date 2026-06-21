import type { Rule } from 'eslint'
import type {
  Node,
  IfStatement,
  LogicalExpression,
  ConditionalExpression,
  UnaryExpression,
  BinaryExpression,
  CallExpression,
  MemberExpression,
  ChainExpression,
  BlockStatement,
  Statement,
} from 'estree'

const OPERATOR_THRESHOLD = 2

function isLogicalExpression(node: Node): node is LogicalExpression {
  return node.type === 'LogicalExpression'
}

function isConditionalExpression(node: Node): node is ConditionalExpression {
  return node.type === 'ConditionalExpression'
}

function isUnaryExpression(node: Node): node is UnaryExpression {
  return node.type === 'UnaryExpression'
}

function isBinaryExpression(node: Node): node is BinaryExpression {
  return node.type === 'BinaryExpression'
}

function isCallExpression(node: Node): node is CallExpression {
  return node.type === 'CallExpression'
}

function isMemberExpression(node: Node): node is MemberExpression {
  return node.type === 'MemberExpression'
}

function isChainExpression(node: Node): node is ChainExpression {
  return node.type === 'ChainExpression'
}

function isIfStatement(node: Node): node is IfStatement {
  return node.type === 'IfStatement'
}

function isBlockStatement(node: Node): node is BlockStatement {
  return node.type === 'BlockStatement'
}

function countOperators(node: Node): number {
  let count = 0

  function traverse(n: Node): void {
    if (isLogicalExpression(n)) {
      count++
      traverse(n.left)
      traverse(n.right)
    }

    if (isConditionalExpression(n)) {
      count++
      traverse(n.test)
      traverse(n.consequent)
      traverse(n.alternate)
    }

    if (isUnaryExpression(n)) {
      traverse(n.argument)
    }

    if (isBinaryExpression(n)) {
      traverse(n.left)
      traverse(n.right)
    }

    if (isCallExpression(n)) {
      for (const argument of n.arguments) {
        traverse(argument)
      }
    }

    if (isMemberExpression(n)) {
      traverse(n.object)
    }

    if (isChainExpression(n)) {
      traverse(n.expression)
    }
  }

  traverse(node)
  return count
}

function isAlreadyVariableReference(node: Node): boolean {
  return node.type === 'Identifier'
}

/**
 * Check if condition contains optional chaining (?.)
 * These are type narrowing guards that must stay inline for TypeScript.
 */
function hasOptionalChaining(node: Node): boolean {
  let isFound = false

  function traverse(n: Node): void {
    if (isFound) return

    if (isChainExpression(n)) {
      isFound = true
      return
    }

    if (isMemberExpression(n)) {
      if (n.optional) {
        isFound = true
        return
      }
      traverse(n.object)
      return
    }

    if (isCallExpression(n)) {
      traverse(n.callee)
      for (const argument of n.arguments) {
        traverse(argument)
      }
      return
    }

    if (isLogicalExpression(n)) {
      traverse(n.left)
      traverse(n.right)
      return
    }

    if (isUnaryExpression(n)) {
      traverse(n.argument)
      return
    }

    if (isBinaryExpression(n)) {
      traverse(n.left)
      traverse(n.right)
    }
  }

  traverse(node)
  return isFound
}

/**
 * Check if the if body is a simple early exit (return, throw, continue, break).
 * These are guard clauses that TypeScript uses for type narrowing.
 * Extracting their conditions would break type safety.
 */
function isEarlyExitGuard(consequent: Statement): boolean {
  // Direct statement: if (cond) return;
  if (
    consequent.type === 'ReturnStatement' ||
    consequent.type === 'ThrowStatement' ||
    consequent.type === 'ContinueStatement' ||
    consequent.type === 'BreakStatement'
  ) {
    return true
  }

  // Block with single statement: if (cond) { return; }
  if (isBlockStatement(consequent) && consequent.body.length === 1) {
    const statement = consequent.body[0]
    if (
      statement &&
      (statement.type === 'ReturnStatement' ||
        statement.type === 'ThrowStatement' ||
        statement.type === 'ContinueStatement' ||
        statement.type === 'BreakStatement')
    ) {
      return true
    }
  }

  return false
}

/**
 * Check if the condition involves truthiness checks that narrow types.
 * Pattern: foo && foo[0] or foo && foo.bar
 * These must stay inline for TypeScript narrowing.
 */
function hasTruthyNarrowingPattern(node: Node): boolean {
  if (!isLogicalExpression(node) || node.operator !== '&&') {
    return false
  }

  // Collect all identifiers being checked for truthiness
  const truthyCheckedIds = new Set<string>()
  // Collect all identifiers used in member access
  const accessedIds = new Set<string>()

  function collectTruthyChecks(n: Node): void {
    if (n.type === 'Identifier') {
      truthyCheckedIds.add(n.name)
      return
    }

    if (isLogicalExpression(n) && n.operator === '&&') {
      collectTruthyChecks(n.left)
      collectTruthyChecks(n.right)
    }
  }

  function collectMemberAccess(n: Node): void {
    if (isMemberExpression(n)) {
      if (n.object.type === 'Identifier') {
        accessedIds.add(n.object.name)
      }
      collectMemberAccess(n.object)
      return
    }

    if (isLogicalExpression(n)) {
      collectMemberAccess(n.left)
      collectMemberAccess(n.right)
      return
    }

    if (isCallExpression(n)) {
      collectMemberAccess(n.callee)
      for (const argument of n.arguments) {
        collectMemberAccess(argument)
      }
    }
  }

  collectTruthyChecks(node)
  collectMemberAccess(node)

  // If any identifier is both truthy-checked AND accessed, it's a narrowing pattern
  for (const id of accessedIds) {
    if (truthyCheckedIds.has(id)) {
      return true
    }
  }

  return false
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require complex conditions to be extracted into named variables',
    },
    messages: {
      extractCondition:
        'Complex condition with {{count}} operators should be extracted into a named const for readability. Example: const isConditionName = {{condition}}',
    },
    schema: [
      {
        type: 'object',
        properties: {
          threshold: {
            type: 'number',
            minimum: 1,
          },
        },
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    const options = context.options[0] || {}
    const threshold = options.threshold || OPERATOR_THRESHOLD

    return {
      IfStatement(node: Node) {
        if (!isIfStatement(node)) {
          return
        }

        // Skip if condition is already a simple variable reference
        if (isAlreadyVariableReference(node.test)) {
          return
        }

        // Skip early exit guards - TypeScript needs inline conditions for narrowing
        if (isEarlyExitGuard(node.consequent)) {
          return
        }

        // Skip conditions with optional chaining - these are type narrowing
        if (hasOptionalChaining(node.test)) {
          return
        }

        // Skip truthy narrowing patterns like: foo && foo[0]
        if (hasTruthyNarrowingPattern(node.test)) {
          return
        }

        const operatorCount = countOperators(node.test)

        if (operatorCount >= threshold) {
          context.report({
            node: node.test,
            messageId: 'extractCondition',
            data: {
              count: String(operatorCount),
              condition: context.sourceCode.getText(node.test),
            },
          })
        }
      },
    }
  },
}

export default rule
