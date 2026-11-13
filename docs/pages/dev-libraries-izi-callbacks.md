# IZI - Callbacks

> Source: <https://docs.project-sylvanas.net/dev/libraries/izi/callbacks>

## Overview

The IZI SDK provides an event-driven callback system that allows you to react to game events in real-time. Instead of polling for changes every frame, you can register callback functions that are automatically invoked when specific events occur.

**Key Features:**

- **Automatic Cleanup** - Every callback returns an unsubscribe function for easy cleanup
- **Buff/Debuff Tracking** - React to aura gains and losses on any unit
- **Combat Events** - Detect when units enter or leave combat
- **Spell Events** - Track spell casts from start to completion or cancellation
- **Keyboard Input** - Clean key release detection without polling

---

## Buff Callbacks

### `izi.on_buff_gain`

Syntax

```lua
izi.on_buff_gain(callback: function): function
```

**Parameters**

- `callback: function` - Function called when any unit gains a buff

**Callback Parameters**

```lua
{
    unit: game_object,  -- The unit that gained the buff
    buff_id: integer    -- The spell ID of the buff
}
```

Returns

- `unsubscribe: function` - Call this to stop receiving callbacks

Description

Registers a callback to be invoked whenever any tracked unit gains a buff. Useful for reacting to enemy cooldowns, friendly buffs to maintain, or procs to capitalize on.

**Example Usage**

```lua
local izi = require("common/izi_sdk")

-- Track when enemies gain shields
local PAIN_SUPPRESSION = 33206
local DIVINE_SHIELD = 642

local unsub = izi.on_buff_gain(function(event)
    local unit = event.unit
    local buff_id = event.buff_id
    
    if buff_id == PAIN_SUPPRESSION then
        izi.printf("%s gained Pain Suppression!", unit:get_name())
    elseif buff_id == DIVINE_SHIELD then
        izi.printf("%s bubbled! Switch targets!", unit:get_name())
    end
end)

-- Later, when done:
-- unsub()
```

---

### `izi.on_buff_lose`

Syntax

```lua
izi.on_buff_lose(callback: function): function
```

**Parameters**

- `callback: function` - Function called when any unit loses a buff

**Callback Parameters**

```lua
{
    unit: game_object,  -- The unit that lost the buff
    buff_id: integer    -- The spell ID of the buff
}
```

Returns

- `unsubscribe: function` - Call this to stop receiving callbacks

Description

Registers a callback to be invoked whenever any tracked unit loses a buff. Useful for detecting when defensive cooldowns fade, when buffs need to be reapplied, or when enemies become vulnerable again.

**Example Usage**

```lua
local izi = require("common/izi_sdk")

-- React when enemy's defensive fades
local ICEBOUND_FORTITUDE = 48792

local unsub = izi.on_buff_lose(function(event)
    if event.buff_id == ICEBOUND_FORTITUDE then
        izi.printf("%s Icebound Fortitude faded - GO!", event.unit:get_name())
    end
end)
```

---

## Debuff Callbacks

### `izi.on_debuff_gain`

Syntax

```lua
izi.on_debuff_gain(callback: function): function
```

**Parameters**

- `callback: function` - Function called when any unit gains a debuff

**Callback Parameters**

```lua
{
    unit: game_object,   -- The unit that gained the debuff
    debuff_id: integer   -- The spell ID of the debuff
}
```

Returns

- `unsubscribe: function` - Call this to stop receiving callbacks

Description

Registers a callback to be invoked whenever any tracked unit gains a debuff. Useful for tracking your DoT applications, enemy CC, or debuffs that need to be dispelled.

**Example Usage**

```lua
local izi = require("common/izi_sdk")

-- Track successful CC applications
local POLYMORPH = 118
local FEAR = 5782

local unsub = izi.on_debuff_gain(function(event)
    local unit = event.unit
    local debuff_id = event.debuff_id
    
    if debuff_id == POLYMORPH then
        izi.printf("Polymorphed %s!", unit:get_name())
    elseif debuff_id == FEAR then
        izi.printf("Feared %s!", unit:get_name())
    end
end)
```

---

### `izi.on_debuff_lose`

Syntax

```lua
izi.on_debuff_lose(callback: function): function
```

**Parameters**

- `callback: function` - Function called when any unit loses a debuff

**Callback Parameters**

```lua
{
    unit: game_object,   -- The unit that lost the debuff
    debuff_id: integer   -- The spell ID of the debuff
}
```

Returns

- `unsubscribe: function` - Call this to stop receiving callbacks

Description

Registers a callback to be invoked whenever any tracked unit loses a debuff. Useful for detecting when CC breaks, when DoTs need reapplication, or when dispels occur.

**Example Usage**

```lua
local izi = require("common/izi_sdk")

-- React when CC breaks
local POLYMORPH = 118

local unsub = izi.on_debuff_lose(function(event)
    if event.debuff_id == POLYMORPH then
        izi.printf("Polymorph broke on %s!", event.unit:get_name())
    end
end)
```

