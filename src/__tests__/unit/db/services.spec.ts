/**
 * Node `unit` tier (ADR 004: brain/decisions/004-db-in-di.md). Proves two
 * things with zero Dexie: `src/db/services.ts` is Node-importable on its own
 * (it must never drag in `services.live.ts`, which reaches `@/db`), and the
 * positional layer-order contract `buildAll` relies on is real — a dependent
 * layer resolves only when it is listed after the layer it depends on.
 *
 * The `HabitRepo` -> `Repositories` shape below is exactly what `main.ts` wires
 * for real (`sync(HabitRepo, (ctx) => ctx.unsafeGet(Repositories).habits)`),
 * proven here against `createMockRepositoryProvider()` instead of Dexie. That
 * helper is Node-safe: its only runtime import is `vi`, everything else is
 * `import type`.
 */
import { describe, expect, it } from 'vitest'
import { empty } from '@/lib/di/context'
import { succeed, sync } from '@/lib/di/layer'
import { makeRuntime } from '@/lib/di/runtime'
import { Repositories } from '@/db/services'
import { HabitRepo } from '@/features/habits/services'
import { createMockRepositoryProvider } from '@/__tests__/helpers/mockRepositories'

describe('Repositories', () => {
  it('round-trips a provided RepositoryProvider through a context', () => {
    const fake = createMockRepositoryProvider()
    const context = empty().add(Repositories, fake)

    expect(context.get(Repositories)).toBe(fake)
  })
})

describe('layer order for a dependent service (the Repositories -> HabitRepo shape)', () => {
  it('resolves the dependent layer when it is positioned after its dependency', () => {
    const fake = createMockRepositoryProvider()
    const runtime = makeRuntime([
      succeed(Repositories, fake),
      sync(HabitRepo, (ctx) => ctx.unsafeGet(Repositories).habits),
    ])

    expect(runtime.get(HabitRepo)).toBe(fake.habits)
  })

  it('throws Service not found when the dependent layer is positioned before its dependency', () => {
    const fake = createMockRepositoryProvider()

    expect(() =>
      makeRuntime([
        sync(HabitRepo, (ctx) => ctx.unsafeGet(Repositories).habits),
        succeed(Repositories, fake),
      ]),
    ).toThrow('Service not found: Repositories')
  })
})
