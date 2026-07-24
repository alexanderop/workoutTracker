# Context

Project domain glossary. Grown by `grill` as terms are resolved. One term per definition; split large domains into `context/<area>.md` notes linked from here.

- **Numeric input modal** — the fullscreen touch-device entry sheet (`src/components/ui/numeric-input/`) shared by all numeric fields: weight, reps, RIR, duration, distance. "Weight picker" is this modal with `type="weight"`, not a separate component.
- **Wheel** — the modal's scrollable step list (`NumericPresetList`). Canonical term going forward; "presets" in code refers to the generated step values it displays.
