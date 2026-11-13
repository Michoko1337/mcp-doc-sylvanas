# Assets Helper

> Source: <https://docs.project-sylvanas.net/dev/api/assets-helper>

## Overview

The Assets Helper is a utility library that simplifies texture and data loading from both local files and remote URLs. It provides automatic caching, ZIP pack support for bundling assets, and seamless world-to-screen coordinate conversion.

**Key Features:**

- **Local Texture Loading** - Load PNG/JPG textures from `scripts_data/` folder
- **Remote Texture Loading** - Download and cache textures from URLs
- **ZIP Pack Support** - Bundle multiple assets in a ZIP file with auto-download
- **World Position Support** - Pass `vec3` world coordinates and get automatic world-to-screen conversion
- **Automatic Caching** - Textures are cached after first load for performance
- **PS Short Links** - Use `ps/<file>` shorthand for official Project Sylvanas downloads

> [!TIP]
> For the easiest experience, consider using the [IZI SDK Graphics](/dev/libraries/izi/graphics) module which wraps this helper with additional convenience functions.

## Importing The Module

```lua
---@type assets_helper
local assets = require("common/utility/assets_helper")
```

> [!WARNING]
> Access functions with `:` (colon), not `.` (dot). Static members like `cache` use `.` (dot).

---

## Functions

### `assets:register_zip_pack`

Syntax

```lua
assets:register_zip_pack(folder_name: string, zip_url: string, zip_file_name?: string): nil
```

**Parameters**

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `folder_name` | `string` | Required | Virtual folder name to access files from the ZIP |
| `zip_url` | `string` | Required | URL to download the ZIP file (supports `ps/` shorthand) |
| `zip_file_name` | `string` | `nil` | Optional custom filename for the downloaded ZIP |

Description

Registers a ZIP pack for automatic downloading and extraction. Once registered, files inside the ZIP can be accessed using `draw_local_texture` with the virtual folder path. If the ZIP is missing locally, it will be downloaded automatically on first access.

**Example Usage**

```lua
local assets = require("common/utility/assets_helper")

-- Register a ZIP pack from Project Sylvanas CDN
assets:register_zip_pack(
    "my_icons",                              -- Virtual folder name
    "ps/1768128082013OFT0-my_icons.zip"      -- PS short link
)

-- Files inside are now accessible as: my_icons\icon_name.png
```

---

### `assets:draw_local_texture`

Syntax

```lua
assets:draw_local_texture(
    data_path: string,
    top_left: vec2|vec3,
    width: number,
    height: number,
    tint?: color,
    is_for_window?: boolean
): boolean
```

**Parameters**

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `data_path` | `string` | Required | Path relative to `scripts_data/` folder |
| `top_left` | `vec2\|vec3` | Required | Screen position (vec2) or world position (vec3) |
| `width` | `number` | Required | Draw width in pixels |
| `height` | `number` | Required | Draw height in pixels |
| `tint` | `color` | White | Optional color tint |
| `is_for_window` | `boolean` | `false` | Set true if drawing inside a custom window |

Returns

- `boolean` - True if the texture was drawn successfully

Description

Draws a texture from the local `scripts_data/` folder. The texture is loaded and cached on first use. Supports both screen coordinates (vec2) and world coordinates (vec3) - world positions are automatically converted to screen space.

**Example Usage**

```lua
local vec2 = require("common/geometry/vector_2")
local assets = require("common/utility/assets_helper")
local color = require("common/color")

-- File location: <loader_path>/scripts_data/my_addon/icon.png

local function on_render()
    assets:draw_local_texture(
        "my_addon\\icon.png",    -- Path in scripts_data
        vec2.new(100, 100),      -- Screen position
        64, 64,                  -- Size
        color.white(255),        -- Tint
        false                    -- Not in a window
    )
end

core.register_on_render_callback(on_render)
```

**World Position Example**

```lua
local vec3 = require("common/geometry/vector_3")
local assets = require("common/utility/assets_helper")

local function on_render()
    -- Draw at a world position (auto world-to-screen conversion)
    local world_pos = vec3.new(1234.5, 5678.9, 100)
    assets:draw_local_texture(
        "my_addon\\marker.png",
        world_pos,
        32, 32
    )
end

core.register_on_render_callback(on_render)
```

---

### `assets:draw_http_texture`

Syntax

```lua
assets:draw_http_texture(
    url: string,
    top_left: vec2|vec3,
    width: number,
    height: number,
    cache_path?: string,
    headers?: table<string, string>,
    tint?: color,
    is_for_window?: boolean
): boolean
```

**Parameters**

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `url` | `string` | Required | URL to download the texture from |
| `top_left` | `vec2\|vec3` | Required | Screen position (vec2) or world position (vec3) |
| `width` | `number` | Required | Draw width in pixels |
| `height` | `number` | Required | Draw height in pixels |
| `cache_path` | `string` | `nil` | Optional local cache path in `scripts_data/` |
| `headers` | `table<string, string>` | `nil` | Optional HTTP headers |
| `tint` | `color` | White | Optional color tint |
| `is_for_window` | `boolean` | `false` | Set true if drawing inside a custom window |

Returns

- `boolean` - True if the texture was drawn successfully

Description

Downloads and draws a texture from a remote URL. The texture is cached in memory after download. Optionally specify a `cache_path` to persist the texture to disk for faster loading on subsequent sessions.

