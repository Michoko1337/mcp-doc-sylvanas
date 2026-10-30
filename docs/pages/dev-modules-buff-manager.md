# Buff Manager

> Source: <https://docs.project-sylvanas.net/dev/modules/buff-manager>

## Overview

The Buff Manager is a module that provides efficient, cached access to buff and debuff data on any unit. Instead of repeatedly querying the game for aura information every frame, the Buff Manager caches results and returns them quickly, significantly improving performance.

**Key Features:**

- **Automatic Caching** - Queries are cached to avoid redundant game API calls
- **Buff Database Integration** - Works with `enums.buff_db` for common buff lookups
- **Flexible Queries** - Query by single ID, array of IDs, or buff database enum
- **Rich Data** - Returns remaining time, stacks, duration, and active status

## Importing The Module

```lua
---@type buff_manager
local buff_manager = require("common/modules/buff_manager")
```

> [!WARNING]
> Access functions with `:` (colon), not `.` (dot).

---

## Return Types

### `buff_manager_data`

Returned by `get_buff_data`, `get_debuff_data`, and `get_aura_data`:

| Field | Type | Description |
| --- | --- | --- |
| `is_active` | `boolean` | Whether the buff/debuff is currently active |
| `remaining` | `number` | Time remaining in seconds |
| `stacks` | `number` | Current stack count |
| `duration` | `number` | Total duration of the buff |

### `buff_manager_cache_data`

Returned by `get_buff_cache`, `get_debuff_cache`, and `get_aura_cache`:

| Field | Type | Description |
| --- | --- | --- |
| `buff_id` | `number` | The spell ID of the buff |
| `count` | `number` | Stack count |
| `expire_time` | `number` | When the buff expires |
| `duration` | `number` | Total duration |
| `caster` | `game_object` | Who applied the buff |
| `ptr` | `buff` | Raw buff pointer |
| `buff_name` | `string` | Display name of the buff |
| `buff_type` | `number` | Type of buff |
| `is_undefined` | `boolean` | Whether buff is undefined |

---

## Functions

### `buff_manager:get_buff_data`

Syntax

```lua
buff_manager:get_buff_data(
    unit: game_object,
    enum_key: buff_db | number[],
    custom_cache_duration_ms?: number
): buff_manager_data
```

**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| `unit` | `game_object` | The unit to check |
| `enum_key` | `buff_db \| number[]` | Buff database enum or array of spell IDs |
| `custom_cache_duration_ms` | `number` | Optional custom cache duration in milliseconds |

Returns

- `buff_manager_data` - Buff information with `is_active` , `remaining` , `stacks` , `duration`

**Example Usage**

```lua
local buff_manager = require("common/modules/buff_manager")

local player = core.object_manager.get_local_player()

-- Check using buff database enum
local stealth = buff_manager:get_buff_data(player, enums.buff_db.STEALTH)
if stealth.is_active then
    core.log("Stealthed! " .. stealth.remaining .. "s remaining")
end

-- Check using specific spell IDs
local combustion = buff_manager:get_buff_data(player, { 190319 })
if combustion.is_active and combustion.stacks >= 3 then
    core.log("Combustion active with " .. combustion.stacks .. " stacks")
end
```

---

### `buff_manager:get_debuff_data`

Syntax

```lua
buff_manager:get_debuff_data(
    unit: game_object,
    enum_key: buff_db | number[],
    custom_cache_duration_ms?: number
): buff_manager_data
```

Same as `get_buff_data` but queries debuffs instead of buffs.

**Example Usage**

```lua
local target = core.object_manager.get_target()

-- Check if target has your DoT
local immolate = buff_manager:get_debuff_data(target, { 348 })
if not immolate.is_active or immolate.remaining < 3 then
    -- Refresh Immolate
end

-- Check CC status using buff database
local cc_data = buff_manager:get_debuff_data(target, enums.buff_db.STUN)
if cc_data.is_active then
    core.log("Target is stunned for " .. cc_data.remaining .. "s")
end
```

---

### `buff_manager:get_aura_data`

Syntax

```lua
buff_manager:get_aura_data(
    unit: game_object,
    enum_key: buff_db | number[],
    custom_cache_duration_ms?: number
): buff_manager_data
```

Queries both buffs AND debuffs (any aura). Use when you don't care whether it's a buff or debuff.

---

### `buff_manager:get_buff_cache`

Syntax

```lua
buff_manager:get_buff_cache(
    unit: game_object,
    custom_cache_duration_ms?: number
): buff_manager_cache_data[]
```

Returns the full cached buff list for a unit. Useful for iterating all buffs.

**Example Usage**

```lua
local player = core.object_manager.get_local_player()
local buffs = buff_manager:get_buff_cache(player)

for _, buff in ipairs(buffs) do
    core.log(string.format("Buff: %s (ID: %d) - %d stacks, %.1fs remaining",
        buff.buff_name, buff.buff_id, buff.count, buff.duration))
end
```

---

### `buff_manager:get_debuff_cache`

```lua
buff_manager:get_debuff_cache(
    unit: game_object,
    custom_cache_duration_ms?: number
): buff_manager_cache_data[]
```

Returns the full cached debuff list for a unit.

---

### `buff_manager:get_aura_cache`

```lua
buff_manager:get_aura_cache(
    unit: game_object,
    custom_cache_duration_ms?: number
): buff_manager_cache_data[]
```

Returns the full cached aura list (buffs + debuffs) for a unit.

---

### `buff_manager:get_buff_value_from_description`

Syntax

```lua
buff_manager:get_buff_value_from_description(
    description_text: string,
    ignore_percentage: boolean,
    ignore_flat: boolean
): number
```

Parses a buff description text to extract numeric values. Useful for dynamic buff effects.

---

## Complete Examples

### DoT Tracking

```lua
local buff_manager = require("common/modules/buff_manager")

local DOT_IDS = {
    IMMOLATE = { 348 },
    CORRUPTION = { 146739 },
    AGONY = { 980 },
}

local function check_dots(target)
    local dots_missing = {}
    
    for name, ids in pairs(DOT_IDS) do
        local dot_data = buff_manager:get_debuff_data(target, ids)
        if not dot_data.is_active or dot_data.remaining < 4.5 then
            table.insert(dots_missing, name)
        end
    end
    
    return dots_missing
end
```

### Proc Monitoring

```lua
local buff_manager = require("common/modules/buff_manager")

local PROCS = {
    HOT_STREAK = { 48108 },
    HEATING_UP = { 48107 },
    BRAIN_FREEZE = { 190446 },
}

local function get_active_procs(player)
    local active = {}
    
    for name, ids in pairs(PROCS) do
        local proc = buff_manager:get_buff_data(player, ids)
        if proc.is_active then
            active[name] = {
                remaining = proc.remaining,
                stacks = proc.stacks
            }
        end
    end
    
    return active
end
```

### Custom Cache Duration

```lua
-- For rapidly changing buffs, use shorter cache
local fast_buff = buff_manager:get_buff_data(player, { 12345 }, 50)  -- 50ms cache

-- For stable buffs, use longer cache for better performance  
local stable_buff = buff_manager:get_buff_data(player, { 67890 }, 500)  -- 500ms cache
```