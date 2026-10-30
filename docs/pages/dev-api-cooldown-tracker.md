# Cooldown Tracker

> Source: <https://docs.project-sylvanas.net/dev/api/cooldown-tracker>

## Overview

The Cooldown Tracker is a utility library that monitors and tracks cooldowns for spells across all units - both friendly and enemy. It maintains internal whitelists of important spells (defensives, interrupts, etc.) and provides APIs to query cooldown status and extend the tracking database at runtime.

**Key Features:**

- **Enemy Cooldown Tracking** - Know when enemy defensives and interrupts are available
- **Spell Readiness Checks** - Query if specific spells are ready on any unit
- **Range & LOS Validation** - Check if spells can be cast to targets
- **Extensible Whitelists** - Add custom spells to track at runtime
- **Class/Spec Awareness** - Returns appropriate values based on unit's class and spec

> [!WARNING]
> The tracked cooldowns come from a separate list for Retail, TBC Classic, MoP Classic and Classic Era. Titan (China) and Forever have none of their own and use the MoP Classic list.

> [!TIP]
> This helper is essential for PvP combat where knowing enemy cooldown availability (e.g., when their trinket or major defensive is down) can determine engagement timing.

## Importing The Module

```lua
---@type cooldown_tracker
local tracker = require("common/utility/cooldown_tracker")
```

> [!WARNING]
> Access functions with `:` (colon), not `.` (dot).

---

## Core Query Functions

### `tracker:get_remaining_cooldown`

Syntax

```lua
tracker:get_remaining_cooldown(unit: game_object, spell_id: number): number
```

**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| `unit` | `game_object` | The unit to check |
| `spell_id` | `number` | The spell ID to query |

Returns

- `number` - Seconds remaining on cooldown. Returns `999` if the spell doesn't match the unit's class/spec.

Description

This is the base function for all cooldown queries. It returns the remaining cooldown time for a spell on a specific unit. If the spell isn't applicable to that unit's class/spec, it returns 999.

**Example Usage**

```lua
local ICE_BLOCK = 45438
local enemy = get_current_target()

local cd_remaining = tracker:get_remaining_cooldown(enemy, ICE_BLOCK)
if cd_remaining == 0 then
    core.log("Ice Block is available!")
elseif cd_remaining < 999 then
    core.log(string.format("Ice Block on CD: %.1fs", cd_remaining))
else
    core.log("Enemy is not a Mage or doesn't have Ice Block")
end
```

---

### `tracker:is_spell_ready`

```lua
tracker:is_spell_ready(unit: game_object, spell_id: number): boolean
```

Returns `true` if the spell is off cooldown and ready to use.

**Example Usage**

```lua
local COUNTERSPELL = 2139
if tracker:is_spell_ready(enemy, COUNTERSPELL) then
    core.log("Enemy can interrupt!")
end
```

---

### `tracker:get_last_cast_time`

```lua
tracker:get_last_cast_time(unit: game_object, spell_id: number): number
```

Returns the timestamp when the spell was last cast by the unit.

---

## Defensive Tracking

### `tracker:has_any_relevant_defensive_up`

```lua
tracker:has_any_relevant_defensive_up(unit: game_object): boolean
```

Checks if the unit has any relevant defensive cooldown available.

**Example Usage**

```lua
local enemy = get_current_target()
if not tracker:has_any_relevant_defensive_up(enemy) then
    core.log("Enemy has no defensives - GO!")
end
```

---

## Interrupt Tracking

### `tracker:has_any_kick_up`

```lua
tracker:has_any_kick_up(caster: game_object, target: game_object, include_los: boolean): boolean
```

Checks if the caster has any interrupt spell available that can reach the target.

**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| `caster` | `game_object` | The unit that would cast the interrupt |
| `target` | `game_object` | The target of the interrupt |
| `include_los` | `boolean` | Whether to include line-of-sight check |

**Example Usage**

```lua
local player = core.object_manager.get_local_player()
local enemy = get_current_target()

if tracker:has_any_kick_up(enemy, player, true) then
    core.log("Enemy can kick you - be careful casting!")
end
```

---

### `tracker:is_any_kick_around`

```lua
tracker:is_any_kick_around(enemy_list: game_object[], include_los: boolean): boolean
```

Checks if any enemy in the list has an interrupt available.

**Example Usage**

```lua
local enemies = core.object_manager.get_enemies()
if tracker:is_any_kick_around(enemies, true) then
    core.log("At least one enemy can interrupt")
end
```

