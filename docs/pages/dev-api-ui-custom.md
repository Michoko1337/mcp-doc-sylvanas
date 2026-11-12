# Custom UI

> Source: <https://docs.project-sylvanas.net/dev/api/ui/custom>

## Overview

The Lua Menu Element Window module provides a range of functions for creating and managing custom GUI windows in Lua scripts. This module allows developers to design sophisticated interfaces with various visual elements and controls.

### Create New Window 📃

`core.menu.window.new(id)`

- `id`: String - The unique identifier for the window.
- Returns: `window` - A new window instance.

> Creates a new window with the specified ID. Remember this should always be called outside of the render callback, since we are creating a new unique instance of a window.

### Set Initial Size 📃

`window:set_initial_size(size)`

- `size` : [vec2](/dev/api/vector-2) - The initial size of the window.

> [!NOTE]
> This function just sets the initial size of the window. It can be overriden later, either by user input or by code by calling this function inside the render callback (this is not the recommended behaviour)

### Set Initial Position 📃

`window:set_initial_position(pos)`

- `pos` : [vec2](/dev/api/vector-2) - The initial position of the window.

> [!NOTE]
> This function just sets the initial position of the window. It can be overriden later, either by user input or by code by calling the "force_next_begin_window_pos" function inside the render callback (this is not the recommended behaviour)

### Set Next Close Cross Position Offset 📃

`window:set_next_window_close_cross_pos_offset(pos_offset)`

- `pos_offset` : [vec2](/dev/api/vector-2) - The position offset for the close cross.

> [!NOTE]
> This function will add an offset on the close cross position. By default, it is rendered at the top-right corner of the window.

### Add Menu Element Position Offset 📃

`window:add_menu_element_pos_offset(pos_offset)`

- `pos_offset` : [vec2](/dev/api/vector-2) - The position offset for menu elements.

> [!NOTE]
> This function will add a position offset to the internal dynamic position variable. See "The Advanceds - Explaining Dynamic Drawing" for a more in-depth explanation on the matter.

### Get Window Size 📃

`window:get_size()`

- Returns: [vec2](/dev/api/vector-2) - The current size of the window.

### Get Window Position 📃

`window:get_position()`

- Returns: [vec2](/dev/api/vector-2) - The current position of the window.

### Get Mouse Position 📃

`window:get_mouse_pos()`

- Returns: [vec2](/dev/api/vector-2) - The current mouse position relative to the window.

### Get Current Context Dynamic Drawing Offset 📃

`window:get_current_context_dynamic_drawing_offset()`

- Returns: [vec2](/dev/api/vector-2) - The current context dynamic drawing offset.

> [!NOTE]
> Retrieves the internal dynamic position variable's current value. See "The Advanceds - Explaining Dynamic Drawing" for a more in-depth explanation on the matter.

### Get Text Size 📃

`window:get_text_size(str)`

- `str`: String - The text to measure.
- Returns: [vec2](/dev/api/vector-2) - The size of the text.

### Get Centered Text X Position 📃

`window:get_text_centered_x_pos(text)`

- `text`: String - The text to center.
- Returns: Number - The X position offset for centered text.

> [!NOTE]
> After we get the centered text x position offset, we just need to add this value to the dynamic drawing offset by using "window:get_current_context_dynamic_drawing_offset()". Another option is to use the "Center Text" function directly (recommended)

### Center Text 📃

`window:center_text(text)`

- `text` : String - The text to center.

> [!NOTE]
> After calling this function, we just need to render the text using the "add_text_on_dynamic_pos" function. You will see that the text is centered in the middle of the window.

### Render Text 🖌️

`window:render_text(font_id, pos_offset, color, text)`

- `font_id` : Integer - The ID of the font to use.
- `pos_offset` : [vec2](/dev/api/vector-2) - The position offset for the text.
- `color` : [color](/dev/api/color) - The color of the text.
- `text` : String - The text to render.

> [!NOTE]
> Renders a text at the specified position with the given font and color. This function renders statically, so this text is not taken into account for the dynamic position offset.

### Render Rectangle 🖌️

`window:render_rect(pos_min_offset, pos_max_offset, color, rounding, thickness [, flags])`

- `pos_min_offset` : [vec2](/dev/api/vector-2) - The minimum position offset for the rectangle.
- `pos_max_offset` : [vec2](/dev/api/vector-2) - The maximum position offset for the rectangle.
- `color` : [color](/dev/api/color) - The color of the rectangle.
- `rounding` : Number - The rounding radius for the rectangle corners.
- `thickness` : Number - The thickness of the rectangle border.
- `flags` (Optional): Integer - Flags for rectangle rendering. Default is `0` .

Available rounding flags: ( enums.window_enums.rect_borders_rounding_flags. )

NO_ROUNDING

ROUND_TOP_LEFT_CORNERS

ROUND_TOP_RIGHT_CORNERS

ROUND_BOTTOM_LEFT_CORNER

ROUND_BOTTOM_RIGHT_CORNER

ROUND_TOP_CORNERS

ROUND_BOTTOM_CORNERS

ROUND_LEFT_CORNERS

ROUND_RIGHT_CORNERS

ROUND_ALL_CORNERS

> [!NOTE]
> Renders a rectangle at the specified position with the given properties. This function renders statically, so this rectangle is not taken into account for the dynamic position offset.

### Render Filled Rectangle 🖌️

`window:render_rect_filled(pos_min_offset, pos_max_offset, color, rounding [, flags])`

- `pos_min_offset` : [vec2](/dev/api/vector-2) - The minimum position offset for the filled rectangle.
- `pos_max_offset` : [vec2](/dev/api/vector-2) - The maximum position offset for the filled rectangle.
- `color` : [color](/dev/api/color) - The fill color of the rectangle.
- `rounding` : Number - The rounding radius for the rectangle corners.
- `flags` (Optional): Integer - Flags for rectangle rendering. Default is `0` .

Available rounding flags: ( enums.window_enums.rect_borders_rounding_flags. )

NO_ROUNDING

ROUND_TOP_LEFT_CORNERS

ROUND_TOP_RIGHT_CORNERS

ROUND_BOTTOM_LEFT_CORNER

ROUND_BOTTOM_RIGHT_CORNER

ROUND_TOP_CORNERS

ROUND_BOTTOM_CORNERS

ROUND_LEFT_CORNERS

ROUND_RIGHT_CORNERS

ROUND_ALL_CORNERS

> [!NOTE]
> Renders a filled rectangle at the specified position with the given properties. This function renders statically, so this rectangle is not taken into account for the dynamic position offset.

### Render Filled Rectangle with Multiple Colors 🖌️

`window:render_rect_filled_multicolor(pos_min_offset, pos_max_offset, col_upr_left, col_upr_right, col_bot_right, col_bot_left, rounding [, flags])`

- `pos_min_offset` : [vec2](/dev/api/vector-2) - The minimum position offset for the filled rectangle.
- `pos_max_offset` : [vec2](/dev/api/vector-2) - The maximum position offset for the filled rectangle.
- `col_upr_left` : [color](/dev/api/color) - The color for the upper-left corner.
- `col_upr_right` : [color](/dev/api/color) - The color for the upper-right corner.
- `col_bot_right` : [color](/dev/api/color) - The color for the bottom-right corner.
- `col_bot_left` : [color](/dev/api/color) - The color for the bottom-left corner.
- `rounding` : Number - The rounding radius for the rectangle corners.
- `flags` (Optional): Integer - Flags for rectangle rendering. Default is `0` .

Available rounding flags: ( enums.window_enums.rect_borders_rounding_flags. )

NO_ROUNDING

ROUND_TOP_LEFT_CORNERS

ROUND_TOP_RIGHT_CORNERS

ROUND_BOTTOM_LEFT_CORNER

ROUND_BOTTOM_RIGHT_CORNER

ROUND_TOP_CORNERS

ROUND_BOTTOM_CORNERS

ROUND_LEFT_CORNERS

ROUND_RIGHT_CORNERS

ROUND_ALL_CORNERS

> [!NOTE]
> Renders a filled rectangle at the specified position with the given properties. This function renders statically, so this rectangle is not taken into account for the dynamic position offset. The specified colors will be blended so we recommend testing to get used to this function. You can achieve cool-looking visuals with this function. An example is the height / width resizing rectangles that appear when the mouse is hovering the draggable regions of the window. (You can see that on the bottom of the main menu, for example.)

### Render Circle 🖌️

`window:render_circle(center, radius, color [, num_segments [, thickness]])`

- `center` : [vec2](/dev/api/vector-2) - The center position of the circle.
- `radius` : Number - The radius of the circle.
- `color` : [color](/dev/api/color) - The color of the circle.
- `num_segments` (Optional): Integer - The number of segments for the circle. Default is `0` .
- `thickness` (Optional): Number - The thickness of the circle outline. Default is `1.0` .

> [!NOTE]
> Renders a circunference (non-filled circle) at the specified position with the given properties. This function renders statically, so this circle is not taken into account for the dynamic position offset.

