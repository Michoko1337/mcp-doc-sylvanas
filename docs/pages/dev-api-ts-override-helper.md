# Target Selector Override Helper

> Source: <https://docs.project-sylvanas.net/dev/api/ts-override-helper>

## Overview

The TS Override Helper allows plugins to programmatically configure the Target Selector's mode, ranges, weights, override slots, and blacklist marks. Instead of relying on manual menu configuration, your plugin can enforce specific targeting behavior at runtime.

**Key Features:**

- **Mode & Range Control** - Set targeting mode, pull mode, and max range
- **Weight System** - Enable/disable and tune individual targeting weights
- **Override Slots** - Configure priority override slots (focus, mark, target, etc.)
- **Blacklist Marks** - Exclude marked targets from targeting
- **Write Modes** - Control how often overrides are applied (once, on change, every frame)
- **Batch Operations** - Apply multiple weight changes in a single call

## Importing The Module

```lua
---@type ts_override_helper
local ts = require("common/utility/ts_override_helper")
```

> [!WARNING]
> Access functions with `:` (colon), not `.` (dot).

---

## Write Modes

Every setter accepts an optional `write_mode` as the last parameter. This controls how often the override is applied.

| Mode | Enum | Description |
| --- | --- | --- |
| **Once** | `ts.enums.write_mode.ONCE` | Apply once per session (default). Safe to call every frame. |
| **On Change** | `ts.enums.write_mode.ON_CHANGE` | Apply only when the value differs from last write. |
| **Always** | `ts.enums.write_mode.ALWAYS` | Apply every frame. Use sparingly. |

```lua
-- Default: ONCE - safe to call in on_update, only writes once
ts:set_max_range_damage(40)

-- ON_CHANGE - syncs from a menu slider, only writes when value changes
ts:set_max_range_damage(my_slider:get(), ts.enums.write_mode.ON_CHANGE)

-- ALWAYS - force every frame (rarely needed)
ts:set_max_range_damage(40, ts.enums.write_mode.ALWAYS)
```

---

## Enums

All enums are accessible via `ts.enums`.

### `ts.enums.mode` — Targeting Mode

| Value | Description |
| --- | --- |
| `MANUAL` | Manual targeting only |
| `HARD_TARGET` | Semi-manual: prioritize HUD target |
| `SILENT_AUTO` | Fully automatic, no HUD changes |
| `DISABLED` | Target selector disabled entirely |

### `ts.enums.pull_mode` — Pull Behavior

| Value | Description |
| --- | --- |
| `DONT_PULL` | Don't auto-pull |
| `PULL_HUD_TARGET` | Pull only HUD target |
| `PULL_FULL_AUTOMATIC` | Pull any valid target automatically |

### `ts.enums.context` — Targeting Context

| Value | Description |
| --- | --- |
| `DAMAGE` | Damage target selection |
| `HEAL` | Heal target selection |

### `ts.enums.weight` — Weight Types

| Weight | Type | Description |
| --- | --- | --- |
| `THREAT` | float | Less threat = more weight |
| `ANGLE` | bool | Is inside angle cone |
| `ANGLE_F` | float | Less angle = more weight (use `set_weight_angle_f`) |
| `CLOSE` | float | Less distance = more weight |
| `HEALTH_DECREASE` | float | Less HP % = more weight |
| `HEALTH_INCREASE` | float | More HP % = more weight |
| `MULTIPLE_HITS` | float | More nearby units = more weight (use `set_weight_multiple_hits`) |
| `LOWEST_MAX_HP` | bool | Is lowest max HP unit |
| `LOWEST_CURRENT_HP` | bool | Is lowest current HP unit |
| `HIGHEST_MAX_HP` | bool | Is highest max HP unit |
| `HIGHEST_CURRENT_HP` | bool | Is highest current HP unit |
| `FOCUS` | bool | Is focus target |
| `TARGET` | bool | Is HUD target |
| `SELFISH` | bool | Is local player |
| `TANK` | bool | Is tank role |
| `HEALER` | bool | Is healer role |
| `DPS` | bool | Is DPS role |
| `INJURED` | bool | HP <= 60% (damage) or <= 50% (heal) |
| `LOW_HP` | bool | HP <= 40% (damage) or <= 25% (heal) |
| `TEAM_TARGET_FOLLOWUP` | bool | Most targeted unit by your team |
| `LOW_FORECAST` | bool | Combat forecast <= 5.0s |
| `MARKS` | bool | Is marked with selected marks |

### `ts.enums.override_type` — Override Slot Types

| Value | Description |
| --- | --- |
| `DISABLED` | Slot disabled |
| `MARK` | Prioritize marked target |
| `TARGET` | Prioritize HUD target |
| `FOCUS` | Prioritize focus target |
| `MOST_HITS` | Prioritize most AoE hits |
| `CLOSER` | Prioritize closest target |
| `MOST_MAX_HEALTH` | Prioritize highest max HP |
| `MOST_CURRENT_HEALTH` | Prioritize highest current HP |
| `LEAST_MAX_HEALTH` | Prioritize lowest max HP |
| `LEAST_CURRENT_HEALTH` | Prioritize lowest current HP |
| `TEAM_TARGET_FOLLOWUP` | Prioritize team's focus target |

