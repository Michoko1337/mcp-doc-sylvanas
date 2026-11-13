# Settings Manager

> Source: <https://docs.project-sylvanas.net/dev/modules/settings-manager>

## Overview

The Settings Manager provides automatic settings persistence for your plugins. It handles saving and loading configuration to disk, attaching to menu elements, and managing defaults - all with minimal setup required.

**Key Features:**

- **Automatic Persistence** - Settings saved to disk and restored on reload
- **Menu Integration** - Attach directly to menu element tables
- **Nested Structure Support** - Organize settings in logical hierarchies
- **Default Management** - Automatically handles missing keys with defaults
- **Get/Set API** - Programmatic access to any setting by key path

## Importing The Module

```lua
---@type settings_manager
local settings = require("common/modules/settings_manager")
```

> [!WARNING]
> Access functions with `:` (colon), not `.` (dot).

---

## Quick Start

```lua
local settings = require("common/modules/settings_manager")

-- 1. Set the file name (saved to scripts_data/)
settings:set_file_name("my_plugin_settings")

-- 2. Define your menu elements
local menu = {
    combat = {
        enabled = core.menu.checkbox(true, "combat_enabled", "Enable Combat"),
        burst_threshold = core.menu.slider(30, 0, 100, "burst_hp", "Burst HP%"),
    },
    targeting = {
        max_range = core.menu.slider(40, 5, 100, "max_range", "Max Range"),
    },
}

-- 3. Attach menu elements
settings:attach(menu)

-- 4. Initialize (loads from disk or uses defaults)
settings:init()
```

That's it! Your settings will now persist across sessions.

---

## Functions

### Setup Functions

#### `settings:set_file_name`

Syntax

```lua
settings:set_file_name(name: string): boolean
```

**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| `name` | `string` | File name without extension |

Returns

- `boolean` - False if name is empty or contains invalid characters ( `\ / : * ? " < > |` )

The `.txt` extension is automatically appended. Files are saved to `scripts_data/`.

---

#### `settings:attach`

Syntax

```lua
settings:attach(element: table | userdata, namespace?: string): nil
```

**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| `element` | `table \| userdata` | Menu element or table of elements |
| `namespace` | `string` | Required when attaching a single element |

Description

Attaches menu elements for automatic settings management. Can attach:

- A single element with a namespace/key
- A nested table of elements (will iterate recursively)

Supports any element with `get_state`/`get`/`get_default` methods.

**Example Usage**

```lua
-- Attach entire menu table (recursive)
settings:attach(menu)

-- Attach single element with namespace
settings:attach(my_checkbox, "features.special_mode")
```

---

#### `settings:init`

Syntax

```lua
settings:init(): table | boolean
```

Description

Initializes the settings manager:

1. Builds defaults from attached elements
2. Attempts to load settings from file
3. Merges loaded settings with defaults (missing keys get default values)
4. Applies settings to attached elements

**Call this after attaching all elements and setting the file name.**

---

### Get/Set Functions

#### `settings:get`

Syntax

```lua
settings:get(key: string): any
```

**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| `key` | `string` | Dot-separated path to the setting |

**Example Usage**

```lua
local is_enabled = settings:get("combat.enabled")
local threshold = settings:get("combat.burst_threshold")
local max_range = settings:get("targeting.max_range")
```

---

#### `settings:set`

Syntax

```lua
settings:set(key: string, value: any): boolean
```

**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| `key` | `string` | Dot-separated path to the setting |
| `value` | `any` | New value to set |

Description

Updates both the internal settings and the attached menu element (if present). Auto-saves after setting.

**Example Usage**

```lua
settings:set("combat.burst_threshold", 50)
settings:set("targeting.max_range", 30)
```

---

### Save/Load Functions

#### `settings:save`

Syntax

```lua
settings:save(): boolean
```

Saves current settings to file. Shows override confirmation notification if file already exists. Returns false if file name not set or file exists (must click notification to confirm).

Use `save_int()` to bypass the confirmation.

---

#### `settings:save_int`

```lua
settings:save_int(): boolean
```

Internal save function that bypasses override confirmation. Directly writes settings to file.

---

#### `settings:load`

Syntax

```lua
settings:load(): table | boolean
```

Loads settings from file, merges with defaults, and applies to attached elements.