**Example Usage**

```lua
local vec2 = require("common/geometry/vector_2")
local assets = require("common/utility/assets_helper")

local function on_render()
    assets:draw_http_texture(
        "https://example.com/icon.png",
        vec2.new(200, 200),
        64, 64,
        "cache\\remote_icon.png"  -- Cache to disk
    )
end

core.register_on_render_callback(on_render)
```

---

### `assets:load_local_data`

Syntax

```lua
assets:load_local_data(data_path: string, default_value?: string): string
```

**Parameters**

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `data_path` | `string` | Required | Path relative to `scripts_data/` folder |
| `default_value` | `string` | `""` | Value to return if file doesn't exist |

Returns

- `string` - File contents or default value

Description

Loads raw data from a local file. Useful for loading JSON configs, text files, or binary data.

**Example Usage**

```lua
local assets = require("common/utility/assets_helper")

local config_json = assets:load_local_data("my_addon\\config.json", "{}")
-- Parse JSON and use config...
```

---

### `assets:load_http_data`

Syntax

```lua
assets:load_http_data(
    url: string,
    callback: function,
    headers?: table<string, string>
): nil
```

**Parameters**

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `url` | `string` | Required | URL to download data from |
| `callback` | `function` | Required | Callback function when download completes |
| `headers` | `table<string, string>` | `nil` | Optional HTTP headers |

**Callback Parameters**

```lua
function(ok: boolean, data: string, http_code: integer, content_type: string, response_headers: string)
```

| Parameter | Type | Description |
| --- | --- | --- |
| `ok` | `boolean` | True if download succeeded |
| `data` | `string` | Downloaded data (or error message) |
| `http_code` | `integer` | HTTP status code |
| `content_type` | `string` | Response content type |
| `response_headers` | `string` | Raw response headers |

Description

Asynchronously downloads data from a remote URL. The callback is invoked when the download completes (or fails).

**Example Usage**

```lua
local assets = require("common/utility/assets_helper")

assets:load_http_data(
    "https://example.com/data.json",
    function(ok, data, http_code, content_type, headers)
        if ok then
            core.log("Downloaded: " .. data)
        else
            core.log_error("Download failed: " .. data)
        end
    end
)
```

---

## URL Formats

The assets helper supports two URL formats:

| Format | Example | Description |
| --- | --- | --- |
| **Full URL** | `https://url.com/file.png` | Standard HTTP URL |
| **PS Short Link** | `ps/file.png` | Shorthand for PS CDN (you can ask silvi to host your stuff) |

The `ps/` prefix is automatically resolved to the official Project Sylvanas download host.

---

## Complete Examples

### Example 1: Local Texture

```lua
local vec2 = require("common/geometry/vector_2")
local assets = require("common/utility/assets_helper")
local color = require("common/color")

-- Place file at: <loader_path>/scripts_data/test_assets/classicon_paladin.png

local function on_render()
    assets:draw_local_texture(
        "test_assets\\classicon_paladin.png",
        vec2.new(30, 30),
        64, 64,
        color.white(255),
        false
    )
end

core.register_on_render_callback(on_render)
```

### Example 2: ZIP Pack Auto-Download

```lua
local vec2 = require("common/geometry/vector_2")
local assets = require("common/utility/assets_helper")
local color = require("common/color")

-- Register ZIP pack - will auto-download if missing
assets:register_zip_pack(
    "zip_test_assets",
    "ps/1768128082013OFT0-zip_test_assets.zip"
)

local function on_render()
    -- Access files from inside the ZIP
    assets:draw_local_texture(
        "zip_test_assets\\classicon_paladin.png",
        vec2.new(30, 110),
        64, 64,
        color.red(),
        false
    )
end

core.register_on_render_callback(on_render)
```

### Example 3: World-Space Drawing

```lua
local vec3 = require("common/geometry/vector_3")
local assets = require("common/utility/assets_helper")

local function on_render()
    -- Draw texture at a 3D world position
    local world_pos = vec3.new(1234, 5678, 90)
    assets:draw_local_texture(
        "test_assets\\marker.png",
        world_pos,  -- Automatic world-to-screen conversion
        64, 64
    )
end

core.register_on_render_callback(on_render)
```

---

## Types

### `assets_helper_local_texture_entry`

Internal cache entry for local textures.

| Field | Type | Description |
| --- | --- | --- |
| `path` | `string` | File path |
| `tex_id` | `integer\|nil` | GPU texture ID |
| `w` | `integer\|nil` | Texture width |
| `h` | `integer\|nil` | Texture height |
| `dead` | `boolean` | True if loading failed permanently |
| `dead_error` | `string\|nil` | Error message if dead |

### `assets_helper_remote_texture_entry`

Internal cache entry for remote textures.

| Field | Type | Description |
| --- | --- | --- |
| `url` | `string` | Source URL |
| `cache_path` | `string\|nil` | Local disk cache path |
| `tex_id` | `integer\|nil` | GPU texture ID |
| `w` | `integer\|nil` | Texture width |
| `h` | `integer\|nil` | Texture height |
| `requested` | `boolean` | True if download has been initiated |
| `error` | `string\|nil` | Error message if failed |

### `assets_helper_zip_pack`

ZIP pack registration entry.

| Field | Type | Description |
| --- | --- | --- |
| `url` | `string` | Download URL |
| `zip_file` | `string` | Local ZIP filename |