# Dispel External Filters

> Source: <https://docs.project-sylvanas.net/dev/api/dispel-external-filters>

## Overview

The Dispel External Filters helper allows you to register custom filters that control when the Universal Dispels plugin should or should not dispel. This enables fine-grained control over dispel behavior based on your own conditions - such as blocking dispels while stealthed, allowing only specific targets, or temporarily muting dispel logic.

**Key Features:**

- **Block Filters** - Prevent dispels when your condition returns false
- **Allow Filters** - Require at least one allow filter to pass before dispelling
- **Auto-Expiration** - Filters can expire after time, frame count, or usage count
- **Priority Access** - Check debuff priority in your filter logic
- **Runtime Management** - Register, unregister, and clear filters dynamically

## Importing The Module

```lua
---@type dispel_external_filters_helper
local dispels = require("common/utility/dispel_external_filters_helper")
```

> [!WARNING]
> Access functions with `:` (colon), not `.` (dot).

---

## Filter Types

### Block Filters (`type = "block"`)

Block filters prevent dispels when they return `false`. Multiple block filters can exist - if ANY block filter returns `false`, the dispel is blocked.

```lua
dispels:register("my_block_filter",
    function(local_player, target, data_packet)
        if should_block then
            return false, "reason_string"  -- Block the dispel
        end
        return true  -- Allow the dispel to proceed
    end,
    { type = "block", label = "My Block Filter" }
)
```

### Allow Filters (`type = "allow"`)

Allow filters create a whitelist requirement. When ANY allow filter exists, at least one must return `true` for the dispel to proceed.

```lua
dispels:register("my_allow_filter",
    function(local_player, target, data_packet)
        return target == my_priority_target  -- Only allow this target
    end,
    { type = "allow", label = "Priority Target Only" }
)
```

> [!CAUTION]
> If you register ANY allow filter, dispels are permitted ONLY when at least one allow filter returns `true`. This is more restrictive than block filters.

---

## Functions

### `dispels:is_available`

Syntax

```lua
dispels:is_available(): boolean
```

Returns

- `boolean` - True if the Universal Dispels plugin is loaded and the API is available.

Description

Check this before calling other methods. If the plugin isn't loaded, `register`, `unregister`, and `clear` will return `false`.

---

### `dispels:get_api`

Syntax

```lua
dispels:get_api(): table|nil
```

Returns

- `table|nil` - The raw underlying API table, or nil if the plugin is not loaded.

Description

Returns the raw external filters API from the Universal Dispels plugin. Most users should use the helper methods instead.

---

### `dispels:get_priority_enum`

Syntax

```lua
dispels:get_priority_enum(): table|nil
```

Returns

- `table|nil` - Priority enum table with levels like `low` , `medium` , `high` , `critical` , or nil if unavailable.

Description

Access priority level constants for filtering by debuff priority in your filter callbacks.

**Example Usage**

```lua
local priority_enum = dispels:get_priority_enum()
if priority_enum then
    -- priority_enum.low, priority_enum.medium, priority_enum.high, priority_enum.critical
end
```

---

### `dispels:register`

Syntax

```lua
dispels:register(name: string, func: function, opts?: table): boolean
```

**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| `name` | `string` | Unique identifier for this filter |
| `func` | `function` | Filter function (see callback signature below) |
| `opts` | `table\|nil` | Options including type, expiration, and label |

**Callback Signature**

```lua
function(local_player: game_object, target: game_object, data_packet: table): boolean, string|nil
```

| Parameter | Type | Description |
| --- | --- | --- |
| `local_player` | `game_object` | The local player |
| `target` | `game_object` | The dispel target |
| `data_packet` | `table` | Contains `details.id`, `details.priority`, etc. |

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

### `dispels:unregister`

Syntax

```lua
dispels:unregister(name: string): boolean
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

### `dispels:clear`

Syntax

```lua
dispels:clear(): boolean
```

Returns

- `boolean` - `false` if the plugin is not loaded.

Description

Removes all registered filters.

---

## Complete Examples

### Block While Stealthed

```lua
local dispels = require("common/utility/dispel_external_filters_helper")

dispels:register("block_while_stealth",
    function(local_player, target, data_packet)
        local stealth_data = buff_manager:get_buff_data(local_player, enums.buff_db.STEALTH, 50)
        local is_stealthed = stealth_data and stealth_data.is_active == true
        if is_stealthed then
            return false, "stealth_active"
        end
        return true
    end,
    { type = "block", label = "No Dispel While Stealth" }
)
```

### Block Low Priority for Short Window

```lua
local dispels = require("common/utility/dispel_external_filters_helper")
local priority_enum = dispels:get_priority_enum()

dispels:register("no_low_priority_for_0_7s",
    function(_, _, data_packet)
        local prio = (data_packet and data_packet.details and data_packet.details.priority) or 0
        if priority_enum and prio <= priority_enum.medium then
            return false, "priority_low"
        end
        return true
    end,
    { type = "block", time = 0.7, label = "Low Priority Gate" }
)
```

### Allow Only Specific Target for 2 Seconds

```lua
local dispels = require("common/utility/dispel_external_filters_helper")

local my_unit_pointer = my_module.get_primary_target()
if my_unit_pointer then
    dispels:register("allow_only_primary_target",
        function(_, target)
            return target == my_unit_pointer or false, "not_primary_target"
        end,
        { type = "allow", time = 2.0, label = "Only Primary Target" }
    )
end
```

### Block Specific Debuff ID Once

```lua
local dispels = require("common/utility/dispel_external_filters_helper")

local blocked_id = 388392
dispels:register("ban_debuff_388392_once",
    function(_, _, data_packet)
        local id = data_packet and data_packet.details and data_packet.details.id
        return id ~= blocked_id or false, "id_388392_blocked"
    end,
    { type = "block", count = 1, label = "Ban 388392 Once" }
)
```

### Temporary Global Mute (Next 3 Checks)

```lua
local dispels = require("common/utility/dispel_external_filters_helper")

dispels:register("block_next_3_checks",
    function() return false, "temp_mute" end,
    { type = "block", count = 3, label = "Mute Next 3" }
)
```

### Single Frame Guard

```lua
local dispels = require("common/utility/dispel_external_filters_helper")

dispels:register("block_once_frame",
    function() return false, "single_guard" end,
    { type = "block", frames = 1, label = "Single Check Guard" }
)
```

### Boss Only Window (1.5 Seconds)

```lua
local dispels = require("common/utility/dispel_external_filters_helper")

local boss_ptr = encounter and encounter.get_boss_ptr and encounter.get_boss_ptr() or nil
if boss_ptr then
    dispels:register("allow_only_boss",
        function(_, target)
            return target == boss_ptr or false, "not_boss"
        end,
        { type = "allow", time = 1.5, label = "Boss Only Window" }
    )
end
```

### Druid Cat Form Toggle

```lua
local dispels = require("common/utility/dispel_external_filters_helper")

-- Register on enter cat form, unregister on exit
if is_cat_form then
    dispels:register("druid_no_dispel",
        function() return false, "cat_form" end,
        { type = "block", label = "No Dispel in Cat Form" }
    )
else
    dispels:unregister("druid_no_dispel")
end
```

---

## Tips

- Prefer `time` or `count` expirations for temporary rules so you don't have to manually unregister
- If you register ANY allow filter, dispels only work when at least one returns true
- Use `dispels:unregister()` when conditions change (e.g., leaving stealth)
- Use `dispels:get_priority_enum()` to access priority levels for filtering by debuff priority
- Filter functions are called every time a dispel is considered, so keep them fast