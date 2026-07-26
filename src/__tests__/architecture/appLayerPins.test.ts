/**
 * Architecture rule: every service registered in `src/appLayers.ts` must be
 * pinned by a matching assertion in `src/__tests__/types/appLayers.test-d.ts`.
 *
 * This exists because the guarantee is *per service*, not global, and nothing
 * else notices when a new one goes unpinned. `useRuntimeContext<T>()` erases
 * the service union by design (ADR 003/004 *Limits*, `src/lib/di/vue.ts`), so a
 * feature that resolves its service through a composable contributes no
 * type-level evidence that the layer is registered. Delete an unpinned layer
 * from `appLayers` and `vue-tsc` exits 0, the whole Node `unit` tier passes,
 * the husky pre-commit gate is green -- and the app throws
 * `Service not found: <Tag>` the moment the route that needs it mounts.
 *
 * That happened once already: `HabitViewModeStoreLive` shipped without a pin,
 * and only the ~45s browser integration spec would have caught its removal.
 * `brain/principles/type-guarantees-need-a-pinned-call-site.md` is the write-up;
 * this file is the structural version, so the next layer cannot repeat it.
 *
 * Deliberately textual rather than type-level: the pin file is a `.test-d.ts`
 * whose whole job is to be type-checked, so a test that reasoned about its
 * *types* would be circular. What needs checking is cruder -- that a line
 * mentioning each Tag exists at all.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import { describe, it, expect } from 'vitest'

const repoRoot = fileURLToPath(new URL('../../../', import.meta.url))

function read(relativePath: string): string {
  return readFileSync(`${repoRoot}${relativePath}`, 'utf8')
}

/**
 * Layer identifiers listed in the `appLayers` array literal, e.g.
 * `HabitRepoLive`. The array is a flat list of identifiers by construction
 * (`as const satisfies ReadonlyArray<ErasedLayer>`), so a line-wise read is
 * enough and needs no TypeScript parse.
 */
function layerNamesInAppLayers(source: string): Array<string> {
  const arrayBody = /export const appLayers = \[(?<body>[^\]]*)\]/s.exec(source)?.groups?.body
  if (arrayBody === undefined)
    throw new Error('Could not find the `appLayers` array in appLayers.ts')
  return arrayBody
    .split(',')
    .map((entry) => entry.replaceAll(/\/\/.*$/gm, '').trim())
    .filter((entry) => entry.length > 0)
}

/**
 * `XyzLive` is the Layer; `Xyz` is the Tag the pin file asserts on. The naming
 * convention is what links them -- `HabitRepoLive` provides `HabitRepo`.
 */
function tagNameFor(layerName: string): string {
  return layerName.replace(/Live$/, '')
}

describe('appLayers pins', () => {
  it('asserts every registered layer in appLayers.test-d.ts', () => {
    const layers = layerNamesInAppLayers(read('src/appLayers.ts'))
    const pins = read('src/__tests__/types/appLayers.test-d.ts')

    expect(layers.length).toBeGreaterThan(0)

    const unpinned = layers
      .map((layer) => tagNameFor(layer))
      .filter((tag) => !new RegExp(String.raw`runtime\.get\(${tag}\)`).test(pins))

    expect(
      unpinned,
      `These services are registered in appLayers but not pinned in appLayers.test-d.ts, so ` +
        `deleting their layer would type-check clean and fail only at runtime. Add ` +
        `\`expectTypeOf(runtime.get(<Tag>)).toEqualTypeOf<...>()\` for each.`,
    ).toEqual([])
  })

  it('follows the `<Tag>Live` naming convention this rule depends on', () => {
    const layers = layerNamesInAppLayers(read('src/appLayers.ts'))

    // The check above maps layer -> tag by trimming `Live`. A layer named
    // otherwise would map to a tag that does not exist and pass vacuously.
    expect(layers.filter((layer) => !layer.endsWith('Live'))).toEqual([])
  })
})
