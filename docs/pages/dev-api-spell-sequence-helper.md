# Spell Sequence Helper

> Source: <https://docs.project-sylvanas.net/dev/api/spell-sequence-helper>

## Overview

The Spell Sequence Helper provides utilities for chaining multiple spell casts together in sequences. It supports simple A→B chains, multi-spell sequences with conditions, fill spells for when the main sequence stalls, and server-confirmed sequences that wait for cast acknowledgment before proceeding.

**Key Features:**

- **Simple Sequences** - Cast spell A then B with optional delays
- **Advanced Sequences** - Conditional spell chains with flexible ordering
- **Fill Spells** - Fallback spells when main sequence can't proceed
- **Confirmed Sequences** - Wait for server confirmation before advancing
- **Cast Policies** - Control when spells can be re-cast within a sequence
- **State Management** - Query progress, cancel, and manage cooldowns

> [!TIP]
> For a more integrated experience, consider using the [IZI SDK Spell Sequences](/dev/libraries/izi/izi-spells-sequences) which provides a similar API with tighter integration into the IZI ecosystem.

## Importing The Module

```lua
---@type spell_sequence_helper
local cast_sequence = require("common/utility/spell_sequence_helper")
```

> [!WARNING]
> Access functions with `:` (colon), not `.` (dot).

---

## Cast Policy Enum

Control when spells can be re-cast within a sequence:

```lua
cast_sequence.CAST_POLICY.NO_RESTRICTIONS        -- Can cast same spell repeatedly (default)
cast_sequence.CAST_POLICY.ONCE_EACH_CYCLE        -- Only after all spells evaluated
cast_sequence.CAST_POLICY.ONCE_EACH_CYCLE_OR_FILL -- After cycle completes OR fill activates
cast_sequence.CAST_POLICY.ONCE_EACH_COOLDOWN     -- Has internal cooldown before re-cast
cast_sequence.CAST_POLICY.ONCE_EACH_SWITCH       -- After any other base spell casts
cast_sequence.CAST_POLICY.ONCE_EACH_SWITCH_OR_FILL -- After any spell (base or fill) casts
```

---

## Native Sequence Functions

### `cast_sequence:a_into_b`

Syntax

