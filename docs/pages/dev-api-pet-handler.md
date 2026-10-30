# Pet Handler

> Source: <https://docs.project-sylvanas.net/dev/api/pet-handler>

## Overview

The Pet Handler provides utilities for controlling pet behavior, including setting pet states (passive, defensive, assist) and commanding pets to move to specific positions. This is essential for pet classes that need precise control over their companions.

**Key Features:**

- **Pet State Control** - Set pet to passive, defensive, or assist mode
- **Pet Movement** - Command pet to move to specific positions
- **Delayed Actions** - Schedule state changes and movements with delays
- **Duration Control** - Specify how long a pet should stay at a position

## Importing The Module

```lua
---@type pet_handler
local pet_handler = require("common/utility/pet_handler")
```

> [!WARNING]
> Access functions with `:` (colon), not `.` (dot).

---

## Pet State Enum

Access pet states through the `pet_state` field:

```lua
pet_handler.pet_state.PASSIVE    -- Pet won't attack
pet_handler.pet_state.DEFENSIVE  -- Pet attacks enemies that attack you
pet_handler.pet_state.ASSIST     -- Pet attacks your target
```

---

## Functions

### `pet_handler:set_pet_state`

Syntax

```lua
pet_handler:set_pet_state(new_state: number, delay?: number): nil
```

**Parameters**

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `new_state` | `number` | Required | Pet state from `pet_handler.pet_state` enum |
| `delay` | `number` | `0` | Delay in seconds before changing state |

Description

Changes the pet's behavior state. Can be scheduled with a delay.

**Example Usage**

```lua
-- Set pet to passive immediately
pet_handler:set_pet_state(pet_handler.pet_state.PASSIVE)

-- Set pet to passive after 2 seconds
pet_handler:set_pet_state(pet_handler.pet_state.PASSIVE, 2.0)

-- Set pet to assist mode
pet_handler:set_pet_state(pet_handler.pet_state.ASSIST)

-- Set pet to defensive mode with delay
pet_handler:set_pet_state(pet_handler.pet_state.DEFENSIVE, 0.5)
```

---

### `pet_handler:move_pet_to_position`

Syntax

```lua
pet_handler:move_pet_to_position(position: vec3, delay?: number, duration?: number): nil
```

**Parameters**

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `position` | `vec3` | Required | World position for pet to move to |
| `delay` | `number` | `0` | Delay before movement command |
| `duration` | `number` | `nil` | How long pet should stay at position |

Description

Commands the pet to move to a specific world position. Optionally specify how long the pet should remain at that position.

**Example Usage**

```lua
local target_pos = vec3.new(1234, 5678, 100)

-- Move pet to position immediately
pet_handler:move_pet_to_position(target_pos)

-- Move pet after 1 second delay
pet_handler:move_pet_to_position(target_pos, 1.0)

-- Move pet and stay for 5 seconds
pet_handler:move_pet_to_position(target_pos, 0, 5.0)

-- Move pet after delay and stay for duration
pet_handler:move_pet_to_position(target_pos, 0.5, 3.0)
```

---

### `pet_handler:on_render`

```lua
pet_handler:on_render(): nil
```

Call this in your render callback to process delayed pet commands.

**Example Usage**

```lua
local function on_render()
    pet_handler:on_render()
end

core.register_on_render_callback(on_render)
```

---

## Complete Examples

### Stealth Opener with Pet Control

```lua
local pet_handler = require("common/utility/pet_handler")

local function stealth_opener(target)
    -- Set pet passive before opening (don't break CC)
    pet_handler:set_pet_state(pet_handler.pet_state.PASSIVE)
    
    -- Perform opener...
    opener_ability:cast(target)
    
    -- Return pet to assist after 3 seconds
    pet_handler:set_pet_state(pet_handler.pet_state.ASSIST, 3.0)
end
```

### Pet Positioning for AoE

```lua
local pet_handler = require("common/utility/pet_handler")

local function position_pet_for_aoe(center_pos)
    -- Move pet to AoE center
    pet_handler:move_pet_to_position(center_pos, 0, 5.0)
    
    -- Pet will stay there for 5 seconds then return to normal behavior
end
```

### Arena Pet Control

```lua
local pet_handler = require("common/utility/pet_handler")

local function arena_pet_passive_on_cc()
    -- When enemy is CC'd, make pet passive to avoid breaking it
    pet_handler:set_pet_state(pet_handler.pet_state.PASSIVE)
end

local function arena_pet_attack(target)
    -- Set to assist and attack
    pet_handler:set_pet_state(pet_handler.pet_state.ASSIST)
    
    -- Optionally position pet on target
    local target_pos = target:get_position()
    pet_handler:move_pet_to_position(target_pos)
end
```

### Integration with Render Loop

```lua
local pet_handler = require("common/utility/pet_handler")

local function on_render()
    -- Required for delayed commands to work
    pet_handler:on_render()
end

local function on_update()
    -- Your combat logic...
    
    if should_go_passive then
        pet_handler:set_pet_state(pet_handler.pet_state.PASSIVE)
    end
    
    if should_reposition_pet then
        pet_handler:move_pet_to_position(safe_position, 0, 3.0)
    end
end

core.register_on_render_callback(on_render)
core.register_on_update_callback(on_update)
```