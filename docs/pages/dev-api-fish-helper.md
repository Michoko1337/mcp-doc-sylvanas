# Fish Helper

> Source: <https://docs.project-sylvanas.net/dev/api/fish-helper>

## Overview

The Fish Helper provides utilities for fishing automation, including bobber identification, bite detection, and flexible looting options. It handles the complexity of tracking fishing bobbers, detecting when fish bite, and looting with various filtering strategies.

**Key Features:**

- **Bobber Detection** - Identify the player's fishing bobber among game objects
- **Bite Tracking** - Detect when a fish has bitten (bobber animation)
- **Flexible Looting** - Loot all, gold only, whitelist, blacklist, or custom filter
- **Detailed Stats** - Track looted items, skipped items, and gold collected

## Importing The Module

```lua
---@type fish_helper
local fish = require("common/utility/fish_helper")
```

> [!WARNING]
> Access functions with `:` (colon), not `.` (dot).

---

## Bobber Detection Functions

### `fish:is_fish_bobber`

Syntax

```lua
fish:is_fish_bobber(obj: game_object): boolean
```

Description

Checks if a game object is the local player's fishing bobber. Returns true when:

- `obj:get_health() == 0` and `obj:get_max_health() == 0`
- `obj:is_basic_object()` is true
- `obj:get_creator_object()` equals the local player

**Example Usage**

```lua
local objects = core.object_manager.get_objects()
for _, obj in ipairs(objects) do
    if fish:is_fish_bobber(obj) then
        core.log("Found my bobber!")
    end
end
```

---

### `fish:does_bobber_have_fish`

Syntax

```lua
fish:does_bobber_have_fish(obj: game_object): boolean
```

Description

Returns true when the bobber has recorded a bite/animation within the last 10 seconds. The helper internally tracks bobber animations to detect bites.

---

### `fish:get_last_animation_time`

Syntax

```lua
fish:get_last_animation_time(obj: game_object): number
```

Returns

- `number` - `core.time()` of the last recorded bite/animation (0.0 if none)

---

## Looting Functions

### `fish:open_loot`

Syntax

```lua
fish:open_loot(target: game_object): boolean, string
```

**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| `target` | `game_object` | The bobber to interact with |

Returns

- `boolean` - True if loot window opened successfully
- `string` - `"opened"` on success, or error message

Description

Uses `core.input.use_object(target)` to interact with the bobber and checks if the loot window opens.

---

### `fish:loot_all`

Syntax

```lua
fish:loot_all(): boolean, table
```

Returns

- `boolean` - Success status
- `table` - Stats: `{ looted: integer, skipped: integer, gold: integer }`

Description

Loots everything from the loot window - gold and all items.

---

### `fish:loot_gold_only`

Syntax

```lua
fish:loot_gold_only(): boolean, table
```

Returns

- `boolean` - Success status
- `table` - Stats: `{ looted: integer, skipped: integer, gold: integer }`

Description

Loots only gold, skipping all items.

---

### `fish:loot_items_whitelist`

Syntax

```lua
fish:loot_items_whitelist(whitelist: number[], loot_gold?: boolean): boolean, table
```

**Parameters**

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `whitelist` | `number[]` | Required | Array of item IDs to loot |
| `loot_gold` | `boolean` | `true` | Whether to also loot gold |

Description

Loots only items whose ID is in the whitelist. Optionally loots gold.

**Example Usage**

```lua
local valuable_fish = { 12345, 67890, 11111 }
local ok, stats = fish:loot_items_whitelist(valuable_fish, true)
core.log("Looted " .. stats.looted .. " valuable fish")
```

---

### `fish:loot_items_excluding_blacklist`

Syntax

```lua
fish:loot_items_excluding_blacklist(blacklist: number[], loot_gold?: boolean): boolean, table
```

**Parameters**

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `blacklist` | `number[]` | Required | Array of item IDs to skip |
| `loot_gold` | `boolean` | `true` | Whether to also loot gold |

Description

Loots everything EXCEPT items in the blacklist.

**Example Usage**

```lua
local trash_items = { 111, 222, 333 }
local ok, stats = fish:loot_items_excluding_blacklist(trash_items, false)
core.log("Looted " .. stats.looted .. " items (no gold)")
```

---

### `fish:loot_with_filter`

Syntax

```lua
fish:loot_with_filter(filter: function): boolean, table
```

**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| `filter` | `function` | Filter function that decides per-slot looting |

**Filter Function Signature**

```lua
function(slot: loot_slot): boolean
```

**loot_slot Structure**

| Field | Type | Description |
| --- | --- | --- |
| `index` | `integer` | Loot slot index |
| `is_gold` | `boolean` | True if this slot is gold |
| `item_id` | `integer\|nil` | Item ID (nil for gold) |
| `item_name` | `string\|nil` | Item name (nil for gold) |

Description

Most flexible looting option - your filter function decides what to loot on a per-slot basis.

**Example Usage**

```lua
local ok, stats = fish:loot_with_filter(function(slot)
    -- Always loot gold
    if slot.is_gold then return true end
    
    -- Only loot items with "Fancy" in the name
    return slot.item_name and slot.item_name:find("Fancy")
end)

core.log("Filter looting - looted: " .. stats.looted)
```

---

## Fields

| Field | Type | Description |
| --- | --- | --- |
| `bobber_cache` | `table<game_object, number>` | Maps bobber objects to last bite time |

---

## Complete Examples

### Basic Fishing Bot Loop

```lua
local fish = require("common/utility/fish_helper")

local function on_update()
    local objects = core.object_manager.get_objects()
    
    for _, obj in ipairs(objects) do
        if fish:is_fish_bobber(obj) and fish:does_bobber_have_fish(obj) then
            local opened, msg = fish:open_loot(obj)
            
            if opened then
                local success, stats = fish:loot_all()
                if success then
                    core.log(string.format("Looted %d slots (%d gold)",
                        stats.looted, stats.gold))
                else
                    core.log("Loot failed")
                end
            else
                core.log("Loot window not open yet")
            end
            
            break  -- Only process one bobber
        end
    end
end

core.register_on_update_callback(on_update)
```

### Value-Based Looting

```lua
local fish = require("common/utility/fish_helper")

-- Define valuable items by ID
local valuable_items = {
    [12345] = true,  -- Rare Fish
    [67890] = true,  -- Epic Bait
    [11111] = true,  -- Quest Item
}

local function loot_valuable_only(bobber)
    if fish:open_loot(bobber) then
        return fish:loot_with_filter(function(slot)
            if slot.is_gold then return true end
            return valuable_items[slot.item_id] == true
        end)
    end
    return false, { looted = 0, skipped = 0, gold = 0 }
end
```

### Fishing Statistics Tracker

```lua
local fish = require("common/utility/fish_helper")

local session_stats = {
    casts = 0,
    catches = 0,
    total_gold = 0,
    items_looted = 0,
}

local function on_catch(bobber)
    session_stats.catches = session_stats.catches + 1
    
    if fish:open_loot(bobber) then
        local ok, stats = fish:loot_all()
        if ok then
            session_stats.total_gold = session_stats.total_gold + stats.gold
            session_stats.items_looted = session_stats.items_looted + stats.looted
        end
    end
end

local function print_stats()
    core.log(string.format(
        "Session: %d casts, %d catches, %d gold, %d items",
        session_stats.casts,
        session_stats.catches,
        session_stats.total_gold,
        session_stats.items_looted
    ))
end
```