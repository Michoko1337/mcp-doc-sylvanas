# IZI - Graphics

> Source: <https://docs.project-sylvanas.net/dev/libraries/izi/graphics>

## Overview

The IZI Graphics system provides utilities for loading and drawing textures, icons, and other visual assets. Whether you need to display WoW ability icons, custom images, or data loaded from the web, these functions make visual customization straightforward.

**Key Features:**

- **Local Textures** - Draw images from local files or ZIP packs
- **HTTP Textures** - Load and display images from URLs
- **Icon Helpers** - Easy WoW icon display by name or URL
- **Spell ID Icons** - Dynamically resolve and draw icons from spell IDs
- **ZIP Pack Support** - Register and use bundled asset packs
- **Data Loading** - Load text/JSON data from files or HTTP
- **Caching** - Automatic caching for performance

---

## ZIP Packs

### `izi.register_zip_pack`

Syntax

```lua
izi.register_zip_pack(folder_name: string, zip_url: string, zip_file_name?: string): nil
```

**Parameters**

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `folder_name` | `string` | required | Virtual folder name for the pack |
| `zip_url` | `string` | required | URL to download the ZIP from |
| `zip_file_name` | `string` | `nil` | Optional override for local filename |

Description

Registers a ZIP asset pack. The pack will be automatically downloaded if not present locally. Once registered, you can access files within the pack using the folder name prefix.

**Example Usage**

```lua
local izi = require("common/izi_sdk")

-- Register a custom icon pack
izi.register_zip_pack("my_icons", "ps/12345-my_icons.zip")

-- Now you can draw textures from it
izi.draw_local_texture(
    "my_icons\\classicon_warrior.png",
    izi.vec2(100, 100),
    64, 64
)
```

---

## Drawing Textures

### `izi.draw_local_texture`

Syntax

```lua
izi.draw_local_texture(
    data_path: string, 
    position: vec2|vec3, 
    width: number, 
    height: number, 
    tint?: color, 
    is_for_window?: boolean
): boolean
```

**Parameters**

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `data_path` | `string` | required | Path relative to scripts_data folder (or ZIP virtual path) |
| `position` | `vec2\|vec3` | required | Screen position (vec2) or world position (vec3) |
| `width` | `number` | required | Display width in pixels |
| `height` | `number` | required | Display height in pixels |
| `tint` | `color` | `white` | Optional color tint |
| `is_for_window` | `boolean` | `false` | True if drawing inside a window context |

Returns

- `boolean` - True if the texture was successfully drawn

Description

Draws a texture from a local file or registered ZIP pack. Supports PNG, JPG, and other common image formats. When a vec3 is provided, the position is automatically converted from world to screen coordinates.

**Example Usage**

```lua
local izi = require("common/izi_sdk")
local color = izi.color

-- Draw a local texture at screen position
izi.draw_local_texture(
    "my_assets\\icon.png",
    izi.vec2(30, 30),
    64, 64,
    color.white(255)
)

-- Draw with a red tint
izi.draw_local_texture(
    "my_assets\\warning.png",
    izi.vec2(100, 30),
    32, 32,
    color.red()
)

-- Draw from a ZIP pack
izi.draw_local_texture(
    "zip_test_assets\\classicon_paladin.png",
    izi.vec2(200, 30),
    64, 64
)

-- Draw at a world position (follows unit in 3D space)
local target = izi.target()
if target then
    local world_pos = target:get_position()
    izi.draw_local_texture(
        "my_assets\\marker.png",
        world_pos,
        32, 32
    )
end
```

---

### `izi.draw_http_texture`

Syntax

```lua
izi.draw_http_texture(
    url: string, 
    position: vec2|vec3, 
    width: number, 
    height: number, 
    cache_path?: string, 
    headers?: table, 
    tint?: color, 
    is_for_window?: boolean
): boolean
```

**Parameters**

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `url` | `string` | required | URL to load the image from |
| `position` | `vec2\|vec3` | required | Screen or world position |
| `width` | `number` | required | Display width in pixels |
| `height` | `number` | required | Display height in pixels |
| `cache_path` | `string` | `nil` | Optional local cache path |
| `headers` | `table` | `nil` | Optional HTTP headers |
| `tint` | `color` | `white` | Optional color tint |
| `is_for_window` | `boolean` | `false` | True if drawing inside a window |

Returns

- `boolean` - True if the texture was successfully drawn

Description

Loads and draws a texture from an HTTP URL. The image is cached after the first download for performance. Use `cache_path` to specify where the cached file should be stored.

**Example Usage**