### Render Filled Circle 🖌️

`window:render_circle_filled(center, radius, color [, num_segments])`

- `center` : [vec2](/dev/api/vector-2) - The center position of the circle.
- `radius` : Number - The radius of the circle.
- `color` : [color](/dev/api/color) - The fill color of the circle.
- `num_segments` (Optional): Integer - The number of segments for the circle. Default is `0` .

> [!NOTE]
> Renders a filled circle at the specified position with the given properties. This function renders statically, so this circle is not taken into account for the dynamic position offset.

### Render Circle Percentage

`window:render_circle_percentage(p_min, p_max, bg_color, fill_start_color, fill_end_color, progress, start_angle_rad, direction, inner_norm, outer_norm, softness)`

- `p_min` : [vec2](/dev/api/vector-2) - The minimum screen-space position of the ring bounds.
- `p_max` : [vec2](/dev/api/vector-2) - The maximum screen-space position of the ring bounds.
- `bg_color` : [color](/dev/api/color) - The background ring color.
- `fill_start_color` : [color](/dev/api/color) - The fill gradient start color.
- `fill_end_color` : [color](/dev/api/color) - The fill gradient end color.
- `progress` : Number - Fill fraction from `0.0` to `1.0` .
- `start_angle_rad` (Optional): Number - Arc start angle in radians. Default is `-pi/2` .
- `direction` (Optional): Number - Positive values draw clockwise, negative values draw counter-clockwise. Default is `1.0` .
- `inner_norm` (Optional): Number - Inner radius normalized from `0.0` to `1.0` . Default is `0.70` .
- `outer_norm` (Optional): Number - Outer radius normalized from `0.0` to `1.0` . Default is `0.98` .
- `softness` (Optional): Number - Edge softness in pixels. Default is `1.0` .

> [!NOTE]
> Draws a circular progress ring inside a custom window using the SDF circle percentage shader.

### Render Quadratic Bezier Curve 🖌️

`window:render_bezier_quadratic(p1, p2, p3, color, num_segments, thickness)`

- `p1` : [vec2](/dev/api/vector-2) - The start point of the curve.
- `p2` : [vec2](/dev/api/vector-2) - The control point of the curve.
- `p3` : [vec2](/dev/api/vector-2) - The end point of the curve.
- `color` : [color](/dev/api/color) - The color of the curve.
- `num_segments` : Integer - The number of segments for the curve.
- `thickness` : Number - The thickness of the curve.

> [!NOTE]
> Renders a quadratic bezier curve at the specified position with the given properties. This function renders statically, so this curve is not taken into account for the dynamic position offset.

### Render Cubic Bezier Curve 🖌️

`window:render_bezier_cubic(p1, p2, p3, p4, color, num_segments, thickness)`

- `p1` : [vec2](/dev/api/vector-2) - The start point of the curve.
- `p2` : [vec2](/dev/api/vector-2) - The first control point of the curve.
- `p3` : [vec2](/dev/api/vector-2) - The second control point of the curve.
- `p4` : [vec2](/dev/api/vector-2) - The end point of the curve.
- `color` : [color](/dev/api/color) - The color of the curve.
- `num_segments` : Integer - The number of segments for the curve.
- `thickness` : Number - The thickness of the curve.

> [!NOTE]
> Renders a cubic bezier curve at the specified position with the given properties. This function renders statically, so this curve is not taken into account for the dynamic position offset.

### Render Triangle 🖌️

`window:render_triangle(p1, p2, p3, color, thickness)`

- `p1` : [vec2](/dev/api/vector-2) - The first point of the triangle.
- `p2` : [vec2](/dev/api/vector-2) - The second point of the triangle.
- `p3` : [vec2](/dev/api/vector-2) - The third point of the triangle.
- `color` : [color](/dev/api/color) - The color of the triangle.
- `thickness` : Number - The thickness of the triangle outline.

> [!NOTE]
> Renders a triangle at the specified position with the given properties. This function renders statically, so this triangle is not taken into account for the dynamic position offset.

### Render Filled Triangle 🖌️

`window:render_triangle_filled(p1, p2, p3, color)`

- `p1` : [vec2](/dev/api/vector-2) - The first point of the triangle.
- `p2` : [vec2](/dev/api/vector-2) - The second point of the triangle.
- `p3` : [vec2](/dev/api/vector-2) - The third point of the triangle.
- `color` : [color](/dev/api/color) - The fill color of the triangle.

> [!NOTE]
> Renders a filled triangle at the specified position with the given properties. This function renders statically, so this filled triangle is not taken into account for the dynamic position offset.

### Render Filled Triangle with Multiple Colors 🖌️

`window:render_triangle_filled_multi_color(p1, p2, p3, col_1, col_2, col_3)`

- `p1` : [vec2](/dev/api/vector-2) - The first point of the triangle.
- `p2` : [vec2](/dev/api/vector-2) - The second point of the triangle.
- `p3` : [vec2](/dev/api/vector-2) - The third point of the triangle.
- `col_1` : [color](/dev/api/color) - The color for the first point.
- `col_2` : [color](/dev/api/color) - The color for the second point.
- `col_3` : [color](/dev/api/color) - The color for the third point.

> [!NOTE]
> Renders a filled triangle at the specified position with the given properties. This function renders statically, so this triangle is not taken into account for the dynamic position offset. The specified colors will be blended so we recommend testing to get used to this function. You can achieve cool-looking visuals with this function. An example is the height and width resizing triangle that appear when the mouse is hovering the draggable regions of the window. (You can see that on the right-left of the console, for example.)

### Render Line 🖌️

`window:render_line(p1, p2, color, thickness)`

- `p1` : [vec2](/dev/api/vector-2) - The start point of the line.
- `p2` : [vec2](/dev/api/vector-2) - The end point of the line.
- `color` : [color](/dev/api/color) - The color of the line.
- `thickness` : Number - The thickness of the line.

> [!NOTE]
> Renders a line from p1 to p2 with the given properties. This function renders statically, so this line is not taken into account for the dynamic position offset.

### Add Separator 🖌️

`window:add_separator(right_sep_offset, left_sep_offset, y_offset, width_offset, custom_color)`

- `right_sep_offset` : Number - The right offset for the separator.
- `left_sep_offset` : Number - The left offset for the separator.
- `y_offset` : Number - The y-offset for the separator.
- `width_offset` : Number - The width offset for the separator.
- `custom_color` : [color](/dev/api/color) - The custom color for the separator.
- `faded_line` : Boolean - Render the separator as a faded line.

> [!NOTE]
> Renders a separator from p1 to p2 with the given properties. This function renders statically, so the separator is not taken into account for the dynamic position offset.

### Is Mouse Hovering Rect 📃

`window:is_mouse_hovering_rect(rect_min, rect_max)`

- `rect_min`: [vec2](/dev/api/vector-2) - The minimum position of the rectangle.
- `rect_max`: [vec2](/dev/api/vector-2) - The maximum position of the rectangle.
- Returns: Boolean

> [!NOTE]
> Returns true if the mouse is hovering the specified bounds.

> [!TIP]
> It also answers while the window is not focused, as long as it is the window under the mouse (a window or popup drawn on top still wins). So the mouse wheel can scroll a menu without clicking it first. Clicks (`is_rect_clicked`, `is_rect_pressed`) still need the window to be focused. Same for `is_mouse_hovering_rect_block_movement`.

### Is Rect Clicked 📃

`window:is_rect_clicked(rect_min, rect_max)`

- `rect_min`: [vec2](/dev/api/vector-2) - The minimum position of the rectangle.
- `rect_max`: [vec2](/dev/api/vector-2) - The maximum position of the rectangle.
- Returns: Boolean

> [!NOTE]
> Returns true if the mouse left button was clicked while hovering the rect.

### Is Rect Double Clicked 📃

`window:is_rect_double_clicked(rect_min, rect_max)`

- `rect_min`: [vec2](/dev/api/vector-2) - The minimum position of the rectangle.
- `rect_max`: [vec2](/dev/api/vector-2) - The maximum position of the rectangle.
- Returns: Boolean

> [!NOTE]
> Returns true if the mouse left button was double-clicked while hovering the rect.

### Set Visibility 📃

`window:set_visibility(visibility)`

- `visibility` : Boolean - The visibility state of the window.

> [!NOTE]
> If visibility is false, the window will not be rendered. This is useful for window-popups, for example. See the examples in the guide.

### Is Being Shown 📃

`window:is_being_shown()`

- Returns: Boolean - The current visibility state of the window.

### Render 📃

`window:render(resizing_flag, is_adding_cross, bg_color, border_color, cross_style_flag, flag_1 (optional), flag_2 (optional), flag_3 (optional), callback)`

