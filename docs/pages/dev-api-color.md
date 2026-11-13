# Lua Color Module Documentation

> Source: <https://docs.project-sylvanas.net/dev/api/color>

## Overview

The Lua Color Module provides functions for handling colors in Lua scripts. These functions allow for color creation, manipulation, blending, and predefined color creation.

## Importing The Module

> [!WARNING]
> This is a Lua library stored inside the "common" folder. To use it, you will need to include the library. Use the `require` function and store it in a local variable.
>
> Here is an example of how to do it:
>
> ```lua
> -- recomended "color" name for consistency
> ---@type color
> local color = require("common/color");
> ```

## Functions

### Color New

`color.new`

- Creates a new color object with the specified RGBA components.

```lua
local example_white_color = color.new(255, 255, 255, 255)
```

### Color Clone

`color:clone`

- Clones the current color object.

```lua
local example_red_transparent_color = color.new(255, 0, 0, 150)
local cloned_color = example_red_transparent_color :clone()
```

### Color Blend

`color:blend`

- Blends the current color with another color using the specified alpha value.

```lua
local other_color = color.new(255, 0, 0, 255)
local color_instance = color.new(0, 0, 255, 255)
local blended_color = color_instance:blend(other_color, 150)
```

### Color Set

`color:set`

- Sets the RGBA components of the color.

```lua
local color_instance = color.new(255, 255, 255, 255)
-- now color_instance is white full alpha

color_instance:set(255, 0, 0, 150)
-- now color instance is red half transparent
```

### Color Get

`color:get`

- Retrieves the RGBA components of the color.

```lua
local test_color = color_instance:get()
```

### Color Clamp

`color:clamp`

- Clamps the RGBA components of the color to the range [0, 255].

### HSV To RGB

`color.hsv_to_rgb(h, s, v)`

- `h`: Number - The hue.
- `s`: Number - The saturation.
- `v`: Number - The value (brightness).
- Returns: `color` - The equivalent RGB color.

```lua
-- Sweep the hue while keeping saturation and brightness fixed
local hue = (core.time() * 0.2) % 1.0
local swept = color.hsv_to_rgb(hue, 0.8, 1.0)
```

> [!TIP]
> HSV is much easier to animate than RGB — vary the hue for a smooth colour cycle, or drop the value to dim a colour without shifting its tone.

### Get Rainbow Color

`color.get_rainbow_color(ratio)`

- `ratio`: Number - Controls how fast the colour cycles.
- Returns: `color` - A colour that shifts over time.

```lua
core.graphics.add_notification(notification_id, "[Notifying]", "RMB Was Pressed!", 5, color.get_rainbow_color(20))
```

## Predefined Color Functions

The module also provides predefined color functions for commonly used colors:

- `color.red`
- `color.green`
- `color.blue`
- `color.white`
- `color.black`
- `color.yellow`
- `color.pink`
- `color.purple`
- `color.gray`
- `color.brown`
- `color.gold`
- `color.silver`
- `color.orange`
- `color.cyan`
- `color.red_pale`
- `color.green_pale`
- `color.blue_pale`
- `color.cyan_pale`
- `color.gray_pale`

## Code Examples

```lua
-- Example usage of creating and blending colors
local color1 = color.new(255, 0, 0, 255) -- Red color
local color2 = color.new(0, 255, 0, 255) -- Green color

-- Blend colors with alpha of 0.5
local blended_color = color1:blend(color2, 0.5)

core.log(blended_color:get()) -- Output: 127, 127, 0, 255 (Yellow color)
```