```lua
local izi = require("common/izi_sdk")

-- Draw an image from the web
izi.draw_http_texture(
    "ps/some_image.png",
    izi.vec2(200, 30),
    64, 64
)

-- With custom headers (e.g., for authenticated APIs)
izi.draw_http_texture(
    "https://api.example.com/icon.png",
    izi.vec2(300, 30),
    64, 64,
    "cached_icon.png",  -- Cache locally
    { ["Authorization"] = "Bearer token123" }
)
```

---

## Icons

### `izi.draw_icon`

Syntax

```lua
izi.draw_icon(
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
| `icon_name_or_url` | `string` | required | WoW icon slug or direct URL |
| `position` | `vec2\|vec3` | required | Screen or world position |
| `width` | `number` | required | Display width in pixels |
| `height` | `number` | required | Display height in pixels |
| `tint` | `color` | `white` | Optional color tint |
| `is_for_window` | `boolean` | `false` | True if drawing inside a window |
| `opts` | `table` | `nil` | Additional icon helper options |

**Options Structure: `icons_helper_draw_opts`**

```lua
{
    size?: string,            -- "small", "medium", "large" (for Wowhead icons)
    persist_to_disk?: boolean -- Cache to disk for faster loading
}
```

Returns

- `boolean` - True if the icon was successfully drawn

Description

Draws a WoW icon by its Wowhead slug name or a direct URL. This is the easiest way to display spell/item icons without managing textures manually.

**Common Icon Format**

- Class icons: `classicon-warrior` , `classicon-mage` , `classicon-paladin`
- Spell icons: Use the spell's icon name from Wowhead (e.g., `spell_frost_frostbolt` )
- Item icons: Use the item's icon name (e.g., `inv_misc_food_72` )

**Example Usage**

```lua
local izi = require("common/izi_sdk")
local color = izi.color

-- Draw by Wowhead slug name
izi.draw_icon(
    "classicon-warlock",
    izi.vec2(300, 30),
    64, 64,
    color.purple()
)

-- Draw a spell icon
izi.draw_icon(
    "spell_frost_frostbolt",
    izi.vec2(400, 30),
    48, 48
)

-- Draw by direct URL
izi.draw_icon(
    "https://wow.zamimg.com/images/wow/icons/large/classicon_warrior.jpg",
    izi.vec2(500, 30),
    64, 64,
    color.red()
)

-- With options
izi.draw_icon(
    "ability_rogue_shadowstep",
    izi.vec2(600, 30),
    64, 64,
    nil,  -- no tint
    false,
    { size = "large", persist_to_disk = true }
)

-- Draw icon at a world position (follows target)
local target = izi.target()
if target then
    izi.draw_icon(
        "spell_shadow_shadowbolt",
        target:get_position(),
        32, 32
    )
