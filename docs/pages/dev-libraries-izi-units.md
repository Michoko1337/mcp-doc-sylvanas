# IZI - Units

> Source: <https://docs.project-sylvanas.net/dev/libraries/izi/units>

## Overview

The IZI Units system provides powerful utilities for querying, filtering, and selecting units in the game world. From simple enemy lists to sophisticated target selection with scoring functions, these tools make unit management effortless.

**Key Features:**

- **Target Selector Integration** - Seamlessly access the target selector system
- **Smart Queries** - Get enemies, friends, or party members with flexible filtering
- **Predicate Filtering** - Use custom functions to filter unit lists
- **Scoring Selection** - Pick the best target using custom scoring logic

---

## Target Selector

### `izi.get_ts_target`

Syntax

```lua
izi.get_ts_target(): game_object|nil
```

Returns

- [`game_object|nil`](/dev/api/game-object) - The first target from the target selector, or nil if none found

Description

Retrieves the primary (first) target from the target selector system. This is typically your main damage target in a rotation.

**Example Usage**

```lua
local izi = require("common/izi_sdk")

local target = izi.get_ts_target()

if target then
    izi.printf("Primary target: %s (%.1f%% HP)", 
        target:get_name(), 
        target:get_health_percentage())
end
```

---

### `izi.get_ts_targets`

Syntax

```lua
izi.get_ts_targets(limit?: integer): game_object[]
```

**Parameters**

- `limit?: integer` - Optional maximum number of targets to retrieve

Returns

- [`game_object[]`](/dev/api/game-object) - Array of target selector units, or empty array if none found

Description

Retrieves all targets from the target selector, optionally limited to a specific count. Useful for multi-DoT spreading or cleave target selection.

**Example Usage**

```lua
local izi = require("common/izi_sdk")

-- Get all targets
local all_targets = izi.get_ts_targets()
izi.printf("Target selector has %d targets", #all_targets)

-- Get up to 3 targets for multi-DoT
local dot_targets = izi.get_ts_targets(3)
for i, target in ipairs(dot_targets) do
    izi.printf("DoT target %d: %s", i, target:get_name())
end
```

---

### `izi.ts`

Syntax

```lua
izi.ts(i?: integer): game_object|nil
```

**Parameters**

- `i?: integer` - Target selector index to retrieve (default: 1)

Returns

- [`game_object|nil`](/dev/api/game-object) - The target at the specified index, or nil if not found

Description

Quick shorthand for accessing specific target selector positions. `izi.ts()` returns the first target, `izi.ts(2)` returns the second, etc.

**Example Usage**

```lua
local izi = require("common/izi_sdk")

-- Get primary target
local main_target = izi.ts()  -- same as izi.ts(1)

-- Get secondary target for cleave
local secondary = izi.ts(2)

if main_target then
    -- Damage main target
end

if secondary and secondary ~= main_target then
    -- Apply DoT to secondary
end
```

---

## Unit Queries

### `izi.enemies`

Syntax

```lua
izi.enemies(radius?: number, players_only?: boolean): game_object[]
```

**Parameters**

- `radius?: number` - Optional maximum distance from the player (in yards)
- `players_only?: boolean` - When true, only returns enemy players (excludes NPCs)

Returns

- [`game_object[]`](/dev/api/game-object) - Array of enemy units within the specified radius

Description

Retrieves all valid enemy units around the local player. Includes PvE enemies in combat and PvP enemies.

**Example Usage**

```lua
local izi = require("common/izi_sdk")

-- Get all enemies within 40 yards
local all_enemies = izi.enemies(40)
izi.printf("%d enemies nearby", #all_enemies)

-- Get only enemy players (for arena/BG)
local player_enemies = izi.enemies(40, true)
izi.printf("%d enemy players nearby", #player_enemies)

-- Count for AoE decisions
if #izi.enemies(10) >= 3 then
    -- Use AoE abilities
end
```

---

### `izi.friends`

Syntax

```lua
izi.friends(radius?: number, players_only?: boolean): game_object[]
```

**Parameters**

- `radius?: number` - Optional maximum distance from the player (in yards)
- `players_only?: boolean` - When true, only returns friendly players (excludes NPCs)

Returns

- [`game_object[]`](/dev/api/game-object) - Array of friendly units within the specified radius

Description

Retrieves all valid friendly units around the local player. Includes party/raid members, friendly NPCs, and pets.

**Example Usage**