---

## Functions

### Mode & Settings

#### `ts:set_mode`

Syntax

```lua
ts:set_mode(mode: number, write_mode?: number): nil
```

**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| `mode` | `number` | Targeting mode (`ts.enums.mode`) |
| `write_mode` | `number\|nil` | Write mode (default: `ONCE`) |

---

#### `ts:set_max_range_damage`

Syntax

```lua
ts:set_max_range_damage(range: number, write_mode?: number): nil
```

Set max targeting range for damage (0-50).

---

#### `ts:set_max_range_heal`

Syntax

```lua
ts:set_max_range_heal(range: number, write_mode?: number): nil
```

Set max targeting range for healing (0-50).

---

#### `ts:set_pull_mode`

Syntax

```lua
ts:set_pull_mode(mode: number, write_mode?: number): nil
```

Set pull logic (`ts.enums.pull_mode`).

---

#### `ts:set_semi_force_target_heal`

Syntax

```lua
ts:set_semi_force_target_heal(enabled: boolean, write_mode?: number): nil
```

Override HUD target for heal in semi-manual mode.

---

#### `ts:set_semi_force_target_damage`

Syntax

```lua
ts:set_semi_force_target_damage(enabled: boolean, write_mode?: number): nil
```

Override HUD target for damage in semi-manual mode.

---

#### `ts:set_aa_totems`

Syntax

```lua
ts:set_aa_totems(enabled: boolean, write_mode?: number): nil
```

Enable/disable auto-attack totems.

---

#### `ts:set_re_focus`

Syntax

```lua
ts:set_re_focus(enabled: boolean, write_mode?: number): nil
```

Enable/disable auto re-focus dead units.

---

#### `ts:set_re_target_hunter`

Syntax

```lua
ts:set_re_target_hunter(enabled: boolean, write_mode?: number): nil
```

Enable/disable re-target hunter after feign death.

---

#### `ts:set_pull_allowed`

Syntax

```lua
ts:set_pull_allowed(enabled: boolean, write_mode?: number): nil
```

Set the internal `is_pull_allowed` flag.

---

### Enable / Disable

#### `ts:set_damage_enabled`

Syntax

```lua
ts:set_damage_enabled(enabled: boolean, write_mode?: number): nil
```

Enable or disable the damage target selector.

---

#### `ts:set_heal_enabled`

Syntax

```lua
ts:set_heal_enabled(enabled: boolean, write_mode?: number): nil
```

Enable or disable the heal target selector.

---

### Weights

#### `ts:set_weight`

Syntax

```lua
ts:set_weight(ctx: string, weight_name: string, enabled: boolean, value: number, write_mode?: number): nil
```

**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| `ctx` | `string` | Context: `ts.enums.context.DAMAGE` or `ts.enums.context.HEAL` |
| `weight_name` | `string` | Weight name from `ts.enums.weight` |
| `enabled` | `boolean` | Whether the weight is active |
| `value` | `number` | Weight multiplier value |
| `write_mode` | `number\|nil` | Write mode (default: `ONCE`) |

Description

Set a weight toggle and slider value. Use `ts.enums.context` and `ts.enums.weight` enums.

---

#### `ts:set_weight_angle_f`

Syntax

```lua
ts:set_weight_angle_f(ctx: string, enabled: boolean, value: number, write_mode?: number): nil
```

Set the float-based angle weight (`ANGLE_F`). Separate from the bool-based `ANGLE` weight.

---

#### `ts:set_weight_multiple_hits`

Syntax

```lua
ts:set_weight_multiple_hits(ctx: string, enabled: boolean, value: number, radius: number, write_mode?: number): nil
```

**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| `ctx` | `string` | Context |
| `enabled` | `boolean` | Whether the weight is active |
| `value` | `number` | Weight multiplier |
| `radius` | `number` | Splash radius (2.0-20.0) |
| `write_mode` | `number\|nil` | Write mode (default: `ONCE`) |

---

### Override Slots

#### `ts:set_override_slot`

Syntax

```lua
ts:set_override_slot(ctx: string, slot: number, override_type: number, write_mode?: number): nil
```

**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| `ctx` | `string` | Context |
| `slot` | `number` | Slot index (1-3) |
| `override_type` | `number` | Override type from `ts.enums.override_type` |
| `write_mode` | `number\|nil` | Write mode (default: `ONCE`) |

---

#### `ts:disable_override_slot`

Syntax

```lua
ts:disable_override_slot(ctx: string, slot: number, write_mode?: number): nil
```

Disable an override slot (1-3).

---

### Blacklist Marks

#### `ts:set_blacklist_marks_enabled`