---

#### `settings:import`

```lua
settings:import(): table | boolean
```

Alias for `load()`.

---

### Reset Functions

#### `settings:resetUI`

```lua
settings:resetUI(): nil
```

Resets UI elements to default values **without saving to file**. Persistent settings on disk remain unchanged.

---

#### `settings:reset`

Syntax

```lua
settings:reset(saveToFile?: boolean): nil
```

**Parameters**

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `saveToFile` | `boolean` | `false` | If true, also persists defaults to disk |

Full reset to default values.

---

### Utility Functions

#### `settings:build_default_settings`

```lua
settings:build_default_settings(): table
```

Builds default settings from all attached elements by calling `get_default()` on each.

---

#### `settings:collect_attached_settings`

```lua
settings:collect_attached_settings(): table
```

Collects current values from all attached elements. Returns nested table structure.

---

#### `settings:apply_attached_settings`

```lua
settings:apply_attached_settings(nested_settings: table): nil
```

Applies a nested settings table to all attached elements. Handles type conversion automatically. Skips button, keybind, and tree elements.

---

#### `settings:flatten_table`

```lua
settings:flatten_table(tbl: table, prefix?: string, result?: table): table
```

Flattens a nested table into dot-separated keys.

```lua
-- Input:  { a = { b = 1 } }
-- Output: { "a.b" = 1 }
```

---

#### `settings:unflatten_table`

```lua
settings:unflatten_table(flat_tbl: table): table
```

Converts dot-separated keys back into nested structure.

```lua
-- Input:  { "a.b" = 1 }
-- Output: { a = { b = 1 } }
```

---

## Complete Example

### Full Plugin Settings Setup

```lua
local settings = require("common/modules/settings_manager")

-- Set file name
settings:set_file_name("fire_mage_rotation")

-- Define menu structure
local menu = {
    general = {
        enabled = core.menu.checkbox(true, "gen_enabled", "Enable Rotation"),
        debug = core.menu.checkbox(false, "gen_debug", "Debug Mode"),
    },
    
    combat = {
        burst_enabled = core.menu.checkbox(true, "burst_enabled", "Enable Burst"),
        burst_hp = core.menu.slider(30, 0, 100, "burst_hp", "Burst Below HP%"),
        aoe_threshold = core.menu.slider(3, 1, 10, "aoe_thresh", "AoE Target Count"),
    },
    
    defensives = {
        ice_block_hp = core.menu.slider(20, 5, 50, "ib_hp", "Ice Block HP%"),
        barrier_hp = core.menu.slider(50, 20, 80, "barrier_hp", "Barrier HP%"),
    },
}

-- Attach and initialize
settings:attach(menu)
settings:init()

-- Now you can use settings anywhere
local function should_burst()
    local player = core.object_manager.get_local_player()
    local hp = player:get_health_percent()
    
    if not settings:get("combat.burst_enabled") then
        return false
    end
    
    return hp < settings:get("combat.burst_hp")
end

-- Programmatic changes
local function on_boss_pull()
    -- Temporarily lower burst threshold for boss
    settings:set("combat.burst_hp", 50)
end

-- Reset button handler
local function on_reset_clicked()
    settings:reset(true)  -- Reset and save to file
    core.log("Settings reset to defaults")
end
```

### Settings with Categories

```lua
local settings = require("common/modules/settings_manager")

settings:set_file_name("my_healer_plugin")

local menu = {
    healing = {
        tank = {
            priority = core.menu.slider(100, 0, 100, "tank_prio", "Tank Priority"),
            threshold = core.menu.slider(80, 0, 100, "tank_thresh", "Tank Heal Threshold"),
        },
        party = {
            priority = core.menu.slider(50, 0, 100, "party_prio", "Party Priority"),
            threshold = core.menu.slider(70, 0, 100, "party_thresh", "Party Heal Threshold"),
        },
    },
    
    dispel = {
        enabled = core.menu.checkbox(true, "dispel_on", "Enable Dispel"),
        priority_only = core.menu.checkbox(false, "dispel_prio", "Priority Debuffs Only"),
    },
}

settings:attach(menu)
settings:init()

-- Access nested settings
local tank_threshold = settings:get("healing.tank.threshold")
local party_threshold = settings:get("healing.party.threshold")
```