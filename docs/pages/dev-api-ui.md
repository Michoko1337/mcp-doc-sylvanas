# Menu

> Source: <https://docs.project-sylvanas.net/dev/api/ui>

> [!INFO]
> This page is the reference for the original low-level `core.menu.*` objects. They remain supported for old plugins. New plugins should use the retained `_G.menu` API, and portable OW/League-style modules can use `require("common/menu/menu_api")`, which translates the old structure into the new menu. See the [complete menu guide](/modules/menu) for both approaches, defaults, persistence, modifier chords, and configurable keybind modes.

### Overview 📃

This module is one of the most important ones, since it is the one that will allow you to add customization options to your plugins. You could always design your own menu for your scripts using our [Custom UI](/dev/guides/custom-ui), in a way that makes your plugins very unique and different from the rest. However, **this would add a level of complexity that might not be necessary** in most cases. So, for most devs, we offer the option to add your own menu to the main menu directly. (You can still use the menu elements in your custom menu, if desired, as stated in the [Custom UI](/dev/guides/custom-ui) guide).

## Menu Elements Basics

There are a two things that you have to keep in mind when working with menu elements. The first one is that you can only render them in 2 specific callbacks. The other information that you should know is

menu elements are, and therefore, must be treated as,

objects

. This implies that you must not declare the menu elements inside the render callback, since you would be generating a new different menu element with each iteration. This will cause issues, specially if done with tree nodes.

> [!TIP]
> There is one exception to the previous rule, and that is, headers. You can render a header (a plain text in the menu) as follows:
>
> ```lua
>     core.menu.header():render("Header Test", color.green(200))
> ```
>
> And it would be valid, since headers are a very light-weight object and don't need of an unique ID, unlike the other menu elements.

An example of an invalid code:

```lua
-- The state of the checkbox is not saved into the variable "bad_code_example", since core.menu.checkbox doesn't return a boolean, but rather the checkbox object.
-- A new checkbox is being generated every frame, generating performance issues.
core.register_on_render_menu_callback(function()
    local bad_code_example = core.menu.checkbox(true, "testing_1"):render("AA")
end)
```

An example of code following best practices:

```lua
-- first, we generate a table containing all the menu elements that we are going to use OUTSIDE the callback

---@type color
local color = require("common/color")

local menu_elements =
{
    my_test_node = core.menu.tree_node(),
    my_checkbox_1 = core.menu.checkbox(true, "my_checkbox_test"),
    my_test_keybind = core.menu.keybind(7, false, "my_test_keybind")
}

core.register_on_render_menu_callback(function()
    menu_elements.my_test_node:render("Hi From Lua - Testing Menu Elements!", function()
        menu_elements.my_checkbox_1:render("Testing The Checkbox!", "This is a tooltip!")
        core.menu.header():render("Testing The Headers!", color.green(200))
        menu_elements.my_test_keybind:render("Testing The Keybind!")
    end)
end)

```

This is the result of the previous code:

