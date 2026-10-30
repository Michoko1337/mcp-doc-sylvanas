# Assets Playground Example

> Source: <https://docs.project-sylvanas.net/examples/legacy/assets-example>

This example demonstrates how to load and draw textures using the `assets_helper` utility library. We'll explore loading images from local files and from ZIP archives, with automatic downloading and caching support.

*The plugin displays four paladin class icons - two loaded from local files (JPG and PNG) and two loaded from a ZIP archive that is automatically downloaded when missing.*

## What You'll Learn

- How to use the `assets_helper` utility library for texture loading
- Loading textures from local files in `scripts_data/`
- Registering and using ZIP packs for bundled assets
- Automatic ZIP downloading when assets are missing
- Drawing textures with color tinting
- Understanding the texture caching system

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

plugin.name = "Assets Playground"
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
    Assets Playground - Demonstrating assets_helper usage
    
    This plugin shows how to:
        - Load textures from local files in scripts_data
        - Register ZIP packs for bundled assets
        - Draw textures with automatic fallback (JPG -> PNG)
        - Apply color tinting to textures
        - Handle automatic ZIP downloading
    
    Requirements:
        - Local files: scripts_data/test_assets/classicon_paladin.jpg
                       scripts_data/test_assets/classicon_paladin.png
        - ZIP pack: Downloaded automatically to scripts_data/zip_test_assets.zip
    
    Author: Silvi
]]

-- ============================================================================
-- DEPENDENCIES
-- ============================================================================

local vec2 = require("common/geometry/vector_2")
local color = require("common/color")
local assets_helper = require("common/utility/assets_helper")

-- ============================================================================
-- ASSET PATHS
-- ============================================================================

-- Local assets (files already in scripts_data)
local JPG_PATH = "test_assets\\classicon_paladin.jpg"
local PNG_PATH = "test_assets\\classicon_paladin.png"

-- ZIP virtual assets (extracted from scripts_data/zip_test_assets.zip)
local ZIP_FOLDER = "zip_test_assets"
local ZIP_URL = "ps/1768128082013OFT0-zip_test_assets.zip"

local ZIP_JPG_PATH = "zip_test_assets\\classicon_paladin.jpg"
local ZIP_PNG_PATH = "zip_test_assets\\classicon_paladin.png"

-- ============================================================================
-- ZIP PACK REGISTRATION
-- ============================================================================

-- Register the ZIP pack once at load time
-- assets_helper will download it automatically when any file from it is requested
assets_helper:register_zip_pack(ZIP_FOLDER, ZIP_URL)

-- ============================================================================
-- DEBUG STATE
-- ============================================================================

local logged_zip_ready = false

-- ============================================================================
-- RENDER CALLBACK
-- ============================================================================

