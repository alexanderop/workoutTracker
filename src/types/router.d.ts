import 'vue-router'
import type { MessageSchema } from '@/i18n/types'

declare module 'vue-router' {
  interface RouteMeta {
    /**
     * Key into nav.pageTitles (e.g. 'settings'), resolved into document.title
     * as "<title> · Workout Tracker" by setupDocumentTitle(). A literal union
     * (not `string`) so vue-i18n's `t()` overloads can validate it and so a
     * typo is caught at compile time instead of silently falling back.
     */
    titleKey?: keyof MessageSchema['nav']['pageTitles']
  }
}
