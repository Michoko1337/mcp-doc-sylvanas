# Icons Helper

> Source: <https://docs.project-sylvanas.net/dev/api/icons-helper>

## Overview

The Icons Helper is a utility library that simplifies loading and displaying World of Warcraft icons. It automatically fetches icons from Wowhead's CDN by name, caches them to disk for fast subsequent loads, and handles all the complexity of HTTP requests and texture management.

**Key Features:**

- **Icon by Name** - Load any WoW icon using its Wowhead slug (e.g., `"classicon-warlock"` )
- **Icon by Spell ID** - Dynamically resolve any spell's icon from its ID (e.g., `100` for Charge)
- **Automatic Disk Caching** - Icons are saved locally after first download
- **Multiple Sizes** - Support for large, medium, and small icon sizes
- **World Position Support** - Pass `vec3` world coordinates with automatic screen conversion
- **Format Fallback** - Automatically tries PNG and JPG formats
- **Throttled Downloads** - Built-in rate limiting to avoid overwhelming the CDN

> [!TIP]
> For the easiest experience, consider using the [IZI SDK Graphics](/dev/libraries/izi/graphics) module which wraps this helper with additional convenience functions.

## Importing The Module

```lua
---@type icons_helper
local icons = require("common/utility/icons_helper")
```

> [!WARNING]
> Access functions with `:` (colon), not `.` (dot). Static members like `cache` and constants use `.` (dot).

---

## Functions

### `icons:draw_icon`

Syntax

```lua
icons:draw_icon(
    icon_name_or_url: string,
    position: vec2|vec3,
    width: number,
    height: number,
    tint?: color,
    is_for_window?: boolean,
    opts?: icons_helper_draw_opts
): boolean
```

**Parameters**

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `icon_name_or_url` | `string` | Required | Wowhead icon slug or direct URL |
| `position` | `vec2\|vec3` | Required | Screen position (vec2) or world position (vec3) |
| `width` | `number` | Required | Draw width in pixels |
| `height` | `number` | Required | Draw height in pixels |
| `tint` | `color` | White | Optional color tint |
| `is_for_window` | `boolean` | `false` | Set true if drawing inside a custom window |
| `opts` | `icons_helper_draw_opts` | `nil` | Optional drawing options |

Returns

- `boolean` - True if the icon was drawn successfully

Description

Draws a WoW icon at the specified position. The icon is identified by its Wowhead slug name (the part after `/icon/` in Wowhead URLs). On first call, the icon is downloaded from Wowhead's CDN and cached locally. Subsequent calls use the cached version.

**Icon Name Format**

Icon names use the Wowhead slug format:

- Class icons: `classicon-warrior` , `classicon-paladin` , `classicon-warlock` , etc.
- Spell icons: `spell_fire_fireball02` , `ability_warrior_charge` , etc.
- Item icons: `inv_sword_04` , `inv_helmet_plate_raidwarrior_i_01` , etc.

