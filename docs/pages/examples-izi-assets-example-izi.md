# Assets Playground Example (IZI SDK)

> Source: <https://docs.project-sylvanas.net/examples/izi/assets-example-izi>

This example demonstrates how to load and draw textures using the **IZI SDK**. We'll explore loading images from local files and from ZIP archives, with automatic downloading and caching - all through the unified IZI interface.

*The plugin displays four paladin class icons - two loaded from local files (JPG and PNG) and two loaded from a ZIP archive that is automatically downloaded when missing. This version uses the streamlined IZI SDK API.*

## What You'll Learn

- How to use the IZI SDK for texture loading ( `izi.draw_local_texture` )
- Creating vectors with `izi.vec2()` helper
- Registering ZIP packs with `izi.register_zip_pack()`
- Using `izi.print()` for debug logging
- The benefits of the unified IZI SDK approach

## Prerequisites

Before running this example, you need to set up the test assets:

1. Create a folder: `<loader_path>/scripts_data/test_assets/`
2. Place two image files in it:
  - `classicon_paladin.jpg`
  - `classicon_paladin.png`

The ZIP pack (`zip_test_assets.zip`) will be downloaded automatically when the plugin runs.

## Plugin Structure

### header.lua

```lua
local plugin = {}

plugin.name = "Assets Playground (IZI)"
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
    Assets Playground (IZI) - Texture loading with IZI SDK
    
    This plugin shows how to:
        - Load textures from local files using izi.draw_local_texture
        - Register ZIP packs with izi.register_zip_pack
        - Use izi.vec2() for position vectors
        - Debug with izi.print()
    
    Requirements:
        - Local files: scripts_data/test_assets/classicon_paladin.jpg
                       scripts_data/test_assets/classicon_paladin.png
        - ZIP pack: Downloaded automatically to scripts_data/zip_test_assets.zip
    
    Author: Silvi
]]

-- ============================================================================
-- DEPENDENCIES
-- ============================================================================

local izi = require("common/izi_sdk")
local color = require("common/color")

-- ============================================================================
-- ASSET PATHS
-- ============================================================================

-- Local assets (files already in scripts_data)
-- You must add these manually - otherwise you get a red error in console
local JPG_PATH = "test_assets\\classicon_paladin.jpg"
local PNG_PATH = "test_assets\\classicon_paladin.png"

-- ZIP virtual assets (extracted from scripts_data/zip_test_assets.zip)
local ZIP_FOLDER = "zip_test_assets"
local ZIP_URL = "ps/1768128082013OFT0-zip_test_assets.zip" -- hosted on PS (you can ask silvi about it)

local ZIP_JPG_PATH = "zip_test_assets\\classicon_paladin.jpg"
local ZIP_PNG_PATH = "zip_test_assets\\classicon_paladin.png"

-- ============================================================================
-- ZIP PACK REGISTRATION
-- ============================================================================

-- Register the ZIP pack once at load time
-- IZI will download it automatically when any file from it is requested
izi.register_zip_pack(ZIP_FOLDER, ZIP_URL)

-- ============================================================================
-- DEBUG STATE
-- ============================================================================

local logged_zip_ready = false

-- ============================================================================
-- RENDER CALLBACK
-- ============================================================================

local function on_render()
    -- Note: JPG_PATH and PNG_PATH require manual setup
    -- If files are missing, you'll see a red error message in console

    -- 1) Local folder: Draw JPG (falls back to PNG if JPG decode fails)
    izi.draw_local_texture(
        JPG_PATH,
        izi.vec2(30, 30),   -- IZI helper for vec2 creation
        64, 64,
        color.purple(),
        false  -- is_for_window
    )

    -- 2) Local folder: Draw PNG explicitly
    izi.draw_local_texture(
        PNG_PATH,
        izi.vec2(30, 110),
        64, 64,
        color.yellow(),
        false
    )

    -- 3) ZIP virtual: Draw JPG from ZIP archive
    -- If zip_test_assets.zip is missing, IZI downloads it automatically
    izi.draw_local_texture(
        ZIP_JPG_PATH,
        izi.vec2(140, 30),
        64, 64,
        color.blue(),
        false
    )

    -- 4) ZIP virtual: Draw PNG from ZIP archive
    izi.draw_local_texture(
        ZIP_PNG_PATH,
        izi.vec2(140, 110),
        64, 64,
        color.red(),
        false
    )

    -- Debug: Log once when ZIP is ready using izi.print
    if not logged_zip_ready then
        local zip_size = core.get_data_file_size("zip_test_assets.zip")
        if zip_size and zip_size > 0 then
            local bytes = core.read_data_file(ZIP_PNG_PATH)
            if bytes and #bytes > 0 then
                logged_zip_ready = true
                izi.print("zip_test_assets.zip present, size=", zip_size, ", entry bytes=", #bytes)
            end
        end
    end
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

The IZI SDK provides a unified interface that wraps multiple helper libraries. Instead of importing `assets_helper`, `vec2`, and other modules separately, you get everything through the `izi` object.

### 2. IZI vs Direct Helper Comparison

| Task | Direct Helper | IZI SDK |
| --- | --- | --- |
| Import | `require("common/utility/assets_helper")` | `require("common/izi_sdk")` |
| Create vec2 | `vec2.new(30, 30)` | `izi.vec2(30, 30)` |
| Draw texture | `assets_helper:draw_local_texture(...)` | `izi.draw_local_texture(...)` |
| Register ZIP | `assets_helper:register_zip_pack(...)` | `izi.register_zip_pack(...)` |
| Debug log | `core.log("message")` | `izi.print("msg", value, ...)` |

### 3. Creating Vectors with izi.vec2

```lua
-- IZI SDK style (cleaner)
izi.vec2(30, 30)

