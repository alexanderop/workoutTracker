### System Instructions: TypeScript Style Guide

**Context:** TypeScript v5, `strict-type-checked`.

#### 1\. Type Logic & Syntax

  * **Inference:** Prefer inference. Explicitly declare types **only** to narrow (e.g., `useState<UserRole>('guest')`, `new Map<string, number>()`).
  * **Immutability:** ALWAYS use `Readonly` and `ReadonlyArray<T>`. Arguments must be immutable (returns new data, never mutates).
  * **Nullability:** Use `null` for explicit "no value"; use `undefined` for optional/non-existent.
  * **Strictness:**
      * **NO** `any`. Use `unknown` + type guards.
      * **NO** type assertions (`as T`). Use `@ts-expect-error` with comment if necessary.
      * **NO** `enum`. Use literal unions or `as const` objects.
  * **Definitions:** Use `type` over `interface`.
  * **Generics:** Use `Array<T>` syntax, not `T[]`.

#### 2\. Pattern Enforcement

  * **Discriminated Unions:** PRIORITIZE over optional properties for state/complex logic.
      * *Pattern:* `{ kind: 'circle', r: number } | { kind: 'square', s: number }`.
  * **Constants:**
      * Objects/Arrays: `as const`.
      * Complex/Validated: `as const satisfies ReadonlyArray<T>`.
  * **Template Literals:** Use for pattern validation (e.g., `type Version = v${number}`).
  * **Imports:** Explicitly separate `import type`.

#### 3\. Functions

  * **Behavior:** Pure, stateless, single-responsibility.
  * **Arguments:**
      * Use **Single Object Pattern** for multiple args.
      * Object args must use **Discriminated Unions** (not optional flags).
  * **Returns:** Explicit return types for public exports; inferred for internal helpers.

#### 4\. Naming Conventions

  * **Variables/Functions:** `camelCase`. Booleans: `is`, `has`.
  * **Types/Interfaces:** `PascalCase`.
  * **Generics:** `T` + Descriptor (e.g., `TRequest`, `TResponse`). NO single `T`.
  * **Constants:** `SCREAMING_SNAKE_CASE` (primitives). `PascalCase` (objects/arrays).
  * **Acronyms:** Treat as words (e.g., `loadXml`, `getFaqList`).

#### 5\. Source Structure

  * **Exports:** Named exports ONLY. NO default exports.
  * **Collocation:** Group by feature. Keep styles/tests/logic close.
  * **Imports:** Relative (`./`) for same-feature; Absolute (`@/`) for cross-feature.
  * **Comments:** "Why", not "What".

-----

### Code Patterns (Strict Adherence Required)

**Better Type Narrowing**

```typescript
// BAD
const userRole: string = 'admin'
const employees = new Map()

// GOOD
const userRole = 'admin' // Inferred literal
const employees = new Map<string, number>()
```

**Immutability & Arrays**

```typescript
// BAD
function update(users: User[]) {
  users.push(u)
}

// GOOD
function update(users: ReadonlyArray<User>) {
  return [...users, u]
}
```

**Complex State (Discriminated Unions)**

```typescript
// BAD
interface State { status: string, error?: string, data?: Data }

// GOOD
type State
  = | { status: 'loading' }
    | { status: 'error', error: string }
    | { status: 'success', data: Data }
```

**No Enums**

```typescript
// BAD
enum Role { Admin = 'admin' }

// GOOD
const ROLES = { Admin: 'admin' } as const
type Role = (typeof ROLES)[keyof typeof ROLES]
// OR
type Role = 'admin' | 'guest'
```

**Naming & Generics**

```typescript
// BAD
interface XMLParser<T> { URL: string }

// GOOD
interface XmlParser<TOutput> { url: string }
```
