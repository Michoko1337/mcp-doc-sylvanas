# Icons Playground Example (IZI SDK)

> Source: <https://docs.project-sylvanas.net/examples/izi/icons-example-izi>

This example demonstrates how to download and display World of Warcraft icons using the **IZI SDK**. We'll fetch icons directly from Wowhead/Zamimg with automatic caching - all through the unified IZI interface.

*The plugin displays three WoW icons downloaded from Wowhead - a warlock class icon, a food item icon, and a warrior class icon loaded via direct URL. This version uses the streamlined IZI SDK API.*

## What You'll Learn

- How to use the IZI SDK for icon loading ( `izi.draw_icon` )
- Creating vectors with `izi.vec2()` helper
- Configuring icon size and disk persistence
- Using direct URLs for custom icon sources
- The benefits of the unified IZI SDK approach

## Plugin Structure

### header.lua

```lua
local plugin = {}

plugin.name = "Icons Playground (IZI)"
plugin.version = "1.0.0"
plugin.author = "Silvi"
plugin.load = true

local local_player = core.object_manager.get_local_player()

if not local_player or not local_player:is_valid() then
    plugin.load = false
    return plugin
end

return plugin
```

### main.lua

```lua
--[[
    Icons Playground (IZI) - WoW icon loading with IZI SDK
    
    This plugin shows how to:
        - Download WoW icons from Wowhead/Zamimg using izi.draw_icon
        - Use izi.vec2() for position vectors
        - Configure icon sizes and disk persistence
        - Use direct URLs for custom icon sources
    
    Notes:
        - First run downloads icons from the internet
        - Subsequent runs reuse cached texture IDs
        - If persist_to_disk=true, icons are saved to scripts_data/cache/wowhead_icons/
    
    Author: Silvi
]]

-- ============================================================================
-- DEPENDENCIES
-- ============================================================================

local izi = require("common/izi_sdk")
local color = require("common/color")

-- ============================================================================
-- RENDER CALLBACK
-- ============================================================================

local function on_render()
    -- 1) Simple draw by Wowhead slug
    izi.draw_icon(
        "classicon-warlock",    -- Wowhead icon slug
        izi.vec2(30, 30),       -- Screen position using IZI helper
        64, 64,                 -- Width, height
        color.purple(),         -- Tint color
        false,                  -- is_for_window
        {
            size = "large",           -- Icon size: "small", "medium", "large"
            persist_to_disk = true,   -- Save to disk for offline use
        }
    )

    -- 2) Another icon by slug
    izi.draw_icon(
        "inv_misc_food_72",
        izi.vec2(110, 30),
        64, 64,
        color.yellow(),
        false,
        {
            size = "large",
            persist_to_disk = true,
        }
    )

    -- 3) Direct URL mode (advanced)
    izi.draw_icon(
        "https://wow.zamimg.com/images/wow/icons/large/classicon_warrior.jpg",
        izi.vec2(190, 30),
        64, 64,
        color.red(),
        false,
        {
            persist_to_disk = false,  -- Don't save URL-based icons
        }
    )
end

-- ============================================================================
-- REGISTER CALLBACKS
-- ============================================================================

core.register_on_render_callback(on_render)
```

## Code Breakdown

### 1. Importing IZI SDK

```lua
local izi = require("common/izi_sdk")
local color = require("common/color")
```

The IZI SDK provides a unified interface that wraps multiple helper libraries. Instead of importing `icons_helper` and `vec2` separately, you get everything through the `izi` object.

### 2. IZI vs Direct Helper Comparison

| Task | Direct Helper | IZI SDK |
| --- | --- | --- |
| Import | `require("common/utility/icons_helper")` | `require("common/izi_sdk")` |
| Create vec2 | `vec2.new(30, 30)` | `izi.vec2(30, 30)` |
| Draw icon | `icons_helper:draw_icon(...)` | `izi.draw_icon(...)` |

### 3. Drawing Icons by Slug

```lua
izi.draw_icon(
    "classicon-warlock",    -- Wowhead icon slug
    izi.vec2(30, 30),       -- Screen position
    64, 64,                 -- Width, height
    color.purple(),         -- Tint color
    false,                  -- is_for_window
    {
        size = "large",
        persist_to_disk = true,
    }
)
```

**Parameters are identical to icons_helper** - IZI just provides a cleaner access pattern without needing the colon (`:`) method syntax.

### 4. Creating Vectors with izi.vec2

```lua
-- IZI SDK style (cleaner)
izi.vec2(30, 30)

-- Direct style (requires separate import)
local vec2 = require("common/geometry/vector_2")
vec2.new(30, 30)
```

`izi.vec2()` is a convenience wrapper that creates vec2 objects without needing a separate require statement.

### 5. Icon Size Options

```lua
{
    size = "large",  -- Options: "small", "medium", "large"
}
```

| Size | Dimensions | Use Case |
| --- | --- | --- |
| `"small"` | 18x18 | Compact UI, lists |
| `"medium"` | 36x36 | Buttons, tooltips |
| `"large"` | 56x56 | Featured icons, spell bars |

### 6. Disk Persistence

```lua
{
    persist_to_disk = true,  -- Save downloaded icons locally
}
```

When enabled, icons are saved to `scripts_data/cache/wowhead_icons/` for offline use and faster loading on subsequent runs.

### 7. Direct URL Mode

```lua
izi.draw_icon(
    "https://wow.zamimg.com/images/wow/icons/large/classicon_warrior.jpg",
    izi.vec2(190, 30),
    64, 64,
    color.red(),
    false,
    {
        persist_to_disk = false,
    }
)
```