```lua
local izi = require("common/izi_sdk")

-- Get all friends within healing range
local allies = izi.friends(40)
izi.printf("%d allies in range", #allies)

-- Get only player allies
local player_allies = izi.friends(40, true)

-- Count injured allies for smart healing
local injured_count = 0
for _, ally in ipairs(allies) do
    if ally:get_health_percentage() < 80 then
        injured_count = injured_count + 1
    end
end
```

---

### `izi.party`

Syntax

```lua
izi.party(radius?: number): game_object[]
```

**Parameters**

- `radius?: number` - Optional maximum distance from the player (in yards)

Returns

- [`game_object[]`](/dev/api/game-object) - Array of party/raid members within the specified radius

Description

Retrieves party and raid members around the local player. This is more restrictive than `friends()` as it only includes actual group members.

**Example Usage**

```lua
local izi = require("common/izi_sdk")

-- Get party members in range
local party = izi.party(40)
izi.printf("%d party members in range", #party)

-- Find lowest health party member
local lowest_hp = nil
local lowest_pct = 100

for _, member in ipairs(party) do
    local hp_pct = member:get_health_percentage()
    if hp_pct < lowest_pct then
        lowest_pct = hp_pct
        lowest_hp = member
    end
end

if lowest_hp then
    izi.printf("Lowest HP: %s at %.1f%%", lowest_hp:get_name(), lowest_pct)
end
```

---

## Filtered Queries

### `izi.enemies_if`

Syntax

```lua
izi.enemies_if(radius?: number, filter?: function|function[]): game_object[]
```

**Parameters**

- `radius?: number` - Optional maximum distance from the player
- `filter?: function|function[]` - Predicate function(s) that return true to include a unit

**Filter Function Signature**

```lua
function(unit: game_object): boolean
```

Returns

- [`game_object[]`](/dev/api/game-object) - Array of enemies matching the filter criteria

Description

Retrieves enemies that match custom filter conditions. You can provide a single predicate or an array of predicates (all must pass).

**Example Usage**

```lua
local izi = require("common/izi_sdk")

-- Get enemies below 35% health (execute range)
local execute_targets = izi.enemies_if(40, function(unit)
    return unit:get_health_percentage() < 35
end)

-- Get enemies that are casting
local casting_enemies = izi.enemies_if(40, function(unit)
    return unit:is_casting() or unit:is_channeling()
end)

-- Multiple conditions: low HP enemies that are players
local low_hp_players = izi.enemies_if(40, {
    function(unit) return unit:get_health_percentage() < 50 end,
    function(unit) return unit:is_player() end
})

-- Find enemies without your DoT
local CORRUPTION_ID = 172
local needs_dot = izi.enemies_if(40, function(unit)
    return unit:debuff_down(CORRUPTION_ID)
end)
```

---

### `izi.friends_if`

Syntax

```lua
izi.friends_if(radius?: number, filter?: function|function[]): game_object[]
```

**Parameters**

- `radius?: number` - Optional maximum distance from the player
- `filter?: function|function[]` - Predicate function(s) that return true to include a unit

**Filter Function Signature**

```lua
function(unit: game_object): boolean
```

Returns

- [`game_object[]`](/dev/api/game-object) - Array of friendly units matching the filter criteria

Description

Retrieves friendly units that match custom filter conditions. Perfect for finding healing targets or buff targets.

**Example Usage**

```lua
local izi = require("common/izi_sdk")

-- Get injured allies (below 80% HP)
local injured = izi.friends_if(40, function(unit)
    return unit:get_health_percentage() < 80
end)
izi.printf("%d injured allies", #injured)

-- Get allies missing a buff
local FORTITUDE_ID = 21562
local needs_fort = izi.friends_if(40, function(unit)
    return unit:buff_down(FORTITUDE_ID)
end)

-- Get critically injured allies that are not CC'd
local critical = izi.friends_if(40, {
    function(unit) return unit:get_health_percentage() < 30 end,
    function(unit) return not unit:is_cc() end
})
```

---

## Smart Selection

### `izi.pick_enemy`

Syntax

```lua
izi.pick_enemy(
    radius?: number, 
    players_only?: boolean, 
    filter: function, 
    mode: sort_mode
): game_object|nil
```

**Parameters**