- `resizing_flag` : Integer - The resizing flag for the window.
- `is_adding_cross` : Boolean - Indicates if a cross is being added.
- `bg_color` : [color](/dev/api/color) - The background color of the window. Use color.new(0,0,0,0) to use the Sylvana's theme default color.
- `border_color` : [color](/dev/api/color) - The border color of the window.
- `cross_style_flag` (Optional): Integer - The style flag for the cross. Default is `0` .
- `flag_1` (Optional): Integer - Additional rendering flag. Default is `0` .
- `flag_2` (Optional): Integer - Additional rendering flag. Default is `0` .
- `flag_3` (Optional): Integer - Additional rendering flag. Default is `0` .
- `callback` : Function - The callback function to execute during rendering.

Available flags: ( enums.window_enums.window_behaviour_flags. ) NO_MOVE - Disables the option for the user to drag the window. ALWAYS_AUTO_RESIZE - Makes the window content automatically resize according to the space occupied by the widgets that affect the dynamic drawing variable. NO_SCROLLBAR - Disables scrollbars on the window.

- Returns: Boolean - True if the window is being rendered.

> [!NOTE]
> Renders the window with the specified properties and executes the callback function if the window is open. This is the main function, so all the code regarding visuals will always be inside a window:render block. The callback function must always be the last parameter of the window:render function.
>
> A use example:
>
> ```lua
> ---@type color
> local color = require("common/color")
>
> ---@type vec2
> local vec2 = require("common/geometry/vector_2")
>
> ---@type enums
> local enums = require("common/enums")
>
> local test_window = core.menu.window("Test window - ")
>
> local initial_size = vec2.new(200, 200)
> test_window:set_initial_size(initial_size)
>
> local initial_position = vec2.new(500, 300)
> test_window:set_initial_position(initial_position)
>
> local bg_color = color.new(16, 16, 20, 180)
> local border_color = color.new(100, 99, 150, 255)
> core.register_on_render_window_callback(function()
>     test_window:begin(enums.window_enums.window_resizing_flags.RESIZE_BOTH_AXIS, true, color.new(0,0,0,0),
>     border_color, enums.window_enums.window_cross_visuals.BLUE_THEME, function()
>         -- render your stuff here
>     end)
> end)
> ```

### Begin Group 📃

`window:begin_group(callback)`

- `callback` : Function - The callback function to execute within the group.

> [!NOTE]
> Begins a new group and executes the callback function within the group context. This is useful when we want to draw multiple widgets at the same x offset, for example. By using this function, we avoid having to manually set the position for each widget. Instead, we can just set the position once and it will be applied for all widgets inside the callback.
>
> For example, this is the code that we use for the main debug panel buttons:
>
> ```lua
>     -- popup triggers
>     window:add_menu_element_pos_offset(vec2.new(actual_offset, 7.0))
>     window:begin_group(function()
>         if menu_elements.unit_info_launch_popup:render("Show Unit Info") then
>             is_unit_info_popup_enabled = true
>             unit_info_window.set_visibility(true)
>         end
>
>         local auras_warning_msg = "Auras Table Is Empty\nFor Target: " .. target:get_name()
>         if menu_elements.unit_auras_launch_popup:render("Show Auras Info") then
>             is_unit_auras_popup_enabled = true
>             auras_info_window.set_visibility(true)
>
>             if #all_strings_to_show.auras_strings == 0 then
>                 core.graphics.add_notification(auras_warning_msg_id, "[Debug Panel - Warning]", auras_warning_msg,
>                 5.0, color.yellow(200))
>
>                 is_unit_auras_popup_enabled = false
>                 auras_info_window.set_visibility(false)
>             end
>         end
>
>         local is_auras_popup_warning_clicked = core.graphics.is_notification_clicked(auras_warning_msg_id, 0.0)
>         if is_auras_popup_warning_clicked then
>             is_unit_auras_popup_enabled = true
>             auras_info_window.set_visibility(true)
>         end
>
>         local buffs_warning_msg = "Buffs Table Is Empty\nFor Target: " .. target:get_name()
>         if menu_elements.unit_buffs_launch_popup:render("Show Buffs Info") then
>             is_unit_buffs_popup_enabled = true
>             buffs_info_window.set_visibility(true)
>
>             if #all_strings_to_show.buffs_strings == 0 then
>                 core.graphics.add_notification(buffs_warning_msg_id, "[Debug Panel - Warning]", buffs_warning_msg,
>                 5.0, color.yellow(200))
>
>                 is_unit_buffs_popup_enabled = false
>                 buffs_info_window.set_visibility(false)
>             end
>         end
>
>         local is_buffs_popup_warning_clicked = core.graphics.is_notification_clicked(buffs_warning_msg_id, 0.0)
>         if is_buffs_popup_warning_clicked then
>             is_unit_buffs_popup_enabled = true
>             buffs_info_window.set_visibility(true)
>         end
>
>         local debuffs_warning_msg = "Debuffs Table Is Empty\nFor Target: " .. target:get_name()
>         if menu_elements.unit_debuffs_launch_popup:render("Show Debuffs Info") then
>             is_unit_debuffs_popup_enabled = true
>             debuffs_info_window.set_visibility(true)
>
>             if #all_strings_to_show.debuffs_strings == 0 then
>                 core.graphics.add_notification(debuffs_warning_msg_id, "[Debug Panel - Warning]", debuffs_warning_msg, 5.0, color.yellow(200))
>
>                 is_unit_debuffs_popup_enabled = false
>                 debuffs_info_window.set_visibility(false)
>             end
>         end
>
>         local is_debuffs_popup_warning_clicked = core.graphics.is_notification_clicked(debuffs_warning_msg_id, 0.0)
>         if is_debuffs_popup_warning_clicked then
>             debuffs_info_window.set_visibility(true)
>             is_unit_debuffs_popup_enabled = true
>         end
>
>         if menu_elements.more_info_launch_popup:render("Show Extra Info") then
>             is_extra_info_popup_enabled = true
>             extra_unit_info_window.set_visibility(true)
>         end
>     end)
> ```
>
> It is a very extense example, however, you can focus on the following: We are adding the position offset just once, and as you can see in-game, all buttons are centered at the same X position. Note that the "begin_group" function ONLY works for dynamic offset drawings.

### Begin Popup 📃

`window:begin_popup(background_color, border_color, size, pos, is_close_on_release, is_triggering_from_button, callback)`

- `background_color`: [color](/dev/api/color) - The background color of the popup.
- `border_color`: [color](/dev/api/color) - The border color of the popup.
- `size`: [vec2](/dev/api/vector-2) - The size of the popup.
- `pos`: [vec2](/dev/api/vector-2) - The initial position of the popup. Note that this position is relative to the parent window's position (the window that spawned the popup)
- `is_close_on_release`: Boolean - Indicates if the popup should close on release, instead of on click.
- `is_triggering_from_button`: Boolean - Indicates if the popup is triggered from a core.menu button, since this requires a special handling.
- `callback`: Function - The callback function to execute within the popup.
- Returns: Boolean

> [!NOTE]
> Begins a new popup with the specified properties and executes the callback function if the popup is open. Essentially, a popup is just another window, with 2 main differences: 1 - We don't need to create a new object for it 2 - A popup will close automatically when the user clicks (or releases the mouse, if that's the specified behaviour) outside of its bounds. The begin popup will return false when the popup is not being rendered (in other words, when the user closed it.) We have to use this information to set a boolean declared outside of the main render loop that will dictaminate wheter the popup will be rendered again after the user closed it or not. For this, we usually have to use a button or something similar. This might sound confusing at first, but here is a quick example to show how this works:
>
> ```lua
>     -- use a custom rect as a button (you can also use core.menu buttons)
>     if window:is_rect_clicked(open_popup_rect_v1, open_popup_rect_v2) then
>
>         -- note: define this boolean is defined outside of the main render callback.
>         is_popup_active = true
>     end
>
>     if is_popup_active then
>         if window:begin_popup(color.new(16, 16, 20, 230), border_color, vec2.new(250, 250), vec2.new(150, 50), false, false, function()
>             -- render your stuff here
>             end)
>
>         end) then
>             -- You can do whatever you want here. If the code here is read it means that the popup is currently being rendered.
>         else
>             -- This means that the user clicked outside of the popup bounds (or released the mouse), so it shouldn't be rendered anymore.
>             is_popup_active = false
>         end
>     end
> ```
>
> You can also check "The Intermediates - Popups" part on Barney's Guide for a more extense explanation and code examples.

### Draw Next Dynamic Widget on Same Line 📃

`window:draw_next_dynamic_widget_on_same_line(offset_from_start_x [, spacing_w])`

- `offset_from_start_x` : Number - The offset from the start X position.
- `spacing_w` (Optional): Number - The spacing width. Default is `-1.0` .

> [!NOTE]
> Draws the next dynamic widget on the same line with the specified offset and spacing. This esentially prevents the internal handling system to automatically add a Y offset for the next dynamic widget that will be rendered.

### Draw Next Dynamic Widget on New Line 📃

`window:draw_next_dynamic_widget_on_new_line()`

> [!NOTE]
> Draws the next dynamic widget on a new line. This esentially forces the internal handling system to automatically add a Y offset for the next dynamic widget that will be rendered.

