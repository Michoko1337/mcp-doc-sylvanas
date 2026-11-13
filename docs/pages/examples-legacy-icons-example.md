# Icons Playground Example

> Source: <https://docs.project-sylvanas.net/examples/legacy/icons-example>

This example demonstrates how to download and display World of Warcraft icons using the `icons_helper` utility library. We'll fetch icons directly from Wowhead/Zamimg with automatic caching support.

*The plugin displays three WoW icons downloaded from Wowhead - a warlock class icon, a food item icon, and a warrior class icon loaded via direct URL.*

## What You'll Learn

- How to use the `icons_helper` utility library for WoW icon loading
- Downloading icons by Wowhead slug name
- Using direct URLs for custom icon sources
- Configuring icon size (small, medium, large)
- Persisting downloaded icons to disk for offline use
- Understanding the download and caching system

## Plugin Structure

### header.lua

```lua
local plugin = {}

plugin.name = "Icons Playground"
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
    Icons Playground - Demonstrating icons_helper usage
    
    This plugin shows how to:
        - Download WoW icons from Wowhead/Zamimg by name
        - Use direct URLs for icon loading
        - Configure icon sizes (small, medium, large)
        - Persist icons to disk for caching
        - Apply color tinting to icons
    
    Notes:
        - First run downloads icons from the internet
        - Subsequent runs reuse cached texture IDs
        - If persist_to_disk=true, icons are saved to scripts_data/cache/wowhead_icons/
    
    Author: Silvi
]]

-- ============================================================================
-- DEPENDENCIES
-- ============================================================================

local vec2 = require("common/geometry/vector_2")
local color = require("common/color")
local icons_helper = require("common/utility/icons_helper")

-- ============================================================================
-- RENDER CALLBACK
-- ============================================================================

local function on_render()
    -- 1) Draw icon by Wowhead slug name
    icons_helper:draw_icon(
        "classicon-warlock",    -- Wowhead icon slug
        vec2.new(30, 30),       -- Screen position
        64, 64,                 -- Width, height
        color.purple(),         -- Tint color
        false,                  -- is_for_window
        {
            size = "large",           -- Icon size: "small", "medium", or "large"
            persist_to_disk = true,   -- Save to disk for offline use
        }
    )

    -- 2) Draw another icon by slug
    icons_helper:draw_icon(
        "inv_misc_food_72",
        vec2.new(110, 30),
        64, 64,
        color.yellow(),
        false,
        {
            size = "large",
            persist_to_disk = true,
        }
    )

    -- 3) Draw icon using direct URL (advanced)
    icons_helper:draw_icon(
        "https://wow.zamimg.com/images/wow/icons/large/classicon_warrior.jpg",
        vec2.new(190, 30),
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

### 1. Importing icons_helper

```lua
local icons_helper = require("common/utility/icons_helper")
```

The `icons_helper` library provides a simple interface to:

- Download WoW icons from Wowhead/Zamimg
- Cache downloaded icons in memory
- Optionally persist icons to disk
- Handle network errors gracefully

### 2. Drawing Icons by Slug Name

```lua
icons_helper:draw_icon(
    "classicon-warlock",    -- Icon slug from Wowhead
    vec2.new(30, 30),       -- Screen position
    64, 64,                 -- Width, height
    color.purple(),         -- Tint color
    false,                  -- is_for_window
    {
        size = "large",
        persist_to_disk = true,
    }
)
```

**The icon slug** is the name used in Wowhead URLs. For example:

- `https://wow.zamimg.com/images/wow/icons/large/classicon_warlock.jpg`
- The slug is `classicon-warlock` (use hyphens, not underscores)

**Common icon slug patterns:**

| Pattern | Example | Description |
| --- | --- | --- |
| `classicon-{class}` | `classicon-warlock` | Class icons |
| `inv_misc_{type}_{id}` | `inv_misc_food_72` | Inventory items |
| `spell_{school}_{name}` | `spell_fire_fireball` | Spell icons |
| `ability_{class}_{name}` | `ability_warrior_charge` | Ability icons |

