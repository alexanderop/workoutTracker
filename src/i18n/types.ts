import type en from './messages/en'

export type MessageSchema = typeof en
export type SupportedLocale = 'en' | 'de'

// Extend vue-i18n module to provide global type definitions
// This pattern is recommended by official vue-i18n docs for type safety without assertions
declare module 'vue-i18n' {
  // Must use interface (not type) for proper module augmentation
  export type DefineLocaleMessage = {} & MessageSchema
}