### Add Text on Dynamic Position 📃

`window:add_text_on_dynamic_pos(color, text)`

- `color` : [color](/dev/api/color) - The color of the text.
- `text` : String - The text to add.

> [!NOTE]
> Adds text on the current dynamic position with the specified color.

### Push Font 📃

`window:push_font(font_id)`

- `font_id` : Integer - The ID of the font to push.

> [!NOTE]
> Pushes the specified font onto the internal font stack. Every text rendered after this call will be performed with the specified font, until a new push_font call is found. The currently available fonts are the following ones: Available Fonts: ( enums.window_enums.font_id. ) FONT_SMALL = 0 FONT_NORMAL = 1 FONT_SEMI_BIG = 2 FONT_BIG = 3 FONT_ICONS_SMALL = 4 FONT_ICONS_BIG = 5 FONT_ICONS_VERY_BIG = 6

### Animate Widget 📃

`window:animate_widget(animation_id, start_pos, end_pos, starting_alpha, max_alpha, alpha_speed, movement_speed, only_once)`

- `animation_id`: Integer - The ID of the animation.
- `start_pos`: [vec2](/dev/api/vector-2) - The starting position of the animation.
- `end_pos`: [vec2](/dev/api/vector-2) - The ending position of the animation.
- `starting_alpha`: Integer - The starting alpha value.
- `max_alpha`: Integer - The maximum alpha value.
- `alpha_speed`: Number - The speed of the alpha change.
- `movement_speed`: Number - The speed of the movement.
- `only_once`: Boolean - Indicates if the animation should run only once.
- Returns: Table - A table containing the animation result with keys `current_position` and `alpha`.

> [!NOTE]
> Animates a widget with the specified properties and returns the animation result. Check "The Advanceds - Animations" part on Barney's Guide for a more in-depth explanation and code examples.

### Set Next Window Items Spacing 📃

`window:set_next_window_items_spacing(spacing)`

- `spacing` : [vec2](/dev/api/vector-2) - The spacing between window items.

> [!NOTE]
> Sets the spacing between items in the next window. This only applies to dynamic drawings. This function should be called before the window:render function.

### Set Next Window Items Inner Spacing 📃

`window:set_next_window_items_inner_spacing(inner_spacing)`

- `inner_spacing` : [vec2](/dev/api/vector-2) - The inner spacing between window items.

> [!NOTE]
> Sets the inner spacing between items in the next window. This only applies to dynamic drawings. This function should be called before the window:render function.

### Set Next Window Padding 📃

`window:set_next_window_padding(padding)`

- `padding` : [vec2](/dev/api/vector-2) - The padding of the next window.

> [!NOTE]
> Sets the padding for the next window. This only applies to dynamic drawings. This function should be called before the window:render function.

### Set Background Multicolored 📃

`window:set_background_multicolored(top_left_color: color, top_right_color: color, bot_right_color: color, bot_left_color: color))`

This function enables multi-color support for the given window's background.

> [!WARNING]
> This function MUST be called before the window:begin function.

> [!TIP]
> You could use a colorpicker for each color, giving infinite color customization options to the user. An example is the [PvP UI module](/dev/libraries/mini-libs/pvp-ui).

### Manually Set End Called State 📃

`window:set_end_called_state()`

This function is to manually set the end_called flag that's used within the core to check if a begin function was called for the given window. The implementation is a bit complex, just keep in mind that this function exists for when you use the functions to set the next window padding/spacing and it gives a Lua Error on the console. This means that we just found an unhandled exception.

To fix this, just call this function at the end of your :begin function.

### Force Next Begin Window Position 📃

`window:force_next_begin_window_pos(pos)`

- `pos` : [vec2](/dev/api/vector-2) - The position to force the next window to begin at.

> [!NOTE]
> Forces the next window to be rendered at the specified position. This function's use is not recommended in most cases. This function should be called before the window:render function.

### Stop Forcing Next Begin Window Position 📃

`window:stop_forcing_position()`

> [!NOTE]
> Stops the next window to be rendered at the specified position. This function's use is not recommended in most cases. This function should be called before the window:render function.

> [!TIP]
> An example where force_next_begin_window_pos / stop_forcing_position might be useful is when you have to enable attachment / deattachment of one window to another window. ([See PvP UI Module](/dev/libraries/mini-libs/pvp-ui)). This would be the simple code example:
>
> ```lua
>     if not menu.menu_elements.deattach_check:get_state() then
>         settings_window:force_next_begin_window_pos(vec2.new(current_window_pos.x + window_size_elements.x:get(), current_window_pos.y))
>     else
>         settings_window:stop_forcing_position()
>     end
> ```
>
> The previous code is extracted directly from the PvP UI Module. The settings window is the one that attaches to current window, which would be the main window (the one with the buttons).

### Set Next Window Minimum Size 📃

`window:set_next_window_min_size(min_size)`

- `min_size` : [vec2](/dev/api/vector-2) - The minimum size of the next window.

> [!NOTE]
> Sets the minimum size of the next window, so the user cannot reduce its size to less than the specified value. This function should be called before the window:render function.

### Is Animation Finished 📃

`window:is_animation_finished(id)`

- `id`: Integer - The ID of the animation.
- Returns: Boolean

> [!NOTE]
> Returns true if the animation with the given ID has already finished.

### Set Window Cross Round 📃

`window:set_window_cross_round()`

> [!NOTE]
> Sets the next window cross to be a circumference, instead of a rectangle. This function should be called before the window:render function.

### Make Loading Circle Animation 📃

`window:make_loading_circle_animation(animation_id, origin, radius, color, thickness, animation_type)`

- `animation_id` : Integer - The ID of the animation.
- `origin` : [vec2](/dev/api/vector-2) - The origin of the animation.
- `radius` : Number - The radius of the circle.
- `color` : [color](/dev/api/color) - The color of the circle.
- `thickness` : Number - The thickness of the circle.
- `animation_type` : Integer - The type of the animation.

> [!NOTE]
> Creates a loading circle animation with the specified properties. These are the animations used by the loader, for example.

### Get Window Type 📃

`window:get_type()`

- Returns: Integer - The type of the window.

### Set Window ID 📃

`window:set_id(id)`

- `id` : String - The new unique identifier for the window.

> [!NOTE]
> Overrides the ID given to `core.menu.window(id)`. The ID is what the core uses to persist the window's position and size, so changing it at runtime makes the window forget its saved geometry.

## Window Configuration

### Set Corner Rounding 📃

`window:set_corner_rounding(rounding)`

- `rounding` : Number - The corner radius in pixels for the window frame.

> [!NOTE]
> This is also the radius used to mask `window:render_blur`, which has no per-call radius of its own.

### Get Corner Rounding 📃

`window:get_corner_rounding()`

- Returns: Number - The current corner radius of the window frame.

### Set Block Movement 📃

`window:set_block_movement(block)`

- `block` : Boolean - `true` to prevent the user from dragging the window.

> [!NOTE]
> Unlike the `NO_MOVE` behaviour flag, this can be toggled at any time. Useful while a custom widget inside the window is being dragged, so the drag doesn't move the whole window. See also `is_mouse_hovering_rect_block_movement`, which does this automatically for a given rect.

### Set Draw To Foreground 📃

`window:set_draw_to_foreground(enabled)`

- `enabled` : Boolean - `true` to draw the window on the foreground draw list.

> [!NOTE]
> Foreground windows are rendered above every other window regardless of focus order. Use sparingly — for overlays and drag ghosts, not for regular panels.

### Set Render Layer 📃

`window:set_render_layer(layer)`

- `layer` : Integer - The render layer index.

> [!NOTE]
> Windows on a higher layer are always drawn above windows on a lower one. Within the same layer, the usual focus ordering applies.

### Force Window Size 📃

`window:force_window_size(size)`

- `size` : [vec2](/dev/api/vector-2) - The size to force the window to.

> [!NOTE]
> Forces the window size every frame, overriding user resizing. Call `stop_forcing_size` to hand control back to the user. This is the size counterpart of `force_next_begin_window_pos`.

### Stop Forcing Size 📃

`window:stop_forcing_size()`

> [!NOTE]
> Stops forcing the window size, so the user can resize it again.

### Get Minimum Size 📃

`window:get_min_size()`

- Returns: [vec2](/dev/api/vector-2) - The minimum size currently applied to the window.

> [!NOTE]
> Returns the value previously set with `set_next_window_min_size`, or the core default when none was set.

### Get Available Region 📃

`window:get_available_region()`

- Returns: [vec2](/dev/api/vector-2) - The remaining content region, in pixels.

> [!NOTE]
> The space left between the current dynamic drawing offset and the bottom-right of the content area (padding excluded). Use it to size a widget to "the rest of the window" instead of hardcoding pixel values.

### Get Close Cross Bounds 📃

`window:get_close_cross_bounds()`

- Returns: Table - A table with `min` and `max` [vec2](/dev/api/vector-2) fields.

