# IZI - Spell Sequences

> Source: <https://docs.project-sylvanas.net/dev/libraries/izi/izi-spells-sequences>

## Overview

The IZI Spell Sequence system allows you to chain multiple spells together with precise timing control. From simple A→B combos to complex server-confirmed sequences, this system handles the coordination automatically.

**Key Features:**

- **Simple Combos** - Chain two spells with automatic timing
- **Multi-Spell Sequences** - Execute lists of spells in order
- **Advanced Entries** - Configure each spell with custom conditions and delays
- **Server Confirmation** - Wait for server acknowledgment before continuing
- **Progress Tracking** - Monitor sequence state and progress
- **Cooldown Management** - Prevent sequence spam with built-in cooldowns

---

## Quick Start

### Simple A→B Combo

```lua
local izi = require("common/izi_sdk")

local shadowstep = izi.spell(36554)
local kidney_shot = izi.spell(408)

-- Shadowstep, then immediately Kidney Shot
if izi.a_into_b(shadowstep, target, kidney_shot, target) then
    izi.print("Shadowstep -> Kidney combo started!")
end
```

### Multi-Spell Sequence

```lua
local izi = require("common/izi_sdk")

local spells = {
    izi.spell(1856),   -- Vanish
    izi.spell(1784),   -- Stealth (auto-applied)
    izi.spell(8676),   -- Ambush
}

local targets = { me, me, target }

if izi.simple_sequence(spells, targets) then
    izi.print("Vanish -> Ambush sequence started!")
end
```

---

## Basic Functions

### `izi.a_into_b`

Syntax

```lua
izi.a_into_b(
    spell_a: izi_spell, 
    target_a: game_object, 
    spell_b: izi_spell, 
    target_b: game_object, 
    delay?: number, 
    timeout?: number, 
    debug_name?: string, 
    cooldown?: number
): boolean
```

**Parameters**

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `spell_a` | `izi_spell` | required | First spell to cast |
| `target_a` | `game_object` | required | Target for first spell |
| `spell_b` | `izi_spell` | required | Second spell to cast |
| `target_b` | `game_object` | required | Target for second spell |
| `delay` | `number` | `0` | Delay in seconds between spells |
| `timeout` | `number` | `3.0` | Maximum time to complete sequence |
| `debug_name` | `string` | `nil` | Name for debug logging |
| `cooldown` | `number` | `0` | Cooldown before sequence can be used again |

Returns

- `boolean` - True if the sequence was successfully started

Description

Executes a simple two-spell combo. Casts spell A, then immediately (or after a delay) casts spell B. The sequence times out if spell B cannot be cast within the timeout period.

**Example Usage**

```lua
local izi = require("common/izi_sdk")

local charge = izi.spell(100)
local hamstring = izi.spell(1715)

-- Charge then immediately Hamstring
izi.a_into_b(charge, target, hamstring, target, 0, 2.0, "Charge->Hamstring")

-- With a slight delay for GCD
local heroic_leap = izi.spell(6544)
local shockwave = izi.spell(46968)

izi.a_into_b(heroic_leap, target, shockwave, me, 0.5, 3.0, "Leap->Shockwave")
```

---

### `izi.simple_sequence`

Syntax

```lua
izi.simple_sequence(
    spells: izi_spell[], 
    targets: game_object[], 
    delay?: number, 
    timeout?: number, 
    debug_name?: string, 
    cooldown?: number
): boolean
```

**Parameters**

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `spells` | `izi_spell[]` | required | Array of spells to cast in order |
| `targets` | `game_object[]` | required | Array of targets (one per spell) |
| `delay` | `number` | `0` | Delay between each spell |
| `timeout` | `number` | `5.0` | Maximum time to complete sequence |
| `debug_name` | `string` | `nil` | Name for debug logging |
| `cooldown` | `number` | `0` | Cooldown before sequence can be used again |

Returns

- `boolean` - True if the sequence was successfully started

Description

Executes a sequence of multiple spells in order. Each spell is cast on its corresponding target. The sequence proceeds as fast as possible (respecting GCD) unless a delay is specified.

**Example Usage**

```lua
local izi = require("common/izi_sdk")

-- Mage burst: Icy Veins -> Frozen Orb -> Blizzard
local me = izi.me()
local target = izi.ts()

local burst_spells = {
    izi.spell(12472),   -- Icy Veins
    izi.spell(84714),   -- Frozen Orb
    izi.spell(190356),  -- Blizzard
}

local burst_targets = { me, target, target }

if izi.simple_sequence(burst_spells, burst_targets, 0, 5.0, "Frost Burst") then
    izi.print("Frost burst sequence started!")
end
```

---

## Advanced Sequences

### `izi.advanced_sequence`

Syntax

```lua
izi.advanced_sequence(
    entries: advanced_spell_entry[], 
    opts?: advanced_sequence_opts
): boolean
```

**Parameters**

- `entries: advanced_spell_entry[]` - Array of spell entries with individual configurations
- `opts?: advanced_sequence_opts` - Optional sequence-level options

