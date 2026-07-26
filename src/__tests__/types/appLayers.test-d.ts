import { expectTypeOf } from 'vitest'
import { appLayers } from '@/appLayers'
import type { HabitRepository, ProgressionsRepository, RepositoryProvider } from '@/db/interfaces'
import { Repositories } from '@/db/services'
import { HabitRepo, HabitViewModeStore } from '@/features/habits/services'
import type { HabitViewModePrefs } from '@/features/habits/services'
import { ProgressionRepo } from '@/features/progressions/services'
import { makeRuntime } from '@/lib/di/runtime'

// The app runtime must resolve every service the app depends on. Deleting a
// layer from `appLayers` makes one of these a compile error rather than a
// runtime `Service not found` -- that guarantee is what ADR 004's 250 -> 280
// line budget bought, and this file is what stops it regressing silently.
//
// EVERY Tag added to `appLayers` needs a line here. The guarantee is per
// service, not global: a layer with no assertion below can be deleted with a
// green type-check and a green unit tier, and only fails when the route that
// needs it mounts in the browser. Consumers reached through
// `useRuntimeContext<T>()` cannot supply the pin themselves -- it `unsafeCoerce`s
// the service union away (src/lib/di/vue.ts), which is exactly why the pin has
// to live at this call site. See
// brain/principles/type-guarantees-need-a-pinned-call-site.md.
const runtime = makeRuntime(appLayers)

expectTypeOf(runtime.get(Repositories)).toEqualTypeOf<RepositoryProvider>()
expectTypeOf(runtime.get(HabitRepo)).toEqualTypeOf<HabitRepository>()
expectTypeOf(runtime.get(HabitViewModeStore)).toEqualTypeOf<HabitViewModePrefs>()
expectTypeOf(runtime.get(ProgressionRepo)).toEqualTypeOf<ProgressionsRepository>()