You can find icon names by browsing [Wowhead's icon database](https://www.wowhead.com/icons) - the slug is the last part of the URL.

**Example Usage**

```lua
local vec2 = require("common/geometry/vector_2")
local icons = require("common/utility/icons_helper")
local color = require("common/color")

local function on_render()
    icons:draw_icon(
        "classicon-warlock",     -- Icon name (Wowhead slug)
        vec2.new(30, 30),        -- Screen position
        64, 64,                  -- Size
        color.white(255),        -- Tint
        false,                   -- Not in a window
        {
            size = "large",      -- Icon size
            persist_to_disk = true
        }
    )
end

core.register_on_render_callback(on_render)
```

---

### `icons:draw_spell_icon`

Syntax

```lua
icons:draw_spell_icon(
    spell_id: number,
    position: vec2|vec3,
    width: number,
    height: number,
    tint?: color,
    is_for_window?: boolean,
    opts?: icons_helper_draw_opts
): boolean
```

**Parameters**

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `spell_id` | `number` | Required | WoW spell ID (e.g., `100` for Charge) |
| `position` | `vec2\|vec3` | Required | Screen position (vec2) or world position (vec3) |
| `width` | `number` | Required | Draw width in pixels |
| `height` | `number` | Required | Draw height in pixels |
| `tint` | `color` | White | Optional color tint |
| `is_for_window` | `boolean` | `false` | Set true if drawing inside a custom window |
| `opts` | `icons_helper_draw_opts` | `nil` | Optional drawing options |

Returns

- `boolean` - True if the icon was drawn successfully

Description

Draws a WoW icon resolved dynamically from a spell ID. On the first call, the helper scrapes the spell's Wowhead page to discover the icon name, then delegates to `draw_icon` for the actual download and rendering. The spell-to-icon mapping is cached to disk so subsequent launches skip the Wowhead lookup entirely.

This is the easiest way to draw spell icons when you only have the spell ID and don't want to manually look up icon names.

**Example Usage**

```lua
local vec2 = require("common/geometry/vector_2")
local icons = require("common/utility/icons_helper")
local color = require("common/color")

local function on_render()
    -- Spell 100 = Charge -> resolves to "ability_warrior_charge"
    icons:draw_spell_icon(
        100,                     -- Spell ID
        vec2.new(30, 30),        -- Screen position
        64, 64,                  -- Size
        color.white(255),        -- Tint
        false,                   -- Not in a window
        {
            size = "large",
            persist_to_disk = true
        }
    )
end

core.register_on_render_callback(on_render)
```

---

### `icons:get_spell_icon_name`

Syntax

```lua
icons:get_spell_icon_name(spell_id: number): string|nil
```

**Parameters**

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `spell_id` | `number` | Required | WoW spell ID |

Returns

- `string|nil` - The Zamimg icon file stem (e.g., `"ability_warrior_charge"` ), or `nil` if not yet resolved

Description

Resolves a spell ID to its icon name without drawing anything. Returns the icon name immediately if already cached, or `nil` if the Wowhead lookup is still in progress. Triggers the background lookup automatically on first call.

This is useful when you need the icon name for your own logic (e.g., building a dynamic icon list) rather than drawing directly.

**Example Usage**

```lua
local icons = require("common/utility/icons_helper")

local function on_update()
    local name = icons:get_spell_icon_name(100)
    if name then
        -- name == "ability_warrior_charge"
        core.log("Resolved icon: " .. name)
    end
end

core.register_on_update_callback(on_update)
```

---

### `icons:clear_cache`

Syntax

```lua
icons:clear_cache(): nil
```

Description

Clears the in-memory icon cache, including resolved spell icon mappings. Does not delete disk-cached icons or the spell-to-icon mapping file. Useful if you need to force re-download of icons.

**Example Usage**

```lua
local icons = require("common/utility/icons_helper")

-- Clear memory cache (disk cache remains)
icons:clear_cache()
```

---

## Constants

The icons helper exposes several constants:

| Constant | Type | Description |
| --- | --- | --- |
| `ZAMIMG_BASE` | `string` | Base URL for Wowhead's icon CDN |
| `DEFAULT_SIZE` | `string` | Default icon size (`"large"`) |
| `DEFAULT_DISK_CACHE_FOLDER` | `string` | Default cache folder (`"cache\\wowhead_icons"`) |
| `DEFAULT_HTTP_THROTTLE_SECONDS` | `number` | Delay between HTTP requests |
| `DEFAULT_PROBE_THROTTLE_SECONDS` | `number` | Delay between cache probes |
| `WOWHEAD_SPELL_BASE` | `string` | Base URL for Wowhead spell pages |
| `DEFAULT_SPELL_CACHE_FILE` | `string` | Disk path for spell-to-icon mappings |
| `MAX_REDIRECTS` | `number` | Maximum HTTP redirects to follow |

> [!WARNING]
> `WOWHEAD_SPELL_BASE` points at the Wowhead site for your game version: Classic on Classic Era, TBC on TBC Classic, WotLK on Titan (China), MoP Classic on MoP Classic, and the Retail site on Retail and Forever. `draw_spell_icon` and `get_spell_icon_name` resolve spell ids on that site.

---

## Types

### `icons_helper_draw_opts`

Options for customizing icon drawing behavior.

```lua
{
    size?: string,              -- "large" | "medium" | "small"
    persist_to_disk?: boolean,  -- Save to disk cache (default: true)
    disk_cache_folder?: string  -- Custom cache folder path
}
```

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `size` | `string` | `"large"` | Icon size: `"large"` (56px), `"medium"` (36px), or `"small"` (18px) |
| `persist_to_disk` | `boolean` | `true` | Whether to save downloaded icons to disk |
| `disk_cache_folder` | `string` | `"cache\\wowhead_icons"` | Folder in `scripts_data/` for disk cache |

### `icons_helper_icon_entry`

Internal cache entry for icons.

| Field | Type | Description |
| --- | --- | --- |
| `key` | `string` | Cache key |
| `name` | `string` | Icon name |
| `size` | `string` | Icon size |
| `url_jpg` | `string` | JPG download URL |
| `url_png` | `string` | PNG download URL |
| `tex_id` | `integer\|nil` | GPU texture ID |
| `w` | `integer\|nil` | Texture width |
| `h` | `integer\|nil` | Texture height |
| `requested` | `boolean` | True if download initiated |
| `error` | `string\|nil` | Error message if failed |
| `dead` | `boolean` | True if loading failed permanently |

---

## Complete Examples

### Example 1: Basic Icon Drawing

```lua
local vec2 = require("common/geometry/vector_2")
local icons = require("common/utility/icons_helper")
local color = require("common/color")

local function on_render()
    -- Draw a warlock class icon
    icons:draw_icon(
        "classicon-warlock",
        vec2.new(30, 30),
        64, 64,
        color.white(255),
        false,
        {
            size = "large",
            persist_to_disk = true
        }
    )
end

core.register_on_render_callback(on_render)
```

### Example 2: World Position Icon

```lua
local vec3 = require("common/geometry/vector_3")
local icons = require("common/utility/icons_helper")

local function on_render()
    -- Draw icon at a 3D world position (auto world-to-screen)
    local world_pos = vec3.new(123.0, 456.0, 78.0)
    icons:draw_icon(
        "classicon-warlock",
        world_pos,
        32, 32
    )
end

core.register_on_render_callback(on_render)
```

### Example 3: Multiple Class Icons

```lua
local vec2 = require("common/geometry/vector_2")
local icons = require("common/utility/icons_helper")
local color = require("common/color")

local class_icons = {
    "classicon-warrior",
    "classicon-paladin",
    "classicon-hunter",
    "classicon-rogue",
    "classicon-priest",
    "classicon-deathknight",
    "classicon-shaman",
    "classicon-mage",
    "classicon-warlock",
    "classicon-monk",
    "classicon-druid",
    "classicon-demonhunter",
    "classicon-evoker"
}

local function on_render()
    for i, icon_name in ipairs(class_icons) do
        local x = 30 + ((i - 1) % 5) * 40
        local y = 30 + math.floor((i - 1) / 5) * 40
        
        icons:draw_icon(
            icon_name,
            vec2.new(x, y),
            36, 36,
            color.white(255),
            false,
            { size = "medium" }
        )
    end
end

core.register_on_render_callback(on_render)
```

### Example 4: Spell Icons for Rotation Display

```lua
local vec2 = require("common/geometry/vector_2")
local icons = require("common/utility/icons_helper")
local color = require("common/color")

-- Common mage spell icons
local spell_icons = {
    { name = "spell_fire_fireball02", label = "Fireball" },
    { name = "spell_fire_firebolt02", label = "Fire Blast" },
    { name = "ability_mage_hotstreak", label = "Hot Streak" },
    { name = "spell_fire_flamebolt", label = "Pyroblast" },
}

local function on_render()
    local base_x, base_y = 100, 100
    
    for i, spell in ipairs(spell_icons) do
        local x = base_x + (i - 1) * 50
        
        -- Draw icon
        icons:draw_icon(
            spell.name,
            vec2.new(x, base_y),
            44, 44,
            color.white(255),
            false,
            { size = "large" }
        )
    end
end

core.register_on_render_callback(on_render)
```

### Example 5: Dynamic Spell Icons by ID

```lua
local vec2 = require("common/geometry/vector_2")
local icons = require("common/utility/icons_helper")
local color = require("common/color")

-- No need to know icon names - just use spell IDs!
local warrior_spells = {
    100,    -- Charge
    1680,   -- Whirlwind
    12294,  -- Mortal Strike
    167105, -- Colossus Smash
    227847, -- Bladestorm
}

local function on_render()
    for i, spell_id in ipairs(warrior_spells) do
        local x = 30 + (i - 1) * 50
        
        icons:draw_spell_icon(
            spell_id,
            vec2.new(x, 30),
            44, 44,
            color.white(255),
            false,
            { size = "large", persist_to_disk = true }
        )
    end
end

core.register_on_render_callback(on_render)
```

### Example 6: Resolve Icon Name for Custom Logic

```lua
local icons = require("common/utility/icons_helper")

-- Build a lookup table of spell_id -> icon_name
local spell_ids = { 100, 1680, 12294 }
local resolved = {}

local function on_update()
    for _, id in ipairs(spell_ids) do
        if not resolved[id] then
            local name = icons:get_spell_icon_name(id)
            if name then
                resolved[id] = name
                core.log("Spell " .. id .. " -> " .. name)
            end
        end
    end
end

core.register_on_update_callback(on_update)
```

---

## Finding Icon Names

To find the correct icon name for a spell, item, or ability:

1. Go to [Wowhead](https://www.wowhead.com)
2. Search for the spell/item/ability
3. Look at the icon on the page
4. Right-click the icon and "Copy image address"
5. The icon name is the last part of the URL (before the extension)

For example:

- URL: `https://wow.zamimg.com/images/wow/icons/large/spell_fire_fireball02.jpg`
- Icon name: `spell_fire_fireball02`

Alternatively, browse the [Wowhead Icon Database](https://www.wowhead.com/icons) to search icons by name.

> [!TIP]
> If you already have the spell ID, use `draw_spell_icon` or `get_spell_icon_name` to resolve the icon automatically - no need to look it up on Wowhead manually!