> [!NOTE]
> The bounds are relative to the window position, so they can be fed straight into `is_mouse_hovering_rect` or a custom render call. Useful for drawing your own close button on top of the built-in cross.

## Layout & Measurement

### Get Local Mouse Position 📃

`window:get_mouse_pos_local()`

- Returns: [vec2](/dev/api/vector-2) - The mouse position relative to the window's top-left corner.

> [!NOTE]
> `get_mouse_pos` returns the position in the window's coordinate space including the dynamic drawing offset; this one is a plain window-local offset, which is what you usually want when hit-testing your own rects.

### Get Wrapped Text Size 📃

`window:get_wrapped_text_size(text, width)`

- `text`: String - The text to measure.
- `width`: Number - The wrap width in pixels.
- Returns: [vec2](/dev/api/vector-2) - The size the text occupies once wrapped.

> [!NOTE]
> Pair this with `render_text_wrapped` to reserve the right amount of vertical space before drawing.

### Get Text Size With Custom Font Size 📃

`window:get_text_size_custom(font_id, font_size, text)`

- `font_id`: Integer - The font to measure with (`enums.window_enums.font_id.`).
- `font_size`: Number - The pixel size to measure at.
- `text`: String - The text to measure.
- Returns: [vec2](/dev/api/vector-2) - The size of the text at that size.

> [!NOTE]
> `get_text_size` measures at the font's baked size. Use this one when you render with `render_text_custom_size` so the measurement matches what is drawn.

### Set Current Context Dynamic Drawing Offset 📃

`window:set_current_context_dynamic_drawing_offset(offset)`

- `offset` : [vec2](/dev/api/vector-2) - The new dynamic drawing offset.

> [!NOTE]
> Writes the internal dynamic position variable directly, instead of adding to it like `add_menu_element_pos_offset` does. Use it to jump the cursor to an absolute spot inside the window.

### Allocate Space 📃

`window:allocate_space(width, height [, spacing])`

- `width`: Number - The width to reserve.
- `height`: Number - The height to reserve.
- `spacing` (Optional): Number - Extra spacing added after the reserved block.
- Returns: [vec2](/dev/api/vector-2), [vec2](/dev/api/vector-2) - The `min` and `max` corners of the reserved rect.

> [!NOTE]
> Advances the dynamic drawing offset by the given size and hands you the rect that was reserved, so custom drawings participate in dynamic layout (and in `ALWAYS_AUTO_RESIZE`) exactly like a built-in widget does.
>
> ```lua
> local rect_min, rect_max = window:allocate_space(160, 24)
> window:render_rect_filled(rect_min, rect_max, bg_color, 4)
> if window:is_rect_clicked(rect_min, rect_max) then
>     -- custom button was clicked
> end
> ```

### Add Artificial Item Bounds 📃

`window:add_artificial_item_bounds(bounds_start, bounds_end, id)`

- `bounds_start` : [vec2](/dev/api/vector-2) - The top-left of the bounds.
- `bounds_end` : [vec2](/dev/api/vector-2) - The bottom-right of the bounds.
- `id` : String - An identifier for the registered bounds.

> [!NOTE]
> Registers a rect with the window's internal item system without drawing anything. The window then treats that area as an item for auto-resize and input-capture purposes — the counterpart to `allocate_space` when you already know the rect.

### Push Item / Pop Item 📃

`window:push_item(label)` `window:pop_item()`

- `label` : String - The item label to push.

> [!NOTE]
> Pushes a label onto the internal item stack so nested custom drawings get unique IDs. Always pair a `push_item` with a `pop_item` in the same frame.

### Pop Font 📃

`window:pop_font()`

> [!NOTE]
> Pops the font pushed by the matching `push_font` call, restoring the previous one. Every `push_font` must be paired with a `pop_font`.

## Scrolling

### Get Scroll 📃

`window:get_scroll()`

- Returns: [vec2](/dev/api/vector-2) - The current scroll position (x, y) in pixels.

### Get Max Scroll Y 📃

`window:get_max_scroll_y()`

- Returns: Number - The maximum scroll Y value.

> [!NOTE]
> `0` means the content fits and there is nothing to scroll.

### Set Scroll Y 📃

`window:set_scroll_y(scroll)`

- `scroll` : Number - The scroll Y position in pixels.

> [!NOTE]
> Clamped to `[0, get_max_scroll_y()]`. Use it to implement "scroll to top" buttons or to keep a selected row in view.

### Set Next No Scrollbar 📃

`window:set_next_no_scrollbar(flag)`

- `flag` : Boolean - `true` to suppress the built-in scrollbar.

> [!NOTE]
> One-shot: applies to the next `begin_navbar` / `begin_navbar_at` only. The content still scrolls with the mouse wheel — only the visual bar is hidden.

### Enable Next Scrollbar 📃

`window:enable_next_scrollbar(enable [, track_col [, thumb_col [, accent_col [, width [, inset [, min_thumb_h [, skip_paint [, bottom_inset]]]]]]]])`

- `enable` : Boolean - Whether to arm the custom scrollbar on the next navbar.
- `track_col` (Optional): [color](/dev/api/color) - The track color. `nil` uses the default.
- `thumb_col` (Optional): [color](/dev/api/color) - The thumb color. `nil` uses the default.
- `accent_col` (Optional): [color](/dev/api/color) - The accent color used on hover/drag. `nil` uses the default.
- `width` (Optional): Integer - The bar width in pixels. `0` uses the default.
- `inset` (Optional): Integer - The inset from the content edge. `0` uses the default.
- `min_thumb_h` (Optional): Integer - The minimum thumb height in pixels. `0` uses the default.
- `skip_paint` (Optional): Boolean - `true` keeps the interaction but skips the built-in painting.
- `bottom_inset` (Optional): Integer - Extra inset at the bottom of the track. `0` uses the default.

> [!NOTE]
> One-shot: arms a core-managed custom scrollbar on the next navbar. It sets the `NoScrollbar` flag, computes the thumb geometry and handles click/drag for you.
>
> Pass `skip_paint = true` when you want to draw the bar yourself: the core still owns the interaction, and you read the geometry back from `get_scrollbar_state`.

### Get Scrollbar State 📃

`window:get_scrollbar_state()`

- Returns: `scrollbar_state` | `nil`

> [!NOTE]
> Geometry and eased animation state of the most recent end-of-navbar scrollbar pass. Returns `nil` when there is no overflow or no override armed.
>
> The returned table has the following fields:
>
> | Field | Type | Description |
> | --- | --- | --- |
> | `x_min` | Number | Track left edge (screen space) |
> | `x_max` | Number | Track right edge (screen space) |
> | `y_min` | Number | Track top edge (screen space) |
> | `y_max` | Number | Track bottom edge (screen space) |
> | `thumb_y_min` | Number | Thumb top edge (screen space) |
> | `thumb_y_max` | Number | Thumb bottom edge (screen space) |
> | `thumb_t` | Number | Scroll progress, `0.0` to `1.0` |
> | `thumb_h_norm` | Number | Thumb height as a fraction of the track |
> | `hov` | Number | Eased hover animation, `0.0` to `1.0` |
> | `drag` | Number | Eased drag animation, `0.0` to `1.0` |
>
> ```lua
> window:enable_next_scrollbar(true, nil, nil, nil, 6, 0, 24, true)
> window:begin_navbar(dock, size, offset, spacing, function()
>     -- content
> end)
>
> local sb = window:get_scrollbar_state()
> if sb then
>     local t = vec2.new(sb.x_min, sb.thumb_y_min)
>     local b = vec2.new(sb.x_max, sb.thumb_y_max)
>     window:render_smooth_rect(t, b, color.white(120 + 100 * sb.hov), 3)
> end
> ```

## Input & Hit-Testing

### Is Mouse Button Pressed 📃

`window:is_mouse_button_pressed(button)`

- `button`: Integer - The mouse button index (`0` left, `1` right, `2` middle).
- Returns: Boolean - True while the button is held down.

### Is Mouse Button Clicked 📃

`window:is_mouse_button_clicked(button)`

- `button`: Integer - The mouse button index (`0` left, `1` right, `2` middle).
- Returns: Boolean - True on the frame the button went down.

### Is Rect Pressed 📃

`window:is_rect_pressed(rect_min, rect_max)`

- `rect_min`: [vec2](/dev/api/vector-2) - The minimum position of the rectangle.
- `rect_max`: [vec2](/dev/api/vector-2) - The maximum position of the rectangle.
- Returns: Boolean

> [!NOTE]
> True for as long as the mouse is held down over the rect, unlike `is_rect_clicked` which only fires once. Use it for press-and-hold behaviour such as repeat buttons or drag handles.

### Is Mouse Hovering Rect (Block Movement) 📃

`window:is_mouse_hovering_rect_block_movement(rect_min, rect_max)`

- `rect_min`: [vec2](/dev/api/vector-2) - The minimum position of the rectangle.
- `rect_max`: [vec2](/dev/api/vector-2) - The maximum position of the rectangle.
- Returns: Boolean