end
```

---

### `izi.draw_spell_icon`

Syntax

```lua
izi.draw_spell_icon(
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
| `spell_id` | `number` | required | WoW spell ID (e.g., `100` for Charge) |
| `position` | `vec2\|vec3` | required | Screen or world position |
| `width` | `number` | required | Display width in pixels |
| `height` | `number` | required | Display height in pixels |
| `tint` | `color` | `white` | Optional color tint |
| `is_for_window` | `boolean` | `false` | True if drawing inside a window |
| `opts` | `table` | `nil` | Additional icon helper options |

Returns

- `boolean` - True if the icon was successfully drawn

Description

Draws a WoW icon resolved dynamically from a spell ID. On the first call, the helper scrapes the spell's Wowhead page to discover the icon name, then downloads and renders the icon via the Zamimg CDN. Both the spell-to-icon mapping and the icon image are cached to disk, so subsequent launches are instant.

This is the easiest way to draw spell icons when you only have the spell ID — no need to manually look up icon names on Wowhead.

**Example Usage**

```lua
local izi = require("common/izi_sdk")
local color = izi.color

-- Draw Charge icon by spell ID - no need to know the icon name!
izi.draw_spell_icon(
    100,                    -- Spell ID (Charge)
    izi.vec2(30, 30),
    64, 64,
    color.white()
)

-- Draw multiple spell icons in a row
local spells = { 100, 1680, 12294, 167105, 227847 }
for i, id in ipairs(spells) do
    izi.draw_spell_icon(
        id,
        izi.vec2(30 + (i - 1) * 50, 30),
        44, 44,
        nil, false,
        { size = "large", persist_to_disk = true }
    )
end

-- Draw at a world position
local target = izi.target()
if target and target:is_casting() then
    local cast_id = target:get_active_cast_or_channel_id()
    izi.draw_spell_icon(
        cast_id,
        target:get_position(),
        32, 32,
        color.red()
    )
end
```

---

### `izi.get_spell_icon_name`

Syntax

```lua
izi.get_spell_icon_name(spell_id: number): string|nil
```

**Parameters**

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `spell_id` | `number` | required | WoW spell ID |

Returns

- `string|nil` - The Zamimg icon file stem (e.g., `"ability_warrior_charge"` ), or `nil` if still resolving

Description

Resolves a spell ID to its icon name without drawing anything. Returns the icon name immediately if already cached, or `nil` if the Wowhead lookup is still in progress. Triggers the background lookup automatically on first call.

This is useful when you need the icon name for your own logic rather than drawing directly.

**Example Usage**

```lua
local izi = require("common/izi_sdk")

-- Resolve the icon name for Charge
local name = izi.get_spell_icon_name(100)
if name then
    izi.print("Charge icon: " .. name)
    -- name == "ability_warrior_charge"
end
```

---

### `izi.clear_icon_cache`

Syntax

```lua
izi.clear_icon_cache(): nil
```

Description

Clears the in-memory icon cache, including resolved spell icon mappings. Useful if you need to force-reload icons or free memory.

**Example Usage**

```lua
local izi = require("common/izi_sdk")

-- Clear all cached icons
izi.clear_icon_cache()
izi.print("Icon cache cleared!")
```

---

## Data Loading

### `izi.load_local_data`

Syntax

```lua
izi.load_local_data(data_path: string, default_value?: string): string
```

**Parameters**

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `data_path` | `string` | required | Path relative to scripts_data folder |
| `default_value` | `string` | `""` | Value to return if file doesn't exist |

Returns

- `string` - The file contents or default value

Description

Loads text data from a local file synchronously. Useful for configuration files, JSON data, or any text content.

**Example Usage**

```lua
local izi = require("common/izi_sdk")

-- Load a JSON config file
local json_str = izi.load_local_data("my_config.json", "{}")

-- Parse if you have a JSON library
-- local config = json.decode(json_str)

-- Load with a complex default
local default_config = [[{
    "enabled": true,
    "threshold": 50
}]]
local config_data = izi.load_local_data("settings.json", default_config)
```

---

### `izi.load_http_data`

Syntax

```lua
izi.load_http_data(
    url: string, 
    callback: function, 
    headers?: table
): nil
```

**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| `url` | `string` | URL to fetch data from |
| `callback` | `function` | Function called when request completes |
| `headers` | `table` | Optional HTTP headers |

**Callback Signature**

```lua
function(
    ok: boolean,           -- True if request succeeded
    data: string,          -- Response body
    http_code: integer,    -- HTTP status code
    content_type: string,  -- Content-Type header
    response_headers: string -- All response headers
)
```

Description

Loads data from an HTTP URL asynchronously. The callback is invoked when the request completes (or fails).

**Example Usage**

```lua
local izi = require("common/izi_sdk")

-- Load JSON data from API
izi.load_http_data("ps/my_data.json", function(ok, data, code, content_type, headers)
    if ok then
        izi.printf("Loaded %d bytes (HTTP %d)", #data, code)
        -- Process data...
    else
        izi.printf("Failed to load data: HTTP %d", code)
    end
end)

-- With custom headers
izi.load_http_data(
    "https://api.example.com/data",
    function(ok, data, code)
        if ok then
            izi.print("API data loaded!")
        end
    end,
    { ["X-API-Key"] = "secret123" }
)
```

---

## Enqueue Render

A delayed render action queue that lets you schedule drawing callbacks that persist across frames. Unlike a one-shot render callback, enqueued actions run for a specified duration (`timespan`) and can optionally be delayed before starting.

`izi.enqueue_render` is **callable** — you can call it directly as a function, and also access sub-methods on it.

---

### `izi.enqueue_render`

Syntax

```lua
izi.enqueue_render(
    fn: function,
    timespan: number,
    layer?: "world"|"overlay",
    delay?: number,
    ...: any
): nil
```

**Parameters**

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `fn` | `function` | required | The render callback to run each frame. Receives any extra args passed after `delay`. |
| `timespan` | `number` | required | How long (in seconds) the callback should keep running. |
| `layer` | `string` | `nil` | Render layer: `"world"` or `"overlay"`. |
| `delay` | `number` | `nil` | Seconds to wait before the action starts rendering. |
| `...` | `any` | — | Extra arguments forwarded to `fn` on each invocation. |

Description

Enqueues a render callback that fires every frame for `timespan` seconds. Optionally delays the start by `delay` seconds. Use this to create timed visual effects — damage splats, highlight flashes, temporary markers — without managing timers yourself.

**Example Usage**

```lua
local izi = require("common/izi_sdk")
local color = izi.color

-- Flash a warning icon at a world position for 3 seconds
local pos = izi.me():get_position()
izi.enqueue_render(function()
    izi.draw_icon("spell_holy_excorcism", pos, 48, 48, color.red())
end, 3.0, "world")

-- Delayed overlay text after 1 second, lasting 2 seconds
izi.enqueue_render(function(msg)
    core.graphics.text_2d(msg, izi.vec2(400, 300), 24, color.green())
end, 2.0, "overlay", 1.0, "Interrupt NOW!")
```

---

### `izi.enqueue_render.clear_world`

Syntax

```lua
izi.enqueue_render.clear_world(): nil
```

Description

Clears all pending render actions on the `"world"` layer.

---

### `izi.enqueue_render.clear_overlay`

Syntax

```lua
izi.enqueue_render.clear_overlay(): nil
```

Description

Clears all pending render actions on the `"overlay"` layer.

---

### `izi.enqueue_render.clear_all`

Syntax

```lua
izi.enqueue_render.clear_all(): nil
```

Description

Clears all pending render actions across all layers.

**Example Usage**

```lua
local izi = require("common/izi_sdk")

-- Clean up all enqueued visuals (e.g., on combat end)
izi.enqueue_render.clear_all()
```

---

## Module Access

### `izi.assets_helper`

Direct access to the underlying assets helper module for advanced operations.

```lua
local assets = izi.assets_helper
-- Use advanced asset functions
```

---

### `izi.icons_helper`

Direct access to the underlying icons helper module.

```lua
local icons = izi.icons_helper
-- Use advanced icon functions directly
icons:draw_spell_icon(100, izi.vec2(30, 30), 64, 64)
```

---

## Complete Example

```lua
local izi = require("common/izi_sdk")
local color = izi.color

-- Register custom asset pack
izi.register_zip_pack("rotation_icons", "ps/98765-rotation_icons.zip")

-- HUD drawing function
local function draw_hud()
    local me = izi.me()
    if not me then return end
    
    local base_x = 400
    local base_y = 600
    local icon_size = 48
    local padding = 4
    
    -- Draw class icon
    local class_icons = {
        [1] = "classicon-warrior",
        [2] = "classicon-paladin",
        [3] = "classicon-hunter",
        [8] = "classicon-mage",
        [9] = "classicon-warlock",
    }
    
    local class_icon = class_icons[me:get_class()] or "classicon-warrior"
    izi.draw_icon(
        class_icon,
        izi.vec2(base_x, base_y),
        icon_size, icon_size
    )
    
    -- Draw resource bar using local texture
    local resource_pct = me:mana_pct() / 100
    izi.draw_local_texture(
        "rotation_icons\\bar_bg.png",
        izi.vec2(base_x + icon_size + padding, base_y + 16),
        100, 16
    )
    
    izi.draw_local_texture(
        "rotation_icons\\bar_fill.png",
        izi.vec2(base_x + icon_size + padding, base_y + 16),
        100 * resource_pct, 16,
        color.blue()
    )
    
    -- Draw cooldown icons using spell IDs (no manual icon name lookup!)
    local cooldown_spells = {
        { id = 12472, spell = izi.spell(12472) },   -- Icy Veins
        { id = 84714, spell = izi.spell(84714) },   -- Frozen Orb
    }
    
    for i, entry in ipairs(cooldown_spells) do
        local x = base_x + (i - 1) * (icon_size + padding)
        local y = base_y + icon_size + padding
        
        -- Draw spell icon directly from spell ID
        izi.draw_spell_icon(
            entry.id,
            izi.vec2(x, y),
            icon_size, icon_size,
            entry.spell:cooldown_up() and color.white() or color.grey(128)
        )
    end
end

-- Draw target markers in world
local function draw_world_markers()
    local enemies = izi.enemies(40)
    
    for _, enemy in ipairs(enemies) do
        local pos = enemy:get_position()
        
        -- Show what the enemy is casting using spell ID icons
        if enemy:is_casting() then
            local cast_id = enemy:get_active_cast_or_channel_id()
            if cast_id and cast_id > 0 then
                izi.draw_spell_icon(
                    cast_id,
                    pos,
                    24, 24,
                    color.red()
                )
            end
        elseif enemy:get_health_percentage() < 20 then
            izi.draw_icon(
                "ability_warrior_execute",
                pos,
                24, 24,
                color.orange()
            )
        end
    end
end

-- Register render callback
core.register_on_render_callback(function()
    draw_hud()
    draw_world_markers()
end)
```