# Changing Primary Color in shadcn/ui

## Problem
Need to change the primary theme color from the default neutral/grayscale to a custom color (e.g., purple).

## Solution
Update the CSS variables in `src/style.css`:

### 1. Modify Light Mode (`:root` selector)
```css
--primary: oklch(0.55 0.25 290);        /* Medium purple */
--primary-foreground: oklch(0.985 0 0); /* White text */
```

### 2. Modify Dark Mode (`.dark` selector)
```css
--primary: oklch(0.75 0.2 290);         /* Lighter purple for dark backgrounds */
--primary-foreground: oklch(0.15 0 0);  /* Dark text */
```

### 3. Update Sidebar Primary (Optional but recommended for consistency)
Also update `--sidebar-primary` in both `:root` and `.dark` to match.

## OKLCH Color Format
Format: `oklch(lightness chroma hue)`
- **Lightness** (0-1): How bright the color is. Higher = lighter
- **Chroma** (0-0.4): Color saturation. Higher = more intense
- **Hue** (0-360): Color tone on the color wheel
  - Purple range: 270-310
  - Blue: 230-260
  - Red: 20-40
  - Green: 140-180

## Examples
- `oklch(0.55 0.25 290)` - Medium purple
- `oklch(0.75 0.2 290)` - Lighter purple
- `oklch(0.627 0.265 303.9)` - Deep saturated purple
- `oklch(0.488 0.243 264.376)` - Violet (more blue)

## Key Takeaway
When using shadcn/ui with CSS variables enabled (`cssVariables: true` in `components.json`):
- Primary color is defined by `--primary` CSS variable
- Always update both light and dark mode variants
- Use OKLCH for modern, perceptually uniform colors
- Changes are live with hot module reload during `pnpm dev`

## Reference
- Config: `components.json` → `tailwind.cssVariables: true`
- Style file: `src/style.css`
- Theme variables start around line 44 (`:root`) and line 79 (`.dark`)