- `radius?: number` - Optional maximum distance from the player
- `players_only?: boolean` - When true, only considers enemy players
- `filter: function` - Scoring function that returns a number or nil (to exclude)
- `mode:` [`sort_mode`](/dev/libraries/izi/types#sort_mode) - `"max"` for highest score, `"min"` for lowest

**Filter Function Signature**

```lua
function(unit: game_object): number|nil
```

Returns

- [`game_object|nil`](/dev/api/game-object) - The best enemy based on score, or nil if none found

Description

Picks the optimal enemy based on a custom scoring function. Return a number to score the unit, or nil to exclude it. Use `"min"` mode for lowest score (e.g., lowest HP) or `"max"` for highest.

**Example Usage**

```lua
local izi = require("common/izi_sdk")

-- Get lowest health enemy (for execute)
local execute_target = izi.pick_enemy(40, false, function(enemy)
    return enemy:get_health_percentage()
end, "min")

-- Get highest health enemy (for sustained damage)
local tank = izi.pick_enemy(40, false, function(enemy)
    return enemy:get_health_percentage()
end, "max")

-- Get closest enemy
local me = izi.me()
local closest = izi.pick_enemy(40, false, function(enemy)
    return enemy:distance()
end, "min")

-- Get enemy with lowest time-to-die (dying soon)
local dying_target = izi.pick_enemy(40, false, function(enemy)
    local ttd = enemy:time_to_die()
    -- Exclude targets that will live too long
    if ttd > 30 then return nil end
    return ttd
end, "min")

-- Complex scoring: prioritize low HP healers
local priority_target = izi.pick_enemy(40, true, function(enemy)
    local score = 100 - enemy:get_health_percentage()  -- Lower HP = higher score
    
    if enemy:is_healer() then
        score = score + 50  -- Bonus for healers
    end
    
    return score
end, "max")
```

---

## Complete Example

```lua
local izi = require("common/izi_sdk")

-- Rotation-style target management
local function get_targets()
    local targets = {
        main = nil,       -- Primary damage target
        execute = nil,    -- Low HP target for execute
        interrupt = nil,  -- Target to interrupt
        heal = nil,       -- Ally to heal
    }
    
    -- Main target from target selector
    targets.main = izi.ts()
    
    -- Find execute target (lowest HP under 35%)
    targets.execute = izi.pick_enemy(40, false, function(unit)
        local hp = unit:get_health_percentage()
        if hp >= 35 then return nil end
        return hp
    end, "min")
    
    -- Find interrupt target
    local casting = izi.enemies_if(40, function(unit)
        return unit:is_casting() and not unit:is_cc()
    end)
    
    if #casting > 0 then
        -- Pick the one closest to finishing their cast
        targets.interrupt = izi.pick_enemy(40, false, function(unit)
            if not unit:is_casting() then return nil end
            return unit:get_cast_remaining_ms()
        end, "min")
    end
    
    -- Find heal target (lowest HP ally)
    local injured = izi.friends_if(40, function(unit)
        return unit:get_health_percentage() < 90
    end)
    
    if #injured > 0 then
        -- Prioritize critically low targets
        targets.heal = izi.pick_enemy(40, false, function(unit)
            -- Note: This should use a "pick_friend" style approach
            -- This is just demonstrating the scoring concept
            return unit:get_health_percentage()
        end, "min")
        
        -- Simpler approach: just find lowest in injured list
        local lowest_hp = 100
        for _, ally in ipairs(injured) do
            local hp = ally:get_health_percentage()
            if hp < lowest_hp then
                lowest_hp = hp
                targets.heal = ally
            end
        end
    end
    
    return targets
end

-- Usage in rotation
local function rotation()
    local targets = get_targets()
    
    -- Priority 1: Interrupt dangerous casts
    if targets.interrupt then
        -- Cast kick
    end
    
    -- Priority 2: Execute low HP targets
    if targets.execute then
        -- Cast execute
    end
    
    -- Priority 3: Heal critical allies
    if targets.heal and targets.heal:get_health_percentage() < 30 then
        -- Emergency heal
    end
    
    -- Priority 4: Damage main target
    if targets.main then
        -- Regular rotation
    end
end

-- AoE decision making
local function should_use_aoe()
    local enemy_count = #izi.enemies(10)
    return enemy_count >= 3
end

-- Spread DoT logic
local function spread_dots()
    local DOT_ID = 172
    
    local needs_dot = izi.enemies_if(40, function(unit)
        return unit:debuff_down(DOT_ID) and unit:time_to_die() > 6
    end)
    
    return needs_dot
end
```