---

## Combat Callbacks

### `izi.on_combat_start`

Syntax

```lua
izi.on_combat_start(callback: function): function
```

**Parameters**

- `callback: function` - Function called when a unit enters combat

**Callback Parameters**

```lua
{
    unit: game_object   -- The unit that entered combat
}
```

Returns

- `unsubscribe: function` - Call this to stop receiving callbacks

Description

Registers a callback to be invoked when a unit enters combat. Useful for triggering combat openers, initializing state, or starting timers.

**Example Usage**

```lua
local izi = require("common/izi_sdk")

local combat_start_time = nil

local unsub = izi.on_combat_start(function(event)
    local me = izi.me()
    if event.unit == me then
        combat_start_time = izi.now()
        izi.print("Combat started! Popping cooldowns...")
    end
end)
```

---

### `izi.on_combat_finish`

Syntax

```lua
izi.on_combat_finish(callback: function): function
```

**Parameters**

- `callback: function` - Function called when a unit leaves combat

**Callback Parameters**

```lua
{
    unit: game_object   -- The unit that left combat
}
```

Returns

- `unsubscribe: function` - Call this to stop receiving callbacks

Description

Registers a callback to be invoked when a unit leaves combat. Useful for cleanup, state reset, or post-combat actions like auto-eating.

**Example Usage**

```lua
local izi = require("common/izi_sdk")

local unsub = izi.on_combat_finish(function(event)
    local me = izi.me()
    if event.unit == me then
        local duration = izi.now() - (combat_start_time or 0)
        izi.printf("Combat ended after %.1f seconds", duration)
    end
end)
```

---

## Spell Callbacks

### `izi.on_spell_begin`

Syntax

```lua
izi.on_spell_begin(callback: function): function
```

**Parameters**

- `callback: function` - Function called when a unit begins casting a spell

**Callback Parameters**

```lua
{
    spell_id: integer,        -- The spell being cast
    caster: game_object,      -- The unit casting the spell
    target: game_object|nil   -- The target of the cast (if any)
}
```

Returns

- `unsubscribe: function` - Call this to stop receiving callbacks

Description

Registers a callback to be invoked when any tracked unit begins casting a spell. Useful for interrupt timing, kick coordination, or defensive reactions.

**Example Usage**

```lua
local izi = require("common/izi_sdk")

-- Track dangerous casts
local GREATER_HEAL = 2060
local CHAOS_BOLT = 116858

local unsub = izi.on_spell_begin(function(event)
    local spell_id = event.spell_id
    local caster = event.caster
    
    if spell_id == GREATER_HEAL then
        izi.printf("KICK %s - Greater Heal!", caster:get_name())
    elseif spell_id == CHAOS_BOLT then
        izi.printf("Chaos Bolt incoming from %s!", caster:get_name())
    end
end)
```

---

### `izi.on_spell_success`

Syntax

```lua
izi.on_spell_success(callback: function): function
```

**Parameters**

- `callback: function` - Function called when a unit successfully casts a spell

**Callback Parameters**

```lua
{
    spell_id: integer,        -- The spell that was cast
    caster: game_object,      -- The unit that cast the spell
    target: game_object|nil   -- The target of the cast (if any)
}
```

Returns

- `unsubscribe: function` - Call this to stop receiving callbacks

Description

Registers a callback to be invoked when any tracked unit successfully completes a spell cast. Useful for tracking cooldown usage, combo point spending, or reaction timing.

> [!WARNING]
> For spells with a cast time, this fires shortly before the cast ends: two pings plus 54 ms early. The private-server clients (Vanilla 1.14 / TBC 2.5.3) report a fixed 10 ms ping, so there it always fires about 75 ms early, whatever your real latency is.

**Example Usage**

```lua
local izi = require("common/izi_sdk")

-- Track my own casts for combo tracking
local unsub = izi.on_spell_success(function(event)
    local me = izi.me()
    if event.caster == me then
        izi.printf("Successfully cast spell %d", event.spell_id)
    end
end)
```

---

### `izi.on_spell_cancel`

Syntax

```lua
izi.on_spell_cancel(callback: function): function
```

**Parameters**

- `callback: function` - Function called when a unit cancels a spell cast

**Callback Parameters**

```lua
{
    spell_id: integer,        -- The spell that was cancelled
    caster: game_object,      -- The unit that cancelled the spell
    target: game_object|nil   -- The intended target (if any)
}
```

Returns

- `unsubscribe: function` - Call this to stop receiving callbacks

Description

Registers a callback to be invoked when any tracked unit cancels or has their spell cast interrupted. Useful for detecting successful interrupts or cast jukes.

**Example Usage**

```lua
local izi = require("common/izi_sdk")

local unsub = izi.on_spell_cancel(function(event)
    izi.printf("%s stopped casting %d", event.caster:get_name(), event.spell_id)
end)
```

