# Lua Graphics Module Documentation

> Source: <https://docs.project-sylvanas.net/dev/api/graphics>

## Overview

The Lua Graphics Module provides a range of functions for rendering various graphical elements in Lua scripts. This module empowers developers to create visually engaging user interfaces and enhance in-game visuals.

### Register Graphics Callback

> [!WARNING]
> This callback should only be used for graphics, as explained in [Core - Overview](/dev/api/core#overview)

`core.menu.register_on_render_callback(callback: function)`

- This function registers the menu for interaction. Same like with other callbacks, you can also pass an anonymous function. This is how you would call the callback:

```lua
core.menu.register_on_render_callback(function()
     -- your rendering code here
end)
```

Or:

```lua
local function my_render_function()
    -- your rendering code here
end

core.menu.register_on_render_callback(my_render_function)
```

---

## Functions 🛠️

### Line Of Sight 👁️

> [!WARNING]
> In most cases, you should NOT use this function, since it's very expensive. Instead, you should instead use the spell_helper:is_spell_in_line_of_sight() function. See [Spell Helper - LOS](/dev/api/spellbook/helper#is_spell_in_line_of_sightspell_id-caster-target)

Syntax

```lua
core.graphics.is_line_of_sight(caster, target)
```

Parameters

- `caster` : [game_object](/dev/api/game-object) - The caster object.
- `target` : [game_object](/dev/api/game-object) - The target object.

Returns

- `boolean` : `true` if the `target` is in line of sight from the `caster` , `false` otherwise.

Description

Determines if the `target` is within the line of sight of the `caster`.

> [!TIP]
> You can use this function to check visibility between two game objects.

---

### Cursor World Position 👁️

Syntax

```lua
core.graphics.get_cursor_world_position()
```

Returns

- [vec3](/dev/api/vector-3) : The current cursor position's coordinates transformed to 3D dimensions.

Description

Retrieves the current cursor position screen coordinates (2D) and returns it after transforming them to 3D.

---

### Trace Line 🧭

Syntax

```lua
core.graphics.trace_line(pos1, pos2, flags)
```

Parameters

- `pos1` : [vec3](/dev/api/vector-3) - Starting position.
- `pos2` : [vec3](/dev/api/vector-3) - Ending position.
- `flags` : Collision flags that determine which objects to consider during tracing.

> [!WARNING]
> `EntityRender` (`0x200000`) and anything above it crashed the 2.5.6 client, so on the Classic versions a mask containing those bits now raises a Lua error instead of reaching the client. Every other flag in `enums.collision_flags`, including the `LineOfSight` preset, is unaffected.

Returns

- `boolean` : `true` if there is a valid trace line between `pos1` and `pos2` , `false` otherwise.

Description

Indicates if there is a valid trace line between `pos1` and `pos2` following the collision flags you provide.

**Collision Flags**

```lua
None,
DoodadCollision     = 0x00000001,
DoodadRender        = 0x00000002,
WmoCollision        = 0x00000010,
WmoRender           = 0x00000020,
WmoNoCamCollision   = 0x00000040,
Terrain             = 0x00000100,
IgnoreWmoDoodad     = 0x00002000,
LiquidWaterWalkable = 0x00010000,
LiquidAll           = 0x00020000,
Cull                = 0x00080000,
EntityCollision     = 0x00100000,
EntityRender        = 0x00200000,

Collision           = DoodadCollision | WmoCollision | Terrain | EntityCollision,
LineOfSight         = WmoCollision | EntityCollision
```

> [!WARNING]
> The collision flags are located in `enums.collision_flags`. You should import the enums module:
>
> ```lua
> ---@type enums
> local enums = require("common/enums")
> ```
>
> Avoid using their values directly, as this is **not recommended** since these values might change in the future. By importing the enums module, any updates will automatically be reflected in your code.

You can use this function to see which enemies are not in line of sight. You can adjust the flags according to your requirements.

## Example:

Here's an example

function to gather all units that are not in line of sight within a search distance:

```lua
---@type unit_helper
local unit_helper = require("common/utility/unit_helper")

---@type enums
local enums = require("common/enums")

---@param search_distance number
---@return table<game_object> | nil
local function get_enemies_that_are_not_in_los(search_distance)
    local local_player = core.object_manager.get_local_player()
    if not local_player then
        return nil
    end

    local local_player_position = local_player:get_position()

    local enemies = unit_helper:get_enemy_list_around(local_player_position, search_distance, true)

    local not_in_los_enemies = {}

    for _, enemy in ipairs(enemies) do
        local enemy_pos = enemy:get_position()
        -- trace_line will return true if the enemy is in line of sight, as long as we pass the enums.collision_flags.LineOfSight flag
        local is_in_los = core.graphics.trace_line(local_player_position, enemy_pos, enums.collision_flags.LineOfSight)

        if not is_in_los then
            table.insert(not_in_los_enemies, enemy)
        end
    end

    return not_in_los_enemies
end
```

> [!NOTE]
> For this example, to check if something is in **LOS** (line of sight), you could also use the `core.graphics.is_line_of_sight` function, defined earlier.

---

### World to Screen 🌐➡️🖥️

Syntax

```lua
core.graphics.w2s(position)
```

Parameters

- `position` : [vec3](/dev/api/vector-3) - The 3D world position to convert.

Returns

- [vec2](/dev/api/vector-2) : The 2D screen position corresponding to the 3D world position.

Description

Converts a 3D world position to a 2D screen position, facilitating the rendering of objects in screen space.

> [!WARNING]
> Before using the return value, you should make sure it's not `nil`, since a `vec3` out of the screen won't be converted and will return `nil`.

## Example:

Drawing text at the 2D position of a given unit

```lua
---@type color
local color = require("common/color")

---@param unit game_object
---@param text string
local function draw_text_at_unit_screen_position(unit, text)
    if not unit then
        return
    end

    local unit_position = unit:get_position()
    local unit_screen_position = core.graphics.w2s(unit_position)
    if not unit_screen_position then
        return
    end

    core.graphics.text_2d(text, unit_screen_position, 16, color.cyan(230))
end
```

---

### Is Menu Open 📋🔍

Syntax

```lua
core.graphics.is_menu_open()
```

Returns

- `boolean` : `true` if the main menu is visible, `false` otherwise.

Description

Checks if the main menu is currently open.

---

### Get Screen Size 🖥️📏

Syntax

```lua
core.graphics.get_screen_size()
```

Returns

- [vec2](/dev/api/vector-2) : The width and height of the screen.

Description

Retrieves the current screen size in pixels.

---

### Render 2D Text 📝

Syntax

```lua
core.graphics.text_2d(text, position, font_size, color, centered, font_id)
```

Parameters

- `text` : `string` - The text to render.
- `position` : [vec2](/dev/api/vector-2) - The position where the text will be rendered.
- `font_size` : `number` - The font size of the text.
- `color` : [color](/dev/api/color) - The color of the text.
- `centered` (Optional): `boolean` - Indicates whether the text should be centered at the specified position. Default is `false` .
- `font_id` (Optional): `integer` - The font ID. Default is `0` .

Description

Renders 2D text on the screen at the specified position with the given font size and color.

---

### Render 3D Text 📝🌐

Syntax

```lua
core.graphics.text_3d(text, position, font_size, color, centered, font_id)
```

Parameters

- `text` : `string` - The text to render.
- `position` : [vec3](/dev/api/vector-3) - The position in 3D space where the text will be rendered.
- `font_size` : `number` - The font size of the text.
- `color` : [color](/dev/api/color) - The color of the text.
- `centered` (Optional): `boolean` - Indicates whether the text should be centered at the specified position. Default is `false` .
- `font_id` (Optional): `integer` - The font ID. Default is `0` .

Description

Renders 3D text in the world at the specified position with the given font size and color.

---

### Get Text Width 📐

Syntax

```lua
core.graphics.get_text_width(text, font_size, font_id)
```

Parameters

- `text` : `string` - The text to measure.
- `font_size` : `number` - The font size of the text.
- `font_id` (Optional): `integer` - The font ID. Default is `0` .

Returns

- `number` : The width of the text.

Description

Calculates and returns the width of the specified text, useful for aligning text elements.

---

### Draw 2D Line ✏️

Syntax

```lua
core.graphics.line_2d(start_point, end_point, color, thickness)
```

Parameters

- `start_point` : [vec2](/dev/api/vector-2) - The start point of the line.
- `end_point` : [vec2](/dev/api/vector-2) - The end point of the line.
- `color` : [color](/dev/api/color) - The color of the line.
- `thickness` (Optional): `number` - The thickness of the line. Default is `1` .

Description

Draws a 2D line between two points with the specified color and optional thickness.

---

### Draw 3D Line ✏️🌐

Syntax

```lua
core.graphics.line_3d(start_point, end_point, color, thickness)
```

Parameters

- `start_point` : [vec3](/dev/api/vector-3) - The start point of the line in 3D space.
- `end_point` : [vec3](/dev/api/vector-3) - The end point of the line in 3D space.
- `color` : [color](/dev/api/color) - The color of the line.
- `thickness` (Optional): `number` - The thickness of the line. Default is `1` .

Description

Draws a 3D line between two points with the specified color and optional thickness.

## Example:

Drawing A Line From Local Player To a Unit

```lua
---@type color
local color = require("common/color")

---@param unit game_object
local function draw_line_to_unit(unit)
    if not unit then
        return
    end

    local local_player = core.object_manager.get_local_player()
    if not local_player then
        return nil
    end

    local local_player_position = local_player:get_position()
    local unit_position = unit:get_position()

    core.graphics.line_3d(local_player_position, unit_position, color.cyan(220), 5.0)
end
```

---

### Draw 2D Rectangle Outline 🖼️

Syntax

```lua
core.graphics.rect_2d(top_left_point, width, height, color, thickness, rounding)
```

Parameters

- `top_left_point` : [vec2](/dev/api/vector-2) - The top-left corner point of the rectangle.
- `width` : `number` - The width of the rectangle.
- `height` : `number` - The height of the rectangle.
- `color` : [color](/dev/api/color) - The color of the rectangle outline.
- `thickness` (Optional): `number` - The thickness of the outline. Default is `1` .
- `rounding` (Optional): `number` - The rounding of corners. Default is `0` .

Description

Draws an outlined 2D rectangle with the specified dimensions, color, and optional thickness and rounding.

---

### Draw 2D Filled Rectangle 🖼️🖌️

Syntax

```lua
core.graphics.rect_2d_filled(top_left_point, width, height, color, rounding)
```

Parameters

- `top_left_point` : [vec2](/dev/api/vector-2) - The top-left corner point of the rectangle.
- `width` : `number` - The width of the rectangle.
- `height` : `number` - The height of the rectangle.
- `color` : [color](/dev/api/color) - The fill color of the rectangle.
- `rounding` (Optional): `number` - The rounding of corners. Default is `0` .

Description

Draws a filled 2D rectangle with the specified dimensions, color, and optional rounding.

## Example:

Drawing a 2d filled rect at cursor screen position

```lua
---@type color
local color = require("common/color")

local function render_rect_2d_at_cursor_screen_pos()
    local local_player = core.object_manager.get_local_player()
    if not local_player then
        return nil
    end

    local cursor_pos_2d = core.get_cursor_position()

    core.graphics.rect_2d_filled(cursor_pos_2d, 200, 50, color.cyan_pale(200))
end
```

![](https://downloads.project-sylvanas.net/1727348652550-rect_2d_filled_mousepos.png)

---

### Draw 3D Rectangle Outline 🖼️🌐

Syntax

```lua
core.graphics.rect_3d(p1, p2, p3, p4, color, thickness)
```

Parameters

- `p1` , `p2` , `p3` , `p4` : [vec3](/dev/api/vector-3) - Four points defining the corners of the rectangle in 3D space.
- `color` : [color](/dev/api/color) - The color of the rectangle outline.
- `thickness` (Optional): `number` - The thickness of the outline. Default is `1` .

Description

Draws an outlined 3D rectangle with the specified corner points, color, and optional thickness.

## Example:

How to Render a 3D Rectangle From Local Player to Mouse Position

```lua
---@type color
local color = require("common/color")

local function render_rect_3d_to_mouse()
    local local_player = core.object_manager.get_local_player()
    if not local_player then
        return nil
    end

    local local_player_position = local_player:get_position()
    local cursor_position_3d = core.graphics.get_cursor_world_position()

    core.graphics.rect_3d(local_player_position, cursor_position_3d, 5.0, color.cyan_pale(200), 30.0, 1.5)
end
```

![](https://downloads.project-sylvanas.net/1727347302615-rect_showcase.png)

---

### Draw 3D Rectangle Outline New

Syntax

```lua
core.graphics.render_rect_3d_new(start_pos, end_pos, width, thickness, color)
```

Parameters

- `start_pos` : [vec3](/dev/api/vector-3) - Start position of the rectangle center line.
- `end_pos` : [vec3](/dev/api/vector-3) - End position of the rectangle center line.
- `width` : `number` - Perpendicular width of the rectangle.
- `thickness` : `number` - Outline thickness.
- `color` : [color](/dev/api/color) - The outline color.

Description

Draws a crisp 3D rectangle outline that stays inside the requested bounds. This newer renderer avoids the legacy `rect_3d` thickness compensation behavior.

---

### Draw 3D Filled Rectangle 🖼️🖌️🌐

Syntax

```lua
core.graphics.rect_3d_filled(p1, p2, p3, p4, color)
```

Parameters

- `p1` , `p2` , `p3` , `p4` : [vec3](/dev/api/vector-3) - Four points defining the corners of the rectangle in 3D space.
- `color` : [color](/dev/api/color) - The fill color of the rectangle.

Description

Draws a filled 3D rectangle with the specified corner points and color.

---

### Draw 3D Filled Rectangle New

Syntax

```lua
core.graphics.render_rect_3d_filled_new(start_pos, end_pos, width, color)
```

Parameters

- `start_pos` : [vec3](/dev/api/vector-3) - Start position of the rectangle center line.
- `end_pos` : [vec3](/dev/api/vector-3) - End position of the rectangle center line.
- `width` : `number` - Perpendicular width of the rectangle.
- `color` : [color](/dev/api/color) - The fill color.

Description

Draws a filled 3D rectangle using the newer anti-aliased 3D rectangle renderer.

---

### Draw 3D Polygon

Syntax

```lua
core.graphics.render_polygon_3d(points, color, filled, thickness, border_fade)
```

Parameters

- `points` : `vec3[]` - Vertices in ring order. The renderer accepts up to 256 points.
- `color` : [color](/dev/api/color) - Fill or outline color.
- `filled` : `boolean` - `true` for a filled polygon, `false` for an outline.
- `thickness` (Optional): `number` - Outline width in pixels when `filled` is `false` . Default is `2` .
- `border_fade` (Optional): `number` - Edge feather width in pixels. Default is `2` ; use `0` for a crisp anti-aliased edge.

Description

Draws a 3D polygon from world-space vertices. Convex and concave rings are both supported, in either winding order.

The points must form **one closed ring**, with no self-intersections and no holes. The fill is produced by ear clipping, which is only defined for a simple polygon, so concatenating several separate loops into a single list does not draw several shapes: it triangulates to garbage. Draw each loop as its own `render_polygon_3d` call. This matters most when building a shape out of merged circles, which is a valid single ring only if you trace the union outline rather than appending each circle in turn.

Passing more than 256 points raises a Lua error. It does not silently draw a truncated ring, which would close early and read as a mangled shape rather than as a limit being hit.

On very tight concave notches the filled path can fold the inset that produces the feather. Passing `border_fade = 0` skips the inset entirely and gives a crisp one-pixel anti-aliased edge instead.

> [!NOTE]
> The point cap is a CPU-side limit, not a shader one, and the two costs behave differently. An outline is linear in the point count and effectively free. A filled polygon is triangulated by ear clipping, which is O(n squared): roughly 65,000 point-in-triangle tests at 256 points against 4,000 at 64. That is still small for a handful of polygons per frame, but drawing many large filled polygons every frame is the one case where the count is worth keeping down.

Example Usage

```lua
local me = core.object_manager.get_local_player()
if not me then return end

local pos = me:get_position()
local points = {
    vec3.new(pos.x + 3, pos.y, pos.z),
    vec3.new(pos.x, pos.y + 3, pos.z),
    vec3.new(pos.x - 3, pos.y, pos.z),
    vec3.new(pos.x, pos.y - 3, pos.z),
}

core.graphics.render_polygon_3d(points, color.cyan(180), true)
```

---

### Draw 2D Circle Outline 🎯

Syntax

```lua
core.graphics.circle_2d(center, radius, color, thickness)
```

Parameters

- `center` : [vec2](/dev/api/vector-2) - The center point of the circle.
- `radius` : `number` - The radius of the circle.
- `color` : [color](/dev/api/color) - The color of the circle outline.
- `thickness` (Optional): `number` - The thickness of the outline. Default is `1` .

Description

Draws an outlined 2D circle with the specified center, radius, color, and optional thickness.

---

### Draw 2D Filled Circle 🎯🖌️

Syntax

```lua
core.graphics.circle_2d_filled(center, radius, color)
```

Parameters

- `center` : [vec2](/dev/api/vector-2) - The center point of the circle.
- `radius` : `number` - The radius of the circle.
- `color` : [color](/dev/api/color) - The fill color of the circle.

Description

Draws a filled 2D circle with the specified center, radius, and color.

---

### Draw 3D Circle Outline 🎯🌐

Syntax

```lua
core.graphics.circle_3d(center, radius, color, thickness)
```

Parameters

- `center` : [vec3](/dev/api/vector-3) - The center point of the circle in 3D space.
- `radius` : `number` - The radius of the circle.
- `color` : [color](/dev/api/color) - The color of the circle.
- `thickness` (Optional): `number` - The thickness of the lines forming the circle.

Description

Draws an outlined 3D circle with the specified center, radius, color, and optional thickness.

## Example:

How to Render a 3D Circle at Unit's Position

```lua
---@type color
local color = require("common/color")

local function render_rect_3d_at_unit_position(unit)
    if not unit then
        return
    end

    -- you can avoid this check if you checked it earlier in your code.
    -- It's just to make sure nothing is rendered while on loading screen.
    local local_player = core.object_manager.get_local_player()
    if not local_player then
        return nil
    end

    local unit_position = unit:get_position()
    core.graphics.circle_3d(unit_position, 5.0, color.cyan(230), 40, 1.5)
end
```

![](https://downloads.project-sylvanas.net/1727349247525-circle_3d_showcase.png)

---

### Draw 3D Circle Outline Percentage 🎯🌐📊

Syntax

```lua
core.graphics.circle_3d_percentage(center, radius, color, percentage, thickness)
```

Parameters

- `center` : [vec3](/dev/api/vector-3) - The center point of the circle in 3D space.
- `radius` : `number` - The radius of the circle.
- `color` : [color](/dev/api/color) - The color of the circle outline.
- `percentage` : `number` - The percentage of the circle to render.
- `thickness` (Optional): `number` - The thickness of the outline. Default is `1` .

Description

Draws an outlined 3D circle with the specified center, radius, color, and percentage of the circle to render. Optionally, the thickness can be specified.

> [!TIP]
> This function might be useful to track casts, since you can render the circle up to a unit's current cast completion percentage, for example.

---

### Draw 3D Filled Circle 🎯🖌️🌐

Syntax

```lua
core.graphics.circle_3d_filled(center, radius, color)
```

Parameters

- `center` : [vec3](/dev/api/vector-3) - The center point of the circle in 3D space.
- `radius` : `number` - The radius of the circle.
- `color` : [color](/dev/api/color) - The fill color of the circle.

Description

Draws a filled 3D circle with the specified center, radius, and color.

---

### Draw 2D Filled Triangle 🔺🖌️

Syntax

```lua
core.graphics.triangle_2d_filled(p1, p2, p3, color)
```

Parameters

- `p1` , `p2` , `p3` : [vec2](/dev/api/vector-2) - Three points defining the corners of the triangle in 2D space.
- `color` : [color](/dev/api/color) - The fill color of the triangle.

Description

Draws a filled 2D triangle with the specified corner points and color.

---

### Draw 3D Filled Triangle 🔺🖌️🌐

Syntax

```lua
core.graphics.triangle_3d_filled(p1, p2, p3, color)
```

Parameters

- `p1` , `p2` , `p3` : [vec3](/dev/api/vector-3) - Three points defining the corners of the triangle in 3D space.
- `color` : [color](/dev/api/color) - The fill color of the triangle.

Description

Draws a filled 3D triangle with the specified corner points and color.

---

### Draw 2D Gradient Circle 🎯🎨

Syntax

```lua
core.graphics.circle_2d_gradient(center, radius, color_1, color_2, color_3, thickness)
```

Parameters

- `center` : [vec2](/dev/api/vector-2) - The center point of the circle.
- `radius` : `number` - The radius of the circle.
- `color_1` : [color](/dev/api/color) - The first gradient color.
- `color_2` : [color](/dev/api/color) - The second gradient color.
- `color_3` : [color](/dev/api/color) - The third gradient color.
- `thickness` (Optional): `number` - The thickness of the outline. Default is `1` .

Description

Draws a gradient 2D circle with the specified center, radius, colors, and optional thickness.

---

### Draw 3D Gradient Circle 🎯🎨🌐

Syntax

```lua
core.graphics.circle_3d_gradient(center, radius, color_1, color_2, color_3, thickness)
```

Parameters

- `center` : [vec3](/dev/api/vector-3) - The center point of the circle in 3D space.
- `radius` : `number` - The radius of the circle.
- `color_1` : [color](/dev/api/color) - The first gradient color.
- `color_2` : [color](/dev/api/color) - The second gradient color.
- `color_3` : [color](/dev/api/color) - The third gradient color.
- `thickness` (Optional): `number` - The thickness of the outline. Default is `1` .

Description

Draws a gradient 3D circle with the specified center, radius, colors, and optional thickness.

---

### Draw 3D Gradient Circle Percentage 🎯🎨🌐📊

Syntax

```lua
core.graphics.circle_3d_gradient_percentage(center, radius, color_1, color_2, color_3, percentage, thickness)
```

Parameters

- `center` : [vec3](/dev/api/vector-3) - The center point of the circle in 3D space.
- `radius` : `number` - The radius of the circle.
- `color_1` : [color](/dev/api/color) - The first gradient color.
- `color_2` : [color](/dev/api/color) - The second gradient color.
- `color_3` : [color](/dev/api/color) - The third gradient color.
- `percentage` : `number` - The percentage of the circle to render.
- `thickness` (Optional): `number` - The thickness of the outline. Default is `1` .

Description

Draws a partial gradient 3D circle with the specified center, radius, colors, percentage, and optional thickness.

---

### Draw 3D Cone 🔺🌐

Syntax

```lua
core.graphics.cone_3d(center, target_pos, radius, angle_degrees, color, fade_power)
```

Parameters

- `center` : [vec3](/dev/api/vector-3) - The origin point of the cone in 3D space.
- `target_pos` : [vec3](/dev/api/vector-3) - The target position the cone is aimed at.
- `radius` : `number` - The radius of the cone.
- `angle_degrees` : `number` - The angle of the cone in degrees.
- `color` : [color](/dev/api/color) - The color of the cone.
- `fade_power` (Optional): `number` - The fade power of the cone.

Description

Draws a 3D cone from the center towards the target position with the specified radius, angle, color, and optional fade power.

---

### Translate Virtual Key to String ⌨️

Syntax

```lua
core.graphics.translate_vkey_to_string(key)
```

Parameters

- `key` : `integer` - The virtual key code.

Returns

- `string` : A human-readable string representation of the virtual key code.

Description

Converts a virtual key code to a human-readable string.

---

### Scale Width to Screen Size 📏

Syntax

```lua
core.graphics.scale_width_to_screen_size(value, main_resolution)
```

Parameters

- `value` : `number` - The width value to scale.
- `main_resolution` : `number` - The reference resolution width.

Returns

- `number` : The scaled width value matching the current screen size.

Description

Scales a width value to match the current screen size based on a reference resolution.

---

### Scale Height to Screen Size 📏

Syntax

```lua
core.graphics.scale_height_to_screen_size(value, main_resolution)
```

Parameters

- `value` : `number` - The height value to scale.
- `main_resolution` : `number` - The reference resolution height.

Returns

- `number` : The scaled height value matching the current screen size.

Description

Scales a height value to match the current screen size based on a reference resolution.

---

### Scale Size to Screen Size 📏

Syntax

```lua
core.graphics.scale_size_to_screen_size(value, main_resolution)
```

Parameters

- `value` : [vec2](/dev/api/vector-2) - The size to scale.
- `main_resolution` : [vec2](/dev/api/vector-2) - The reference resolution.

Returns

- [vec2](/dev/api/vector-2) : The scaled size matching the current screen size.

Description

Scales a size to match the current screen size based on a reference resolution.

---

### Native Intersect 🧭

Syntax

```lua
core.graphics.native_intersect(end_pos, start_pos, distance, hit_mask)
```

Parameters

- `end_pos` : [vec3](/dev/api/vector-3) - The end position of the ray.
- `start_pos` : [vec3](/dev/api/vector-3) - The start position of the ray.
- `distance` (Optional): `number` - The maximum ray distance.
- `hit_mask` : `integer` - The hit mask flags for the intersection test. Same values as `trace_line` 's `flags` , see `enums.collision_flags` .

Returns

- `boolean` : `true` if the ray intersected something, `false` otherwise.
- [vec3](/dev/api/vector-3) : The position where the ray hit.
- `number` : The distance of the hit from the start position.

Description

Performs a ray intersection test from the start position to the end position. Returns whether a hit occurred, the hit position, and the hit distance.

> [!WARNING]
> Same rule as `trace_line`: `EntityRender` (`0x200000`) and higher crashed the 2.5.6 client, so those bits are refused with a Lua error on the Classic versions.

> [!NOTE]
> Game objects such as stoves, chairs and benches, and a few static models such as some rope bridges and hut walls, are **not** hit with any mask, even though your character collides with them while moving. Ordinary doodads such as crates are hit with `DoodadCollision`. If you build stuck detection or a mesh scanner on this, those objects will be invisible to it for now.

---

### Load Font 🔤

Syntax

```lua
core.graphics.load_font(font_data, font_size)
```

Parameters

- `font_data` : `string` - The raw binary data of the font.
- `font_size` : `number` - The font size.

Returns

- `integer` : The font ID that can be used with text rendering functions.

Description

Loads a custom font from raw binary data and returns a font ID for use with text rendering functions.

---

### Load Image 🖼️

Syntax

```lua
core.graphics.load_image(path_to_asset)
```

Parameters

- `path_to_asset` : `string` - The path to the image asset in scripts_data.

Description

Loads an image from scripts_data for later rendering.

---

### Draw Image 🖼️✏️

Syntax

```lua
core.graphics.draw_image(image, position)
```

Parameters

- `image` : The loaded image object.
- `position` : [vec2](/dev/api/vector-2) - The position where the image will be drawn.

Description

Draws a previously loaded image at the specified screen position.

---

### Load Texture 🖼️

Syntax

```lua
core.graphics.load_texture(image_data)
```

Parameters

- `image_data` : `string` - The raw binary data of the texture.

Returns

- `integer` : The texture ID for use with texture drawing functions.

Description

Loads a texture from raw binary data and returns a texture ID.

---

### Unload Texture 🗑️

Syntax

```lua
core.graphics.unload_texture(texture_id)
```

Parameters

- `texture_id` : `integer` - The id `load_texture` returned.

Returns

- `boolean` : `true` when this plugin's reference was dropped; `false` for an unknown id or one this plugin never loaded.

Description

Frees a texture this plugin loaded. Needs core 2.135 or newer. Use it for icon or map tile caches: the game has a hard limit of 10000 textures, and a plugin that only ever loads will eventually hit it.

- The id is a hash of the image, so two plugins loading the same image share it. It is freed when the **last** plugin that loaded it unloads it.
- From this call on, `draw_texture` with that id draws nothing. Loading the same image again gives the same id back.
- Still images only, not `load_gif` / `load_png_sequence` .
- Reloading a plugin frees every texture it does not load again.

---

### Draw Texture 🖼️✏️

Syntax

```lua
core.graphics.draw_texture(texture_id, top_left, width, height, color, is_for_window)
```

Parameters

- `texture_id` : `integer` - The texture ID returned by `load_texture` .
- `top_left` : [vec2](/dev/api/vector-2) - The top-left position to draw the texture.
- `width` : `number` - The width of the texture.
- `height` : `number` - The height of the texture.
- `color` (Optional): [color](/dev/api/color) - The tint color of the texture.
- `is_for_window` (Optional): `boolean` - Whether the texture is for a window.

Description

Draws a loaded texture at the specified position with the given dimensions and optional color tint.

---

### Draw Texture Rect 🖼️✏️

Syntax

```lua
core.graphics.draw_texture_rect(texture_id, top_left, width, height, uv0_x, uv0_y, uv1_x, uv1_y, color, is_for_window)
```

Parameters

- `texture_id` : `integer` - The texture ID returned by `load_texture` .
- `top_left` : [vec2](/dev/api/vector-2) - The top-left position to draw the texture.
- `width` : `number` - The width of the texture.
- `height` : `number` - The height of the texture.
- `uv0_x` : `number` - The U coordinate of the top-left UV.
- `uv0_y` : `number` - The V coordinate of the top-left UV.
- `uv1_x` : `number` - The U coordinate of the bottom-right UV.
- `uv1_y` : `number` - The V coordinate of the bottom-right UV.
- `color` (Optional): [color](/dev/api/color) - The tint color of the texture.
- `is_for_window` (Optional): `boolean` - Whether the texture is for a window.

Description

Draws a textured rectangle with UV coordinates, allowing you to render a specific portion of a texture.

---

### Draw Texture Faded 🖼️🌫️

Syntax

```lua
core.graphics.draw_texture_faded(texture_id, top_left, width, height, fade_l, fade_t, fade_r, fade_b, color, is_for_window)
```

Parameters

- `texture_id` : `integer` - The texture handle returned by `load_texture` .
- `top_left` : [vec2](/dev/api/vector-2) - The screen position of the top-left corner.
- `width` : `number` - The draw width in pixels.
- `height` : `number` - The draw height in pixels.
- `fade_l` (Optional): `number` - Left fade width as a fraction of `width` ( `0` to `0.49` ). Default is `0` .
- `fade_t` (Optional): `number` - Top fade height as a fraction of `height` ( `0` to `0.49` ). Default is `0` .
- `fade_r` (Optional): `number` - Right fade width as a fraction of `width` ( `0` to `0.49` ). Default is `0` .
- `fade_b` (Optional): `number` - Bottom fade height as a fraction of `height` ( `0` to `0.49` ). Default is `0` .
- `color` (Optional): [color](/dev/api/color) - The tint color; its alpha is the ramp's full value. Default is white.
- `is_for_window` (Optional): `boolean` - If `true` , draws to the current window draw list. Default is `false` (background).

Description

Draws a texture whose edges dissolve into the background.

Use this when the source art is not a clean cut-out — a character render exported over its own opaque backdrop, for example. The tint alpha of a plain `draw_texture` call is uniform across the quad, so it can only make such an image fainter, never edgeless.

Each fade is a fraction of the drawn width or height over which alpha ramps from `0` at that edge up to full; `0` leaves that edge hard. Opposing pairs are clamped so they cannot cross.

> [!NOTE]
> The quad is emitted as a 4x4 vertex grid and the GPU interpolates the ramp, so it costs one texture bind and up to nine quads regardless of how large the fades are.

**Example Usage**

```lua
-- Dissolve the sides and bottom, leave the top alone
core.graphics.draw_texture_faded(tex_id, vec2.new(100, 100), 64, 64,
    0.25, 0.0, 0.25, 0.30, color.white(220), true)
```

---

### Scissor Push ✂️

Syntax

```lua
core.graphics.scissor_push(x, y, w, h)
```

Parameters

- `x` : `number` - The x-position of the clipping rectangle.
- `y` : `number` - The y-position of the clipping rectangle.
- `w` : `number` - The width of the clipping rectangle.
- `h` : `number` - The height of the clipping rectangle.

Description

Pushes a clipping rectangle onto the scissor stack. All subsequent draw calls will be clipped to this rectangle.

---

### Scissor Pop ✂️

Syntax

```lua
core.graphics.scissor_pop()
```

Description

Pops the current clipping rectangle from the scissor stack.

---

### Capture Next Mouse Input 🖱️

Syntax

```lua
core.graphics.capture_next_mouse_input()
```

Description

Captures the next mouse input event.

---

### Capture Next Keyboard Input ⌨️

Syntax

```lua
core.graphics.capture_next_keyboard_input()
```

Description

Captures the next keyboard input event.

---

### Set Mouse Capture State 🖱️

Syntax

```lua
core.graphics.set_mouse_capture_state(state)
```

Parameters

- `state` : `boolean` - Whether to enable or disable hard mouse input capture.

Description

Sets the hard mouse input capture state.

---

### Set Keyboard Capture State ⌨️

Syntax

```lua
core.graphics.set_keyboard_capture_state(state)
```

Parameters

- `state` : `boolean` - Whether to enable or disable hard keyboard input capture.

Description

Sets the hard keyboard input capture state.

---

### Get Main Menu Screen Position 📋

Syntax

```lua
core.graphics.get_main_menu_screen_pos()
```

Returns

- [vec2](/dev/api/vector-2) : The main menu screen position.

Description

Returns the main menu screen position.

---

### Get Main Menu Screen Size 📋📏

Syntax

```lua
core.graphics.get_main_menu_screen_size()
```

Returns

- [vec2](/dev/api/vector-2) : The main menu screen size.

Description

Returns the main menu screen size.

---

### Get Current Control Panel Element Label 📋

Syntax

```lua
core.graphics.get_current_control_panel_element_label()
```

Returns

- `string` : The current control panel element label.

Description

Gets the label of the current control panel element.

---

### Set Current Control Panel Element Label 📋

Syntax

```lua
core.graphics.set_current_control_panel_element_label(label)
```

Parameters

- `label` : `string` - The label to set for the current control panel element.

Description

Sets the label of the current control panel element.

---

### Render System Menu 📋

Syntax

```lua
core.graphics.render_system_menu()
```

Description

Renders the system menu.

---

## GIF Support 🎞️

### Load GIF 🎞️

Syntax

```lua
core.graphics.load_gif(gif_data)
```

Parameters

- `gif_data` : `string` - The raw binary data of the GIF file.

Returns

- `integer` : The GIF ID for use with `draw_gif` .
- `integer` : The width of the GIF in pixels.
- `integer` : The height of the GIF in pixels.
- `integer` : The total number of frames.
- `integer` : The total animation duration in milliseconds.

Returns `nil` if the GIF data is invalid or could not be parsed.

Description

Loads an animated GIF from raw binary data and returns a GIF ID along with its dimensions and timing info. If the GIF was already loaded, the cached metadata is returned immediately. Frame upload to the GPU happens asynchronously — `draw_gif` silently no-ops until frames are ready.

**Example Usage**

```lua
local gif_data = core.read_file("my_animation.gif")
local gif_id, w, h, frames, duration_ms = core.graphics.load_gif(gif_data)
if gif_id then
    core.log("Loaded GIF: " .. w .. "x" .. h .. ", " .. frames .. " frames, " .. duration_ms .. "ms")
end
```

---

### Load PNG Sequence 🎞️

Syntax

```lua
core.graphics.load_png_sequence(frames, frame_ms)
```

Parameters

- `frames` : `string[]` - Array of raw PNG binary data, one entry per frame, indexed `1..N` in playback order.
- `frame_ms` (Optional): `integer` - How long each frame is shown, in milliseconds. Default is `33` .

Returns

- `integer` : The sequence ID for use with `draw_gif` .
- `integer` : The width in pixels.
- `integer` : The height in pixels.
- `integer` : The total number of frames.
- `integer` : The total animation duration in milliseconds.

Returns `nil` if `frames` is empty, if `frame_ms` is zero or negative, or if any frame fails to decode.

Description

Builds an animated sequence from a list of individual PNG images. This is the alternative to `load_gif` when your source art is a folder of numbered frames rather than a single animated GIF file. The returned ID goes through `draw_gif` unchanged, so playback, speed, offset and UV cropping all behave identically.

Every frame must match the dimensions of frame `1`. A frame that is a different size, or that cannot be decoded, aborts the whole load and returns `nil` rather than playing a partial animation.

Loading is cached on the frame data itself, so calling this again with the same frames returns the existing ID immediately instead of re-decoding. As with `load_gif`, GPU upload is asynchronous and `draw_gif` silently no-ops until it completes.

> [!NOTE]
> `frame_ms` is stored at 1/100s resolution, so it is rounded **down** to a multiple of `10` (a value of `33` plays at `30`ms), and then floored at `20`ms for a 50 FPS playback cap.
>
> The ID is also returned while the sequence is still queued for upload, and in that case the width, height, frame count and duration all come back as `0`. Read those values from the first call, or re-read them once the animation starts drawing.

**Example Usage**

```lua
-- Load a numbered frame set out of scripts_data at 25 FPS
local frames = {}
for i = 1, 60 do
    frames[i] = core.read_data_file(string.format("my_plugin/anim/frame_%03d.png", i))
end

local seq_id, w, h, count, duration_ms = core.graphics.load_png_sequence(frames, 40)
if seq_id then
    core.log("Loaded sequence: " .. w .. "x" .. h .. ", " .. count .. " frames, " .. duration_ms .. "ms")
end
```

---

### Draw GIF 🎞️✏️

Syntax

```lua
core.graphics.draw_gif(gif_id, top_left, width, height, color, is_for_window, speed,
                       time_offset_s, uv0_x, uv0_y, uv1_x, uv1_y)
```

Parameters

- `gif_id` : `integer` - The ID returned by `load_gif` or `load_png_sequence` .
- `top_left` : [vec2](/dev/api/vector-2) - The top-left position to draw the GIF.
- `width` : `number` - The display width.
- `height` : `number` - The display height.
- `color` (Optional): [color](/dev/api/color) - The tint color. Default is white.
- `is_for_window` (Optional): `boolean` - Whether the GIF is for a window draw list. Default is `false` .
- `speed` (Optional): `number` - The playback speed multiplier. Default is `1.0` .
- `time_offset_s` (Optional): `number` - Playback offset in real seconds, added before the speed multiplier is applied. Default is `0` .
- `uv0_x` (Optional): `number` - Left edge of the sampled sub-rect, `0.0` to `1.0` . Default is `0` .
- `uv0_y` (Optional): `number` - Top edge of the sampled sub-rect, `0.0` to `1.0` . Default is `0` .
- `uv1_x` (Optional): `number` - Right edge of the sampled sub-rect, `0.0` to `1.0` . Default is `1` .
- `uv1_y` (Optional): `number` - Bottom edge of the sampled sub-rect, `0.0` to `1.0` . Default is `1` .

Description

Draws an animated GIF or PNG sequence at the specified position. The current frame is selected automatically based on elapsed time and the speed multiplier. Silently skips if the frames have not finished uploading to the GPU yet.

`time_offset_s` shifts where in the loop the animation is right now. Two draws of the same ID half a loop apart give you a cross-fade with no visible seam, and a per-instance offset keeps a row of identical animations from marching in lockstep.

`uv0_x` / `uv0_y` / `uv1_x` / `uv1_y` select a sub-rect of the source instead of the whole frame, so you can crop to one region of a wider animation. The default `0,0` to `1,1` rect is the full frame.

All five trailing arguments are optional, so the plain seven-argument call is unchanged.

**Example Usage**

```lua
-- Draw at half speed
core.graphics.draw_gif(gif_id, vec2:new(100, 100), 200, 150, nil, false, 0.5)

-- Two copies half a loop apart, cross-faded so the loop seam never shows.
-- duration_ms comes from load_gif / load_png_sequence.
local half_loop_s = (duration_ms / 1000) * 0.5
core.graphics.draw_gif(gif_id, vec2:new(100, 100), 200, 150, fade_in, false, 1.0, 0.0)
core.graphics.draw_gif(gif_id, vec2:new(100, 100), 200, 150, fade_out, false, 1.0, half_loop_s)

-- Crop to the left half of the source frame
core.graphics.draw_gif(gif_id, vec2:new(100, 300), 100, 150, nil, false, 1.0, 0.0,
                       0.0, 0.0, 0.5, 1.0)
```

---

## SDF Shader Rendering 🎨

GPU-accelerated pixel shader functions for modern UI rendering. All SDF functions use screen-space coordinates (`vec2` min/max corners).

### Render Smooth Rect

Syntax

```lua
core.graphics.render_smooth_rect(p_min, p_max, color, rounding, softness)
```

Parameters

- `p_min` : [vec2](/dev/api/vector-2) - Top-left corner.
- `p_max` : [vec2](/dev/api/vector-2) - Bottom-right corner.
- `color` : [color](/dev/api/color) - The fill color.
- `rounding` (Optional): `number` - Corner rounding radius. Default `4.0` .
- `softness` (Optional): `number` - Edge softness. Default `1.0` .

Description

Draws a filled rectangle with smooth (anti-aliased) edges using a pixel shader.

---

### Render Drop Shadow

Syntax

```lua
core.graphics.render_drop_shadow(p_min, p_max, color, offset_x, offset_y, element_w, element_h, rounding, softness, spread)
```

Parameters

- `p_min` : [vec2](/dev/api/vector-2) - Top-left corner of the shadow quad.
- `p_max` : [vec2](/dev/api/vector-2) - Bottom-right corner of the shadow quad.
- `color` : [color](/dev/api/color) - The shadow color.
- `offset_x` : `number` - Horizontal shadow offset.
- `offset_y` : `number` - Vertical shadow offset.
- `element_w` : `number` - Width of the element casting the shadow.
- `element_h` : `number` - Height of the element casting the shadow.
- `rounding` (Optional): `number` - Corner rounding radius. Default `6.0` .
- `softness` (Optional): `number` - Shadow blur softness. Default `8.0` .
- `spread` (Optional): `number` - Shadow spread. Default `0.0` .

Description

Draws a GPU-accelerated drop shadow behind a UI element.

---

### Render Border Rect

Syntax

```lua
core.graphics.render_border_rect(p_min, p_max, fill, border, rounding, softness, thickness)
```

Parameters

- `p_min` : [vec2](/dev/api/vector-2) - Top-left corner.
- `p_max` : [vec2](/dev/api/vector-2) - Bottom-right corner.
- `fill` : [color](/dev/api/color) - The fill color.
- `border` : [color](/dev/api/color) - The border color.
- `rounding` (Optional): `number` - Corner rounding radius. Default `4.0` .
- `softness` (Optional): `number` - Edge softness. Default `1.0` .
- `thickness` (Optional): `number` - Border thickness. Default `1.0` .

Description

Draws a filled rectangle with a smooth border using a pixel shader.

---

### Render Linear Gradient

Syntax

```lua
core.graphics.render_linear_gradient(p_min, p_max, color_a, color_b, angle, rounding, softness)
```

Parameters

- `p_min` : [vec2](/dev/api/vector-2) - Top-left corner.
- `p_max` : [vec2](/dev/api/vector-2) - Bottom-right corner.
- `color_a` : [color](/dev/api/color) - The start gradient color.
- `color_b` : [color](/dev/api/color) - The end gradient color.
- `angle` (Optional): `number` - Gradient angle in radians. Default `0.0` .
- `rounding` (Optional): `number` - Corner rounding radius. Default `0.0` .
- `softness` (Optional): `number` - Edge softness. Default `0.0` .

Description

Draws a rectangle filled with a linear gradient between two colors.

---

### Render Keybind Pill

Syntax

```lua
core.graphics.render_keybind_pill(p_min, p_max, base, elev, accent, rounding, hover, listening, time_val, speed)
```

Parameters

- `p_min` : [vec2](/dev/api/vector-2) - Top-left corner.
- `p_max` : [vec2](/dev/api/vector-2) - Bottom-right corner.
- `base` : [color](/dev/api/color) - The base color.
- `elev` : [color](/dev/api/color) - The elevation/highlight color.
- `accent` : [color](/dev/api/color) - The accent color.
- `rounding` (Optional): `number` - Corner rounding radius. Default `6.0` .
- `hover` (Optional): `number` - Hover interpolation value (0.0-1.0). Default `0.0` .
- `listening` (Optional): `number` - Listening/active state value (0.0-1.0). Default `0.0` .
- `time_val` (Optional): `number` - Animation time value. Default `0.0` .
- `speed` (Optional): `number` - Animation speed multiplier. Default `1.0` .

Description

Draws a styled keybind pill button with hover and listening state animations.

---

### Render Dropdown Field

Syntax

```lua
core.graphics.render_dropdown_field(p_min, p_max, base, elev, accent, rounding, hover, open, time_val, speed)
```

Parameters

- `p_min` : [vec2](/dev/api/vector-2) - Top-left corner.
- `p_max` : [vec2](/dev/api/vector-2) - Bottom-right corner.
- `base` : [color](/dev/api/color) - The base color.
- `elev` : [color](/dev/api/color) - The elevation/highlight color.
- `accent` : [color](/dev/api/color) - The accent color.
- `rounding` (Optional): `number` - Corner rounding radius. Default `4.0` .
- `hover` (Optional): `number` - Hover interpolation value (0.0-1.0). Default `0.0` .
- `open` (Optional): `number` - Open state value (0.0-1.0). Default `0.0` .
- `time_val` (Optional): `number` - Animation time value. Default `0.0` .
- `speed` (Optional): `number` - Animation speed multiplier. Default `1.0` .

Description

Draws a styled dropdown field with hover and open state animations.

---

### Render Section Header

Syntax

```lua
core.graphics.render_section_header(p_min, p_max, primary, secondary, accent, head_split, rounding, hover, open, time_val, speed)
```

Parameters

- `p_min` : [vec2](/dev/api/vector-2) - Top-left corner.
- `p_max` : [vec2](/dev/api/vector-2) - Bottom-right corner.
- `primary` : [color](/dev/api/color) - The primary color.
- `secondary` : [color](/dev/api/color) - The secondary color.
- `accent` : [color](/dev/api/color) - The accent color.
- `head_split` (Optional): `number` - Header split ratio. Default `1.0` .
- `rounding` (Optional): `number` - Corner rounding radius. Default `4.0` .
- `hover` (Optional): `number` - Hover interpolation value (0.0-1.0). Default `0.0` .
- `open` (Optional): `number` - Open/collapsed state value (0.0-1.0). Default `0.0` .
- `time_val` (Optional): `number` - Animation time value. Default `0.0` .
- `speed` (Optional): `number` - Animation speed multiplier. Default `1.0` .

Description

Draws a styled collapsible section header with hover and open/close animations.

---

### Render Slider Track

Syntax

```lua
core.graphics.render_slider_track(p_min, p_max, fill_lo, fill_hi, rail, fill_t, rounding, hover, time_val, speed)
```

Parameters

- `p_min` : [vec2](/dev/api/vector-2) - Top-left corner.
- `p_max` : [vec2](/dev/api/vector-2) - Bottom-right corner.
- `fill_lo` : [color](/dev/api/color) - The fill color at the low end.
- `fill_hi` : [color](/dev/api/color) - The fill color at the high end.
- `rail` : [color](/dev/api/color) - The unfilled rail color.
- `fill_t` : `number` - The fill amount (0.0-1.0).
- `rounding` (Optional): `number` - Corner rounding radius. Default `3.0` .
- `hover` (Optional): `number` - Hover interpolation value (0.0-1.0). Default `0.0` .
- `time_val` (Optional): `number` - Animation time value. Default `0.0` .
- `speed` (Optional): `number` - Animation speed multiplier. Default `1.0` .

Description

Draws a styled slider track with a gradient fill and unfilled rail.

---

### Render Hover Pill

Syntax

```lua
core.graphics.render_hover_pill(p_min, p_max, base, streak, rounding, softness, density, time_val, speed)
```

Parameters

- `p_min` : [vec2](/dev/api/vector-2) - Top-left corner.
- `p_max` : [vec2](/dev/api/vector-2) - Bottom-right corner.
- `base` : [color](/dev/api/color) - The base color.
- `streak` : [color](/dev/api/color) - The animated streak color.
- `rounding` (Optional): `number` - Corner rounding radius. Default `6.0` .
- `softness` (Optional): `number` - Edge softness. Default `1.0` .
- `density` (Optional): `number` - Streak density. Default `1.0` .
- `time_val` (Optional): `number` - Animation time value. Default `0.0` .
- `speed` (Optional): `number` - Animation speed multiplier. Default `1.0` .

Description

Draws a pill-shaped hover highlight with animated streaking effects.

---

### Render Circle Percentage

Syntax

```lua
core.graphics.render_circle_percentage(p_min, p_max, bg_color, fill_start_color, fill_end_color, progress, start_angle_rad, direction, inner_norm, outer_norm, softness)
```

Parameters

- `p_min` : [vec2](/dev/api/vector-2) - Top-left corner in screen space.
- `p_max` : [vec2](/dev/api/vector-2) - Bottom-right corner in screen space.
- `bg_color` : [color](/dev/api/color) - Background ring color.
- `fill_start_color` : [color](/dev/api/color) - Fill gradient start color.
- `fill_end_color` : [color](/dev/api/color) - Fill gradient end color.
- `progress` : `number` - Fill fraction from `0.0` to `1.0` .
- `start_angle_rad` (Optional): `number` - Arc start angle in radians. Default is `-pi/2` .
- `direction` (Optional): `number` - Positive values draw clockwise, negative values draw counter-clockwise. Default is `1.0` .
- `inner_norm` (Optional): `number` - Inner radius normalized from `0.0` to `1.0` . Default is `0.70` .
- `outer_norm` (Optional): `number` - Outer radius normalized from `0.0` to `1.0` . Default is `0.98` .
- `softness` (Optional): `number` - Edge softness in pixels. Default is `1.0` .

Description

Draws a 2D circular progress ring using an SDF pixel shader. Use this for UI cooldown rings, cast progress, or compact status indicators.

---

### Render Circle Percentage 3D

Syntax

```lua
core.graphics.render_circle_percentage_3d(world_pos, world_radius, bg_color, fill_start_color, fill_end_color, progress, start_angle_rad, direction, inner_norm, outer_norm, softness)
```

Parameters

- `world_pos` : [vec3](/dev/api/vector-3) - Center position in world space.
- `world_radius` : `number` - Circle radius in world units.
- `bg_color` : [color](/dev/api/color) - Background ring color.
- `fill_start_color` : [color](/dev/api/color) - Fill gradient start color.
- `fill_end_color` : [color](/dev/api/color) - Fill gradient end color.
- `progress` : `number` - Fill fraction from `0.0` to `1.0` .
- `start_angle_rad` (Optional): `number` - Arc start angle in radians. Default is `-pi/2` .
- `direction` (Optional): `number` - Positive values draw clockwise, negative values draw counter-clockwise. Default is `1.0` .
- `inner_norm` (Optional): `number` - Inner radius normalized from `0.0` to `1.0` . Default is `0.70` .
- `outer_norm` (Optional): `number` - Outer radius normalized from `0.0` to `1.0` . Default is `0.98` .
- `softness` (Optional): `number` - Edge softness in pixels. Default is `1.0` .

Description

Draws a circular progress ring in world space using the same SDF shader as `render_circle_percentage`.