> [!NOTE]
> Same as `is_mouse_hovering_rect`, but it also automatically blocks window movement while the result is true. This is the one to use for custom sliders and drag handles, so dragging the widget doesn't drag the window with it.

### Is Window Clicked 📃

`window:is_window_clicked()`

- Returns: Boolean - True if the window was clicked this frame.

### Is Window Double Clicked 📃

`window:is_window_double_clicked()`

- Returns: Boolean - True if the window was double-clicked this frame.

### Is Window Hovered 📃

`window:is_window_hovered()`

- Returns: Boolean - True if the mouse is over the window.

### Is Window Focused 📃

`window:is_window_focused()`

- Returns: Boolean - True if the window is currently focused.

> [!NOTE]
> A focused window renders on top of the other windows and receives input. See `set_focus` to force it.

### Set Focus 📃

`window:set_focus()`

> [!NOTE]
> Forces the window to be focused. When focused, a window is rendered on top of all other windows and begins accepting inputs.

### Is Any Item Active 📃

`window:is_any_item_active()`

- Returns: Boolean - True if any widget in the window is currently active.

> [!NOTE]
> "Active" means a widget is being interacted with — a text input has focus, a slider is being dragged, and so on. Check this before consuming keyboard shortcuts, so typing in a text box doesn't trigger your hotkeys.

### Block Input Capture 📃

`window:block_input_capture()`

> [!NOTE]
> Prevents the window from capturing mouse and keyboard input for the rest of the frame, letting it pass through to the game underneath.

## Clipboard

### Copy To Clipboard 📋

`window:copy_to_clipboard(text)`

- `text` : String - The text to place on the system clipboard.

> [!NOTE]
> Writes to the Windows clipboard, so the text is available to any other application. Works from anywhere inside the render callback.

### Get Clipboard Text 📋

`window:get_clipboard_text()`

- Returns: String - The current system clipboard contents. Returns an empty string when the clipboard is empty or does not hold text.

> [!TIP]
> Together these two make copy/paste and import/export flows possible — profile strings, colour hex codes, debug dumps. This is how the menu's own profile import/export and the colorpicker's copy buttons work.
>
> ```lua
> -- Ctrl+C / Ctrl+V on a custom field
> if is_ctrl_down and core.input.is_key_pressed(key_c) then
>     window:copy_to_clipboard(my_buffer)
> end
>
> if is_ctrl_down and core.input.is_key_pressed(key_v) then
>     local clip = window:get_clipboard_text() or ""
>     if clip ~= "" then
>         my_buffer = clip
>     end
> end
> ```

> [!WARNING]
> Both functions are members of `window`, not of `core`. If you need them outside a window context, keep a reference to any window instance around and call them on it. A [text_input](/dev/api/ui/) widget also exposes its own `copy_to_clipboard()`, which copies that widget's current text with no argument.

## Tooltips

### Render Default Tooltip 💬

`window:render_tooltip_default(text)`

- `text` : String - The tooltip text.

> [!NOTE]
> Draws the standard themed tooltip at the mouse position. Call it inside a hover check.

### Render Text-Only Tooltip 💬

`window:render_tooltip_text_only(text, text_color)`

- `text` : String - The tooltip text.
- `text_color` : [color](/dev/api/color) - The text color.

> [!NOTE]
> Same as the default tooltip, but with no background plate or border — only the text.

### Render Custom Tooltip 💬

`window:render_tooltip_custom(text, text_color, background_color, border_color, faded_rects_color, x_text_offset, y_text_offset, faded_rects_y_thickness, faded_rects_x_thickness)`

- `text` : String - The tooltip text.
- `text_color` : [color](/dev/api/color) - The text color.
- `background_color` : [color](/dev/api/color) - The background plate color.
- `border_color` : [color](/dev/api/color) - The border color.
- `faded_rects_color` : [color](/dev/api/color) - The color of the faded accent rects drawn around the plate.
- `x_text_offset` : Number - Horizontal padding around the text.
- `y_text_offset` : Number - Vertical padding around the text.
- `faded_rects_y_thickness` : Number - Thickness of the top/bottom faded rects.
- `faded_rects_x_thickness` : Number - Thickness of the left/right faded rects.

> [!NOTE]
> Full control over the tooltip's look. Pass `color.new(0, 0, 0, 0)` for `faded_rects_color` if you don't want the accent rects.

## Text Rendering

### Render Text With Custom Size 🖌️

`window:render_text_custom_size(font_id, pos_offset, color, font_size, text)`

- `font_id` : Integer - The ID of the font to use.
- `pos_offset` : [vec2](/dev/api/vector-2) - The position offset for the text.
- `color` : [color](/dev/api/color) - The color of the text.
- `font_size` : Number - The pixel size to render at.
- `text` : String - The text to render.

> [!NOTE]
> Renders text at an arbitrary pixel size instead of the font's baked size. Measure it with `get_text_size_custom`, not `get_text_size`.

### Render Wrapped Text 🖌️

`window:render_text_wrapped(text, color, max_wrap_width)`

- `text` : String - The text to render.
- `color` : [color](/dev/api/color) - The color of the text.
- `max_wrap_width` : Number - The width in pixels at which the text wraps.

> [!NOTE]
> This one renders on the dynamic position, so the wrapped block advances the drawing offset. Use `get_wrapped_text_size` to know how much room it will take.

### Render Clipped Text 🖌️

`window:render_text_clipped(rect_start, rect_end, text)`

- `rect_start` : [vec2](/dev/api/vector-2) - The top-left of the clip rect.
- `rect_end` : [vec2](/dev/api/vector-2) - The bottom-right of the clip rect.
- `text` : String - The text to render.

> [!NOTE]
> Renders text inside the given rect, cutting off anything that would overflow. Useful for table cells and list rows with long names.

## Containers

### Begin Window Sub Context 📃

`window:begin_window_sub_context(offset, add_flags, callback)`

- `offset` : [vec2](/dev/api/vector-2) - The offset of the sub-context.
- `add_flags` : Boolean - Whether to apply the parent window's flags to the sub-context.
- `callback` : Function - The callback executed inside the sub-context.

> [!NOTE]
> Opens a nested drawing context with its own dynamic drawing offset. Everything drawn in the callback is positioned relative to `offset`, and the parent's offset is restored afterwards.

### Begin Navbar 📃

`window:begin_navbar(dock, size, offset_or_callback [, spacing_or_callback [, callback]])`

- `dock`: Integer - Which edge the bar docks to.
- `size`: Number - The thickness of the bar in pixels.
- `offset_or_callback`: [vec2](/dev/api/vector-2) | Function - The offset, or the callback when no offset is needed.
- `spacing_or_callback` (Optional): Number | Function - The item spacing, or the callback.
- `callback` (Optional): Function - The callback executed inside the navbar.
- Returns: Boolean - True if the navbar is being rendered.

> [!NOTE]
> Creates a docked, scrollable region inside the window — the pattern used for the menu's own sidebar. The trailing arguments are overloaded: the last function you pass is always the content callback.
>
> Combine with `set_next_no_scrollbar` or `enable_next_scrollbar` to control how the overflow bar looks.

### Begin Navbar At 📃

`window:begin_navbar_at(position, size, callback)`

- `position`: [vec2](/dev/api/vector-2) - The position of the navbar, relative to the window.
- `size`: [vec2](/dev/api/vector-2) - The size of the navbar.
- `callback`: Function - The callback executed inside the navbar.
- Returns: Boolean - True if the navbar is being rendered.

> [!NOTE]
> The free-floating variant of `begin_navbar`: instead of docking to an edge, you place and size the scrollable region yourself.

### Begin Content Area 📃

`window:begin_content_area(callback)`

- `callback`: Function - The callback executed inside the content area.
- Returns: Boolean - True if the content area is being rendered.

> [!NOTE]
> Opens the main content region — the space left over once the navbars have been docked. Use it as the right-hand pane next to a `begin_navbar` sidebar.

## Clipping

### Push Clip Rect ✂️

`window:push_clip_rect(min, max, intersect)`

- `min` : [vec2](/dev/api/vector-2) - The top-left of the clip rect.
- `max` : [vec2](/dev/api/vector-2) - The bottom-right of the clip rect.
- `intersect` : Boolean - `true` intersects with the current clip rect, `false` replaces it.

> [!NOTE]
> Everything drawn until the matching `pop_clip_rect` is cut off outside these bounds. Always pair the two in the same frame.

### Pop Clip Rect ✂️

`window:pop_clip_rect()`

> [!NOTE]
> Pops the clipping rectangle pushed by the matching `push_clip_rect` call.

## Extra Primitives

### Render Polyline 🖌️

`window:render_polyline(points, point_count, color, thickness)`

- `points` : Number[] - A flat array of coordinates: `{x1, y1, x2, y2, ...}` .
- `point_count` : Integer - The number of points (not the array length).
- `color` : [color](/dev/api/color) - The line color.
- `thickness` : Number - The line thickness.

