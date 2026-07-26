import type { DesignSection } from './types'
import BadgesFrame from './frames/BadgesFrame.vue'
import BlockKindsFrame from './frames/BlockKindsFrame.vue'
import ButtonsFrame from './frames/ButtonsFrame.vue'
import CardsFrame from './frames/CardsFrame.vue'
import ColorTokensFrame from './frames/ColorTokensFrame.vue'
import FeedbackFrame from './frames/FeedbackFrame.vue'
import FormControlsFrame from './frames/FormControlsFrame.vue'
import NavigationFrame from './frames/NavigationFrame.vue'
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
  {
    id: 'components',
    name: 'Components',
    frames: [
      {
        id: 'buttons',
        name: 'Button',
        description:
          'Six variants, three sizes, plus icon-only. The in-workout primary is deliberately taller than the default — it gets pressed with a sweaty thumb between sets.',
        width: 420,
        component: ButtonsFrame,
        tokens: ['bg-primary', 'bg-destructive', 'h-touch'],
        source: '@/components/ui/button',
        controls: [
          {
            kind: 'select',
            key: 'variant',
            label: 'Variant',
            options: ['default', 'secondary', 'outline', 'ghost', 'destructive', 'link'],
            initial: 'default',
          },
          {
            kind: 'select',
            key: 'size',
            label: 'Size',
            options: ['sm', 'default', 'lg'],
            initial: 'default',
          },
          { kind: 'text', key: 'label', label: 'Label', initial: 'Log set' },
          { kind: 'switch', key: 'icon', label: 'Leading icon', initial: true },
          { kind: 'switch', key: 'fullWidth', label: 'Full width', initial: false },
          { kind: 'switch', key: 'disabled', label: 'Disabled', initial: false },
        ],
      },
      {
        id: 'badges',
        name: 'Badge & chips',
        description:
          'Badges for labels, `.filter-pill` for the exercise filter scroller, `.status-*` for set outcomes. The last two are CSS component classes, not utilities.',
        width: 380,
        component: BadgesFrame,
        tokens: ['.filter-pill', '.status-success-bg', '.status-warning-bg'],
        source: '@/components/ui/badge',
        controls: [
          {
            kind: 'select',
            key: 'variant',
            label: 'Variant',
            options: ['default', 'secondary', 'outline', 'destructive'],
            initial: 'default',
          },
          { kind: 'text', key: 'label', label: 'Label', initial: '12 day streak' },
          { kind: 'switch', key: 'icon', label: 'Leading icon', initial: true },
        ],
      },
      {
        id: 'cards',
        name: 'Card',
        description:
          'Header/content/footer anatomy, the tappable list row, and the compact stat tile. Cards carry the surface colour — never a raw background.',
        width: 420,
        component: CardsFrame,
        tokens: ['bg-card', 'text-card-foreground'],
        source: '@/components/ui/card',
      },
      {
        id: 'form-controls',
        name: 'Form controls',
        description:
          'Interactive on the canvas — type in them, drag the slider. Numeric fields use tabular figures so a value stops shifting as you edit it.',
        width: 420,
        component: FormControlsFrame,
        tokens: ['--input', '--ring', 'aria-invalid'],
        source: '@/components/ui/input',
      },
      {
        id: 'feedback',
        name: 'Feedback',
        description:
          'Progress, empty states, separators, avatars. Empty states always offer the next action — a dead end mid-session is worse than a wrong guess.',
        width: 400,
        component: FeedbackFrame,
        tokens: ['--primary', '--muted-foreground'],
        source: '@/components/ui/empty',
      },
      {
        id: 'navigation',
        name: 'Navigation',
        description:
          'Tabs, the shared SegmentedControl built on them, and multi-select ToggleGroup.',
        width: 400,
        component: NavigationFrame,
        tokens: ['--accent', '--muted'],
        source: '@/components/SegmentedControl.vue',
      },
      {
        id: 'block-kinds',
        name: 'Block kinds',
        description:
          'Labels and colors read straight from the `BLOCK_META` registry, so this frame cannot drift from what the block system ships.',
        width: 400,
        component: BlockKindsFrame,
        tokens: ['--block-strength', '--block-amrap', '--block-emom'],
        source: '@/blocks',
      },
    ],
  },
]
