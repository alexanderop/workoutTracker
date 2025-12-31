export type InputType = 'weight' | 'reps' | 'rir' | 'duration' | 'distance'

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
  min: number
  max: number
}>

type ClampOptions = Readonly<{
  min: number
  max: number
}>

type AppendOptions = Readonly<{
  max?: number
}>

type StringAppendOptions = Readonly<{
  max?: number
  maxDecimals?: number
}>

type NumericInputReturn = {
  generateWheelValues: (currentValue: number, options: GenerateOptions) => number[]
  getPresetConfig: (type: InputType) => PresetConfig
  clampValue: (value: number, options: ClampOptions) => number
  appendDigit: (currentValue: number, digit: string, options?: AppendOptions) => number
  removeDigit: (currentValue: number) => number
  stringToNumber: (str: string) => number
  numberToString: (value: number) => string
  appendDigitToString: (str: string, digit: string, options?: StringAppendOptions) => string
  appendDecimalToString: (str: string) => string
  removeLastChar: (str: string) => string
}

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
  duration: {
    step: 5,
    allowDecimal: false,
    min: 0,
    max: 600,
    range: 30,
  },
  distance: {
    step: 0.5,
    allowDecimal: true,
    min: 0,
    max: 999,
    range: 10,
  },
}

export function useNumericInput(): NumericInputReturn {
  function generateWheelValues(
    currentValue: number,
    options: GenerateOptions,
  ): Array<number> {
    const { step, range, min, max } = options
    const values: Array<number> = []

    // Clamp both bounds to min/max
    const rawStart = Math.max(min, currentValue - range)
    const rawEnd = Math.min(max, currentValue + range)

    // Align start UP to nearest step, end DOWN to nearest step
    const start = Math.ceil(rawStart / step) * step
    const end = Math.floor(rawEnd / step) * step

    for (let value = start; value <= end; value += step) {
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

  // ============================================
  // String-based functions for decimal handling
  // ============================================

  /**
   * Convert editing string to number.
   * Returns 0 for empty or invalid strings.
   */
  function stringToNumber(str: string): number {
    if (!str || str === '' || str === '.') return 0
    const parsed = parseFloat(str)
    return isNaN(parsed) ? 0 : parsed
  }

  /**
   * Convert number to editing string.
   * Preserves trailing decimal point and zeros for editing.
   */
  function numberToString(value: number): string {
    if (value === 0) return '0'
    return String(value)
  }

  /**
   * Append a digit to the editing string.
   */
  function appendDigitToString(
    str: string,
    digit: string,
    options: StringAppendOptions = {},
  ): string {
    const { max, maxDecimals = 2 } = options

    // Handle initial state
    if (str === '0' && digit !== '0') {
      const newStr = digit
      return checkMax(newStr, max) ? newStr : str
    }

    // Prevent multiple leading zeros
    if (str === '0' && digit === '0') {
      return '0'
    }

    // Check decimal place limit
    const decimalIndex = str.indexOf('.')
    if (decimalIndex !== -1) {
      const currentDecimals = str.length - decimalIndex - 1
      if (currentDecimals >= maxDecimals) {
        return str
      }
    }

    const newStr = str + digit

    // Check max constraint
    if (!checkMax(newStr, max)) {
      return str
    }

    return newStr
  }

  /**
   * Append decimal point to the editing string.
   * No-op if decimal already exists.
   */
  function appendDecimalToString(str: string): string {
    // Already has decimal point
    if (str.includes('.')) {
      return str
    }

    // Handle empty or zero
    if (str === '' || str === '0') {
      return '0.'
    }

    return str + '.'
  }

  /**
   * Remove the last character from the editing string.
   */
  function removeLastChar(str: string): string {
    if (str.length <= 1) {
      return '0'
    }
    const newStr = str.slice(0, -1)
    // If we removed the only digit before decimal, return "0."
    if (newStr === '.') {
      return '0'
    }
    return newStr
  }

  /**
   * Check if value would exceed max.
   */
  function checkMax(str: string, max?: number): boolean {
    if (max === undefined) return true
    const value = parseFloat(str)
    return !isNaN(value) && value <= max
  }

  return {
    generateWheelValues,
    getPresetConfig,
    clampValue,
    appendDigit,
    removeDigit,
    // String-based functions
    stringToNumber,
    numberToString,
    appendDigitToString,
    appendDecimalToString,
    removeLastChar,
  }
}