URLs starting with `http://` or `https://` are automatically detected and fetched directly instead of constructing a Wowhead URL from the slug.

## IZI SDK Icon API Reference

### Functions

| Function | Description |
| --- | --- |
| `izi.draw_icon(name_or_url, pos, w, h, color, is_window, options)` | Download and draw a WoW icon |
| `izi.vec2(x, y)` | Create a vec2 position |
| `izi.print(...)` | Debug logging with auto-concatenation |

### Options Table

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `size` | string | `"large"` | Icon size: `"small"`, `"medium"`, `"large"` |
| `persist_to_disk` | boolean | `false` | Save downloaded icons locally |

### Why Use IZI SDK?

1. **Single Import** - One `require` instead of many
2. **Consistent API** - All functions accessed the same way
3. **No Colon Syntax** - `izi.func()` instead of `helper:func()`
4. **Convenience Helpers** - `izi.vec2()` , `izi.print()` , etc.
5. **Battle-Tested** - Used by official rotation plugins

## Finding Icon Slugs

### Common Class Icons

```lua
-- Class icons
"classicon-warrior"
"classicon-paladin"
"classicon-hunter"
"classicon-rogue"
"classicon-priest"
"classicon-deathknight"
"classicon-shaman"
"classicon-mage"
"classicon-warlock"
"classicon-monk"
"classicon-druid"
"classicon-demonhunter"
"classicon-evoker"
```

### Finding Other Icons

1. **Wowhead Search** - Search for spells/items on Wowhead
2. **URL Inspection** - Look at icon URLs in page source
3. **Direct Browse** - Visit `https://wow.zamimg.com/images/wow/icons/large/`

## Customization

### Building a Spell Bar with IZI

```lua
local izi = require("common/izi_sdk")
local color = require("common/color")

local spells = {
    { slug = "spell_fire_fireball", id = 133 },
    { slug = "spell_fire_pyroblast", id = 11366 },
    { slug = "spell_fire_flamestrike", id = 2120 },
}

local function draw_spell_bar()
    local start_x = 100
    local y = 500
    local icon_size = 48
    local padding = 4
    
    for i, spell in ipairs(spells) do
        local x = start_x + (i - 1) * (icon_size + padding)
        
        -- Check cooldown for tint
        local cd = core.spell_book.get_spell_cooldown(spell.id)
        local tint = cd > 0 and color.new(100, 100, 100, 255) or color.white()
        
        izi.draw_icon(
            spell.slug,
            izi.vec2(x, y),
            icon_size, icon_size,
            tint,
            false,
            { size = "large", persist_to_disk = true }
        )
    end
end
```

### Combining with Other IZI Features

```lua
local izi = require("common/izi_sdk")

local function on_render()
    -- Draw multiple icons
    izi.draw_icon("classicon-mage", izi.vec2(10, 10), 48, 48, color.white(), false, {
        size = "large",
        persist_to_disk = true
    })
    
    -- Draw a local texture
    izi.draw_local_texture("ui\\frame.png", izi.vec2(0, 0), 100, 100, color.white(), false)
    
    -- Debug
    izi.print("Icons rendered!")
end
```

### Preloading Icons with IZI

```lua
local izi = require("common/izi_sdk")

local icons_to_preload = {
    "classicon-warrior",
    "classicon-mage",
    "classicon-priest",
}

local preload_done = false

local function preload_icons()
    if preload_done then return end
    
    for _, slug in ipairs(icons_to_preload) do
        izi.draw_icon(slug, izi.vec2(-100, -100), 1, 1, color.white(), false, {
            size = "large",
            persist_to_disk = true
        })
    end
    
    preload_done = true
end
```

## Related Documentation

- [IZI SDK Reference](/dev/libraries/izi) - Complete IZI SDK documentation
- [IZI Graphics](/dev/libraries/izi/graphics) - Graphics functions in IZI
- [Icons Helper API](/dev/api/icons-helper) - Underlying icons_helper reference
- [HTTP API](/dev/api/core#http) - Understanding async downloads

## Tips

> [!TIP]
> The IZI SDK is the recommended way to access helper libraries. It provides a cleaner API and is actively maintained alongside the core rotation plugins.

> [!WARNING]
> On the first frame an icon is requested, it may not appear while downloading. The icon will show on subsequent frames. Consider preloading critical icons during initialization.

> [!INFO]
> `izi.draw_icon()` uses `icons_helper` internally. The download logic, caching, and GPU upload behavior is identical - IZI just provides a nicer interface.

> [!TIP]
> Always use `persist_to_disk = true` for icons you use frequently. This makes your plugin work offline and reduces Wowhead server load.

## Conclusion

This example demonstrates WoW icon loading using the IZI SDK, which provides a cleaner and more convenient API compared to using helper libraries directly. By unifying multiple utilities under a single import, IZI makes your code more readable and maintainable.

**Key Takeaways:**

- **Single Import** - `require("common/izi_sdk")` gives you everything
- **Clean Syntax** - `izi.draw_icon()` instead of `icons_helper:draw_icon()`
- **Helper Functions** - `izi.vec2()` simplifies position creation
- **Same Power** - All features of icons_helper available through IZI
- **Recommended Approach** - IZI SDK is the standard for plugin development
- **Disk Persistence** - Use `persist_to_disk = true` for offline support

---

For new plugins, we recommend using the IZI SDK approach shown here. It's cleaner, more consistent, and matches the style used by official rotation plugins.