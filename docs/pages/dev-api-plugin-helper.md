# Plugin Helper

> Source: <https://docs.project-sylvanas.net/dev/api/plugin-helper>

## Overview

The Plugin Helper is a core utility library for plugin development that provides essential functionality for keybind handling, cross-plugin defensive synchronization, UI text drawing, latency calculation, and combat duration tracking.

**Key Features:**

- **Smart Keybinds** - Toggle and keybind state checking with special default behaviors
- **Defensive Sync** - Prevent defensive ability overlap across multiple plugins
- **UI Drawing** - Draw centered text at character position or custom screen locations
- **Latency Handling** - Get current latency for timing calculations
- **Combat Tracking** - Track combat duration in seconds or milliseconds

## Importing The Module

```lua
---@type plugin_helper
local plugin_helper = require("common/utility/plugin_helper")
```

> [!WARNING]
> Access functions with `:` (colon), not `.` (dot).

---

## Keybind Functions

### Understanding Special Keybind Values

The plugin helper uses special keybind values to create different default behaviors:

| Key Value | Visibility | Default State | Use Case |
| --- | --- | --- | --- |
| **7** | Hidden in Control Panel | Always `true` | Features that should be ON by default (e.g., "Enable Rotation") |
| **999** | Visible in Control Panel | `false` (unbound) | Features user should consciously enable |
| **Other** | Visible in Control Panel | Normal toggle behavior | Standard keybinds |

> [!TIP]
> Using key `7` for essential features means users get a working plugin immediately without configuration. They can later change the keybind to any key, which automatically makes it a normal toggle (default false, user must press to enable).
>
> Using key `999` shows the toggle in the Control Panel but doesn't enable it by default - perfect for optional features the user should discover and enable themselves.

---

### `plugin_helper:is_toggle_binded`

Syntax

```lua
plugin_helper:is_toggle_binded(element: keybind): boolean
```

**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| `element` | `keybind` | A keybind menu element |

Returns

- `boolean` - True if the toggle has an actual keybind assigned (not 7 or 999)

Description

Checks if a toggle menu element has a real keybind assigned. Returns `false` for special values 7 and 999.

---

### `plugin_helper:is_toggle_enabled`

Syntax

```lua
plugin_helper:is_toggle_enabled(element: keybind): boolean
```

**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| `element` | `keybind` | A keybind menu element |

Returns

- `boolean` - True if the toggle is considered enabled

Description

Checks if a toggle is enabled, with special handling:

- **Key 7** : Always returns `true` (invisible, always-on default)
- **Key 999** : Returns `false` unless user changed it (visible, off by default)
- **Other keys** : Normal toggle state

**Example Usage**

```lua
-- In your menu setup
local enable_rotation = core.menu.keybind(7, "enable_rotation", "Enable Rotation")
local enable_cooldowns = core.menu.keybind(7, "enable_cooldowns", "Enable Cooldowns")
local enable_burst = core.menu.keybind(999, "enable_burst", "Enable Burst Mode")

-- In your logic
local function on_update()
    -- This is true by default (key 7)
    if not plugin_helper:is_toggle_enabled(enable_rotation) then
        return
    end
    
    -- This is also true by default (key 7)
    if plugin_helper:is_toggle_enabled(enable_cooldowns) then
        use_cooldowns()
    end
    
    -- This is false by default until user enables it (key 999)
    if plugin_helper:is_toggle_enabled(enable_burst) then
        execute_burst_rotation()
    end
end
```

---

### `plugin_helper:is_keybind_enabled`

Syntax

```lua
plugin_helper:is_keybind_enabled(element: keybind): boolean
```

Description

Checks if a keybind (not toggle) is currently pressed/active, with special case handling similar to toggles.

---

## Defensive Synchronization

The defensive sync system allows multiple plugins to coordinate defensive ability usage, preventing wasteful overlap (e.g., using a trinket immediately after Ice Block).

> [!TIP]
> When you use `plugin_helper` for defensives, ALL plugins that also use it will respect the block time. This means:
>
> - Your rotation plugin won't use defensives while Universal Utility's defensive is active
> - A healer plugin won't waste Pain Suppression right after the target used their own defensive