---

## Spell Validation

### `tracker:is_spell_castable_to_player`

```lua
tracker:is_spell_castable_to_player(spell_id: number, caster: game_object, target: game_object, include_los: boolean): boolean
```

Checks if a specific spell can be cast from caster to target (cooldown ready, in range, optional LOS).

---

### `tracker:is_spell_in_range`

```lua
tracker:is_spell_in_range(spell_id: number, caster: game_object, target: game_object): boolean
```

Checks if the target is within range for the specified spell.

---

### `tracker:is_spell_los`

```lua
tracker:is_spell_los(spell_id: number, caster: game_object, target: game_object): boolean
```

Checks if there is line-of-sight between caster and target for the spell.

---

## Extending the Tracker

You can add custom spells to the tracker's whitelists at runtime. These functions are safe to call every frame - duplicates are automatically rejected.

### `tracker:add_self_cast_spell`

```lua
tracker:add_self_cast_spell(spellDef: SpellDef, overwrite?: boolean): boolean, string
```

Adds a spell to the self-cast whitelist.

**SpellDef Structure**

```lua
{
    name = "Shield Wall",       -- Display name (cosmetic)
    id = 871,                   -- Unique spell ID
    cooldown = 180,             -- Cooldown in seconds
    range = 0,                  -- Effective range (0 for self-cast)
    class_id = enums.class_id.WARRIOR,
    class_spec = nil            -- nil = any spec, or specific spec ID
}
```

**Example Usage**

```lua
local ok, why = tracker:add_self_cast_spell({
    name = "Shield Wall",
    id = 871,
    cooldown = 180,
    range = 0,
    class_id = enums.class_id.WARRIOR,
    class_spec = nil
}, false)

if not ok then
    core.log("[Tracker] Self-cast add failed: " .. why)
end
```

---

### `tracker:add_target_spell`

```lua
tracker:add_target_spell(spellDef: SpellDef, overwrite?: boolean): boolean, string
```

Adds a spell to the target-cast whitelist.

**Example Usage**

```lua
local ok, why = tracker:add_target_spell({
    name = "Counterspell",
    id = 2139,
    cooldown = 24,
    range = 40,
    class_id = enums.class_id.MAGE,
    class_spec = nil
}, false)

if not ok then
    core.log("[Tracker] Target add failed: " .. why)
end
```

---

### `tracker:add_relevant_kick`

```lua
tracker:add_relevant_kick(spellId: number): boolean, string
```

Adds a spell ID to the relevant interrupts list.

**Example Usage**

```lua
local ok, why = tracker:add_relevant_kick(2139)  -- Counterspell
if not ok then
    core.log("[Tracker] Kick add failed: " .. why)
end
```

---

### `tracker:add_relevant_defensive`

```lua
tracker:add_relevant_defensive(spellId: number): boolean, string
```

Adds a spell ID to the relevant defensives list.

**Example Usage**

```lua
local ok, why = tracker:add_relevant_defensive(45438)  -- Ice Block
if not ok then
    core.log("[Tracker] Defensive add failed: " .. why)
end
```

---

## Complete Example

### PvP Engagement Decision

```lua
local tracker = require("common/utility/cooldown_tracker")

local DIVINE_SHIELD = 642
local BLESSING_OF_PROTECTION = 1022
local ICE_BLOCK = 45438
local CLOAK_OF_SHADOWS = 31224

local function should_engage(target)
    -- Check if target has major defensives
    if tracker:has_any_relevant_defensive_up(target) then
        core.log("Target has defensives - wait for them to use it")
        return false
    end
    
    -- Check specific important cooldowns
    local divine_shield_cd = tracker:get_remaining_cooldown(target, DIVINE_SHIELD)
    if divine_shield_cd == 0 then
        core.log("Paladin has bubble - bait it first")
        return false
    end
    
    -- Check if they can interrupt us
    if tracker:has_any_kick_up(target, player, true) then
        core.log("Target can kick - use instant casts")
    end
    
    return true
end
```

### Interrupt Safety Check

```lua
local tracker = require("common/utility/cooldown_tracker")

local function is_safe_to_cast(cast_time)
    local enemies = core.object_manager.get_enemies()
    
    for _, enemy in ipairs(enemies) do
        if tracker:has_any_kick_up(enemy, player, true) then
            local distance = player:get_distance(enemy)
            if distance < 30 then
                -- Enemy is close and can kick
                return false
            end
        end
    end
    
    return true
end
```