> [!NOTE]
> Draws a connected line strip in one call. Far cheaper than a `render_line` per segment when plotting graphs or paths.
>
> ```lua
> local pts = {}
> for i, v in ipairs(samples) do
>     pts[#pts + 1] = x_of(i)
>     pts[#pts + 1] = y_of(v)
> end
> window:render_polyline(pts, #samples, color.cyan(220), 1.5)
> ```

### Render GIF 🖌️

`window:render_gif(gif_id, p_min, p_max [, tint [, speed]])`

- `gif_id` : Integer - The GIF ID returned by `core.graphics.load_gif` .
- `p_min` : [vec2](/dev/api/vector-2) - The top-left corner.
- `p_max` : [vec2](/dev/api/vector-2) - The bottom-right corner.
- `tint` (Optional): [color](/dev/api/color) - The tint color. Default is white.
- `speed` (Optional): Number - The playback speed multiplier. Default is `1.0` .

> [!NOTE]
> The window-draw-list version of `core.graphics.draw_gif`. The current frame is picked automatically from elapsed time. Silently skips while the frames are still uploading to the GPU.

## XY Overloads

Every function in this section is a plain-number variant of a `vec2` function documented above. They take loose `x`/`y` numbers and packed integer colors instead of [vec2](/dev/api/vector-2) and [color](/dev/api/color) objects.

> [!TIP]
> Use them in hot render paths (per-unit overlays, long lists, graphs). Skipping the `vec2` and `color` allocations removes a lot of GC pressure when the call runs hundreds of times per frame. For everything else the `vec2` versions read better.

| Function | Equivalent to |
| --- | --- |
| `window:render_line_xy(x1, y1, x2, y2, col, thickness)` | `render_line` |
| `window:render_rect_xy(min_x, min_y, max_x, max_y, col, rounding, thickness [, flag_1 [, flag_2 [, flag_3 [, flag_4]]]])` | `render_rect` |
| `window:render_rect_filled_xy(min_x, min_y, max_x, max_y, col, rounding [, flag_1 [, flag_2 [, flag_3 [, flag_4]]]])` | `render_rect_filled` |
| `window:render_rect_filled_multicolor_xy(min_x, min_y, max_x, max_y, col_upr_left, col_upr_right, col_bot_right, col_bot_left, rounding [, flag_1 [, flag_2 [, flag_3 [, flag_4]]]])` | `render_rect_filled_multicolor` |
| `window:render_circle_filled_xy(center_x, center_y, radius, col [, num_segments])` | `render_circle_filled` |
| `window:render_text_custom_size_xy(font_id, x, y, col, font_size, text)` | `render_text_custom_size` |
| `window:push_clip_rect_xy(min_x, min_y, max_x, max_y, intersect)` | `push_clip_rect` |
| `window:force_next_begin_window_pos_xy(x, y)` | `force_next_begin_window_pos` |
| `window:force_window_size_xy(width, height)` | `force_window_size` |
| `window:set_next_window_padding_xy(x, y)` | `set_next_window_padding` |
| `window:set_next_window_items_spacing_xy(x, y)` | `set_next_window_items_spacing` |

> [!NOTE]
> The `col` parameters here are packed integers, not [color](/dev/api/color) objects, and the rounding `flag_*` parameters are the same `enums.window_enums.rect_borders_rounding_flags` values used by the `vec2` versions.

### Render Centered Outlined Text 🖌️

`window:render_text_centered_outlined_xy(font_id, min_x, min_y, max_x, max_y, fill_col, font_size, text [, border_px [, outline_col]])`

- `font_id` : Integer - The ID of the font to use.
- `min_x` , `min_y` , `max_x` , `max_y` : Number - The rect the text is centered inside.
- `fill_col` : Integer - The packed text color.
- `font_size` : Number - The pixel size to render at.
- `text` : String - The text to render.
- `border_px` (Optional): Number - The outline thickness in pixels.
- `outline_col` (Optional): Integer - The packed outline color.

> [!NOTE]
> Centers the text in the given rect and draws an outline around it, which keeps small text readable over busy backgrounds — nameplates, world overlays, cooldown numbers.

## SDF Paint Pack 🎨

GPU shader-driven primitives. Each one draws as a single quad and is resolution-independent, so they cost far less than compositing the same look out of dozens of rects.

> [!NOTE]
> All positions are window-local offsets (added to the window position), unlike the `core.graphics.render_*` SDF family which takes screen space.
>
> Parameters named `time` are an absolute clock in seconds — pass `core.time()` — and `speed` scales it. Parameters like `hover`, `press`, `open`, `active`, `listening` and `pulse` are `0.0`-to-`1.0` blend factors that you drive yourself, usually from an eased hover value.

### Render Fog 🎨

`window:render_fog(center, radius, color [, density])`

- `center` : [vec2](/dev/api/vector-2) - The center of the puff.
- `radius` : Number - The radius in pixels.
- `color` : [color](/dev/api/color) - The fog color.
- `density` (Optional): Number - Falloff steepness. Default is `3.0` ; lower values give a wider, softer halo.

### Render SDF Rect 🎨

`window:render_sdf_rect(p_min, p_max, color [, rounding [, softness]])`

- `p_min` , `p_max` : [vec2](/dev/api/vector-2) - The rect corners.
- `color` : [color](/dev/api/color) - The fill color.
- `rounding` (Optional): Number - Corner radius. Default is `4` .
- `softness` (Optional): Number - Edge softness. Default is `1` .

> [!NOTE]
> Alias of `render_smooth_rect` under the League naming.

### Render SDF Circle 🎨

`window:render_sdf_circle(center, radius, color [, softness])`

- `center` : [vec2](/dev/api/vector-2) - The circle center.
- `radius` : Number - The radius in pixels.
- `color` : [color](/dev/api/color) - The fill color.
- `softness` (Optional): Number - Edge softness. Default is `1` .

### Render Filled Circle 🎨

`window:render_filled_circle(center, radius, fill [, border [, border_width [, softness]]])`

- `center` : [vec2](/dev/api/vector-2) - The circle center.
- `radius` : Number - The radius in pixels.
- `fill` : [color](/dev/api/color) - The fill color.
- `border` (Optional): [color](/dev/api/color) - The border ring color. Defaults to none.
- `border_width` (Optional): Number - The border thickness. Default is `0` .
- `softness` (Optional): Number - Edge softness. Default is `1` .

### Render Rect Glow 🎨

`window:render_rect_glow(p_min, p_max, glow_col [, rounding [, glow_size [, glow_intensity]]])`

- `p_min` , `p_max` : [vec2](/dev/api/vector-2) - The rect corners.
- `glow_col` : [color](/dev/api/color) - The glow color.
- `rounding` (Optional): Number - The corner radius of the source rect.
- `glow_size` (Optional): Number - The halo size in pixels. Default is `10` .
- `glow_intensity` (Optional): Number - The glow strength. Default is `1` .

> [!NOTE]
> Draws only the outer halo, so render it before the rect it glows around.

### Render Button Face 🎨

`window:render_button_face(p_min, p_max, base, elevated, accent [, rounding [, hover [, press [, time [, speed [, border_in]]]]]])`

- `p_min` , `p_max` : [vec2](/dev/api/vector-2) - The button bounds.
- `base` : [color](/dev/api/color) - The base plate color.
- `elevated` : [color](/dev/api/color) - The elevation highlight color.
- `accent` : [color](/dev/api/color) - The accent sheen color.
- `rounding` (Optional): Number - The corner radius.
- `hover` (Optional): Number - Hover blend, `0.0` to `1.0` .
- `press` (Optional): Number - Press blend, `0.0` to `1.0` .
- `time` (Optional): Number - Absolute clock in seconds.
- `speed` (Optional): Number - Animation speed multiplier.
- `border_in` (Optional): Number - Insets the border by this many pixels.

> [!NOTE]
> A complete animated button face — base plate, elevation and accent sheen — in one draw call.

### Render Page Title 🎨

`window:render_page_title(p_min, p_max, plate, accent, halo [, rounding [, hover [, time [, speed]]]])`

- `p_min` , `p_max` : [vec2](/dev/api/vector-2) - The title plate bounds.
- `plate` : [color](/dev/api/color) - The plate color.
- `accent` : [color](/dev/api/color) - The underline accent color.
- `halo` : [color](/dev/api/color) - The halo color.
- `rounding` (Optional): Number - The corner radius. Default is `8` .
- `hover` (Optional): Number - Hover blend, `0.0` to `1.0` .
- `time` (Optional): Number - Absolute clock in seconds.
- `speed` (Optional): Number - Animation speed multiplier.

### Render Toast Card 🎨

`window:render_toast_card(p_min, p_max, base, elevated, accent [, rounding [, alpha_env [, life_t [, strip_w [, prog_h [, time [, speed]]]]]]])`