---

## Keyboard Callbacks

### `izi.on_key_release`

Syntax

```lua
izi.on_key_release(key: integer|string, callback: function): function
```

**Parameters**

- `key: integer|string` - The key to listen for (virtual key code or string)
- `callback: function` - Function called when the key is released

Returns

- `unsubscribe: function` - Call this to stop receiving callbacks

Description

Registers a callback to be invoked when the specified key is released. This is cleaner than polling `core.input.is_key_released()` every frame.

**Common Virtual Key Codes**

| Key | Code | Hex |
| --- | --- | --- |
| Left Mouse | 1 | 0x01 |
| Right Mouse | 2 | 0x02 |
| Middle Mouse | 4 | 0x04 |
| F | 70 | 0x46 |
| G | 71 | 0x47 |
| Shift | 16 | 0x10 |
| Control | 17 | 0x11 |
| Alt | 18 | 0x12 |

**Example Usage**

```lua
local izi = require("common/izi_sdk")

-- Toggle mode on F key
local burst_mode = false

local unsub = izi.on_key_release(0x46, function()
    burst_mode = not burst_mode
    izi.printf("Burst mode: %s", burst_mode and "ON" or "OFF")
end)

-- React to mouse clicks
local VK_LBUTTON = 0x01
izi.on_key_release(VK_LBUTTON, function()
    if izi.is_cursor_on_minimap() then
        local pos = izi.get_cursor_world_pos()
        if pos then
            izi.printf("Clicked map at: %.1f, %.1f", pos.x, pos.y)
        end
    end
end)
```

---

## Best Practices

### Always Store Unsubscribe Functions

```lua
local subscriptions = {}

local function setup_callbacks()
    subscriptions.buff_gain = izi.on_buff_gain(function(ev)
        -- handle buff gain
    end)
    
    subscriptions.combat = izi.on_combat_start(function(ev)
        -- handle combat start
    end)
end

local function cleanup()
    for name, unsub in pairs(subscriptions) do
        unsub()
    end
    subscriptions = {}
end
```

### Filter Events Efficiently

```lua
-- Bad: Heavy processing for every buff on every unit
izi.on_buff_gain(function(ev)
    for _, enemy in ipairs(izi.enemies(100)) do
        -- expensive operations
    end
end)

-- Good: Early exit for irrelevant events
local IMPORTANT_BUFFS = {
    [33206] = true,  -- Pain Suppression
    [642] = true,    -- Divine Shield
}

izi.on_buff_gain(function(ev)
    if not IMPORTANT_BUFFS[ev.buff_id] then return end
    if not ev.unit:is_valid_enemy() then return end
    
    -- Now handle the important case
end)
```

### Combine with Scheduled Actions

```lua
local izi = require("common/izi_sdk")

-- Schedule a followup action after detecting an event
izi.on_debuff_gain(function(ev)
    if ev.debuff_id == POLYMORPH then
        -- Schedule a reminder 8 seconds later (before poly breaks)
        izi.after(7.5, function()
            izi.print("Polymorph ending soon - prepare re-CC!")
        end)
    end
end)
```

---

## Complete Example

```lua
local izi = require("common/izi_sdk")

-- Track important cooldowns
local TRACKED_DEFENSIVES = {
    [33206] = "Pain Suppression",
    [642] = "Divine Shield",
    [48792] = "Icebound Fortitude",
    [31224] = "Cloak of Shadows",
}

local active_defensives = {}
local subscriptions = {}

local function on_defensive_gain(event)
    local name = TRACKED_DEFENSIVES[event.buff_id]
    if not name then return end
    if not event.unit:is_valid_enemy() then return end
    
    local unit_name = event.unit:get_name()
    active_defensives[event.unit:get_guid()] = {
        name = name,
        unit = unit_name,
        time = izi.now()
    }
    
    izi.printf("[DEFENSIVE] %s used %s!", unit_name, name)
end

local function on_defensive_lose(event)
    local name = TRACKED_DEFENSIVES[event.buff_id]
    if not name then return end
    
    local guid = event.unit:get_guid()
    local info = active_defensives[guid]
    
    if info then
        local duration = izi.now() - info.time
        izi.printf("[DEFENSIVE] %s's %s faded (%.1fs)", info.unit, name, duration)
        active_defensives[guid] = nil
    end
end

-- Setup
subscriptions.gain = izi.on_buff_gain(on_defensive_gain)
subscriptions.lose = izi.on_buff_lose(on_defensive_lose)

-- Toggle burst mode with F key
local burst_mode = false
subscriptions.key = izi.on_key_release(0x46, function()
    burst_mode = not burst_mode
    izi.printf("Burst mode: %s", burst_mode and "ENABLED" or "DISABLED")
end)

-- Cleanup function
local function unload()
    for _, unsub in pairs(subscriptions) do
        unsub()
    end
end
```