### `plugin_helper:is_defensive_allowed`

Syntax

```lua
plugin_helper:is_defensive_allowed(): boolean
```

Returns

- `boolean` - True if defensive abilities are allowed to be used

Description

Checks a global variable to determine if defensive actions are currently allowed. Returns `false` if another defensive was recently used and is still within its block time.

**Example Usage**

```lua
local function use_defensive()
    -- Check if defensives are allowed globally
    if not plugin_helper:is_defensive_allowed() then
        return false
    end
    
    -- Use your defensive
    if ice_block:cast() then
        -- Block other defensives for 6 seconds (Ice Block lasts 8s)
        plugin_helper:set_defensive_block_time(6)
        return true
    end
    
    return false
end
```

---

### `plugin_helper:get_defensive_block_time`

Syntax

```lua
plugin_helper:get_defensive_block_time(): number
```

Returns

- `number` - Remaining block time in seconds

---

### `plugin_helper:set_defensive_block_time`

Syntax

```lua
plugin_helper:set_defensive_block_time(extra_time: number): nil
```

**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| `extra_time` | `number` | Seconds to block other defensives |

Description

Sets the defensive block time. Other plugins checking `is_defensive_allowed()` will return `false` until this time expires.

> [!TIP]
> Set block time slightly LESS than the defensive duration so other defensives can be considered near the end:
>
> | Defensive | Duration | Recommended Block Time |
> | --- | --- | --- |
> | Divine Shield | 8s | 6s |
> | Ice Block | 10s | 8s |
> | Cloak of Shadows | 5s | 3s |
> | Pain Suppression | 8s | 6s |
> | Healthstone | instant | 1s |

**Example Usage**

```lua
-- Using Divine Shield (8 second immunity)
if divine_shield:cast() then
    -- Block for 6 seconds, so near the end we can prepare next defensive
    plugin_helper:set_defensive_block_time(6)
end

-- Using a Healthstone (instant, just prevent spam)
if healthstone:use() then
    plugin_helper:set_defensive_block_time(1)
end
```

---

## UI Drawing Functions

### `plugin_helper:draw_text_character_center`

Syntax

```lua
plugin_helper:draw_text_character_center(
    text: string,
    text_color?: color,
    y_offset?: number,
    is_static?: boolean,
    counter_special_id?: string,
    font_id?: integer
): nil
```

**Parameters**

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `text` | `string` | Required | Text to display |
| `text_color` | `color` | White | Text color |
| `y_offset` | `number` | `0` | Vertical offset from character center |
| `is_static` | `boolean` | `false` | Whether text position is static |
| `counter_special_id` | `string` | `nil` | Unique ID for counter/stacking |
| `font_id` | `integer` | `nil` | Font identifier |

Description

Draws centered text at the player character's screen position.

**Example Usage**

```lua
-- Simple status text above character
plugin_helper:draw_text_character_center("Burst Active!", color.red(), -50)

-- With custom font
plugin_helper:draw_text_character_center("Ready", color.green(), -30, false, nil, 2)
```

---

### `plugin_helper:draw_text_message`

Syntax

```lua
plugin_helper:draw_text_message(
    text: string,
    text_color: color,
    border_color: color,
    screen_position: vec2,
    size: vec2,
    is_static: boolean,
    add_rectangles: boolean,
    unique_id: string,
    counter_special_id?: string,
    is_adding_text_size?: boolean,
    font_id?: number
): nil
```

Description

Draws text at a specific screen position with optional border and background rectangles.

---

## Utility Functions

### `plugin_helper:get_latency`

Syntax

```lua
plugin_helper:get_latency(): number
```

Returns

- `number` - Current latency in seconds, clamped to a maximum value

Description

Calculates latency based on current ping. Useful for timing adjustments in spell casting.

> [!WARNING]
> The private-server clients (Vanilla 1.14 / TBC 2.5.3) report a fixed ping, so this is always `0.005` there.

**Example Usage**