### 3. Icon Size Options

```lua
{
    size = "large",  -- Options: "small", "medium", "large"
}
```

| Size | Dimensions | Use Case |
| --- | --- | --- |
| `"small"` | 18x18 | Compact UI elements, lists |
| `"medium"` | 36x36 | Standard buttons, tooltips |
| `"large"` | 56x56 | Featured icons, spell bars |

> [!TIP]
> Request the size closest to your display size. Downloading a `large` icon and scaling it down wastes bandwidth, while scaling up a `small` icon looks blurry.

### 4. Disk Persistence

```lua
{
    persist_to_disk = true,  -- Save downloaded icons locally
}
```

When `persist_to_disk` is `true`:

- Icons are saved to `scripts_data/cache/wowhead_icons/`
- Future requests load from disk instead of downloading
- Works offline after first download
- Reduces bandwidth and load times

**Cache location:**

```text
scripts_data/
└── cache/
    └── wowhead_icons/
        ├── classicon-warlock_large.jpg
        ├── inv_misc_food_72_large.jpg
        └── ...
```

### 5. Direct URL Mode

```lua
icons_helper:draw_icon(
    "https://wow.zamimg.com/images/wow/icons/large/classicon_warrior.jpg",
    vec2.new(190, 30),
    64, 64,
    color.red(),
    false,
    {
        persist_to_disk = false,  -- Usually false for direct URLs
    }
)
```

**Direct URL mode** allows you to:

- Load icons from any URL, not just Wowhead
- Access specific icon variations
- Load custom-hosted images

> [!WARNING]
> - The URL is detected automatically (starts with `http://` or `https://` )
> - Persistence uses the URL as the filename, which may cause issues
> - Prefer slug names for standard WoW icons

### 6. Color Tinting

```lua
color.purple()  -- Tint the icon purple
color.yellow()  -- Tint the icon yellow
color.red()     -- Tint the icon red
color.white()   -- No tint (original colors)
```

Tinting multiplies the icon's colors by the tint color. Use this for:

- Indicating states (enabled/disabled)
- Matching your UI color scheme
- Creating visual feedback

## icons_helper API Reference

### Main Function

```lua
icons_helper:draw_icon(
    name_or_url,    -- string: Wowhead slug or direct URL
    position,       -- vec2: Screen position
    width,          -- number: Display width
    height,         -- number: Display height
    tint_color,     -- color: Color tint (use white for no tint)
    is_for_window,  -- boolean: true for ImGui window, false for background
    options         -- table: Configuration options
)
```

### Options Table

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `size` | string | `"large"` | Icon size: `"small"`, `"medium"`, `"large"` |
| `persist_to_disk` | boolean | `false` | Save downloaded icons locally |

### How the Download Flow Works

```text
Request "classicon-warlock"
         │
         ▼
    ┌─────────────────┐
    │ Check GPU cache │
    └────────┬────────┘
             │
      Cached? ───Yes──► Draw immediately
             │
            No
             │
             ▼
    ┌─────────────────┐
    │ Check disk cache│ (if persist_to_disk was used before)
    └────────┬────────┘
             │
      Found? ───Yes──► Load from disk ──► Upload to GPU ──► Draw
             │
            No
             │
             ▼
    ┌─────────────────┐
    │ Download from   │
    │ Wowhead/Zamimg  │
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │ Save to disk    │ (if persist_to_disk = true)
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │ Upload to GPU   │
    │ Cache tex_id    │
    │ Draw            │
    └─────────────────┘
```

## Finding Icon Slugs

### Method 1: Wowhead Search