Syntax

```lua
ts:set_blacklist_marks_enabled(ctx: string, enabled: boolean, write_mode?: number): nil
```

Enable/disable mark-based blacklisting for a context (`"damage"` or `"heal"`).

---

#### `ts:set_blacklist_mark`

Syntax

```lua
ts:set_blacklist_mark(ctx: string, slot: number, mark_index: number, write_mode?: number): nil
```

**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| `ctx` | `string` | Context |
| `slot` | `number` | Blacklist slot (1-3) |
| `mark_index` | `number` | Raid marker index to blacklist |
| `write_mode` | `number\|nil` | Write mode (default: `ONCE`) |

---

### Batch & Utility

#### `ts:set_weights_batch`

Syntax

```lua
ts:set_weights_batch(ctx: string, weights: table, write_mode?: number): nil
```

**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| `ctx` | `string` | Context |
| `weights` | `table` | Table of `{ [weight_name] = { enabled = bool, value = number, radius? = number } }` |
| `write_mode` | `number\|nil` | Write mode (default: `ONCE`) |

Description

Apply multiple weights at once in a single call.

**Example Usage**

```lua
local W = ts.enums.weight
ts:set_weights_batch(ts.enums.context.DAMAGE, {
    [W.TARGET]                = { enabled = true,  value = 2 },
    [W.HEALTH_DECREASE]       = { enabled = true,  value = 3 },
    [W.MULTIPLE_HITS]         = { enabled = true,  value = 5, radius = 8.0 },
    [W.TEAM_TARGET_FOLLOWUP]  = { enabled = true,  value = 1 },
    [W.HIGHEST_MAX_HP]        = { enabled = false, value = 0 },
})
```

---

#### `ts:reset`

Syntax

```lua
ts:reset(): nil
```

Description

Reset all `ONCE` guards. Call this on spec change or encounter start so that all overrides will fire again.

---

#### `ts:is_applied`

Syntax

```lua
ts:is_applied(key: string): boolean
```

**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| `key` | `string` | Internal key to check, e.g. `"damage.weight_close"` |

Returns

- `boolean` - True if the key was already applied in `ONCE` mode.

---

## Complete Examples

### Basic Damage Rotation Setup

Call in `on_update` - safe to call every frame with default `ONCE` write mode.

```lua
local ts = require("common/utility/ts_override_helper")

local W = ts.enums.weight
local CTX = ts.enums.context

local function setup_ts()
    ts:set_damage_enabled(true)
    ts:set_max_range_damage(40)
    ts:set_mode(ts.enums.mode.SILENT_AUTO)
    ts:set_weight(CTX.DAMAGE, W.TARGET, true, 2)
    ts:set_weight(CTX.DAMAGE, W.HIGHEST_MAX_HP, true, 1)
end
```

### AoE-Focused Damage Setup

```lua
local ts = require("common/utility/ts_override_helper")

local W = ts.enums.weight
local CTX = ts.enums.context

local function setup_ts_aoe()
    ts:set_damage_enabled(true)
    ts:set_max_range_damage(40)
    ts:set_weight_multiple_hits(CTX.DAMAGE, true, 5, 8.0)
    ts:set_weight(CTX.DAMAGE, W.HEALTH_DECREASE, false, 0)
end
```

### Heal Setup

```lua
local ts = require("common/utility/ts_override_helper")

local W = ts.enums.weight
local CTX = ts.enums.context

ts:set_heal_enabled(true)
ts:set_max_range_heal(40)
ts:set_weight(CTX.HEAL, W.HEALTH_DECREASE, true, 3)
ts:set_weight(CTX.HEAL, W.INJURED, true, 2)
ts:set_weight(CTX.HEAL, W.LOW_HP, true, 4)
ts:set_weight(CTX.HEAL, W.TANK, true, -1)
```

### ON_CHANGE Mode (Sync From Menu Slider)

```lua
local ts = require("common/utility/ts_override_helper")
local SYNC = ts.enums.write_mode.ON_CHANGE

local function on_update()
    ts:set_max_range_damage(my_menu.range_slider:get(), SYNC)
end
```

### Override Slot — Prioritize Focus Target

```lua
local ts = require("common/utility/ts_override_helper")

ts:set_override_slot(ts.enums.context.DAMAGE, 1, ts.enums.override_type.FOCUS)
```

### Reset Guards on Encounter Start

```lua
local ts = require("common/utility/ts_override_helper")

local function on_encounter_start()
    ts:reset()
    -- now all ONCE overrides will fire again
end
```

---

## Tips

- Default write mode is `ONCE` — safe to call every frame, only writes the first time
- Use `ON_CHANGE` when syncing from dynamic values like menu sliders
- Call `ts:reset()` on encounter start or spec change to re-apply `ONCE` overrides
- Use `ts:set_weights_batch()` to apply many weights in a single call
- Override slots (1-3) are evaluated in order — slot 1 has highest priority