```lua
local latency = plugin_helper:get_latency()
local cast_time_with_latency = spell_cast_time + latency
```

---

### `plugin_helper:get_current_combat_length_seconds`

```lua
plugin_helper:get_current_combat_length_seconds(): number
```

Returns how long the player has been in combat, in seconds (using `core.time()`).

---

### `plugin_helper:get_current_combat_length_miliseconds`

```lua
plugin_helper:get_current_combat_length_miliseconds(): number
```

Returns how long the player has been in combat, in milliseconds (using `core.game_time()`).

---

## Complete Examples

### Plugin with Smart Defaults

```lua
local plugin_helper = require("common/utility/plugin_helper")

-- Menu setup with smart defaults
local menu = {
    -- Key 7: ON by default, invisible until user changes it
    enable_rotation = core.menu.keybind(7, "enable_rotation", "Enable Rotation"),
    enable_interrupts = core.menu.keybind(7, "enable_interrupts", "Enable Interrupts"),
    
    -- Key 999: OFF by default, visible so user can enable
    enable_burst = core.menu.keybind(999, "enable_burst", "Burst Mode"),
    enable_experimental = core.menu.keybind(999, "enable_experimental", "Experimental Features"),
    
    -- Normal keybind: user must set it up
    manual_cooldowns = core.menu.keybind(0, "manual_cooldowns", "Manual Cooldowns"),
}

local function on_update()
    -- Always check rotation toggle first
    if not plugin_helper:is_toggle_enabled(menu.enable_rotation) then
        return
    end
    
    -- Run rotation...
    execute_rotation()
    
    -- Interrupts (on by default)
    if plugin_helper:is_toggle_enabled(menu.enable_interrupts) then
        check_interrupts()
    end
    
    -- Burst mode (user must enable)
    if plugin_helper:is_toggle_enabled(menu.enable_burst) then
        execute_burst()
    end
end
```

### Defensive System Integration

```lua
local plugin_helper = require("common/utility/plugin_helper")

local defensives = {
    { spell = ice_block, duration = 10, block_time = 8 },
    { spell = mirror_image, duration = 40, block_time = 2 },
    { spell = alter_time, duration = 10, block_time = 5 },
}

local function use_defensive_rotation()
    -- Check global defensive state
    if not plugin_helper:is_defensive_allowed() then
        return false
    end
    
    local player = core.object_manager.get_local_player()
    local health_pct = player:get_health_percent()
    
    -- Low health - use major defensive
    if health_pct < 30 then
        if ice_block:cast() then
            plugin_helper:set_defensive_block_time(8)  -- 10s duration, 8s block
            return true
        end
    end
    
    -- Medium health - use minor defensive
    if health_pct < 60 then
        if mirror_image:cast() then
            plugin_helper:set_defensive_block_time(2)  -- Short block for minor CD
            return true
        end
    end
    
    return false
end
```

### Combat Duration Based Logic

```lua
local plugin_helper = require("common/utility/plugin_helper")

local function should_use_long_cooldown()
    local combat_time = plugin_helper:get_current_combat_length_seconds()
    
    -- Don't use long CDs in first 5 seconds (might be a pull mistake)
    if combat_time < 5 then
        return false
    end
    
    -- Use CDs after 10 seconds of combat
    if combat_time > 10 then
        return true
    end
    
    return false
end
```

### Status Display

```lua
local plugin_helper = require("common/utility/plugin_helper")
local color = require("common/color")

local function on_render()
    local status_parts = {}
    
    if plugin_helper:is_toggle_enabled(menu.enable_rotation) then
        table.insert(status_parts, "Rotation: ON")
    end
    
    if plugin_helper:is_toggle_enabled(menu.enable_burst) then
        table.insert(status_parts, "BURST!")
    end
    
    if not plugin_helper:is_defensive_allowed() then
        local remaining = plugin_helper:get_defensive_block_time()
        table.insert(status_parts, string.format("Def CD: %.1fs", remaining))
    end
    
    local status_text = table.concat(status_parts, " | ")
    plugin_helper:draw_text_character_center(status_text, color.white(), -40)
end
```