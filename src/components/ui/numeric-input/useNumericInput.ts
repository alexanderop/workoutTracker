export type InputType = 'weight' | 'reps' | 'rir'

export type PresetConfig = {
  step: number
  allowDecimal: boolean
  min: number
  max: number
  range: number
}

type GenerateOptions = Readonly<{
  step: number
  range: number
}>

type ClampOptions = Readonly<{
  min: number
  max: number
}>

type AppendOptions = Readonly<{
  max?: number
}>

const PRESET_CONFIGS: Record<InputType, PresetConfig> = {
  weight: {
    step: 2.5,
    allowDecimal: true,
    min: 0,
    max: 999,
    range: 40,
  },
  reps: {
    step: 1,
    allowDecimal: false,
    min: 1,
    max: 999,
    range: 20,
  },
  rir: {
    step: 1,
    allowDecimal: false,
    min: 0,
    max: 10,
    range: 10,
  },
}

export function useNumericInput() {
  function generateWheelValues(
    currentValue: number,
    options: GenerateOptions,
  ): Array<number> {
    const { step, range } = options
    const values: Array<number> = []

    const start = Math.max(0, currentValue - range)
    const end = currentValue + range

    // Round start to nearest step
    const roundedStart = Math.ceil(start / step) * step

    for (let value = roundedStart; value <= end; value += step) {
      // Handle floating point precision issues
      const roundedValue = Math.round(value * 100) / 100
      values.push(roundedValue)
    }

    return values
  }

  function getPresetConfig(type: InputType): PresetConfig {
    return PRESET_CONFIGS[type]
  }

  function clampValue(value: number, options: ClampOptions): number {
    const { min, max } = options
    return Math.min(max, Math.max(min, value))
  }

  function appendDigit(
    currentValue: number,
    digit: string,
    options: AppendOptions = {},
  ): number {
    // Prevent leading zeros
    if (currentValue === 0 && digit === '0') {
      return 0
    }

    const newValue =
      currentValue === 0 ? Number(digit) : Number(`${currentValue}${digit}`)

    // Respect max constraint
    if (options.max !== undefined && newValue > options.max) {
      return currentValue
    }

    return newValue
  }

  function removeDigit(currentValue: number): number {
    const valueStr = String(currentValue)
    if (valueStr.length <= 1) {
      return 0
    }
    return Number(valueStr.slice(0, -1))
  }

  return {
    generateWheelValues,
    getPresetConfig,
    clampValue,
    appendDigit,
    removeDigit,
  }
}
