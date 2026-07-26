import type { DesignSection } from './types'
import ColorTokensFrame from './frames/ColorTokensFrame.vue'
import SpacingFrame from './frames/SpacingFrame.vue'
import TypographyFrame from './frames/TypographyFrame.vue'

/**
 * The studio's file structure. Sections become canvas columns, left to right,
 * in the order declared here.
 */
export const designSections: ReadonlyArray<DesignSection> = [
  {
    id: 'foundations',
    name: 'Foundations',
    frames: [
      {
        id: 'color-tokens',
        name: 'Color tokens',
        description:
          'Every semantic color in the system. Components only ever reference these names — raw palette classes are blocked by `pnpm lint:tokens`, which is what makes retheming safe.',
        width: 420,
        component: ColorTokensFrame,
        tokens: ['--primary', '--muted', '--success', '--block-*', '--muscle-*', '--chart-*'],
        source: 'src/style.css',
      },
      {
        id: 'typography',
        name: 'Typography',
        description:
          'Two project-defined steps (`text-page-title`, `text-section-title`) sit on top of the Tailwind ramp. Live numerals use tabular figures so a running timer stops shifting width.',
        width: 380,
        component: TypographyFrame,
        tokens: ['--text-page-title', '--text-section-title'],
        source: 'src/style.css',
      },
      {
        id: 'spacing',
        name: 'Geometry',
        description:
          'Radius, rhythm, icon sizing and touch targets. Every radius derives from `--radius`, so one slider restyles the whole app.',
        width: 380,
        component: SpacingFrame,
        tokens: ['--radius', '--spacing-section', '--size-icon-*', '--size-touch-target'],
        source: 'src/style.css',
      },
    ],
  },
]