**Entry Structure: `advanced_spell_entry`**

```lua
{
    spell: izi_spell,              -- The spell to cast
    target: game_object,           -- Target for the spell
    delay?: number,                -- Delay before this spell
    condition?: function|boolean,  -- Condition to check before casting
    on_cast?: function,            -- Callback when spell is cast
    on_skip?: function,            -- Callback if spell is skipped
    cast_opts?: unit_cast_opts     -- Options passed to cast_safe
}
```

**Options Structure: `advanced_sequence_opts`**

```lua
{
    timeout?: number,      -- Maximum sequence duration (default 5.0)
    cooldown?: number,     -- Cooldown after sequence completes
    debug_name?: string,   -- Name for debug logging
    on_complete?: function -- Callback when sequence finishes
}
```

Returns

- `boolean` - True if the sequence was successfully started

Description

Executes a complex sequence with per-spell configuration. Each entry can have its own delay, condition, and callbacks. Spells can be conditionally skipped without aborting the sequence.

**Example Usage**

```lua
local izi = require("common/izi_sdk")

local me = izi.me()
local target = izi.ts()

-- Complex opener with conditions
local entries = {
    {
        spell = izi.spell(1856),  -- Vanish
        target = me,
        condition = function() return me:is_in_combat() end,
        on_cast = function() izi.print("Vanished!") end
    },
    {
        spell = izi.spell(8676),  -- Ambush
        target = target,
        delay = 0.1,  -- Small delay to ensure stealth
        condition = function() return target:is_valid_enemy() end
    },
    {
        spell = izi.spell(703),   -- Garrote
        target = target,
        condition = function() 
            return target:debuff_down(703) -- Only if not already applied
        end,
        on_skip = function() izi.print("Skipped Garrote - already applied") end
    }
}

local opts = {
    timeout = 5.0,
    cooldown = 30.0,  -- 30 second cooldown
    debug_name = "Rogue Opener",
    on_complete = function() izi.print("Opener complete!") end
}

izi.advanced_sequence(entries, opts)
```

---

### `izi.confirmed_sequence`

Syntax

```lua
izi.confirmed_sequence(
    steps: confirmed_step[], 
    opts?: confirmed_sequence_opts
): boolean
```

**Parameters**

- `steps: confirmed_step[]` - Array of steps requiring server confirmation
- `opts?: confirmed_sequence_opts` - Optional sequence options

**Step Structure: `confirmed_step`**

```lua
{
    spell: izi_spell,        -- The spell to cast
    target: game_object,     -- Target for the spell
    confirm_buff?: integer,  -- Buff ID to confirm success
    confirm_debuff?: integer,-- Debuff ID to confirm success
    timeout?: number,        -- Per-step timeout
    cast_opts?: unit_cast_opts
}
```

**Options Structure: `confirmed_sequence_opts`**

```lua
{
    timeout?: number,       -- Total sequence timeout
    cooldown?: number,      -- Cooldown after sequence
    debug_name?: string,    -- Name for debug logging
    on_step?: function,     -- Called after each step confirms
    on_complete?: function, -- Called when sequence finishes
    on_timeout?: function   -- Called if sequence times out
}
```

Returns

- `boolean` - True if the sequence was successfully started

Description

Executes a sequence that waits for server confirmation before proceeding to each next step. This is ideal for combos where you need to verify a buff/debuff was applied before continuing.

**Example Usage**

```lua
local izi = require("common/izi_sdk")

local me = izi.me()
local target = izi.ts()

-- Confirmed combo: Colossus Smash must land before Mortal Strike
local steps = {
    {
        spell = izi.spell(167105),  -- Colossus Smash
        target = target,
        confirm_debuff = 208086,    -- Wait for debuff
        timeout = 2.0
    },
    {
        spell = izi.spell(12294),   -- Mortal Strike
        target = target,
        -- No confirmation needed, just cast
    }
}

local opts = {
    timeout = 5.0,
    debug_name = "CS -> MS Combo",
    on_step = function(step_index)
        izi.printf("Step %d confirmed", step_index)
    end,
    on_complete = function()
        izi.print("Combo complete!")
    end
}

izi.confirmed_sequence(steps, opts)
```

---

## Sequence Management

### `izi.is_sequence_active`

```lua
izi.is_sequence_active(): boolean
```

Returns true if ANY sequence (native or confirmed) is currently running.

---

### `izi.is_confirmed_active`

```lua
izi.is_confirmed_active(): boolean
```

Returns true if a confirmed sequence specifically is running.

---

### `izi.cancel_sequence`

```lua
izi.cancel_sequence(): nil
```

Cancels the active native sequence (a_into_b, simple, or advanced).

---

### `izi.cancel_confirmed`

```lua
izi.cancel_confirmed(): nil
```

Cancels the active confirmed sequence.

---

### `izi.get_sequence_progress`

```lua
izi.get_sequence_progress(): integer|nil, integer|nil
```