local function on_render()
    -- 1) Local folder: Draw JPG (falls back to PNG if JPG decode fails)
    assets_helper:draw_local_texture(
        JPG_PATH,
        vec2.new(30, 30),
        64, 64,
        color.purple(),
        false  -- is_for_window
    )

    -- 2) Local folder: Draw PNG explicitly
    assets_helper:draw_local_texture(
        PNG_PATH,
        vec2.new(30, 110),
        64, 64,
        color.yellow(),
        false
    )

    -- 3) ZIP virtual: Draw JPG from ZIP archive
    -- If zip_test_assets.zip is missing, assets_helper downloads it automatically
    assets_helper:draw_local_texture(
        ZIP_JPG_PATH,
        vec2.new(140, 30),
        64, 64,
        color.blue(),
        false
    )

    -- 4) ZIP virtual: Draw PNG from ZIP archive
    assets_helper:draw_local_texture(
        ZIP_PNG_PATH,
        vec2.new(140, 110),
        64, 64,
        color.red(),
        false
    )

    -- Debug: Log once when ZIP is ready
    if not logged_zip_ready then
        local zip_size = core.get_data_file_size("zip_test_assets.zip")
        if zip_size and zip_size > 0 then
            local bytes = core.read_data_file(ZIP_PNG_PATH)
            if bytes and #bytes > 0 then
                logged_zip_ready = true
                core.log("ZIP ready! Size: " .. zip_size .. " bytes, entry: " .. #bytes .. " bytes")
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

### 1. Importing assets_helper

```lua
local assets_helper = require("common/utility/assets_helper")
```

The `assets_helper` library handles all the complexity of:

- Reading files from `scripts_data/`
- Extracting files from ZIP archives
- Downloading missing ZIP packs
- Loading textures into GPU memory
- Caching texture IDs for reuse

### 2. Defining Asset Paths

```lua
-- Local files (relative to scripts_data/)
local JPG_PATH = "test_assets\\classicon_paladin.jpg"
local PNG_PATH = "test_assets\\classicon_paladin.png"

-- ZIP virtual paths (folder name matches ZIP filename without extension)
local ZIP_JPG_PATH = "zip_test_assets\\classicon_paladin.jpg"
local ZIP_PNG_PATH = "zip_test_assets\\classicon_paladin.png"
```

**Path Rules:**

- All paths are relative to `scripts_data/`
- Use backslashes ( `\\` ) for path separators
- ZIP virtual paths use the ZIP folder name as the first component
- The ZIP folder name should match the ZIP filename (without `.zip` )

### 3. Registering ZIP Packs

```lua
local ZIP_FOLDER = "zip_test_assets"
local ZIP_URL = "ps/1768128082013OFT0-zip_test_assets.zip"

assets_helper:register_zip_pack(ZIP_FOLDER, ZIP_URL)
```

**How ZIP Registration Works:**

1. Call `register_zip_pack()` once at plugin load
2. Provide the folder name and download URL
3. When you request a file from that folder, assets_helper checks if the ZIP exists
4. If missing, it downloads the ZIP automatically
5. Files are extracted from the ZIP on-demand

> [!TIP]
> You don't need to manually download ZIP packs. Just register them and use the paths - assets_helper handles everything automatically.

### 4. Drawing Textures

```lua
assets_helper:draw_local_texture(
    JPG_PATH,           -- Path relative to scripts_data/
    vec2.new(30, 30),   -- Screen position
    64, 64,             -- Width, height
    color.purple(),     -- Tint color
    false               -- is_for_window (false = background layer)
)
```

**Parameters:**

- `path` - File path relative to `scripts_data/`
- `position` - Screen position as `vec2`
- `width` - Draw width in pixels
- `height` - Draw height in pixels
- `tint` - Color to tint the texture (use `color.white()` for no tint)
- `is_for_window` - `true` to draw in current ImGui window, `false` for background

### 5. Color Tinting

```lua
-- Different colors for each icon
color.purple()  -- Purple tint
color.yellow()  -- Yellow tint
color.blue()    -- Blue tint
color.red()     -- Red tint
color.white()   -- No tint (original colors)
```

Color tinting multiplies the texture colors by the tint color. Use `color.white()` or `color.new(255, 255, 255, 255)` to display the original image colors.

### 6. Checking ZIP Status

```lua
if not logged_zip_ready then
    local zip_size = core.get_data_file_size("zip_test_assets.zip")
    if zip_size and zip_size > 0 then
        local bytes = core.read_data_file(ZIP_PNG_PATH)
        if bytes and #bytes > 0 then
            logged_zip_ready = true
            core.log("ZIP ready!")
        end
    end
end
```

You can check if a ZIP is downloaded using `core.get_data_file_size()`. Once downloaded, files inside the ZIP can be read directly using their virtual paths.

## assets_helper API Reference

### Core Functions

| Function | Description |
| --- | --- |
| `register_zip_pack(folder, url)` | Register a ZIP pack for automatic downloading |
| `draw_local_texture(path, pos, w, h, color, is_window)` | Load and draw a texture from scripts_data |
| `get_texture_id(path)` | Get the GPU texture ID for a path (loads if needed) |
| `is_texture_loaded(path)` | Check if a texture is already in the cache |

### How Caching Works

1. **First Request** : File is read from disk (or ZIP), decoded, uploaded to GPU
2. **Subsequent Requests** : Cached texture ID is reused immediately
3. **ZIP Downloads** : Happen once, then ZIP is cached on disk permanently

```text
Request "test_assets\\icon.png"
         │
         ▼
    ┌─────────────────┐
    │ Cache lookup    │
    └────────┬────────┘
             │
      Cached? ───Yes──► Return tex_id
             │
            No
             │
             ▼
    ┌─────────────────┐
    │ Read from disk  │
    │ or extract ZIP  │
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │ Decode image    │
    │ Upload to GPU   │
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │ Store in cache  │
    │ Return tex_id   │
    └─────────────────┘
```

## File Structure

```text
scripts_data/
├── test_assets/
│   ├── classicon_paladin.jpg    ← Local file
│   └── classicon_paladin.png    ← Local file
│
└── zip_test_assets.zip          ← Downloaded automatically
    ├── classicon_paladin.jpg    ← Virtual file (inside ZIP)
    └── classicon_paladin.png    ← Virtual file (inside ZIP)
```

## Customization

### Loading Different Image Formats

```lua
-- PNG (recommended for quality)
assets_helper:draw_local_texture("icons\\spell_icon.png", pos, 32, 32, color.white(), false)

-- JPG (smaller file size)
assets_helper:draw_local_texture("icons\\background.jpg", pos, 256, 256, color.white(), false)
```

### Creating Your Own ZIP Pack

1. Create a folder with your assets
2. ZIP the folder (the ZIP should contain a folder with the same name)
3. Host the ZIP file somewhere accessible
4. Register it with `register_zip_pack()`

```lua
-- Your custom asset pack
assets_helper:register_zip_pack("my_icons", "https://example.com/my_icons.zip")

-- Use files from it
assets_helper:draw_local_texture("my_icons\\sword.png", pos, 64, 64, color.white(), false)
```

### Drawing in ImGui Windows

```lua
-- In a render_window callback
local function on_render_window()
    -- Draw texture inside the current ImGui window
    assets_helper:draw_local_texture(
        "icons\\button.png",
        vec2.new(10, 10),  -- Position relative to window
        32, 32,
        color.white(),
        true  -- is_for_window = true
    )
end
```

## Related Documentation

- [Assets Helper API](/dev/api/assets-helper) - Complete API reference
- [File I/O](/dev/api/file-io) - Reading files from scripts_data
- [Graphics API](/dev/api/graphics) - Low-level texture functions
- [Color API](/dev/api/color) - Color creation and manipulation
- [Icons Helper](/dev/api/icons-helper) - Download icons from Wowhead

## Tips

> [!TIP]
> PNG files preserve transparency and don't have compression artifacts. Use JPG only when file size is critical and you don't need transparency.

> [!WARNING]
> The folder name in `register_zip_pack()` must match the root folder inside the ZIP file. If your ZIP contains `my_assets/icon.png`, register it as `register_zip_pack("my_assets", url)`.

> [!INFO]
> On the first frame a texture is requested, there may be a brief delay while the file is read and decoded. After that, drawing is instant. For critical UI, you can pre-load textures during initialization.

> [!TIP]
> Use color tinting to create variations of the same icon without loading multiple textures. For example, tint a white icon different colors for different states (enabled/disabled/highlighted).

## Conclusion

This Assets Playground example demonstrates the power and simplicity of the `assets_helper` utility library. By handling file reading, ZIP extraction, downloading, and GPU uploading automatically, it lets you focus on your plugin's functionality rather than asset management.

**Key Takeaways:**

- **Simple API** - Just call `draw_local_texture()` with a path and position
- **Automatic Caching** - Textures are loaded once and reused every frame
- **ZIP Support** - Bundle assets in ZIP files for easy distribution
- **Auto-Download** - Missing ZIP packs are downloaded automatically
- **Color Tinting** - Apply colors to textures for variations
- **Transparent Fallback** - JPG files can fall back to PNG if decoding fails

---

I hope this example helps you understand how to manage textures in your plugins! The assets_helper library makes it easy to include custom graphics without worrying about the low-level details.