```lua
cast_sequence:a_into_b(
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
| `spell_a` | `izi_spell` | Required | First spell to cast |
| `target_a` | `game_object` | Required | Target for first spell |
| `spell_b` | `izi_spell` | Required | Second spell to cast |
| `target_b` | `game_object` | Required | Target for second spell |
| `delay` | `number` | `0` | Delay between casts |
| `timeout` | `number` | `3` | Max time before auto-cancel |
| `debug_name` | `string` | `nil` | Name for logging |
| `cooldown` | `number` | `0` | Cooldown after sequence ends |

Description

Casts spell A then immediately spell B. The simplest sequence type.

**Example Usage**

```lua
cast_sequence:a_into_b(
    SPELLS.BUFF, player,
    SPELLS.ATTACK, target,
    0.0,              -- delay
    3.0,              -- timeout
    "Buff -> Attack", -- debug name
    0.0               -- cooldown after
)
```

---

### `cast_sequence:simple_sequence`

Syntax

```lua
cast_sequence:simple_sequence(
    spells: izi_spell[],
    targets: game_object[],
    delay?: number,
    timeout?: number,
    debug_name?: string,
    cooldown?: number
): boolean
```

Description

Casts multiple spells in strict order. Each spell must complete before the next starts.

**Example Usage**

```lua
cast_sequence:simple_sequence(
    { SPELL_A, SPELL_B, SPELL_C },
    { target, target, target },
    0.0,           -- delay
    10.0,          -- timeout
    "A->B->C",     -- debug name
    0.0            -- cooldown
)
```

---

### `cast_sequence:advanced_sequence`

Syntax

```lua
cast_sequence:advanced_sequence(entries: advanced_spell_entry[], opts?: advanced_sequence_opts): boolean
```

**Entry Structure**

```lua
{
    spell = izi_spell,                    -- The spell object
    target = game_object | function,      -- Target or function returning target
    condition = function(): boolean       -- Return true to allow cast
}
```

**Options Structure**

```lua
{
    timeout = 15,                          -- Max time before auto-cancel
    cooldown = 0,                          -- Cooldown after sequence ends
    debug_name = "advanced_sequence",      -- Name for logging
    is_flexible_order = true,              -- If false, stop on first failed condition
    fill_entries = { ... },                -- Fill spells when main stalls
    fill_delay_ms = 100,                   -- Ms to wait before using fill
    cast_policy = "no_restrictions",       -- Controls re-cast behavior
    cast_policy_cooldown = 4.0             -- Internal CD for once_each_cooldown
}
```

Description

The most flexible sequence type. Each spell has a condition function that determines if it can be cast. With `is_flexible_order = true`, the sequence will skip spells whose conditions fail and try the next one.

**Example Usage**

```lua
cast_sequence:advanced_sequence({
    { 
        spell = SPELLS.COOLDOWN, 
        target = player, 
        condition = function() return true end 
    },
    { 
        spell = SPELLS.BURST, 
        target = target, 
        condition = function() return SPELLS.COOLDOWN:buff_up() end 
    },
    { 
        spell = SPELLS.FINISHER, 
        target = target, 
        condition = function() return true end 
    },
}, {
    timeout = 20.0,
    cooldown = 0.0,
    debug_name = "Burst Combo",
    is_flexible_order = true,
    cast_policy = cast_sequence.CAST_POLICY.NO_RESTRICTIONS,
    fill_entries = {
        { spell = SPELLS.FILLER_1, target = target, condition = function() return true end },
        { spell = SPELLS.FILLER_2, target = target, condition = function() return true end },
    },
    fill_delay_ms = 120,
})
```

---

## Confirmed Sequence Functions

Confirmed sequences wait for server acknowledgment (via `on_spell_cast` callback) before advancing to the next step. This ensures each spell actually cast before proceeding.

### Setup

**Wire the callback once at plugin level:**

```lua
core.register_on_spell_cast_callback(function(data)
    cast_sequence:on_spell_cast(data)
end)
```

---

### `cast_sequence:confirmed_sequence`

Syntax

```lua
cast_sequence:confirmed_sequence(steps: confirmed_step[], opts?: confirmed_sequence_opts): boolean
```

**Step Structure**

```lua
{
    spell = izi_spell,                     -- The spell to cast
    target = game_object | function,       -- Target (or function for late-resolution)
    spell_id = integer,                    -- Spell ID for server callback matching
    opts = { ... },                        -- Cast opts (e.g., { damage_type = ... })
    use_cast = boolean                     -- If true, use spell:cast() instead of cast_safe()
}
```

**Options Structure**

```lua
{
    timeout = 10,                          -- Global timeout for entire sequence
    step_timeout = 3,                      -- Per-step timeout
    debug_name = "confirmed_seq",          -- Name for logging
    cooldown = 0,                          -- Cooldown after sequence ends
    player = game_object                   -- Local player for cast filtering
}
```

**Example Usage**

```lua
-- Rogue opener sequence
cast_sequence:confirmed_sequence({
    { spell = SPELLS.VANISH, target = me, spell_id = 1857, use_cast = true },
    { spell = SPELLS.SHADOWSTEP, target = target, spell_id = 36554 },
    { spell = SPELLS.AMBUSH, target = target, spell_id = 11269, opts = { damage_type = 1 } },
}, {
    debug_name = "Oneshot",
    timeout = 5.0,
    step_timeout = 3.0,
    player = me,
})
```

**Late-Resolution Targets**

Targets can be functions for late-resolution (evaluated when the step executes):

```lua
cast_sequence:confirmed_sequence({
    { spell = SPELLS.SHADOWSTEP, target = function() return izi.target() end, spell_id = 36554 },
    { spell = SPELLS.AMBUSH, target = function() return izi.target() end, spell_id = 11269 },
}, { debug_name = "Late-resolve target" })
```

---

### `cast_sequence:on_spell_cast`

```lua
cast_sequence:on_spell_cast(data: table): nil
```

Call this from your `on_spell_cast` callback to notify the sequence helper about spell casts.

---

### `cast_sequence:is_confirmed_active`

```lua
cast_sequence:is_confirmed_active(): boolean
```

Returns true if a confirmed sequence is currently running.

---

### `cast_sequence:cancel_confirmed`

```lua
cast_sequence:cancel_confirmed(): nil
```

Cancels the current confirmed sequence.

---

### `cast_sequence:get_confirmed_progress`

```lua
cast_sequence:get_confirmed_progress(): integer|nil, integer|nil
```

Returns current step and total steps of the confirmed sequence.

---

## State Management Functions

These work for both native and confirmed sequences:

### `cast_sequence:is_active`

```lua
cast_sequence:is_active(): boolean
```

Returns true if ANY sequence (native or confirmed) is currently running.

---

### `cast_sequence:is_on_cooldown`

```lua
cast_sequence:is_on_cooldown(): boolean
```

Returns true if sequence cooldown is active.

---

### `cast_sequence:get_cooldown_remaining`

```lua
cast_sequence:get_cooldown_remaining(): number
```

Returns remaining cooldown time in seconds.

---

### `cast_sequence:get_sequence_type`

```lua
cast_sequence:get_sequence_type(): string|nil
```

Returns `"native"`, `"confirmed"`, or `nil`.

---

### `cast_sequence:get_progress`

```lua
cast_sequence:get_progress(): integer|nil, integer|nil
```

Returns current step and total steps of any active sequence.

---

### `cast_sequence:cancel`

```lua
cast_sequence:cancel(): nil
```

Cancels the native sequence only.

---

### `cast_sequence:on_update`

```lua
cast_sequence:on_update(): nil
```

Call this in your update loop to advance both native and confirmed sequences.

---

## Debug Functions

### `cast_sequence:set_debug`

```lua
cast_sequence:set_debug(enabled: boolean): nil
```

Enables/disables debug logging for native sequences.

---

### `cast_sequence:get_debug`

```lua
cast_sequence:get_debug(): boolean
```

Returns current debug state for native sequences.

---

### `cast_sequence:set_confirmed_debug`

```lua
cast_sequence:set_confirmed_debug(enabled: boolean): nil
```

Enables/disables debug logging for confirmed sequences.

---

### `cast_sequence:get_confirmed_debug`

```lua
cast_sequence:get_confirmed_debug(): boolean
```

Returns current debug state for confirmed sequences.

---

## Configuration

### `cast_sequence:set_local_player_fn`

```lua
cast_sequence:set_local_player_fn(fn: function): nil
```

Sets a function that returns the local player. Used for cast filtering.

---

### `cast_sequence:bind_native`

```lua
cast_sequence:bind_native(native_module: any): nil
```

Binds to the native sequence engine module.

---

## Complete Example

### Burst Rotation with Sequences

```lua
local izi = require("common/izi_sdk")
local cast_sequence = require("common/utility/spell_sequence_helper")

