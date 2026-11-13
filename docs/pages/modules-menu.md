# Menu

> Source: <https://docs.project-sylvanas.net/modules/menu>

The menu is both the user's control center and the standard settings surface for plugins. This guide starts with the controls users interact with, then shows developers how to build a page with the recommended API or keep older menu code working through the compatibility layer.

## Using the menu

### Open, close, and resize

The menu toggle is configurable under **System**. The shipped default is `Insert`, but the live configured bind is authoritative after it has been changed.

Use the arrows in the top-right corner to move between the supported menu widths.

![](https://downloads.project-sylvanas.net/1727949190846-menu_arrows.png)

To change the height, move the cursor to the bottom resize area, then click and drag.

![](https://downloads.project-sylvanas.net/1727949462427-menu_height.png)

The minimize control keeps a small launcher available. Closing hides the menu until the menu toggle is pressed again.

### Pages, sections, and search

The sidebar groups settings into pages. A page can contain two-column or full-width sections, collapsible subsections, and a local search field. Global search matches actual setting labels and omits pages that are not currently available.

Pages are added by loaded plugins, so two installations with different plugins do not need to have identical sidebars.

### Defaults and reset

Every setting has a default selected by its developer. Right-click a supported widget to restore that declared default. The default is not merely a suggestion: it is also the value used on first run and after a reset.

For sliders, `Ctrl`+click allows direct numeric input. Values outside the developer's minimum and maximum are clamped to the supported range.

### Keybind controls

A keybind row has two different controls:

- **Key pill:** click it, then press the desired key or WoW modifier chord.
- **Mode badge:** double-click it within 0.40 seconds to move to the next mode the plugin developer allowed.

The available modes are:

| Mode | When the bind is active |
| --- | --- |
| `HOLD` | Only while the complete key and modifier chord is held |
| `TOGGLE` | The active state flips when the chord is pressed |
| `RELEASE` | The active state flips when the chord is released |

A grey mode badge is intentionally locked by the plugin. An editable badge only cycles the exact choices the plugin supports. For example, a `TOGGLE`/`HOLD` bind never unexpectedly enters `RELEASE`.

If one click is not followed by the second click in time, the **Changing keybind type** help appears after the 0.40-second window. It appears at most once per session. A successful double-click stays silent. Selecting **Don't remind me again** saves that preference permanently.

> [!TIP]
> Project Sylvanas supports WoW modifier chords such as `Ctrl+T`. Press the full chord while the key pill is listening. This modifier model is WoW-specific; shared LoL/Overwatch code must not assume it exists.

The system menu also contains the configurable menu, console, and Lua reload binds. The shipped defaults are `Insert`, `Delete`, and `F6` respectively.

![](https://downloads.project-sylvanas.net/1727952175429-menu_keybinds.png)

### Persistence and menu-owned files

Widget values, page state, scroll positions, and related menu preferences survive reloads. Live keybind latch state does not: a toggle or release bind starts from the default active state declared by the plugin.

All menu-owned data is organized under `scripts_data/menu/`:

| Path | Purpose |
| --- | --- |
| `assets/` | Menu images, icons, and bundled menu resources |
| `fonts/` | External/downloaded fonts used by the menu |
| `onboarding/` | Onboarding completion and dismissal state |
| `permashow/` | Permashow layout and mirrored settings |
| `translations/` | Menu translation data |
| `keybind_mode_hint.txt` | Permanent dismissal of the keybind-mode hint |
| `menu_debug.txt` | Menu diagnostics |

These are internal files. Users normally manage settings through the menu, and plugins should use the public menu API instead of editing them directly.

## Developing a menu page

### Choose the correct API

Project Sylvanas deliberately supports three layers:

| Surface | Use it for | Recommendation |
| --- | --- | --- |
| `_G.menu` | New retained pages, sections, widgets, search, visibility, modifier chords, and permashow | **Recommended for new work** |
| `require("common/menu/menu_api")` | Existing OW/League-style imperative modules | Supported compatibility layer |
| `core.menu.*` | Low-level native elements and custom window internals | Legacy/advanced only |

The compatibility layer is not a second visual menu. It translates old tree and element calls into the retained menu:

| Old structure | Retained result |
| --- | --- |
| Top-level tree | Sidebar page |
| Depth-1 tree | Section card |
| Depth-2 tree | Subsection |
| Deeper tree | Nested, initially collapsed subsection |

This lets shared old code stay simple while all users receive the same modern menu. New plugins should start with `_G.menu` because it exposes the complete layout, visibility, keybind, and modifier model directly.

### Recommended declarative example

Declare the menu once when the plugin loads:

```lua
local menu = _G.menu
local page_path = { "Plugins", "My Plugin" }

local page = menu:page(page_path, {
    icon = "widgets",
    badge = "NEW",
})

local general = page:section("General", "settings", {
    column = "left",
    searchable = true,
})

general:checkbox("enabled", "Enable plugin", true, {
    description = "Master switch for this plugin",
})

general:slider("range", "Range", 0, 100, 40, "%")

general:keybind("activation", "Activation", 0x54, {
    mode = "toggle",
    modes = { "toggle", "hold" },
    default_active = false,
    default_mods = {
        ctrl = true,
        shift = false,
        alt = false,
    },
    permashow_label = "My Plugin",
})
```

Read values from gameplay code:

```lua
local enabled = menu:get(page_path, "enabled")
local range = menu:get(page_path, "range")
local activation = menu:get(page_path, "activation")

if enabled and activation.active then
    run_feature(range)
end
```

Register pages, widgets, and observers once. `menu:get` is a plain live lookup and is safe to poll from update code.

### Identity, defaults, and persistence

The persistence identity is:

```text
page path + widget id
```

Keep both stable across releases. A label can be renamed or translated without losing a user's setting; changing the id or moving the widget to a new page creates a different setting. Prefix ids in compatibility/native code to avoid collisions.

The default passed when declaring a widget has two jobs:

1. It is the value used when no saved value exists.
2. It is the value restored by right-click reset.

Use `menu:set(page_path, id, value)` for a programmatic live change. Do not redeclare a widget to update it.

### Keybind authoring patterns

`mode` defaults to `hold`. `modes` is an exact allow-list and cycle order.

Locked hold:

```lua
general:keybind("hold_only", "Hold only", 0x47, {
    mode = "hold",
})
```

Locked toggle:

```lua
general:keybind("toggle_only", "Toggle only", 0x47, {
    mode = "toggle",
})
```

User-selectable toggle and hold:

```lua
general:keybind("flexible", "Flexible", 0x47, {
    mode = "toggle",
    modes = { "toggle", "hold" },
})
```

All three modes, only when release is genuinely supported:

```lua
general:keybind("all_modes", "All modes", 0x47, {
    mode = "hold",
    modes = { "hold", "toggle", "release" },
})
```

Omitting `modes`, passing one valid mode, or ending with only one valid mode after validation locks the badge. `default_active` applies to toggle/release latches for the current session; runtime `active` is intentionally not persisted.

WoW chord defaults use `default_mods`. Always include explicit booleans so the intent is obvious:

```lua
default_mods = { ctrl = true, shift = false, alt = false }
```

### Common value shapes

| Widget | `menu:get` result |
| --- | --- |
| Checkbox / toggle | `boolean` |
| Slider / progress | `number` |
| Dropdown / radio / tabs | One-based integer |
| Text input | `string` |
| Color picker | `{ r, g, b, a }` |
| Multi-select | Boolean selection mask |
| Priority/reorder list | Ordered integer permutation |
| Keybind | `{ vk, mods, mode, active }` |

Do not cache `keybind.active`; it changes as input is processed.

### Visibility, changes, permashow, and confirmation

Visibility can be static or evaluated on demand:

```lua
local advanced = page:section("Advanced", "settings", {
    visible = function()
        return menu:get(page_path, "enabled")
    end,
})
```

Use `menu:on_change` for immediate side effects, and register it once:

```lua
menu:on_change(page_path, "enabled", function(new_value, old_value)
    refresh_runtime_state(new_value)
end)
```

Mirror a supported widget in permashow:

```lua
menu.permashow.add(page_path, "activation")
```

Use the shared confirmation UI for destructive actions:

```lua
menu:show_confirm({
    title = "Delete profile?",
    body = "This cannot be undone.",
    tone = "danger",
    confirm_label = "Delete",
    on_confirm = function()
        delete_profile()
    end,
})
```

### Compatibility example for existing plugins

Existing imperative modules can remain concise:

```lua
local legacy = require("common/menu/menu_api")

local root = legacy.new_tree("my_plugin_root", { icon = "widgets" })
local enabled = legacy.new_checkbox("my_plugin_enabled", true)
local activation = legacy.new_keybind(
    true,
    false,
    0x54,
    "my_plugin_activation",
    { modes = { "toggle", "hold" } }
)

core.register_on_render_menu_callback(function()
    root:render("My Plugin", function()
        enabled:render("Enabled")
        activation:render("Activation")
    end)
end)

if enabled:get() and activation:get_state() then
    run_feature()
end
```

Compatibility elements must be constructed once and the same instances rendered from the callback. Per-element styling options are accepted for source compatibility but ignored because the retained menu owns the theme. Options explicitly documented as live, such as descriptions and allowed keybind modes, still work.

The compatibility keybind constructor cannot declare WoW modifier chords. Move a keybind to the recommended `_G.menu` API when `default_mods` or the complete modern value is required.

## Related developer references

- [Native UI functions](/dev/api/ui/)
- [Custom UI](/dev/api/ui/custom)
- [Custom UI guide](/dev/guides/custom-ui)
- [Getting started](/dev)