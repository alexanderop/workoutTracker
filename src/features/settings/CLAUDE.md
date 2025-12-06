# Settings Feature

Provides app-wide settings, theming, localization, and data import/export.

## Purpose

This feature manages user preferences and app configuration. It handles theme switching (light/dark), language selection, data backup/restore, and diagnostic utilities.

## Public API (`index.ts`)

### Components
- `SettingsDeleteAllDataDialog` - Confirmation dialog for wiping all data
- `SettingsImportDataDialog` - File picker and preview for importing backups
- `SettingsImportErrorDialog` - Error display for failed imports
- `SettingsWakeLockDiagnostics` - Debug info for screen wake lock issues

### Composables
- `useTheme()` - Dark/light mode toggle using VueUse's `useColorMode`
- `useLanguage()` - i18n locale management with browser detection

### Utils
- `exportAllData()` - Exports all user data as JSON file download
- `importAllData()` - Restores data from backup file
- `parseExportFile()` - Validates and parses import file
- `getExportSummary()` - Counts items in export for preview

## Key Concepts

### Theme System
- Uses Tailwind's `dark` class on `<html>` element
- `useTheme()` provides `isDark` computed for v-model binding
- Colors defined via CSS variables in `src/style.css`

### Language System
- Supports English (`en`) and German (`de`)
- Auto-detects browser locale on first visit
- Persists to settings store → IndexedDB
- Uses global state (`createGlobalState`) for singleton pattern

### Data Export Format
```typescript
type ExportData = {
  version: number          // Format version for migrations
  exportedAt: string       // ISO timestamp
  data: {
    settings: Array<...>
    customExercises: Array<...>
    templates: Array<...>
    workouts: Array<...>
  }
}
```

## Common Tasks

### Add a new language
1. Add locale file in `src/i18n/locales/`
2. Update `SupportedLocale` type in `src/i18n/index.ts`
3. Update `detectBrowserLocale()` in `useLanguage.ts`

### Add a new setting
1. Add field to `DbUserSetting` in `src/db/schema.ts`
2. Add getter/setter to `src/stores/settings.ts`
3. Create UI component in this feature's `components/`