Returns `current_step, total_steps` for the active sequence. Confirmed sequences take priority.

---

### `izi.get_confirmed_progress`

```lua
izi.get_confirmed_progress(): integer|nil, integer|nil
```

Returns progress specifically for confirmed sequences.

---

### `izi.get_sequence_type`

```lua
izi.get_sequence_type(): string|nil
```

Returns the type of active sequence: `"confirmed"`, `"a_into_b"`, `"simple"`, `"advanced"`, or nil.

---

## Cooldown Management

### `izi.is_sequence_on_cooldown`

```lua
izi.is_sequence_on_cooldown(): boolean
```

Returns true if any sequence is on cooldown (preventing new sequences).

---

### `izi.get_sequence_cooldown_remaining`

```lua
izi.get_sequence_cooldown_remaining(): number
```

Returns the remaining cooldown time in seconds.

---

## Debug Functions

### `izi.set_sequence_debug`

```lua
izi.set_sequence_debug(enabled: boolean): nil
```

Enables or disables debug logging for native sequences.

---

### `izi.get_sequence_debug`

```lua
izi.get_sequence_debug(): boolean
```

Returns whether native sequence debugging is enabled.

---

### `izi.set_confirmed_debug`

```lua
izi.set_confirmed_debug(enabled: boolean): nil
```

Enables or disables debug logging for confirmed sequences.

---

### `izi.get_confirmed_debug`

```lua
izi.get_confirmed_debug(): boolean
```

Returns whether confirmed sequence debugging is enabled.

---

## Spell Cast Callback

### `izi.on_spell_cast`

```lua
izi.on_spell_cast(data: table): nil
```

Feed spell cast callback data to the sequence system. This is typically connected to the spell success callback to track sequence progress.

**Example Usage**

```lua
-- Connect to spell success events
izi.on_spell_success(function(event)
    local me = izi.me()
    if event.caster == me then
        izi.on_spell_cast(event)
    end
end)
```

---

## Cast Policy Constants

### `izi.CAST_POLICY`

Constants for configuring cast behavior in advanced sequences.

```lua
izi.CAST_POLICY.NORMAL      -- Standard casting
izi.CAST_POLICY.FORCE       -- Force cast regardless of state
izi.CAST_POLICY.SKIP_GCD    -- Skip GCD check
```

---

## Module Access

### `izi.sequence`

Direct access to the underlying `spell_sequence_helper` module for advanced usage.

```lua
local sequence_helper = izi.sequence
-- Access internal functions if needed
```

---

## Complete Example

```lua
local izi = require("common/izi_sdk")

-- Enable debug logging
izi.set_sequence_debug(true)
izi.set_confirmed_debug(true)

-- Warrior burst sequence
local function execute_burst()
    local me = izi.me()
    local target = izi.ts()
    
    if not target or not target:is_valid_enemy() then
        return false
    end
    
    -- Check if we're already in a sequence
    if izi.is_sequence_active() then
        local step, total = izi.get_sequence_progress()
        izi.printf("Sequence in progress: %d/%d", step or 0, total or 0)
        return false
    end
    
    -- Check sequence cooldown
    if izi.is_sequence_on_cooldown() then
        local remaining = izi.get_sequence_cooldown_remaining()
        izi.printf("Sequence on cooldown: %.1fs", remaining)
        return false
    end
    
    -- Define the burst sequence
    local burst_entries = {
        {
            spell = izi.spell(227847),  -- Bladestorm (Avatar talent)
            target = me,
            condition = function() 
                return #izi.enemies(8) >= 2 
            end,
            on_skip = function()
                izi.print("Skipped Bladestorm - not enough targets")
            end
        },
        {
            spell = izi.spell(167105),  -- Colossus Smash
            target = target,
            delay = 0.1
        },
        {
            spell = izi.spell(1719),    -- Recklessness
            target = me,
            delay = 0.05
        },
        {
            spell = izi.spell(12294),   -- Mortal Strike
            target = target,
            condition = function()
                return target:get_health_percentage() > 20
            end
        },
        {
            spell = izi.spell(163201),  -- Execute
            target = target,
            condition = function()
                return target:get_health_percentage() <= 20
            end
        }
    }
    
    local opts = {
        timeout = 8.0,
        cooldown = 45.0,  -- Don't spam burst
        debug_name = "Warrior Burst",
        on_complete = function()
            izi.print("Burst sequence complete!")
        end
    }
    
    return izi.advanced_sequence(burst_entries, opts)
end

-- Cancel button
izi.on_key_release(0x1B, function()  -- Escape key
    if izi.is_sequence_active() then
        local seq_type = izi.get_sequence_type()
        if seq_type == "confirmed" then
            izi.cancel_confirmed()
        else
            izi.cancel_sequence()
        end
        izi.print("Sequence cancelled!")
    end
end)

-- Trigger burst on keybind
izi.on_key_release(0x52, function()  -- R key
    execute_burst()
end)
```