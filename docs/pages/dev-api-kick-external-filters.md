# Kick External Filters

> Source: <https://docs.project-sylvanas.net/dev/api/kick-external-filters>

## Overview

The Kick External Filters helper allows you to register custom filters that control when the Universal Kicks plugin should or should not interrupt. This enables fine-grained control over kick behavior based on your own conditions - such as blocking kicks while stealthed, allowing only specific targets, or temporarily muting kick logic.

**Key Features:**

- **Block Filters** - Prevent kicks when your condition returns false
- **Allow Filters** - Require at least one allow filter to pass before kicking
- **Auto-Expiration** - Filters can expire after time, frame count, or usage count
- **Detailed Diagnostics** - List and inspect active filters for debugging
- **Runtime Management** - Register, unregister, extend, and modify filters dynamically

## Importing The Module

```lua
---@type kick_external_filters_helper
local kicks = require("common/utility/kick_external_filters_helper")
```

> [!WARNING]
> Access functions with `:` (colon), not `.` (dot).

---

## Filter Types

### Block Filters (`type = "block"`)

Block filters prevent kicks when they return `false`. Multiple block filters can exist - if ANY returns `false`, the kick is blocked.

```lua
kicks:register("my_block_filter",
    function(local_player, solution_table, spell_to_kick_table, kick_target, prediction_data)
        if should_block then
            return false, "reason_string"  -- Block the kick
        end
        return true  -- Allow the kick to proceed
    end,
    { type = "block", label = "My Block Filter" }
)
```

### Allow Filters (`type = "allow"`)

Allow filters create a whitelist requirement. When ANY allow filter exists, at least one must return `true` for the kick to proceed.

```lua
kicks:register("my_allow_filter",
    function(local_player, solution_table, spell_to_kick_table, kick_target, prediction_data)
        return kick_target == priority_target  -- Only allow kicking this target
    end,
    { type = "allow", label = "Priority Target Only" }
)
```

> [!CAUTION]
> If you register ANY allow filter, kicks are permitted ONLY when at least one allow filter returns `true`. This is more restrictive than block filters.

---

## Functions

### `kicks:is_available`

Syntax

```lua
kicks:is_available(): boolean
```

Returns

- `boolean` - True if the Universal Kicks plugin is loaded and the API is available.

Description

Check this before calling other methods. If the plugin isn't loaded, `register`, `unregister`, and `clear` will return `false`.

---

### `kicks:get_api`

Syntax

```lua
kicks:get_api(): table|nil
```

Returns

- `table|nil` - The raw underlying API table, or nil if the plugin is not loaded.

Description

Returns the raw external filters API from the Universal Kicks plugin. Most users should use the helper methods instead.

---

### `kicks:register`

Syntax

```lua
kicks:register(name: string, func: function, opts?: table): boolean
```

**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| `name` | `string` | Unique identifier for this filter |
| `func` | `function` | Filter function (see callback signature below) |
| `opts` | `table\|nil` | Options including type, expiration, and label |

**Callback Signature**

```lua
function(
    local_player: game_object,
    solution_table: table,
    spell_to_kick_table: table,
    kick_target: game_object,
    prediction_data: table
): boolean, string|nil
```

| Parameter | Type | Description |
| --- | --- | --- |
| `local_player` | `game_object` | The local player |
| `solution_table` | `table` | The kick solution being considered |
| `spell_to_kick_table` | `table` | Info about the spell to interrupt (includes `id`) |
| `kick_target` | `game_object` | The target casting the spell |
| `prediction_data` | `table` | Kick timing prediction data |

**Returns:** `boolean` - `false` if the plugin is not loaded, otherwise the filter is registered.

**Options Table**

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `type` | `string` | `"block"` | Filter type: `"block"` or `"allow"` |
| `label` | `string` | `nil` | Human-readable label for debugging |
| `time` | `number` | `nil` | Auto-expire after this many seconds |
| `count` | `number` | `nil` | Auto-expire after this many checks |
| `frames` | `number` | `nil` | Auto-expire after this many frames |