- `p_min` , `p_max` : [vec2](/dev/api/vector-2) - The card bounds.
- `base` : [color](/dev/api/color) - The base plate color.
- `elevated` : [color](/dev/api/color) - The elevation highlight color.
- `accent` : [color](/dev/api/color) - The accent strip and progress bar color.
- `rounding` (Optional): Number - The corner radius.
- `alpha_env` (Optional): Number - The fade envelope, `0.0` to `1.0` .
- `life_t` (Optional): Number - Remaining lifetime, `0.0` to `1.0` .
- `strip_w` (Optional): Number - The accent strip width. Default is `3` .
- `prog_h` (Optional): Number - The progress bar height. Default is `2` .
- `time` (Optional): Number - Absolute clock in seconds.
- `speed` (Optional): Number - Animation speed multiplier.

> [!NOTE]
> The notification card look: base plate, accent strip down one side, and a lifetime progress bar along the bottom.

### Render Aurora 🎨

`window:render_aurora(p_min, p_max, primary, secondary [, intensity [, rounding [, softness [, time [, speed]]]]])`

- `p_min` , `p_max` : [vec2](/dev/api/vector-2) - The bounds.
- `primary` : [color](/dev/api/color) - The first ribbon color.
- `secondary` : [color](/dev/api/color) - The second ribbon color.
- `intensity` (Optional): Number - Effect strength. Default is `1.8` .
- `rounding` (Optional): Number - The corner radius.
- `softness` (Optional): Number - Edge softness.
- `time` (Optional): Number - Absolute clock in seconds.
- `speed` (Optional): Number - Animation speed multiplier.

### Render Vanta Fog 🎨

`window:render_vanta_fog(p_min, p_max, base, highlight, secondary [, density [, time [, speed [, zoom [, warp]]]]])`

- `p_min` , `p_max` : [vec2](/dev/api/vector-2) - The bounds.
- `base` : [color](/dev/api/color) - The base fog color.
- `highlight` : [color](/dev/api/color) - The highlight color.
- `secondary` : [color](/dev/api/color) - The secondary layer color.
- `density` (Optional): Number - Fog density.
- `time` (Optional): Number - Absolute clock in seconds.
- `speed` (Optional): Number - Animation speed multiplier.
- `zoom` (Optional): Number - Zoom factor. Default is `0` .
- `warp` (Optional): Number - Warp factor. Default is `0` .

> [!NOTE]
> The animated layered dark fog used as the menu's own background weather.

### Render Explosion 🎨

`window:render_explosion(p_min, p_max, core_col, accent [, progress [, seed]])`

- `p_min` , `p_max` : [vec2](/dev/api/vector-2) - The bounds.
- `core_col` : [color](/dev/api/color) - The burst core color.
- `accent` : [color](/dev/api/color) - The accent color.
- `progress` (Optional): Number - Burst progress, `0.0` to `1.0` . You drive this yourself.
- `seed` (Optional): Number - Varies the pattern.

### Render Noise 🎨

`window:render_noise(p_min, p_max, base [, noise_scale [, intensity [, rounding [, time]]]])`

- `p_min` , `p_max` : [vec2](/dev/api/vector-2) - The bounds.
- `base` : [color](/dev/api/color) - The base color.
- `noise_scale` (Optional): Number - The grain scale. Default is `2` .
- `intensity` (Optional): Number - The grain strength. Default is `0.1` .
- `rounding` (Optional): Number - The corner radius.
- `time` (Optional): Number - Absolute clock in seconds.

> [!NOTE]
> A film-grain overlay. Layer it over a flat plate to stop large solid areas from looking dead.

### Render Diagonal Fire 🎨

`window:render_diagonal_fire(p_min, p_max, core_col, mid, edge [, density [, time [, speed]]])`

- `p_min` , `p_max` : [vec2](/dev/api/vector-2) - The bounds.
- `core_col` : [color](/dev/api/color) - The hottest color of the ramp.
- `mid` : [color](/dev/api/color) - The middle color of the ramp.
- `edge` : [color](/dev/api/color) - The coolest color of the ramp.
- `density` (Optional): Number - Flame density. Default is `1.5` .
- `time` (Optional): Number - Absolute clock in seconds.
- `speed` (Optional): Number - Animation speed multiplier.

### Render Keybind Active 🎨

`window:render_keybind_active(p_min, p_max, base, elevated, accent [, rounding [, hover [, active [, time [, speed [, border_in]]]]]])`

- `p_min` , `p_max` : [vec2](/dev/api/vector-2) - The pill bounds.
- `base` : [color](/dev/api/color) - The base plate color.
- `elevated` : [color](/dev/api/color) - The elevation highlight color.
- `accent` : [color](/dev/api/color) - The accent color.
- `rounding` (Optional): Number - The corner radius.
- `hover` (Optional): Number - Hover blend, `0.0` to `1.0` .
- `active` (Optional): Number - Active blend, `0.0` to `1.0` .
- `time` (Optional): Number - Absolute clock in seconds.
- `speed` (Optional): Number - Animation speed multiplier.
- `border_in` (Optional): Number - Insets the border.

> [!NOTE]
> The keybind pill in its ACTIVE state. See `core.graphics.render_keybind_pill` for the idle variant.

### Render Keybind Listening 🎨

`window:render_keybind_listening(p_min, p_max, base, elevated, accent [, rounding [, hover [, listening [, time [, speed [, border_in]]]]]])`

- Parameters are the same as `render_keybind_active` , with `listening` in place of `active` .

> [!NOTE]
> The keybind pill in its LISTENING (press-a-key) state.

### Render Widget Highlight 🎨

`window:render_widget_highlight_reticle(p_min, p_max, body, accent, halo [, rounding [, pulse [, time [, speed [, brightness]]]]])` `window:render_widget_highlight_scanline(p_min, p_max, body, accent, halo [, rounding [, pulse [, time [, speed [, brightness]]]]])` `window:render_widget_highlight_sigil(p_min, p_max, body, accent, halo [, rounding [, pulse [, time [, speed [, brightness]]]]])`

- `p_min` , `p_max` : [vec2](/dev/api/vector-2) - The bounds of the widget being highlighted.
- `body` : [color](/dev/api/color) - The body color.
- `accent` : [color](/dev/api/color) - The accent color.
- `halo` : [color](/dev/api/color) - The halo color.
- `rounding` (Optional): Number - The corner radius.
- `pulse` (Optional): Number - Pulse blend, `0.0` to `1.0` .
- `time` (Optional): Number - Absolute clock in seconds.
- `speed` (Optional): Number - Animation speed multiplier.
- `brightness` (Optional): Number - Brightness multiplier. Default is `1` .

> [!NOTE]
> Three styles of the same effect — corner brackets, a sweeping scanline, and a sigil — used to point the user at a widget from search results or a tutorial. All three take identical parameters.

### Render Smooth Line 🎨

`window:render_smooth_line(p1, p2, color [, thickness [, softness]])`

- `p1` , `p2` : [vec2](/dev/api/vector-2) - The line endpoints.
- `color` : [color](/dev/api/color) - The line color.
- `thickness` (Optional): Number - The line thickness. Default is `2` .
- `softness` (Optional): Number - Edge softness. Default is `1.5` .

> [!NOTE]
> An anti-aliased line. Prefer it over `render_line` for diagonals, where the non-SDF version shows stair-stepping.

### Render Arc 🎨

`window:render_arc(center, radius, start_angle_rad, end_angle_rad, color [, thickness [, softness]])`

- `center` : [vec2](/dev/api/vector-2) - The arc center.
- `radius` : Number - The arc radius.
- `start_angle_rad` : Number - The start angle in radians.
- `end_angle_rad` : Number - The end angle in radians.
- `color` : [color](/dev/api/color) - The stroke color.
- `thickness` (Optional): Number - The stroke thickness. Default is `2` .
- `softness` (Optional): Number - Edge softness. Default is `1` .

### Render Blur 🎨

`window:render_blur(p_min, p_max [, blur_radius [, sigma [, opacity [, tint]]]])`

- `p_min` , `p_max` : [vec2](/dev/api/vector-2) - The bounds of the frosted area.
- `blur_radius` (Optional): Number - The blur kernel radius in pixels.
- `sigma` (Optional): Number - The Gaussian sigma.
- `opacity` (Optional): Number - The blur opacity.
- `tint` (Optional): [color](/dev/api/color) - A tint blended over the blur.

> [!NOTE]
> Frosted-glass blur of whatever is behind the quad, masked to a rounded rect. The corner radius comes from the window's `set_corner_rounding` — there is no per-call radius.

> [!WARNING]
> EXPENSIVE. Every `render_blur` call copies the full backbuffer (one `CopyResource` plus barriers), so use at most one per window per frame, and never try to compose a non-rectangular frosted shape out of strips.
>
> The kernel is clamped inside the quad, so `blur_radius` has to suit the quad size — large radii on small quads collapse into a directional smear. Roughly `14 / 4.5` works for a ~36 px plate, and `40 / 4.0` for full panels.