![](https://downloads.project-sylvanas.net/1727206014677-menu_test1.png)

---

### Register Menu Callback

> [!WARNING]
> Menu elements can only be rendered inside the register_on_render_menu_callback OR register_on_render_window_callback callbacks. The first one is reserved for menu elements that will be rendered within the main menu, and the second one for menu elements that will be rendered within one of your custom-made windows. See [Custom UI Guide](/dev/guides/custom-ui)

`core.menu.register_on_render_menu_callback(callback: function)`

- This function registers the menu for interaction. Same like with other callbacks, you can also pass an anonymous function. This is how you would call the callback:

```lua
core.menu.register_on_render_menu_callback(function()
     -- your pre-defined menu elements render function code here
end)
```

Or:

```lua
local function my_render_menu_function()
    -- your pre-defined menu elements render function code here
end

core.menu.register_on_render_menu_callback(my_render_menu_function)
```

---

### Register Menu

`core.menu.register_menu()`

Registers the menu for interaction.

> [!NOTE]
> Only needed on the low-level path where you drive the menu yourself. `core.menu.register_on_render_menu_callback` already handles registration for the normal case.

---

### Immediate-Mode Helpers

Unlike the element objects below, these are plain functions: they draw straight away, hold no state, and need no ID or persistence. Use them for structure and spacing inside a menu callback.

#### `core.menu.begin_tree(label)` / `core.menu.end_tree()`

Opens and closes a collapsible section without creating a `tree_node` object.

Parameters:

- **`label`** ( *string* ) — The section header text.

Returns: *boolean* — `true` if the section is open. Only call `end_tree()` when it returned `true`.

```lua
if core.menu.begin_tree("Advanced") then
    my_checkbox:render("Enable debug logging")
    core.menu.end_tree()
end
```

> [!NOTE]
> Handy for porting imperative OW/League-style code. For anything long-lived prefer a tree_node object, which persists its open state and participates in menu search.

---

#### `core.menu.separator()`

Draws a horizontal separator line.

Returns: *nil*

---

#### `core.menu.text(text)`

Draws a line of plain text. Also available as `core.menu.label` and `core.menu.add_label`.

Parameters:

- **`text`** ( *string* ) — The text to draw.

Returns: *nil*

---

### Compatibility Aliases

These are installed by the native-menu bridge so ported code keeps working. They are not part of the historical constructor table — new code should use the primary names.

| Alias | Primary |
| --- | --- |
| `core.menu.color_picker(default_color, id)` | `core.menu.colorpicker(default_color, id)` |
| `core.menu.new_colorpicker(default_color, id)` | `core.menu.colorpicker(default_color, id)` |
| `core.menu.input_text(default_text, id)` | `core.menu.text_input(id, save_input)` — note the reversed argument order |
| `core.menu.input_string(default_text, id)` | same as `input_text` |
| `core.menu.new_text_input(id, opts)` | `core.menu.text_input(id, save_input)`, with an options table |
| `core.menu.label(text)` / `core.menu.add_label(text)` | `core.menu.text(text)` |

---

## Available Menu Elements

## Tree Node 🌳

### Constructor

### `tree_node()`

Creates a new tree node instance.

Returns: *tree_node* — A new `tree_node` object.

---

### `render(header, callback)`

Renders the tree node with content.

Parameters:

- **`header`** ( *string* ) — The header text of the tree node.
- **`callback`** ( *function* ) — The content to render inside the node.

#### Example

```lua
-- Anonymous function approach
main_node:render("Debug Plugin", function()
    -- content inside the node
end)

-- Alternative
local function debug_plugin_node()
    -- content inside the node
    -- note: declare outside menu callback
end

-- Inside menu callback
main_node:render("Debug Plugin", debug_plugin_node)
```

---

### `is_open()`

Checks if the tree node is open.

Returns: *boolean* — `true` if the tree node is open; otherwise, `false`.

---

### `set_open_state(state)`

Opens or closes the tree node from code.

Parameters:

- **`state`** ( *boolean* ) — `true` to open the node, `false` to close it.

Returns: *nil*

---

### `just_issued_state_change()`

Checks whether the open/closed state changed on this frame.

Returns: *boolean* — `true` on the single frame the node was opened or closed.

> [!TIP]
> Use this to run work only when a section is expanded — refreshing a cached list, for example — instead of every frame the node happens to be open.

---

## Checkbox ☑️

### Constructor

### `checkbox(default_state, id)`

Creates a new checkbox instance.

Parameters:

- **`default_state`** ( *boolean* ) — The default state of the checkbox.
- **`id`** ( *string* ) — The unique identifier for the checkbox.

Returns: *checkbox* — A new `checkbox` object.

---

### `render(label, tooltip(optional))`

Renders the checkbox with the specified label and optional tooltip.

Parameters:

- **`label`** ( *string* ) — The label text of the checkbox.
- **`tooltip`** ( *string* , optional) — The tooltip text for the checkbox.

> [!TIP]
> Checkbox `render` supports `\n` to write multiple lines.

---

### `get_state()`

Retrieves the current state of the checkbox.

Returns: *boolean* — `true` if checked; otherwise, `false`.

---

### `set(new_state)`

Sets a new state for the checkbox.

Parameters:

- **`new_state`** ( *boolean* ) — The new state to set.

Returns: *nil*

---

## Slider Int 🎚️

### Constructor

### `slider_int(min_value, max_value, default_value, id)`

Creates a new slider with integer values.

Parameters:

- **`min_value`** ( *number* ) — The minimum value of the slider.
- **`max_value`** ( *number* ) — The maximum value of the slider.
- **`default_value`** ( *number* ) — The default value of the slider.
- **`id`** ( *string* ) — The unique identifier for the slider.

Returns: *slider_int* — A new `slider_int` object.

---

### `render(label, tooltip(optional))`

Renders the slider with the specified label and optional tooltip.

Parameters:

- **`label`** ( *string* ) — The label text of the slider.
- **`tooltip`** ( *string* , optional) — The tooltip text for the slider.

> [!TIP]
> Slider `render` supports `\n` to write multiple lines.

---

### `get()`

Retrieves the current value of the slider.

Returns: *number* — The current value.

---

### `set(new_value)`

Sets a new value for the slider.

Parameters:

- **`new_value`** ( *number* ) — The new value to set.

Returns: *nil*

---

## Slider Float 🎛️

### Constructor

### `slider_float(min_value, max_value, default_value, id)`

Creates a new slider with floating-point values.

Parameters:

- **`min_value`** ( *number* ) — The minimum value of the slider.
- **`max_value`** ( *number* ) — The maximum value of the slider.
- **`default_value`** ( *number* ) — The default value of the slider.
- **`id`** ( *string* ) — The unique identifier for the slider.

Returns: *slider_float* — A new `slider_float` object.

---

### `render(label, tooltip (optional))`

Renders the slider with the specified label and optional tooltip.

Parameters:

- **`label`** ( *string* ) — The label text of the slider.
- **`tooltip`** ( *string* , optional) — The tooltip text for the slider.

> [!TIP]
> Slider `render` supports `\n` to write multiple lines.

---

### `get()`

Retrieves the current value of the slider.

Returns: *number* — The current value.

---

### `set(new_value)`

Sets a new value for the slider.

Parameters:

- **`new_value`** ( *number* ) — The new value to set.

Returns: *nil*

---

## Combobox 🔽

### Constructor

### `combobox(default_index, id)`

Creates a new combobox.

Parameters:

- **`default_index`** ( *number* ) — The default index of the combobox options (1-based).
- **`id`** ( *string* ) — The unique identifier for the combobox.

Returns: *combobox* — A new `combobox` object.

---

### `render(label, options, tooltip (optional))`

Renders the combobox with the specified label, options, and optional tooltip.

Parameters:

- **`label`** ( *string* ) — The label text of the combobox.
- **`options`** ( *table* ) — A table of strings containing the options for the combobox.
- **`tooltip`** ( *string* , optional) — The tooltip text for the combobox.

> [!TIP]
> Combobox `render` supports `\n` to write multiple lines.

---

### `get()`

Retrieves the index of the currently selected option (1-based).

Returns: *number* — The index of the selected option.

---

### `set(new_value)`

Sets a new selected index for the combobox.

Parameters:

- **`new_value`** ( *number* ) — The new index to select.

Returns: *nil*

> [!TIP]
> You could use a combo box to let the user decide script behaviours in a more graphical way. Below, an example using 3 possible modes:
>
> ```lua
> local combat_mode_enum =
> {
>     AUTO    = 1,
>     AOE     = 2,
>     SINGLE  = 3,
> }
>
> local combat_mode_options =
> {
>     "Auto",
>     "AoE",
>     "Single"
> }
>
> local main_tree = core.menu.tree_node()
> local combat_mode = core.menu.combobox(combat_mode_enum.AUTO, "combat_mode_auto_aoe_single")
>
> core.register_on_render_menu_callback(function()
>     main_tree:render("Combo - Test", function()
>         combat_mode:render("Testing Combo Boxes - Combat Modes", combat_mode_options)
>     end)
> end)
>
> core.register_on_update_callback(function()
>     local current_combat_mode = combat_mode:get()
>     local current_combat_mode_str = combat_mode_options[current_combat_mode]
>
>     local is_current_combat_mode_auto = current_combat_mode == combat_mode_enum.AUTO
>     local is_current_combat_mode_aoe = current_combat_mode == combat_mode_enum.AOE
>     local is_current_combat_mode_single = current_combat_mode == combat_mode_enum.SINGLE
>
>     core.log("Current Combat Mode Is: " .. current_combat_mode_str)
>     core.log("Is Current Combat Mode Auto: " .. tostring(is_current_combat_mode_auto))
>     core.log("Is Current Combat Mode AOE: " .. tostring(is_current_combat_mode_aoe))
>     core.log("Is Current Combat Mode Single: " .. tostring(is_current_combat_mode_single))
> end)
>
> ```
>
> This should be the result of running that code:
>
> ![](https://downloads.project-sylvanas.net/1727699662195-combobox_test.png)

---

### `set_items(items)`

Replaces the combobox options from code, without going through `render`.

Parameters:

- **`items`** ( *string[]* ) — The new options list. Maximum 64 entries.

Returns: *nil*

> [!TIP]
> Use this for lists that are only known at runtime — party members, spell books, saved profiles. The selected index is not remapped when the list changes, so re-select or clamp it yourself after swapping the items.

---

### `get_items()`

Retrieves the current options list.

Returns: *string[]* — The options list.

---

### `set_draggable_state(state)`

Sets whether the combobox can be dragged on the control panel.

Parameters:

- **`state`** ( *boolean* ) — `true` to allow dragging.

Returns: *nil*

---

### `is_showing_on_control_panel()`

Checks whether the combobox is currently mirrored on the [control panel](/dev/api/ui/control-panel).

Returns: *boolean*

---

### `set_is_showing_on_control_panel()`

Marks the combobox to be mirrored on the [control panel](/dev/api/ui/control-panel).

Returns: *nil*

---

## Combobox Reorderable 🔀

A combobox whose entries the user can drag into a different order — used for priority lists (rotation order, dispel priority, and so on). Where the plain combobox takes its options in `render`, this one is fed with `set_items` and `render` only takes a label.

### Constructor

### `combobox_reorderable(default_index, id)`

Parameters:

- **`default_index`** ( *number* ) — The default selected index (1-based).
- **`id`** ( *string* ) — The unique identifier for the combobox.

Returns: *combobox_reorderable* — A new `combobox_reorderable` object.

---

### `render(label, tooltip (optional))`

Renders the reorderable combobox. Options come from `set_items`, not from `render`.

Parameters:

- **`label`** ( *string* ) — The label text.
- **`tooltip`** ( *string* , optional) — The tooltip text.

---

### `set_items(items)`

Sets the options list.

Parameters:

- **`items`** ( *string[]* ) — The options list.

Returns: *nil*

---

### `get_item_at_index(index)`

Retrieves the option name at a given position in the user's current order.

Parameters:

- **`index`** ( *integer* ) — A 1-based index.

Returns: *string* — The option name.

> [!TIP]
> This is how you read the ordering back. Loop from `1` to the number of items and act on the names in the order the user arranged them:
>
> ```lua
> for i = 1, #my_options do
>     local name = priority_list:get_item_at_index(i)
>     -- try to cast `name` before moving on to the next entry
> end
> ```

---

### `get()` / `set(new_value)`

Get or set the currently selected index (1-based), same as the plain combobox.

---

## Combobox Reorderable (Overlay Window) 🔀

`combobox_reorderable_ow` is the overlay-window variant of the reorderable combobox: the reorder UI opens in its own overlay instead of inline. Its item list is passed to the constructor.

### Constructor

### `combobox_reorderable_ow(id, items)`

Parameters:

- **`id`** ( *string* ) — The unique identifier for the combobox.
- **`items`** ( *string[]* , optional) — The initial options list.

Returns: *combobox_reorderable_ow* — A new object.

---

### `render(label, tooltip (optional))`

Renders the combobox.

---

### `get()`

Returns: *integer* — The selected index (1-based).

---

### `set_items(items)`

Sets the options list.

Parameters:

- **`items`** ( *string[]* ) — The new options list. Must match the original item count.

Returns: *nil*

---

### `get_items()`

Returns: *string[]* — The options list.

---

### `get_item_at_index(index)`

Parameters:

- **`index`** ( *integer* ) — A 1-based index.

Returns: *string* — The option name at that position in the current order.

---

## Keybind ⌨️

### Constructor

### `keybind(default_value, initial_toggle_state, id)`

Creates a new keybind.

> [!NOTE]
> This is the historical native keybind object. For a new bind with an exact `hold`/`toggle`/`release` allow-list, double-click mode switching, and WoW modifier chords, use `_G.menu` as shown in the [menu keybind guide](/modules/menu#keybind-authoring-patterns).

Parameters:

- **`default_value`** ( *number* ) — The default key code for the keybind.
- **`initial_toggle_state`** ( *boolean* ) — The initial toggle state.
- **`id`** ( *string* ) — The unique identifier for the keybind.

Returns: *keybind* — A new `keybind` object.

---

### `render(label, tooltip (optional), add_separator(optional))`

Renders the keybind with the specified label and optional tooltip.

Parameters:

- **`label`** ( *string* ) — The label text of the keybind.
- **`tooltip`** ( *string* , optional) — The tooltip text for the keybind.
- **`add_separator`** ( *boolean* , optional) — A flag to add a separator below the keybind. True by default.

---

### `get_state()`

Retrieves the state of the keybind.

Returns: *boolean* — The state of the keybind.

---

### `get_toggle_state()`

Retrieves the toggle state of the keybind.

Returns: *boolean* — The toggle state.

---

### `get_key_code()`

Retrieves the key code assigned to the keybind.

Returns: *integer* — The key code.

---

### `set_toggle_state(new_state)`

Sets a new toggle state for the keybind.

Parameters:

- **`new_state`** ( *boolean* ) — The new toggle state.

Returns: *nil*

---

### `set_key_code(new_key_code)`

Sets a new key code for the keybind.

Parameters:

- **`new_key_code`** ( *integer* ) — The new key code.

Returns: *nil*

---

### `set_key(new_key)`

Sets a new key code for the keybind. Alias of `set_key_code`.

Parameters:

- **`new_key`** ( *number* ) — The new key code.

Returns: *nil*

---

### `set_forced_state(state)`

Forces `get_state()` to return a fixed value, ignoring what the user is pressing.

Parameters:

- **`state`** ( *boolean* ) — The state to force.

Returns: *nil*

> [!TIP]
> Useful when another part of your script needs to drive a keybind — a "burst now" button, or a mode that pins a toggle on. Always pair it with `stop_forcing_state()` so the user gets control back.

---

### `stop_forcing_state()`

Stops forcing the keybind state, handing control back to the user.

Returns: *nil*

---

### `get_forced_state()`

Retrieves the state currently being forced.

Returns: *boolean* — The forced state.

---

### `is_showing_on_control_panel()`

Checks whether the keybind is currently mirrored on the [control panel](/dev/api/ui/control-panel).

Returns: *boolean*

---

### `set_is_showing_on_control_panel()`

Marks the keybind to be mirrored on the [control panel](/dev/api/ui/control-panel).

Returns: *nil*

---

### `set_draggable_state(state)`

Sets whether the keybind can be dragged on the control panel.

Parameters:

- **`state`** ( *boolean* ) — `true` to allow dragging.

Returns: *nil*

---

## Button 🖱️

### Constructor

### `button()`

Creates a new button.

Returns: *button* — A new `button` object.

---

### `render(label, tooltip (optional))`

Renders the button with the specified label and optional tooltip.

Parameters:

- **`label`** ( *string* ) — The label text of the button.
- **`tooltip`** ( *string* , optional) — The tooltip text for the button.

Returns: *boolean* — `true` if the button was clicked; otherwise, `false`.

---

### `is_clicked()`

Checks whether the button was clicked this frame, without rendering it.

Returns: *boolean* — `true` if the button was clicked; otherwise, `false`.

> [!NOTE]
> `render` already returns the click, so you only need this when you have to read the click from a different place than where you drew the button.

---

## Color Picker 🎨

### Constructor

### `color_picker(default_color, id)`

Creates a new color picker.

Parameters:

- **`default_color`** ( *number* ) — The default color value.
- **`id`** ( *string* ) — The unique identifier for the color picker.

Returns: *color_picker* — A new `color_picker` object.

---

### `render(label, tooltip (optional))`

Renders the color picker with the specified label and optional tooltip.

Parameters:

- **`label`** ( *string* ) — The label text of the color picker.
- **`tooltip`** ( *string* , optional) — The tooltip text for the color picker.

---

### `get()`

Retrieves the selected color value.

Returns: *number* — The selected color value.

---

## Key Checkbox 🖱️

> [!NOTE]
> This is a special menu element that allows the user full customization over a keybind . Using this menu element might be overkill in most cases, but there are circumstances where you would want to add full costumization to a certain keybind, so all kinds of users are happy with the customization options. This is what it would look like:
>
> ![](https://downloads.project-sylvanas.net/1730289461618-key_checkbox.png)

Explanation of the menu element: 1 -> First, we have a checkbox. If this checkbox is disabled, the logic should be disabled completely. 2 -> Secondly, we have a keyboard icon. Upon pressing this icon, a new popup will appear. 3 -> > This popup contains 3 elements:       3.1 -> Mode: This is the behaviour that the keybind has.             3.1.1 -> Available modes:                   3.1.1.1 -- (0) Hold                   3.1.1.2 -- (1) Toggle                   3.1.1.3 -- (2) Always             3.1.2 -> Modes explanation:                   3.1.2.1 -- Hold means that the keybind state will only return true when the user is pressing it. False otherwise.                   3.1.2.2 -- Toggle means that the keybind wil behave as a toggle.                   3.1.2.3 -- Always means that the keybind will always return true (acts as a checkbox, essentially)

### Constructor

### `key_checkbox(default_key, initial_toggle_state, default_state, show_in_binds, default_mode_state, id)`

```lua
--- Creates a new checkbox instance.
---@param default_key integer The default state of the checkbox.
---@param initial_toggle_state boolean The initial toggle state of the keybind
---@param default_state boolean The default state of the checkbox
---@param show_in_binds boolean The default show in binds state of the checkbox
---@param default_mode_state integer The default show in binds state of the checkbox  -> 0 is hold, 1 is toggle, 2 is always
---@param id string The unique identifier for the checkbox.
---@return key_checkbox
```

---

### `render(label, tooltip (optional))`

Renders the key checkbox with the specified label and optional tooltip.

Parameters:

- **`label`** ( *string* ) — The label text of the button.
- **`tooltip`** ( *string* , optional) — The tooltip text for the button.

Returns: *boolean* — `true` if the button was clicked; otherwise, `false`.

---

### `get_main_checkbox_state()`

Retrieves the state of the checkbox part only — element **1** in the breakdown above.

Returns: *boolean* — `true` if the checkbox is ticked.

> [!WARNING]
> This is the one you gate your whole feature on. It is independent of the keybind: the checkbox can be ticked while the keybind is not held, and vice versa.

---

### `get_keybind_state()`

Retrieves the state of the keybind part only, resolved through the current mode.

Returns: *boolean* — `true` if the keybind is considered active.

> [!TIP]
> The usual pattern is to require both:
>
> ```lua
> local enabled = my_key_checkbox:get_main_checkbox_state()
> local active  = my_key_checkbox:get_keybind_state()
>
> if enabled and active then
>     -- run the feature
> end
> ```

---

### `get_mode()`

Retrieves the keybind mode the user picked.

Returns: *integer* — `0` = Hold, `1` = Toggle, `2` = Always.

---

### `set_key(key)`

Sets a new key code for the keybind part.

Parameters:

- **`key`** ( *integer* ) — The new key code.

Returns: *nil*

---

### `should_show_on_control_panel()`

Checks whether the element is set to appear on the [control panel](/dev/api/ui/control-panel).

Returns: *boolean*

---

### `set_keybind_forced_state(state)`

Forces the keybind part to a fixed state, ignoring user input.

Parameters:

- **`state`** ( *boolean* ) — The state to force.

Returns: *nil*

---

### `stop_forcing_keybind_state()`

Stops forcing the keybind state, handing control back to the user.

Returns: *nil*

---

## Text Input ⌨️

A single-line text field. Create it with `core.menu.text_input(id, save_input)`; pass `save_input = true` to persist what the user typed between sessions.

### Constructor

### `text_input(id, save_input)`

Parameters:

- **`id`** ( *string* ) — The unique identifier for the text input.
- **`save_input`** ( *boolean* , optional) — Whether to persist the entered text.

Returns: *text_input* — A new `text_input` object.

---

### `render(label, tooltip (optional))`

Renders the text input.

Parameters:

- **`label`** ( *string* ) — The label text.
- **`tooltip`** ( *string* , optional) — The tooltip text.

---

### `render_custom(label, tooltip, frame_bg, border_color, text_selected_bg_col, text_color, width_offset, height_offset (optional))`

Renders the text input with a fully custom look.

Parameters:

- **`label`** ( *string* ) — The label text.
- **`tooltip`** ( *string* ) — The tooltip text.
- **`frame_bg`** ( [color](/dev/api/color) ) — The field background color.
- **`border_color`** ( [color](/dev/api/color) ) — The border color.
- **`text_selected_bg_col`** ( [color](/dev/api/color) ) — The background color of selected text.
- **`text_color`** ( [color](/dev/api/color) ) — The text color.
- **`width_offset`** ( *number* ) — Width adjustment in pixels.
- **`height_offset`** ( *number* , optional) — Height adjustment in pixels.

---

### `get_text()`

Retrieves the current text.

Returns: *string* — The current buffer contents.

---

### `get_text_as_number()`

Retrieves the current text parsed as a number.

Returns: *number* — The parsed value.

> [!TIP]
> Saves you a `tonumber()` and the nil-check that goes with it for numeric fields such as item IDs or gold thresholds.

---

### `set_buffer(text)`

Replaces the field contents from code. A text input holds up to 4095 characters since core 2.135 (511 before); longer text is cut.

Parameters:

- **`text`** ( *string* ) — The new buffer contents.

Returns: *nil*

---

### `is_reading_input()`

Checks whether the field currently has focus and is being typed into.

Returns: *boolean*

> [!WARNING]
> Check this before acting on your own keyboard shortcuts. Otherwise a user typing an item name into a text field will also fire every hotkey whose letter they happen to type.

---

### `copy_to_clipboard()`

Copies the field's current text to the system clipboard.

Returns: *nil*

> [!NOTE]
> This takes no argument — it always copies this widget's own text. To put arbitrary text on the clipboard, or to read it back, use [`window:copy_to_clipboard(text)` and `window:get_clipboard_text()`](/dev/api/ui/custom#clipboard).

---

## Header 🏷️

A non-interactive label used to title a group of elements. Created with `core.menu.header()`.

### Constructor

### `header()`

Returns: *header* — A new `header` object.

---

### `render(label, color)`

Renders the header text.

Parameters:

- **`label`** ( *string* ) — The header text.
- **`color`** ( [color](/dev/api/color) ) — The text color.

Returns: *nil*

---

## Methods Shared By Every Element 🧩

These exist on every native menu element — `tree_node`, `checkbox`, `key_checkbox`, `slider_int`, `slider_float`, `combobox`, `keybind`, `button`, `color_picker`, `text_input` and `header`.

### `get_type()`

Retrieves the element's type ID.

Returns: *integer*

---

### `get_label()`

Retrieves the label the element was last rendered with.

Returns: *string* — The label, or `""` if the element has not been rendered yet.

> [!WARNING]
> The label lives in the `render` call, not in the constructor, so this returns an empty string until the element has been rendered at least once.

---

### `get_widget_bounds()`

Retrieves the screen bounds the element occupied when it was last rendered.

Returns: *table* — A table with two [vec2](/dev/api/vector-2) fields:

- **`min`** — the left border of the widget.
- **`max`** — the right border of the widget.

> [!TIP]
> This is what lets you attach custom drawings to a native menu element — a badge next to a checkbox, a warning icon after a slider, a popup anchored under a combobox:
>
> ```lua
> local bounds = my_checkbox:get_widget_bounds()
> if bounds and bounds.min then
>     window:render_text(font_id, vec2.new(bounds.max.x + 6, bounds.min.y), color.yellow(220), "!")
> end
> ```

---

### `get_default()`

Retrieves the default value the element was constructed with.

Returns: *any* — The default value, typed per element (boolean for `checkbox`, integer for `slider_int` and `keybind`, and so on).

> [!NOTE]
> On elements that hold no value — `tree_node`, `button`, `header`, `key_checkbox`, `text_input` — `get_default` and `set` exist only as no-op stubs. They are there so you can loop over a table of mixed elements and reset them all without a Lua error, not because they do anything.

---

## Code Examples 🧰

```lua
-- Define a unique developer ID to prevent ID collisions with other plugins
local dev_id = "unique_developer_id_here"

-- Create a table to store all menu elements
local menu_elements = {}

-- Create the main node for the menu
menu_elements.main_node = core.menu.tree_node()

-- Create checkboxes with unique IDs
menu_elements.checkbox_one = core.menu.checkbox(true, dev_id .. "checkbox_example_one")
menu_elements.checkbox_two = core.menu.checkbox(false, dev_id .. "checkbox_example_two")

-- Create slider int and float with unique IDs
menu_elements.slider_int = core.menu.slider_int(0, 100, 50, dev_id .. "slider_int")
menu_elements.slider_float = core.menu.slider_float(0, 100, 50, dev_id .. "slider_float")

-- Create the sub menu node inside the main node
menu_elements.sub_menu_node = core.menu.tree_node()

-- Create combobox, keybind, button, and color picker with unique IDs
menu_elements.combobox = core.menu.combobox(1, dev_id .. "combobox")
menu_elements.keybind = core.menu.keybind(46, false, dev_id .. "keybind")
menu_elements.button = core.menu.button()
menu_elements.colorpicker = core.menu.color_picker(-65536, dev_id .. "colorpicker")

-- Register the menu rendering callback
core.menu.register_on_render_menu_callback(function()
    -- Render the main node
    menu_elements.main_node:render("Menu Example", function()
        -- Render checkboxes
        menu_elements.checkbox_one:render("Checkbox Example One", "")
        menu_elements.checkbox_two:render("Checkbox Example Two", "")

        -- Render slider int and float
        menu_elements.slider_int:render("Slider Int", "")
        menu_elements.slider_float:render("Slider Float", "")

        -- Render the sub menu node
        menu_elements.sub_menu_node:render("More Elements", function()
            -- Render combobox
            menu_elements.combobox:render("ComboBox", {"Option A", "Option B", "Option C"}, "")
            -- Render keybind
            menu_elements.keybind:render("Keybind", "")
            -- Render button
            if menu_elements.button:render("Button", "") then
                core.log("Button was clicked!")
            end
            -- Render color picker
            menu_elements.colorpicker:render("ColorPicker", "")
        end)
    end)
end)
```

---

## Notes 📝

- Always declare your menu elements **outside** of the render callback to prevent creating new instances each frame.
- Use unique IDs for your menu elements to avoid conflicts with other menu elements within your plugin.
- Menu elements can only be rendered inside the `register_on_render_menu_callback` or `register_on_render_window_callback` callbacks.

---

```

```