---

### `kicks:unregister`

Syntax

```lua
kicks:unregister(name: string): boolean
```

**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| `name` | `string` | The name of the filter to remove |

Returns

- `boolean` - `false` if the plugin is not loaded.

Description

Removes a registered filter by name.

---

### `kicks:clear`

Syntax

```lua
kicks:clear(): boolean
```

Returns

- `boolean` - `false` if the plugin is not loaded.

Description

Removes all registered filters.

---

### `kicks:list`

Syntax

```lua
kicks:list(): table|nil
```

Returns

- `table|nil` - Snapshot of all active filters, or nil if the plugin is not loaded.

Description

Returns a snapshot of all active filters. Useful for debug UIs to show `secs_left`, `calls`, `frames_used`.

**Example Usage**

```lua
local filters = kicks:list()
if filters then
    for name, info in pairs(filters) do
        core.log(name .. " - secs_left: " .. tostring(info.secs_left))
    end
end
```

---

### `kicks:touch`

Syntax

```lua
kicks:touch(name: string, opts_patch: table): boolean
```

**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| `name` | `string` | The name of the filter to modify |
| `opts_patch` | `table` | Partial options table to merge (e.g. `{ time = 4 }`) |

Returns

- `boolean` - `false` if the plugin is not loaded or filter not found.

Description

Modifies an existing filter's options. Useful for extending time windows or adjusting counts without re-registering.

**Example Usage**

```lua
kicks:touch("allow_boss_for_2s", { time = 4 })  -- Extend window if still active
```

---

## Complete Examples

### Block While Stealthed

```lua
local kicks = require("common/utility/kick_external_filters_helper")

kicks:register("block_while_stealth",
    function(local_player, solution_table, spell_to_kick_table, kick_target, prediction_data)
        local data = buff_manager:get_buff_data(local_player, enums.buff_db.STEALTH, 50)
        local is_stealthed = data and data.is_active == true
        if is_stealthed then
            return false, "stealth_active"
        end
        return true
    end,
    { type = "block", label = "No Kick While Stealth" }
)
```

### Allow Only Boss Target for 2 Seconds

```lua
local kicks = require("common/utility/kick_external_filters_helper")

local boss_ptr = core.units.boss1
kicks:register("allow_boss_for_2s",
    function(_, _, _, kick_target)
        return kick_target == boss_ptr
    end,
    { type = "allow", time = 2, label = "Boss Only 2s" }
)
```

### Block a Specific Cast ID

```lua
local kicks = require("common/utility/kick_external_filters_helper")

kicks:register("block_cast_12345",
    function(_, _, cast)
        local allow = (cast.id ~= 12345)
        return allow, allow and nil or "cast_12345"
    end,
    { type = "block", label = "Skip 12345" }
)
```

### Expiration Examples

```lua
local kicks = require("common/utility/kick_external_filters_helper")

-- Block once (1 frame)
kicks:register("block_once",
    function() return false, "once" end,
    { type = "block", frames = 1, label = "One Pass" }
)

-- Block next 5 checks
kicks:register("block_next_5_checks",
    function() return false, "next_5" end,
    { type = "block", count = 5, label = "Next 5 Checks" }
)

-- Mute for 3 seconds
kicks:register("mute_for_3s",
    function() return false, "window_3s" end,
    { type = "block", time = 3, label = "Mute 3s" }
)
```

### Remove or Extend Filters

```lua
local kicks = require("common/utility/kick_external_filters_helper")

-- Remove a filter
kicks:unregister("block_while_stealth")

-- Extend an allow window
kicks:touch("allow_boss_for_2s", { time = 4 })
```

---

## Tips

- If you register ANY allow filter, kicks are permitted ONLY when at least one returns true
- Prefer `time` or `count` expirations for temporary rules so you don't have to manually unregister
- For debug UIs, use `kicks:list()` and show `secs_left` , `calls` , `frames_used`
- Use `kicks:touch()` to extend or modify filter options without re-registering
- Keep filter functions fast - they're called every time a kick is considered