1. Go to [Wowhead](https://www.wowhead.com)
2. Search for a spell, item, or ability
3. Look at the icon URL in the page source or by right-clicking the icon
4. Extract the slug from the URL

### Method 2: Common Patterns

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

-- Specialization icons (examples)
"spell_holy_holybolt"           -- Holy Paladin
"spell_nature_lightningshield"  -- Enhancement Shaman
"spell_fire_firebolt02"         -- Fire Mage
```

### Method 3: Zamimg Direct Browse

Visit `https://wow.zamimg.com/images/wow/icons/large/` and browse available icons.

## Customization

### Creating an Icon Button

```lua
local button_icons = {
    normal = "ability_warrior_charge",
    hover = "ability_warrior_charge",  -- Could use a different icon
    pressed = "ability_warrior_charge",
}

local function draw_icon_button(icon_slug, pos, size, is_hovered, is_pressed)
    local tint = color.white()
    
    if is_pressed then
        tint = color.new(150, 150, 150, 255)  -- Darker when pressed
    elseif is_hovered then
        tint = color.new(255, 255, 200, 255)  -- Brighter when hovered
    end
    
    icons_helper:draw_icon(
        icon_slug,
        pos,
        size, size,
        tint,
        false,
        { size = "large", persist_to_disk = true }
    )
end
```

### Building a Spell Bar

```lua
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
        
        icons_helper:draw_icon(
            spell.slug,
            vec2.new(x, y),
            icon_size, icon_size,
            tint,
            false,
            { size = "large", persist_to_disk = true }
        )
    end
end
```

### Preloading Icons

```lua
-- Preload during initialization to avoid first-frame delays
local icons_to_preload = {
    "classicon-warrior",
    "classicon-mage",
    "classicon-priest",
}

local preload_done = false

local function preload_icons()
    if preload_done then return end
    
    for _, slug in ipairs(icons_to_preload) do
        -- Draw off-screen to trigger download
        icons_helper:draw_icon(
            slug,
            vec2.new(-100, -100),  -- Off-screen
            1, 1,
            color.white(),
            false,
            { size = "large", persist_to_disk = true }
        )
    end
    
    preload_done = true
end
```

## Related Documentation

- [Icons Helper API](/dev/api/icons-helper) - Complete API reference
- [Assets Helper](/dev/api/assets-helper) - Local texture loading
- [Graphics API](/dev/api/graphics) - Low-level drawing functions
- [Color API](/dev/api/color) - Color creation and manipulation
- [HTTP API](/dev/api/core#http) - Understanding async downloads

## Tips

> [!TIP]
> Always use `persist_to_disk = true` for icons you use frequently. This makes your plugin work offline and reduces Wowhead server load.

> [!WARNING]
> On the first frame an icon is requested, it may not appear while downloading. The icon will show on subsequent frames once the download completes. Consider preloading critical icons.

> [!INFO]
> icons_helper requires an internet connection for the initial download. If you need guaranteed offline support, use [assets_helper](/dev/api/assets-helper) with bundled assets instead.

> [!TIP]
> Wowhead slugs use **hyphens** (`classicon-warlock`), but the actual filenames on Zamimg use **underscores** (`classicon_warlock.jpg`). The icons_helper handles this conversion automatically.

## Conclusion

This Icons Playground example demonstrates how easy it is to add WoW icons to your plugins using the `icons_helper` utility library. By handling downloads, caching, and GPU upload automatically, it lets you display professional-looking icons with just a single function call.

**Key Takeaways:**

- **Simple API** - Just call `draw_icon()` with a slug name and position
- **Automatic Downloads** - Icons are fetched from Wowhead/Zamimg automatically
- **Memory Caching** - Downloaded icons are reused every frame without re-downloading
- **Disk Persistence** - Optionally save icons for offline use
- **Size Options** - Choose small, medium, or large based on your display needs
- **Direct URL Support** - Load custom icons from any URL when needed
- **Color Tinting** - Apply tints to indicate states or match your UI theme

---

I hope this example helps you add beautiful WoW icons to your plugins! The icons_helper library makes it trivial to access thousands of game icons without bundling them yourself.