-- Direct style (requires separate import)
local vec2 = require("common/geometry/vector_2")
vec2.new(30, 30)
```

`izi.vec2()` is a convenience wrapper that creates vec2 objects without needing a separate require statement.

### 4. Drawing Local Textures

```lua
izi.draw_local_texture(
    JPG_PATH,           -- Path relative to scripts_data/
    izi.vec2(30, 30),   -- Screen position
    64, 64,             -- Width, height
    color.purple(),     -- Tint color
    false               -- is_for_window
)
```

**Parameters are identical to assets_helper** - IZI just provides a cleaner access pattern without needing to use the colon (`:`) method syntax.

### 5. Registering ZIP Packs

```lua
local ZIP_FOLDER = "zip_test_assets"
local ZIP_URL = "ps/1768128082013OFT0-zip_test_assets.zip"

izi.register_zip_pack(ZIP_FOLDER, ZIP_URL)
```

Same functionality as `assets_helper:register_zip_pack()`, but accessed through the IZI namespace.

### 6. Debug Logging with izi.print

```lua
-- IZI print accepts multiple arguments and concatenates them
izi.print("zip_test_assets.zip present, size=", zip_size, ", entry bytes=", #bytes)

-- Equivalent to:
core.log("zip_test_assets.zip present, size=" .. tostring(zip_size) .. ", entry bytes=" .. tostring(#bytes))
```

`izi.print()` is more convenient because:

- Accepts multiple arguments of any type
- Automatically converts values to strings
- No manual concatenation needed

## IZI SDK Texture API Reference

### Functions

| Function | Description |
| --- | --- |
| `izi.register_zip_pack(folder, url)` | Register a ZIP pack for automatic downloading |
| `izi.draw_local_texture(path, pos, w, h, color, is_window)` | Load and draw a texture |
| `izi.vec2(x, y)` | Create a vec2 position |
| `izi.print(...)` | Debug logging with auto-concatenation |

### Why Use IZI SDK?

1. **Single Import** - One `require` instead of many
2. **Consistent API** - All functions accessed the same way
3. **No Colon Syntax** - `izi.func()` instead of `helper:func()`
4. **Convenience Helpers** - `izi.vec2()` , `izi.print()` , etc.
5. **Battle-Tested** - Used by official rotation plugins

## File Structure

```text
scripts_data/
├── test_assets/
│   ├── classicon_paladin.jpg    ← Local file (add manually)
│   └── classicon_paladin.png    ← Local file (add manually)
│
└── zip_test_assets.zip          ← Downloaded automatically
    ├── classicon_paladin.jpg    ← Virtual file (inside ZIP)
    └── classicon_paladin.png    ← Virtual file (inside ZIP)
```

## Customization

### Using IZI for Multiple Textures

```lua
local icons = {
    { path = "icons\\sword.png", x = 10 },
    { path = "icons\\shield.png", x = 80 },
    { path = "icons\\potion.png", x = 150 },
}

local function draw_toolbar()
    for _, icon in ipairs(icons) do
        izi.draw_local_texture(
            icon.path,
            izi.vec2(icon.x, 10),
            64, 64,
            color.white(),
            false
        )
    end
end
```

### Combining with Other IZI Features

```lua
local izi = require("common/izi_sdk")

local function on_render()
    -- Draw texture
    izi.draw_local_texture("ui\\background.png", izi.vec2(0, 0), 200, 100, color.white(), false)
    
    -- Draw icon from Wowhead (also part of IZI)
    izi.draw_icon("classicon-mage", izi.vec2(10, 10), 48, 48, color.white(), false, {
        size = "large",
        persist_to_disk = true
    })
    
    -- Debug output
    izi.print("Frame rendered at ", core.time())
end
```

## Related Documentation

- [IZI SDK Reference](/dev/libraries/izi) - Complete IZI SDK documentation
- [IZI Graphics](/dev/libraries/izi/graphics) - Graphics functions in IZI
- [Assets Helper API](/dev/api/assets-helper) - Underlying assets_helper reference
- [File I/O](/dev/api/file-io) - Reading files from scripts_data

## Tips

> [!TIP]
> The IZI SDK is the recommended way to access helper libraries. It provides a cleaner API and is actively maintained alongside the core rotation plugins.

> [!WARNING]
> Unlike ZIP packs which download automatically, local files in `test_assets/` must be placed there manually. Missing files will show a red error in the console.

> [!INFO]
> `izi.draw_local_texture()` uses `assets_helper` internally. The caching, ZIP handling, and GPU upload behavior is identical - IZI just provides a nicer interface.

## Conclusion

This example demonstrates texture loading using the IZI SDK, which provides a cleaner and more convenient API compared to using helper libraries directly. By unifying multiple utilities under a single import, IZI makes your code more readable and maintainable.

**Key Takeaways:**

- **Single Import** - `require("common/izi_sdk")` gives you everything
- **Clean Syntax** - `izi.func()` instead of `helper:func()`
- **Helper Functions** - `izi.vec2()` and `izi.print()` simplify common tasks
- **Same Power** - All features of assets_helper are available through IZI
- **Recommended Approach** - IZI SDK is the standard for plugin development

---

For new plugins, we recommend using the IZI SDK approach shown here. It's cleaner, more consistent, and matches the style used by official rotation plugins.