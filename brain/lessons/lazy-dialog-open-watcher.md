# A lazily-mounted dialog is already open when it mounts

Dialogs with non-trivial dependencies (camera, live queries, etc.) are mounted
on first use, to keep those dependencies off the startup path:

```vue
const Sheet = defineAsyncComponent(() => import('./FoodLogSheet.vue'))
// ...
<Sheet v-if="requested" v-model:open="open" />
```

`requested` and `open` flip to `true` in the same handler, so the component
**mounts with `open` already `true`**. A plain `watch(open, …)` therefore never
fires for the first opening — it only fires from the second onward.

That is invisible as long as the watcher only resets transient state (a tab
index, a query string), because the initial values are already correct. It
becomes a real bug the moment the watcher initialises something the component
does not own. `FoodLogSheet`'s watcher calls
`basket.openFor(localDate, meal)` on an app-scoped store, which discards the
basket when the day changes. Missing the first opening left `basket.localDate`
empty, so the **second** opening read the same day as a day change and threw
the basket away — the exact failure an app-scoped basket exists to prevent.

Use `{ immediate: true }` on any `watch(open)` that initialises state outside
the component. The `if (!isOpen) return` guard already makes it a no-op when
the component is somehow mounted closed.