-- Enable debug logging
cast_sequence:set_debug(true)
cast_sequence:set_confirmed_debug(true)

-- Wire the callback
core.register_on_spell_cast_callback(function(data)
    cast_sequence:on_spell_cast(data)
end)

-- Define spells
local SPELLS = {
    COMBUSTION = izi.spell(190319),
    FIRE_BLAST = izi.spell(108853),
    PYROBLAST = izi.spell(11366),
    FIREBALL = izi.spell(133),
}

local function execute_burst(target)
    local player = izi.get_player()
    
    -- Check if sequence is already running
    if cast_sequence:is_active() then
        return
    end
    
    -- Check cooldown
    if cast_sequence:is_on_cooldown() then
        return
    end
    
    -- Start burst sequence
    cast_sequence:advanced_sequence({
        { 
            spell = SPELLS.COMBUSTION, 
            target = player, 
            condition = function() return SPELLS.COMBUSTION:is_castable() end 
        },
        { 
            spell = SPELLS.FIRE_BLAST, 
            target = target, 
            condition = function() return SPELLS.COMBUSTION:buff_up() end 
        },
        { 
            spell = SPELLS.PYROBLAST, 
            target = target, 
            condition = function() return player:has_buff(48108) end  -- Hot Streak
        },
    }, {
        timeout = 15.0,
        debug_name = "Fire Burst",
        is_flexible_order = false,  -- Must go in order
        fill_entries = {
            { spell = SPELLS.FIREBALL, target = target, condition = function() return true end },
        },
        fill_delay_ms = 100,
    })
end

local function on_update()
    -- Process sequences
    cast_sequence:on_update()
    
    -- Don't do other stuff while sequence is running
    if cast_sequence:is_active() then
        return
    end
    
    -- Normal rotation...
end
```