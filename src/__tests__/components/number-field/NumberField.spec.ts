import { render } from 'vitest-browser-vue'
import { page } from 'vitest/browser'
import { describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import { NumberField, NumberFieldInput } from '@/components/ui/number-field'

const NumberFieldHarness = defineComponent({
  props: {
    formatOptions: {
      type: Object,
      required: false,
      default: undefined,
    },
  },
  setup(props) {
    return () =>
      h(
        NumberField,
        { formatOptions: props.formatOptions },
        {
          default: () => h(NumberFieldInput, { 'aria-label': 'Amount' }),
        },
      )
  },
})

describe('NumberField', () => {
  it('defaults to a numeric inputmode so Android shows the digit keypad', async () => {
    render(NumberFieldHarness, { props: {} })

    const input = page.getByRole('spinbutton', { name: 'Amount' })
    await expect.element(input).toHaveAttribute('inputmode', 'numeric')
  })

  it('keeps decimal inputmode when a caller passes decimal format options', async () => {
    render(NumberFieldHarness, {
      props: {
        formatOptions: { maximumFractionDigits: 2, useGrouping: false },
      },
    })

    const input = page.getByRole('spinbutton', { name: 'Amount' })
    await expect.element(input).toHaveAttribute('inputmode', 'decimal')
  })

  it('sets the Android action key to Done, matching reka-ui committing the value on Enter', async () => {
    render(NumberFieldHarness, { props: {} })

    const input = page.getByRole('spinbutton', { name: 'Amount' })
    await expect.element(input).toHaveAttribute('enterkeyhint', 'done')
  })
})
