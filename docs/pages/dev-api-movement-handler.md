# Movement Handler

> Source: <https://docs.project-sylvanas.net/dev/api/movement-handler>

## Overview

The Movement Handler is a small utility for **combat movement adjustments** - temporarily pausing player movement and controlling camera/facing direction. This is designed for micro-adjustments during combat, not for automatic bot movement from point A to B.

> [!INFO]
> This is **NOT** a replacement for [Simple Movement](/dev/api/simple-movement). They serve completely different purposes:
>
> | Simple Movement | Movement Handler |
> | --- | --- |
> | Automatic A-to-B navigation | Combat micro-adjustments |
> | Waypoint following | Pause/resume movement |
> | Bot-style pathfinding | Face target for casts |
> | (Deprecated, buggy) | Small, focused utility |
>
> Movement Handler is for things like: "stop moving so I can cast this spell" or "face this target for the next 2 seconds". It does NOT move your character to locations.

**Key Features:**

- **Movement Pause** - Temporarily block movement for spell casts
- **Light Pause** - Shorter, less aggressive movement blocking
- **Look-At Locking** - Lock facing to a target or position
- **Delayed Actions** - Schedule pause/resume with delays

## Importing The Module

```lua
---@type movement_handler
local movement_handler = require("common/utility/movement_handler")
```

> [!WARNING]
> Access functions with `:` (colon), not `.` (dot).

---

## Functions

### `movement_handler:pause_movement`

Syntax

```lua
movement_handler:pause_movement(pause_duration?: number, delay?: number): nil
```

**Parameters**

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `pause_duration` | `number` | `nil` | How long to pause (nil = until manually resumed) |
| `delay` | `number` | `0` | Delay before pausing starts |

Description

Pauses player movement for a specified duration. Movement inputs are blocked until the pause expires or `resume_movement` is called.

**Example Usage**

```lua
-- Pause movement for 5 seconds with 0.5s delay
movement_handler:pause_movement(5, 0.5)

-- Pause indefinitely (must call resume_movement)
movement_handler:pause_movement()

-- Pause for 2 seconds, starting immediately
movement_handler:pause_movement(2, 0)
```

---

### `movement_handler:pause_movement_light`

Syntax

```lua
movement_handler:pause_movement_light(pause_duration?: number, delay?: number): nil
```

**Parameters**

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `pause_duration` | `number` | `nil` | How long to pause |
| `delay` | `number` | `0` | Delay before pausing starts |

Description

A lighter version of movement pause, suitable for shorter interruptions. Behavior is similar to `pause_movement` but with less aggressive blocking.

**Example Usage**

```lua
-- Light pause for quick cast
movement_handler:pause_movement_light(0.5)
```

---

### `movement_handler:resume_movement`

Syntax

```lua
movement_handler:resume_movement(action_delay?: number): nil
```

**Parameters**

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `action_delay` | `number` | `0` | Delay before resuming |

Description

Resumes movement after a pause. Can be scheduled with a delay.

**Example Usage**

```lua
-- Resume immediately
movement_handler:resume_movement()

-- Schedule resume in 1 second
movement_handler:resume_movement(1)
```

---

### `movement_handler:look_at_target`

Syntax

```lua
movement_handler:look_at_target(lock_duration?: number, delay?: number, target?: game_object): nil
```

**Parameters**

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `lock_duration` | `number` | `nil` | How long to maintain look-at |
| `delay` | `number` | `0` | Delay before locking |
| `target` | `game_object` | Current target | Target to look at |

Description

Locks the camera to face a target unit. The look-at is maintained for the specified duration or until manually unlocked.

**Example Usage**

```lua
local target = core.object_manager.get_target()

-- Look at current target for 3 seconds
movement_handler:look_at_target(3, 0, target)

-- Look at target with 0.2s delay
movement_handler:look_at_target(2, 0.2, target)
```

---

### `movement_handler:look_at_position`

Syntax

```lua
movement_handler:look_at_position(lock_duration?: number, delay?: number, position: vec3): nil
```

**Parameters**

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `lock_duration` | `number` | `nil` | How long to maintain look-at |
| `delay` | `number` | `0` | Delay before locking |
| `position` | `vec3` | Required | World position to look at |

Description

Locks the camera to face a specific world position.

**Example Usage**

```lua
local boss_position = vec3.new(1234, 5678, 100)

-- Face the boss position for 5 seconds
movement_handler:look_at_position(5, 0, boss_position)
```

---

### `movement_handler:unlock_look_at`

Syntax

```lua
movement_handler:unlock_look_at(action_delay?: number): nil
```

**Parameters**

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `action_delay` | `number` | `0` | Delay before unlocking |

Description

Unlocks the camera look-at, allowing normal camera control again.

**Example Usage**

```lua
-- Unlock immediately
movement_handler:unlock_look_at()

-- Schedule unlock in 0.5 seconds
movement_handler:unlock_look_at(0.5)
```

---

### `movement_handler:on_render`

```lua
movement_handler:on_render(): nil
```

Call this in your render callback to process movement handler state. Required for delays and auto-resume to work properly.

**Example Usage**

```lua
local function on_render()
    movement_handler:on_render()
end

core.register_on_render_callback(on_render)
```

---

### `movement_handler:get_state`

```lua
movement_handler:get_state(): table
```

Returns the current internal state for debugging.

---

## Complete Examples

### Channeled Spell Helper

```lua
local movement_handler = require("common/utility/movement_handler")

local function cast_channel_spell(spell, target, channel_duration)
    -- Pause movement for channel duration + small buffer
    movement_handler:pause_movement(channel_duration + 0.5)
    
    -- Face the target
    movement_handler:look_at_target(channel_duration, 0, target)
    
    -- Cast the spell
    spell:cast(target)
end

-- Usage
cast_channel_spell(my_channel_spell, enemy_target, 3.0)
```

### Combo with Movement Control

```lua
local movement_handler = require("common/utility/movement_handler")

local function execute_combo(target)
    -- Stop moving for the combo
    movement_handler:pause_movement(4.0)
    
    -- Face target throughout
    movement_handler:look_at_target(4.0, 0, target)
    
    -- Execute combo abilities
    ability_1:cast(target)
    
    -- Schedule next ability
    izi.after(1.0, function()
        ability_2:cast(target)
    end)
    
    izi.after(2.0, function()
        ability_3:cast(target)
    end)
    
    -- Movement auto-resumes after 4 seconds
end
```

### Safe Cast with Movement Check

```lua
local movement_handler = require("common/utility/movement_handler")

local function safe_cast(spell, target, cast_time)
    -- Light pause for cast time
    movement_handler:pause_movement_light(cast_time + 0.2)
    
    -- Ensure facing
    movement_handler:look_at_target(cast_time, 0, target)
    
    return spell:cast(target)
end
```

### Integration with Render Loop

```lua
local movement_handler = require("common/utility/movement_handler")

local function on_render()
    -- Required for movement handler to process delays
    movement_handler:on_render()
    
    -- Your other render logic...
end

local function on_update()
    -- Your combat logic...
    
    if should_cast_big_spell then
        movement_handler:pause_movement(3.0)
        movement_handler:look_at_target(3.0, 0, target)
        big_spell:cast(target)
    end
end

core.register_on_render_callback(on_render)
core.register_on_update_callback(on_update)
```