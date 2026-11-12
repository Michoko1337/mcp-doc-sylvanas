# Core Functions

> Source: <https://docs.project-sylvanas.net/dev/api/core>

## Overview

This module contains a collection of essential functions that you will probably need sooner or later in your scripts. This module includes utilities for logging, callbacks, time management, and accessing game information.

## Callbacks - Brief Explanation

This is essentially the most important part of scripting, since most of your code must be ran inside a callback.

What is a Callback? A callback is a function that you write, which you then pass to the game engine or framework. The engine doesn't execute this function immediately. Instead, it "calls back" to your function at a specific time or when a particular event occurs in the game. Think of it like leaving your phone number with a friend (the game engine) and asking them to call you (execute your function) when a certain event happens.

Why Use Callbacks? Callbacks allow your game to respond to events without constantly checking for them. This makes your code more efficient and easier to manage. Instead of writing code that keeps asking, "Has the player pressed a button yet? Has an enemy appeared yet?" you can simply tell the game engine, "When this happens, run this function." So, all games use callbacks to run, and same with WoW.

Real-World Analogy

Imagine you're waiting for a package to be delivered. You don't stand by the door all day waiting for it (which would be like constantly checking in a loop). Instead, you might continue with your day, and when the doorbell rings (the event), you go to answer it (the callback function is executed).

What was explained is what is a callback in general in the context of videogames. In our case, we have multiple events that our callbacks will be listening to. These are the following:

- On Update — This is the callback that you will use to run your logic most of the time. The code placed inside this callback is called at a **reduced speed**, relative to the speed of `On Render`. It's ideal for logic that doesn't need to be executed every frame. In a game where 95% of spells have a global cooldown, 50% of spells are cast, and units move at 7 yards per second, you don't need to read all the information and check everything every frame. Doing so at 120 FPS means you're, for example, checking the position of all units 120 times per second, which is unnecessary. That's where `On Update` comes in.
- On Render — This is a callback used **only for rendering graphics**, like rectangles, circles, etc. (See [graphics](/dev/api/graphics)). It is the **most important and central callback**, placed within the game inside DirectX in a part called `EndScene`. Every time DirectX is about to render something, this callback is called. That's why it's called `On Render`, and it's the callback that's called the most times of all—**exactly once per frame**. This allows the game to draw the graphics and call your callback so that you can draw at the same speed, neither one frame more nor less, ensuring it feels natural within the game. While you could place your logic here, common sense suggests otherwise.
- On Render Menu — This is a callback used **only for rendering menu elements**. (See [Menu Elements](/dev/api/ui))
- On Render Control Panel — This is a very specialized callback that will be used **ONLY** to handle the control panel elements. (See [Control Panel](/dev/api/ui/control-panel))
- On Spell Cast — This callback will only trigger if a spell is cast, so it might be useful to control some specific cooldowns or how your spells (or other game objects) are being cast.
- On Legit Spell Cast — This callback will only trigger if a spell is **MANUALLY** cast by the player.

> [!NOTE]
> As you will see in the following examples, all callbacks expect you to pass a function. This function must contain all the code that will be read in the case that the event that the callback is listening to is triggered. You can pass it anonymously:
>
> ```lua
> core.register_on_render_callback(function()
>     -- your render code here
> end)
> ```
>
> Or you can pass a defined function:
>
> ```lua
> local function all_my_render_code_function()
> -- your render code here
> end
>
> core.register_on_render_callback(all_my_render_code_function)
> ```
>
> On render callback was used just as an example, but this behaviour is the same for all available callbacks.

## Callback Functions 🔄

### `core.register_on_pre_tick_callback`

Syntax

```lua
core.register_on_pre_tick_callback(callback: function)
```

**Parameters**

- `callback` : `function` - The function to be called before each game tick.

Description

Registers a callback function to be executed before each game tick.

**Example Usage**

```lua
core.register_on_pre_tick_callback(function()
    -- Code to execute before each game tick
end)
```

---

### `core.register_on_update_callback`

Syntax

```lua
core.register_on_update_callback(callback: function)
```

**Parameters**

- `callback` : `function` - The function to be called on each frame update.

Description

Registers a callback function to be executed on each frame update.

**Example Usage**

```lua
core.register_on_update_callback(function()
    -- Code to execute every frame
end)
```

---

### `core.register_on_render_callback`

Syntax

```lua
core.register_on_render_callback(callback: function)
```

**Parameters**

- `callback` : `function` - The function to be called during the render phase.

Description

Registers a callback function to be executed during the render phase.

**Example Usage**

```lua
local function on_render()
    -- Rendering code here
end

core.register_on_render_callback(on_render)
```

---

### `core.register_on_render_menu_callback`

Syntax

```lua
core.register_on_render_menu_callback(callback: function)
```

**Parameters**

- `callback` : `function` - The function to render custom menu elements.

Description

Registers a callback function to render custom menu elements.

> [!WARNING]
> Avoid calling game functions within this callback. It should be used solely for rendering menus and variables.

**Example Usage**

```lua
local function render_menu()
    -- Menu rendering code here
end

core.register_on_render_menu_callback(render_menu)
```

---

### `core.register_on_render_control_panel_callback`

Syntax

```lua
core.register_on_render_control_panel_callback(callback: function)
```

**Parameters**

- `callback` : `function` - The function to render control panel elements.

Description

Registers a callback function to render control panel elements.

**Example Usage**

```lua
local function render_control_panel()
    -- Control panel rendering code here
end

core.register_on_render_control_panel_callback(render_control_panel)
```

---

### `core.register_on_render_window_callback`

Syntax

```lua
core.register_on_render_window_callback(callback: function)
```

**Parameters**

- `callback` : `function` - The function to be called during window rendering.

Description

Registers a callback function to be executed during window rendering phase.

**Example Usage**

```lua
core.register_on_render_window_callback(function()
    -- Window rendering code here
end)
```

---

### `core.register_on_spell_cast_callback`

Syntax

```lua
core.register_on_spell_cast_callback(callback: function)
```

**Parameters**

- `callback` : `function` - The function to be called when any spell is cast.

Description

Registers a callback function that is invoked whenever any spell is cast in the game, including spells cast by the player, allies, and enemies.

**Callback Data Structure**

The callback receives a data table with the following fields:

| Field | Type | Description |
| --- | --- | --- |
| `spell_id` | `number` | Unique identifier for the spell |
| `caster` | `game_object\|nil` | The game object that cast the spell |
| `target` | `game_object\|nil` | The game object targeted by the spell |
| `spell_cast_time` | `number` | The time when the spell was cast |

**Example Usage**

```lua
local function on_spell_casted(data)
    -- Access spell data
    local spell_name = core.spell_book.get_spell_name(data.spell_id)
    core.log(string.format("Spell cast detected: %s", spell_name))
end

core.register_on_spell_cast_callback(on_spell_casted)
```

---

### `core.register_on_legit_spell_cast_callback`

Syntax

```lua
core.register_on_legit_spell_cast_callback(callback: function)
```

**Parameters**

- `callback` : `function` - The function to be called when the local player casts a spell, including unsuccessful attempts.

Description

Registers a callback function that is invoked when the local player casts a spell, including unsuccessful attempts.

**Example Usage**

```lua
local function on_legit_spell_cast(data)
    -- Handle local player's spell cast
end

core.register_on_legit_spell_cast_callback(on_legit_spell_cast)
```

> [!NOTE]
> The "data" parameter is filled with the ID of the spell that was just casted. You can check the way this callback works by adding a core.log(tostring(data)) call inside the function called by the callback.

---

### `core.register_on_focus_changed_callback`

Syntax

```lua
core.register_on_focus_changed_callback(callback: function)
```

**Parameters**

- `callback` : `function(foremost: boolean)` - Called when the game window gains ( `true` ) or loses ( `false` ) the foreground.

Description

Called once each time you alt-tab out of the game or back in (or click another program). The core checks once per tick, before `on_pre_tick`, with the same test as `core.is_window_foremost()`, so you no longer need to poll it every tick. Needs core 2.187 or newer.

It only fires on a change. Read the starting state with `core.is_window_foremost()` when your plugin loads.

**Example Usage**

```lua
core.register_on_focus_changed_callback(function(foremost)
    if not foremost then
        -- the game lost focus: held movement keys are released by the game
    end
end)
```

## Logging - An Important Tool 🔥

## Use Logs In Your Code!

Adding debug logs is a very powerfull tool that you should use in all your plugins. This will help you find bugs and typos very easily. One option that we recommend is that you add a debug local variable (boolean) at the top of your code. When true, the debug for your code will be enabled. For example:

```lua
local debug = false

local function my_logics()
    local is_check_1_ok = true
    if not is_check_1_ok then
        if debug then
            core.log("Check 1 is not ok! .. aborting logics because of it - -")
        end

        return false
    end

    local is_check_2_ok = true
    if not is_check_2_ok then
        if debug then
            core.log("Check 2 is not ok! .. aborting logics because of it - -")
        end

        return false
    end

    if debug then
        core.log("All checks were ok! .. Running logics succesfully!")
    end

    return true
end
```

Obviously, this is a very simple example without any real logic or functionality, but it was showcased here just so you see the recommended workflow. All these prints will only work if your debug variable is true, which is something you can change in less than a second.

### Logging - Functions 📄

### `core.log`

Syntax

```lua
core.log(message: string)
```

**Parameters**

- `message` : `string` - The message to log.

Description

Logs a standard message.

**Example Usage**

```lua
core.log("This is a standard log message.")
```

> [!TIP]
> Use LUA's in-built strings function to format your logs. For example, to pass from boolean or number to string, you would have to use the tostring() function. Example: Logging the cooldown of a spell:
>
> ```lua
> local function print_spell_cd(spell_id)
>     local local_player = core.object_manager.get_local_player()
>     if not local_player then
>         return
>     end
>
>     local spell_cd = core.spell_book.get_spell_cooldown(spell_id)
>
>     core.log("Remaining Spell (ID: " .. tostring(spell_id) .. ") CD: " .. tostring(spell_cd) .. "s")
> end
> ```

---

### `core.log_error`

Syntax

```lua
core.log_error(message: string)
```

**Parameters**

- `message` : `string` - The error message to log.

Description

Logs an error message.

**Example Usage**

```lua
core.log_error("An error has occurred.")
```

---

### `core.log_warning`

Syntax

```lua
core.log_warning(message: string)
```

**Parameters**

- `message` : `string` - The warning message to log.

Description

Logs a warning message.

**Example Usage**

```lua
core.log_warning("This is a warning message.")
```

---

### `core.log_file`

Syntax

```lua
core.log_file(message: string)
```

**Parameters**

- `message` : `string` - The message to log to a file.

Description

Logs a message to a file.

> [!WARNING]
> Access to `core.log_file` may be restricted due to security considerations.

**File Logging for Third-Party Developers**

For third-party developers who need file logging capabilities, you can use `core.create_log_file` and `core.write_log_file` from the [File I/O](/dev/api/file-io) module:

```lua
-- Create and write to a custom log file
core.create_log_file("combat.log")
core.write_log_file("combat.log", "Addon started\n")
core.write_log_file("combat.log", "Target acquired: " .. tostring(unit_name) .. "\n")
```

> [!TIP]
> For the quickest and easiest logging solution, we recommend using the [izi.log](https://docs.project-sylvanas.net/dev/libraries/izi#izilog) helper functions from the izi library. It handles file creation and management automatically, so you don't have to manually build your log files every time.

For more details on file operations, see [File I/O](/dev/api/file-io).

## Time and Performance Functions ⏱️

### `core.get_ping`

Syntax

```lua
core.get_ping() -> number
```

Returns

- `number` : The current network ping.

Description

Retrieves the current network ping.

> [!WARNING]
> On the private-server clients (Vanilla 1.14 / TBC 2.5.3) this always returns `10`, whatever your actual latency is. On every Blizzard client it is the game's own latency reading.

**Example Usage**

```lua
local ping = core.get_ping()
core.log("Current ping: " .. ping .. " ms")
```

---

### `core.time`

Syntax

```lua
core.time() -> number
```

Returns

- `number` : The time in seconds since the PS injection happened.

> [!WARNING]
> Dont use this time to work with server info like buff_end_time, spell_cast_end_time, they work in milliseconds and only with core.game_time()

Description

Returns the time elapsed since the script was injected.

**Example Usage**

```lua
local script_time = core.time()
core.log("Time since script injection: " .. script_time .. " s")
```

---

### `core.game_time`

Syntax

```lua
core.game_time() -> number
```

Returns

- `number` : The time in milliseconds since the game started.

> [!NOTE]
> This is the time that should be used to work with game info like buff_end_time, spell_cast_end_time, etc...

Description

Returns the time elapsed since the game started.

**Example Usage**

```lua
local game_time = core.game_time()
core.log("Game time elapsed: " .. game_time .. " ms")
```

---

### `core.get_local_time`

Syntax

```lua
core.get_local_time() -> table
```

Returns

- `table` : The local system date and time, with the following fields:

| Field | Type | Description |
| --- | --- | --- |
| `year` | `integer` | The four-digit year. |
| `month` | `integer` | The month, `1` to `12`. |
| `day` | `integer` | The day of the month. |
| `hour` | `integer` | The hour, `0` to `23`. |
| `minute` | `integer` | The minute, `0` to `59`. |
| `second` | `integer` | The second, `0` to `59`. |

Description

Returns the local system date and time as a table.

> [!TIP]
> `os.date()` and `os.time()` are not available in the sandbox, so this is how you get wall-clock time — for timestamping log lines, naming daily files, or gating behaviour on the time of day. For measuring elapsed time inside your script keep using `core.time`.

**Example Usage**

```lua
local t = core.get_local_time()
local stamp = string.format("%04d-%02d-%02d %02d:%02d:%02d",
    t.year, t.month, t.day, t.hour, t.minute, t.second)

core.write_log_file("my_addon.log", "[" .. stamp .. "] started\n")
```

---

### `core.get_server_time`

Syntax

```lua
core.get_server_time() -> integer
```

Returns

- `integer` : The realm's clock as unix time, in whole seconds (UTC). `0` only when the client cannot answer; a real reading is never `0` .

Description

Returns the realm's clock, the game's own `GetServerTime()`. Works on every client.

This is the one clock that agrees across sessions, reloads and machines, so use it for anything you store and compare later: cooldown timestamps, "last done at" values, data shared between two PCs. `core.time` and `core.game_time` count from the session start, and `core.get_local_time` follows the PC's own clock, which differs per machine and can simply be wrong.

**Example Usage**

```lua
-- remember when a daily task was done, and skip it for 20 hours
local last_done_at = 0

core.register_on_update_callback(function()
    local now = core.get_server_time()
    if now ~= 0 and now - last_done_at >= 20 * 3600 then
        last_done_at = now
        core.log("running the daily task")
    end
end)
```

---

### `core.delta_time`

Syntax

```lua
core.delta_time() -> number
```

Returns

- `number` : The time in milliseconds since the last frame.

Description

Returns the time elapsed since the last frame.

**Example Usage**

```lua
local dt = core.delta_time()
-- Use dt for frame-dependent calculations
```

---

### `core.cpu_time`

Syntax

```lua
core.cpu_time() -> number
```

Returns

- `number` : The CPU time used.

Description

Retrieves the CPU time used.

**Example Usage**

```lua
local cpu_time = core.cpu_time()
core.log("CPU time used: " .. cpu_time)
```

---

### `core.cpu_ticks`

Syntax

```lua
core.cpu_ticks() -> number
```

Returns

- `number` : The current CPU tick count.

Description

Retrieves the current CPU tick count. Useful for high-precision performance profiling.

**Example Usage**

```lua
local start_ticks = core.cpu_ticks()
-- ... code to profile ...
local end_ticks = core.cpu_ticks()
local elapsed = (end_ticks - start_ticks) / core.cpu_ticks_per_second()
core.log("Operation took: " .. elapsed .. " seconds")
```

---

### `core.cpu_ticks_per_second`

Syntax

```lua
core.cpu_ticks_per_second() -> number
```

Returns

- `number` : The number of CPU ticks per second.

Description

Retrieves the number of CPU ticks per second. Use this in conjunction with `core.cpu_ticks()` for accurate performance measurements.

**Example Usage**

```lua
local ticks_per_second = core.cpu_ticks_per_second()
core.log("CPU ticks per second: " .. ticks_per_second)
```

---

## Game Information Functions 🗺️

### `core.get_map_id`

Syntax

```lua
core.get_map_id() -> number
```

Returns

- `number` : The current map ID.

Description

Retrieves the ID of the current map.

**Example Usage**

```lua
local map_id = core.get_map_id()
core.log("Current map ID: " .. map_id)
```

---

### `core.get_map_name`

Syntax

```lua
core.get_map_name() -> string
```

Returns

- `string` : The name of the current map.

Description

Retrieves the name of the current map.

**Example Usage**

```lua
local map_name = core.get_map_name()
core.log("Current map: " .. map_name)
```

---

### `core.get_subzone_name`

Syntax

```lua
core.get_subzone_name() -> string
```

Returns

- `string` : The subzone, or `""` in open country.

Description

The subzone you are standing in: `"Razor Hill"` where `get_map_name` says `"Durotar"`, `"Booty Bay"` inside Stranglethorn.

**Example Usage**

```lua
core.log(core.get_map_name() .. " / " .. core.get_subzone_name())
```

---

### `core.get_cursor_position`

Syntax

```lua
core.get_cursor_position() -> vec2
```

Returns

- `vec2` : The current cursor position.

Description

Retrieves the current cursor position on the screen.

**Example Usage**

```lua
local cursor_pos = core.get_cursor_position()
core.log(string.format("Cursor position: (%.2f, %.2f)", cursor_pos.x, cursor_pos.y))
```

---

### `core.get_instance_id`

Syntax

```lua
core.get_instance_id() -> integer
```

Returns

- `integer` : The instance map id of where you are.

Description

Returns the instance **map** id of where you are, the 8th value of the game's `GetInstanceInfo()`. It also answers in the open world, where it is the continent. This is the id that [`core.world.get_encounters_for_instance`](/dev/api/world#coreworldget_encounters_for_instance) takes. It is not a UI map id, so do not pass it to functions that expect one, such as `core.world.get_encounters_on_map`.

---

### `core.get_instance_name`

Syntax

```lua
core.get_instance_name() -> string
```

Returns

- `string` : The name of the current instance.

Description

Retrieves the name of the current instance.

---

### `core.get_instance_type`

Syntax

```lua
core.get_instance_type() -> string
```

Returns

- `string` : The type of the current instance.

Description

Retrieves the type of the current instance: `"none"`, `"party"` (a dungeon), `"raid"`, `"pvp"` (a battleground), `"arena"` or `"scenario"`.

**Example Usage**

```lua
local instance_type = core.get_instance_type()
if instance_type == "raid" then
    core.log("Currently in a raid!")
end
```

---

### `core.get_difficulty_id`

Syntax

```lua
core.get_difficulty_id() -> integer
```

Returns

- `integer` : The ID of the current instance difficulty.

Description

Retrieves the ID of the current instance difficulty.

---

### `core.get_difficulty_name`

Syntax

```lua
core.get_difficulty_name() -> string
```

Returns

- `string` : The name of the current instance's difficulty.

Description

Retrieves the name of the current instance's difficulty (e.g., "Normal", "Heroic", "Mythic").

---

### `core.get_game_build`

Syntax

```lua
core.get_game_build() -> table
```

Returns

| Field | Type | Description |
| --- | --- | --- |
| `version` | `string` | Patch string, e.g. `"2.5.6.69795"` |
| `build` | `integer` | Build number as an integer, e.g. `69795`. `0` when unknown |
| `date` | `string` | The client's build date string |
| `toc` | `integer` | Interface version, e.g. `20506` on TBC 2.5.6. `0` when unknown |

Description

The client's own `GetBuildInfo()`. This is the patch a bug report has to name.

`core.get_exact_game_version()` answers a **client key** (`"wow_tbc_us"`, `"wow_tbc_ps"`), not a patch, so plugins were keeping hand-written tables mapping key to build number. Those need a new row on every client update and are wrong until somebody adds it. This asks the client, so it is right the moment the client changes.

Use `build` for comparisons and `version` for anything a human reads.

**Example Usage**

```lua
local b = core.get_game_build()
core.log(string.format("client %s (build %d, toc %d)", b.version, b.build, b.toc))
```

---

### `core.get_keystone_level`

Syntax

```lua
core.get_keystone_level() -> integer
```

Returns

- `integer` : The level of the keystone you are carrying. `0` when you hold none, and `0` on every non-retail client.

Description

Returns the level of the Mythic+ keystone in your bags. Pair it with `core.get_keystone_map_id`: the two together are what identify a key.

> [!WARNING]
> Always `0` on every other version, Forever included.

---

### `core.get_keystone_map_id`

Syntax

```lua
core.get_keystone_map_id() -> integer
```

Returns

- `integer` : The challenge map id of the keystone you are carrying. `0` when you hold none, and `0` on every non-retail client.

Description

The dungeon of the keystone in your bags. Pass it to `C_ChallengeMode.GetMapUIInfo` for the name.

> [!WARNING]
> Always `0` on every other version, Forever included.

This is **not** [`core.world.get_active_challenge_map_id`](/dev/api/world), which answers the dungeon of the run you are standing in. This one answers the key in your bag, which is usually a different dungeon and exists while you are in no run at all.

It is also how you fill in your own row after [`core.game_ui.request_party_keystones`](/dev/api/game-ui): you never receive your own addon message, so the party broadcast returns everybody's key except yours.

---

### `core.get_height_for_position`

Syntax

```lua
core.get_height_for_position(position: vec3, options?: table) -> number
```

**Parameters**

- `position` : `vec3` - The point to measure under.
- `options` : `table` (optional) - Changes where the ray starts and what stops it:
  - `water` : `boolean` - Stop on a water surface instead of the sea or lake bed. Default `false` .
  - `probe_up` : `number` - Yards above `position.z` where the downward ray starts, `0` to `1000` . Default `2` .

Returns

- `number` : The height (z) of the first surface hit, `0` on a miss.

Description

Returns the height of the first surface below a point: a vertical ray from a little above `position`, straight down, answering where it hits terrain, buildings, docks or doodads.

> [!WARNING]
> Called with `position` only, it behaves exactly as it always has:
>
> - The ray starts 2 yards above `position.z` . It cannot hit a surface it starts **below** , so if the z you pass is lower than the dock, bridge or shore slope at that x, y, the answer drops through to whatever is underneath, often the sea bed. Pass a z that is above the surface, or raise `probe_up` .
> - Water is ignored: over a lake or the sea you get the **bed** , not the surface. Pass `water = true` for the surface.
> - A miss answers `0` , which you cannot tell apart from a real height of `0` .

The `options` table was added in the core update of 2026-10-06. Older cores take `position` only.

- `water = true` stops on the water surface instead of the bed. This option is new and has not been confirmed in game on every client yet.
- `probe_up` starts the ray higher, which is useful when you sample the ground along a path. Do not raise it inside buildings or caves: the ray then hits the floor or ceiling above you.

A second argument that is not a table, or a `probe_up` that is not a number from `0` to `1000`, raises a Lua error.

**Example Usage**

```lua
local p = vec3.new(x, y, z)
local bed     = core.get_height_for_position(p)
local surface = core.get_height_for_position(p, { water = true })
local ground  = core.get_height_for_position(p, { probe_up = 10 })
```

---

### `core.get_game_version`

Syntax

```lua
core.get_game_version() -> string
```

Returns

- `string` : The current game version.

Description

Returns the current game version. Possible values: `"Midnight"`, `"Tbc"`, `"Vanilla"`, `"Mop"`, `"Titan"`, `"Forever"`.

> [!NOTE]
> The private-server clients answer like their Blizzard counterpart, `"Vanilla"` or `"Tbc"`. Use `core.get_exact_game_version` when you need to tell them apart.

**Example Usage**

```lua
local version = core.get_game_version()
if version == "Midnight" then
    core.log("Running on Retail (12.X) !")
elseif version == "Vanilla" then
    core.log("Running on Classic Era (1.X) !")
elseif version == "Tbc" then
    core.log("Running on Classic Tbc (2.X) !")
elseif version == "Mop" then
    core.log("Running on Classic Mop (5.X) !")
end
```

---

### `core.get_game_region`

Syntax

```lua
core.get_game_region() -> string
```

Returns

- `string` : The current game region.

Description

Returns the current game region. Possible values: `"West"`, `"China"`.

**Example Usage**

```lua
local region = core.get_game_region()
core.log("Playing in region: " .. region)
```

---

### `core.is_main_menu_open`

Syntax

```lua
core.is_main_menu_open() -> boolean
```

Returns

- `boolean` : `true` if the main menu is open, `false` otherwise.

Description

Checks if the main menu is currently open.

**Example Usage**

```lua
if core.is_main_menu_open() then
    core.log("Main menu is open")
end
```

---

### `core.reset_menu_settings`

Syntax

```lua
core.reset_menu_settings() -> boolean
```

Returns

- `boolean` : `true` if the settings database was cleared.

Description

Clears the stored menu settings database. This is what backs the menu's "factory reset all settings" action.

> [!DANGER]
> This wipes every stored widget value of every plugin, loaded or not — not just your own. There is no undo. Do not call it as part of a plugin's own reset; give the user a confirmation step, or reset only your own elements with their `set(get_default())`.

---

### `core.get_exact_game_version`

Syntax

```lua
core.get_exact_game_version() -> string
```

Returns

- `string` : The exact game version string.

Description

Returns the exact game build this core was made for, as a product name rather than a build number: `"wow_midnight_us"`, `"wow_midnight_cn"`, `"wow_vanilla_us"`, `"wow_vanilla_cn"`, `"wow_tbc_us"`, `"wow_tbc_cn"`, `"wow_mop_us"`, `"wow_mop_cn"`, `"wow_titan_cn"`, `"wow_forever_beta_us"`, and `"wow_vanilla_ps"` / `"wow_tbc_ps"` for the private-server clients.

**Example Usage**

```lua
local version = core.get_exact_game_version()
core.log("Exact game version: " .. version)
```

---

### `core.get_owning_plugin_name`

Syntax

```lua
core.get_owning_plugin_name() -> string|nil
```

Returns

- `string` : The name of the plugin that owns the calling code.
- `nil` : If no plugin owns the current call.

Description

Returns the name of the plugin that owns whatever code is calling right now. This is the `name` your `header.lua` returns, which is also the identity the menu uses when it saves your settings. If that name is empty, the plugin's root folder name is returned instead.

The owner is resolved by walking the Lua call stack, not from the file the call sits in. A shared module that several plugins `require` therefore reports whichever plugin called into it, not the module's own package, which is what makes it usable for per-caller logging and namespacing inside a shared library.

**Example Usage**

```lua
-- Prefix log lines with the calling plugin, from inside a shared helper
local function log_for_caller(message)
    local owner = core.get_owning_plugin_name() or "unknown"
    core.log("[" .. owner .. "] " .. message)
end
```

---

### `core.set_window_foremost`

Syntax

```lua
core.set_window_foremost() -> nil
```

Description

Forces the game window to the foreground.

**Example Usage**

```lua
core.set_window_foremost()
```

---

### `core.is_textbox_focused`

Syntax

```lua
core.is_textbox_focused() -> boolean
```

Returns

- `boolean` : `true` if a textbox (such as chat) is currently focused, `false` otherwise.

Description

Returns whether a textbox (like chat) is currently focused. Useful for disabling keybinds while the player is typing.

**Example Usage**

```lua
if not core.is_textbox_focused() then
    -- Safe to process keybinds
end
```

---

### `core.play_sound_by_id`

Syntax

```lua
core.play_sound_by_id(id: number) -> boolean, number
```

**Parameters**

- `id` : `number` - The game sound ID to play.

Returns

- `boolean` : Whether the sound will play.
- `number` : The sound handle, which can be passed to `core.stop_sound_by_handle` .

Description

Plays a game sound by its sound ID.

**Example Usage**

```lua
core.play_sound_by_id(8959)

-- Keep the handle if you may need to stop the sound early
local will_play, handle = core.play_sound_by_id(8959)
```

---

### `core.stop_sound_by_handle`

Syntax

```lua
core.stop_sound_by_handle(handle: integer, fadeout_ms: integer|nil) -> nil
```

**Parameters**

- `handle` : `integer` - The handle returned by `core.play_sound_by_id` .
- `fadeout_ms` (Optional): `integer` - Fadeout time in milliseconds. Omit to stop immediately.

Description

Stops a playing sound instance by its handle.

**Example Usage**

```lua
local will_play, handle = core.play_sound_by_id(8959)

-- ...later, fade it out over half a second
if will_play then
    core.stop_sound_by_handle(handle, 500)
end
```

> [!TIP]
> Useful for looping alert sounds: start one when a condition trips, keep the handle, and stop it when the condition clears instead of letting it run to the end.

---

### `core.get_mouse_wheel_delta`

Syntax

```lua
core.get_mouse_wheel_delta() -> number
```

Returns

- `number` : The mouse wheel scroll delta for the current frame.

Description

Returns the mouse wheel scroll delta for the current frame. Positive values indicate scrolling up, negative values indicate scrolling down.

**Example Usage**

```lua
local delta = core.get_mouse_wheel_delta()
if delta ~= 0 then
    core.log("Mouse wheel delta: " .. delta)
end
```

---

## HTTP Functions 🌐

The HTTP module allows you to make asynchronous HTTP requests for fetching remote data such as JSON, text, or images.

### `core.http_get`

Syntax

```lua
-- Without headers
core.http_get(url: string, callback: function)

-- With headers
core.http_get(url: string, headers: table, callback: function)
```

**Parameters**

- `url` : `string` - The URL to fetch.
- `headers` (optional): `table<string, string>` - HTTP headers to send with the request.
- `callback` : `function` - Function called when the request completes.

**Callback Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| `http_code` | `integer` | HTTP status code (200, 404, etc). On a network failure this is the curl error code instead, and `content_type` is `"error"`. |
| `content_type` | `string` | Server content type |
| `response_data` | `string` | Raw response body (binary safe) |
| `response_headers` | `string` | The final response's raw header block: its status line, then one `Key: Value` line per header |

Description

Performs an asynchronous HTTP GET request. This API is generally used to fetch remote data (JSON, text, images, etc).

**Redirects** are followed automatically (core update of 2026-10-06):

- Up to 5 hops, `http` and `https` only. The callback gets the **final** response's status, body and headers; you never see the 3xx. More than 5 hops fails with `http_code` `47` and `content_type` `"error"` .
- Code that follows `Location:` by hand keeps working: it simply never sees a 3xx any more.
- An `Authorization` header is not sent on to a different host after a redirect.

Older cores did not follow redirects and handed the 3xx response to the callback.

**Example Usage - Simple Request**

```lua
core.http_get("https://httpbin.org/get", function(http_code, content_type, response_data, response_headers)
    core.log("Status: " .. http_code)
    core.log("Response: " .. response_data)
end)
```

**Example Usage - With Headers**

```lua
core.http_get("https://httpbin.org/get", {
    ["Authorization"] = "Bearer token123",
    ["User-Agent"] = "MyApp/1.0",
    ["Accept"] = "application/json"
}, function(http_code, content_type, response_data, response_headers)
    core.log("Status: " .. http_code)
    core.log("Response: " .. response_data)
end)
```

**Example Usage - Download and Load Texture**

```lua
core.http_get("https://example.com/image.png", function(http_code, content_type, response_data, response_headers)
    if http_code == 200 and response_data and #response_data > 0 then
        local texture_id, width, height = core.graphics.load_texture(response_data)
        if texture_id then
            core.log("Texture loaded! ID: " .. texture_id .. ", Size: " .. width .. "x" .. height)
        end
    end
end)
```

---

### `core.http_post`

Syntax

```lua
-- Without headers
core.http_post(url: string, body: string, callback: function)

-- With headers
core.http_post(url: string, headers: table, body: string, callback: function)
```

**Parameters**

- `url` : `string` - The URL to send the POST request to.
- `headers` (optional): `table<string, string>` - HTTP headers to send with the request.
- `body` : `string` - The request body to send.
- `callback` : `function` - Function called when the request completes.

**Callback Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| `http_code` | `integer` | HTTP status code (200, 404, etc). On a network failure this is the curl error code instead, and `content_type` is `"error"`. |
| `content_type` | `string` | Server content type |
| `response_data` | `string` | Raw response body (binary safe) |
| `response_headers` | `string` | The final response's raw header block: its status line, then one `Key: Value` line per header |

Description

Performs an asynchronous HTTP POST request. Supports two overloads: one without headers and one with headers.

**Redirects** are followed exactly as for `core.http_get`: up to 5 hops, `http` and `https` only, the callback gets the final response, and `Authorization` is not sent on to a different host. On top of that, what happens to the POST depends on the redirect code:

- `301` , `302` or `303` : re-requested as a **GET without the body** , which is what browsers do.
- `307` or `308` : the POST is repeated **with** the body.

**Example Usage - Simple POST**

```lua
core.http_post("https://httpbin.org/post", '{"key": "value"}', function(http_code, content_type, response_data, response_headers)
    core.log("Status: " .. http_code)
    core.log("Response: " .. response_data)
end)
```

**Example Usage - With Headers**

```lua
core.http_post("https://httpbin.org/post", {
    ["Content-Type"] = "application/json",
    ["Authorization"] = "Bearer token123"
}, '{"key": "value"}', function(http_code, content_type, response_data, response_headers)
    core.log("Status: " .. http_code)
    core.log("Response: " .. response_data)
end)
```

---

### `core.get_session_jwt_token`

Syntax

```lua
core.get_session_jwt_token() -> string | nil
```

**Returns**

- `string` - A JWT signed by the PS server (ES256, about 210 ASCII characters) that proves which PS user runs this session.
- `nil` - The session has no token. Treat the user as unverified.

Description

Issued once when the session starts and stays the same for the whole session, plugin reloads included. Send it to your own server and verify it there with the PS public key. No PS API access is needed. Claims: `uid` (PS user id), `sid` (session id), `product` (`0` WoW), `iat` (session start, unix seconds). There is no `exp`: apply your own age limit.

It is a bearer proof: don't log it or show it anywhere public.

Full verification steps, the public key and server examples: [Verifying PS users (session JWT)](/dev/guides/session-jwt).

**Example Usage**

```lua
local token = core.get_session_jwt_token()
if token then
    core.http_post("https://your-server.example/api/ps-verify",
        { ["Authorization"] = "Bearer " .. token },
        "",
        function(http_code, content_type, response_data, response_headers)
            if http_code == 200 then
                -- your server accepted the token
            end
        end)
end
```

---

## Inventory 🎒

> [!NOTE]
> See [Inventory Helper](/dev/libraries/mini-libs/inventory-helper) for more info.

### `core.inventory.get_items_in_bag`

Syntax

```lua
core.inventory.get_items_in_bag(id: integer) -> table<item_slot_info>
```

**Parameters**

- `id` : `integer` - The bag ID.

Returns

- `table<item_slot_info>` : A table containing the item data.

> [!NOTE]
> The item slot info contains 2 members:
>
> - `.slot_id` -> the id of the slot
> - `.object` -> the item itself (game_object)

> [!DANGER]
> Rows carry **only** `.object` and `.slot_id`. Reading `row.item_id` gives you `nil` on every row, on every build, without an error. Read the id off the object instead:
>
> ```lua
> for _, row in ipairs(core.inventory.get_items_in_bag(1)) do
>     local item_id = row.object and row.object:get_item_id()
> end
> ```
>
> Only occupied slots are returned. The list length is an item count, never a slot count, and it cannot be indexed by slot.

Description

This function returns all the items in the bag with the ID that you pass as parameter. This is a low-level function, and we recommend, like always, to use our LUA libraries that we crafted so the development is easier for everyone. For more info, check out the [Inventory Helper](/dev/libraries/mini-libs/inventory-helper) library.

> [!WARNING]
> This is the single most reported surprise in the inventory API, so it is worth reading once.
>
> Bag `0` returns the player's **entire item container**: everything currently worn, then the bag objects themselves, then the backpack. It behaves this way on every expansion and every build.
>
> | `slot_id` range | What is in it |
> | --- | --- |
> | `1` to `19` | Equipped gear, head through tabard |
> | `20` to `23` | The equipped bags, as items |
> | `24` and up | The backpack |
>
> Those ranges were measured on the private-server clients (Vanilla 1.14 / TBC 2.5.3). On retail the worn block is longer, the bags sit at `31` to `35`, and the backpack starts at `36`. The other Classic versions have not been measured, so do not assume either layout there.
>
> Every non-positive id behaves identically: `0`, `-1`, `-2` and `-4` all return that same full container, so the keyring and bank entries below are not separate views. Ids `1` to `4` are the real per-bag reads and return only that bag's own contents, numbered from `1`.
>
> If you want the backpack and nothing else, use [Inventory Helper](/dev/libraries/mini-libs/inventory-helper) rather than filtering by hand: the cut-off differs per client and the helper already knows it.

> [!NOTE]
> **Bag IDs:**
>
> - `0` = the whole player container, see the warning above. `1` to `4` for the bags on the character.
> - `-1` , `-2` and `-4` (bank, keyring, tokens) return the same full player container as `0` , not a separate view.
> - `5` to `11` are addressed as bank bags while the bank is open; these are not verified on the Classic builds.
>
> Check [https://wowwiki-archive.fandom.com/wiki/BagId](https://wowwiki-archive.fandom.com/wiki/BagId) for the historical id table.

---

### `core.inventory.get_container_item_link`

Syntax

```lua
core.inventory.get_container_item_link(container_id: integer, slot_id: integer) -> string | nil
```

**Parameters**

- `container_id` : `integer` - WoW's own bag id. `0` is the backpack, `1` to `4` are the equipped bags.
- `slot_id` : `integer` - **WoW's slot + 1** , the same `bag_slot` every container action takes. Backpack slot 16 is `(0, 17)` .

Returns

- `string` : The full item link for that exact item instance.
- `nil` : The slot is empty.

Description

The **full** item link, including random suffix, enchant and gems.

`core.auction_house.get_item_info(id).item_link` builds a link from an item id, so it carries none of those: two "Bracers of the Eagle" with different suffixes produced the same string and could not be told apart. This is the client's link for the item actually in that slot.

`(container_id, slot_id)` is the **same pair** that `core.input.use_container_item`, `pickup_container_item`, `destroy_container_item`, `equip_container_item` and `core.inventory.get_container_item_stats` take, so the slot you read a link from is the slot you then act on.

> [!WARNING]
> The first version took `(bag + 1, wow_slot)`, which disagreed with every container action on both arguments. It now follows the container convention above. `get_num_bag_slots` still uses its own shifted bag id, which is why the loop below passes `bag + 1` to it and `wow_slot + 1` here.

**Example Usage**

```lua
for bag = 0, 4 do
    for wow_slot = 1, core.inventory.get_num_bag_slots(bag + 1) do
        local link = core.inventory.get_container_item_link(bag, wow_slot + 1)
        if link then
            core.log(link)
            -- the same pair acts on the same item:
            -- core.input.use_container_item(bag, wow_slot + 1)
        end
    end
end
```

---

### `core.inventory.get_inventory_item_link`

Syntax

```lua
core.inventory.get_inventory_item_link(slot_id: integer) -> string | nil
```

**Parameters**

- `slot_id` : `integer` - WoW's own equipment slot, `1` (head) to `19` (tabard). No shift, and unrelated to the bag numbering above.

Returns

- `string` : The full item link of the worn item.
- `nil` : Nothing is worn in that slot.

Description

Same as `get_container_item_link`, for equipped gear. Use it to tell gear variants apart when scoring or comparing.

**Example Usage**

```lua
for slot = 1, 19 do
    local link = core.inventory.get_inventory_item_link(slot)
    if link then
        core.log(slot .. ": " .. link)
    end
end
```

---

### `core.inventory.get_num_bag_slots`

> [!TIP]
> On the private-server builds this used to return garbage (163579 and 969378897 for two 6-slot bags) because the native read landed outside the item object. It asks the client's own `GetContainerNumSlots` now and is correct on every build. The `bag_id` convention below did not change.

Syntax

```lua
core.inventory.get_num_bag_slots(bag_id: integer) -> integer
```

**Parameters**

- `bag_id` : `integer` - The bag ID, **shifted one higher** than the `get_items_in_bag` id. `1` is the backpack, `2` to `5` are the four equipped bags.

Returns

- `integer` : The number of slots in the specified bag. `0` from ids `2` to `5` means no bag is equipped in that slot.

Description

Returns the total number of slots available in the specified bag container.

> [!WARNING]
> The two functions are one apart. Pair them like this, or you will be asking about a different bag than the one you are reading:
>
> | Container | Read its items with | Read its size with |
> | --- | --- | --- |
> | Backpack | `get_items_in_bag(0)` | `get_num_bag_slots(1)` |
> | First equipped bag | `get_items_in_bag(1)` | `get_num_bag_slots(2)` |
> | Fourth equipped bag | `get_items_in_bag(4)` | `get_num_bag_slots(5)` |
>
> `get_num_bag_slots(0)` is out of range and returns `0` on every build. A zero from it is not "the backpack is missing", it is "that id cannot be asked". The backpack is `1`.

**Example Usage**

```lua
-- Check how many slots the backpack has (note: 1, not 0)
local slots = core.inventory.get_num_bag_slots(1)
core.log("Backpack has " .. slots .. " slots")

-- Walk every container: size and contents, correctly paired
for bag = 0, 4 do
    local items = core.inventory.get_items_in_bag(bag)
    local size = core.inventory.get_num_bag_slots(bag + 1)
    core.log("bag " .. bag .. ": " .. #items .. " items, " .. size .. " slots")
end
```

---

### `core.inventory.get_total_repair_cost`

Syntax

```lua
core.inventory.get_total_repair_cost() -> integer
```

Returns

- `integer` : The total repair cost in copper.

Description

Returns the total cost to repair all equipped items, in copper. Divide by 10000 for gold, by 100 for silver.

**Example Usage**

```lua
local cost = core.inventory.get_total_repair_cost()
local gold = math.floor(cost / 10000)
local silver = math.floor((cost % 10000) / 100)
core.log(string.format("Repair cost: %dg %ds", gold, silver))
```

---

### `core.inventory.can_merchant_repair`

Syntax

```lua
core.inventory.can_merchant_repair() -> boolean
```

Returns

- `boolean` : `true` when the merchant currently open offers a repair service.

Description

Returns whether the open merchant can repair. This is only meaningful while a merchant window is open, between `MERCHANT_SHOW` and `MERCHANT_CLOSED`. With no merchant open it returns `false`, so it is not a substitute for a vendor-open check.

Read it before trusting a zero from `get_total_repair_cost()`. That function also needs a repair-capable merchant, so a zero cost means either "nothing is damaged" or "this vendor cannot repair", and only `can_merchant_repair()` separates the two.

The result is always a boolean, including on the classic clients where the game's own function answers `1` or `nil`.

**Example Usage**

```lua
if core.inventory.can_merchant_repair() then
    local cost = core.inventory.get_total_repair_cost()
    if cost > 0 and cost <= core.inventory.get_gold() then
        core.input.repair_all_items(false)
    end
end
```

---

### `core.inventory.get_item_durability`

Syntax

```lua
core.inventory.get_item_durability(slot: integer) -> inventory_item_durability
```

**Parameters**

- `slot` : `integer` - The equipment slot id ( `INVSLOT_*` , 1 to 19). This is an equipment slot, not a bag slot.

Returns

- `inventory_item_durability` : A table containing:
  - `current` : `integer` - Current durability points. Zero with a positive `max` means the item is broken.
  - `max` : `integer` - Maximum durability points. Zero means the slot is empty or the item has no durability.

Description

Returns the durability of the item equipped in one slot.

Both fields are `0` when the slot is empty or the item does not track durability, so test `max > 0` before dividing. Tabards, shirts and most trinkets have no durability and would otherwise divide by zero.

**Example Usage**

```lua
-- Find the worst equipped slot
local worst = 1.0

for slot = 1, 19 do
    local durability = core.inventory.get_item_durability(slot)
    if durability.max > 0 then
        local ratio = durability.current / durability.max
        if ratio < worst then
            worst = ratio
        end
    end
end

core.log(string.format("Worst equipped slot: %d%%", math.floor(worst * 100)))
```

---

### `core.inventory.get_gold`

Syntax

```lua
core.inventory.get_gold() -> integer
```

Returns

- `integer` : The player's current money in copper. `0` when there is no local player.

Description

Returns the local player's total money in copper. Divide by 10000 for gold, by 100 for silver.

`0` is not only "you are broke". It is also the answer when there is no local player, which is the case at character select, so a plugin that reads this during load gets `0` and should read it again once it is in the world.

Copper passes 2^31 at 214,748 gold, so the value is returned as a Lua number rather than a 32-bit integer. It stays exact well past the money cap.

This is a call into the game client and not a memory read. It is cheap, but cache it rather than polling it every frame. `game_object:get_gold()` on the local player is the same value.

**Example Usage**

```lua
local copper = core.inventory.get_gold()
local gold = math.floor(copper / 10000)
local silver = math.floor((copper % 10000) / 100)
local remaining_copper = copper % 100
core.log(string.format("Player gold: %dg %ds %dc", gold, silver, remaining_copper))
```

---

### `core.inventory.get_container_item_stats`

Syntax

```lua
core.inventory.get_container_item_stats(container_id, slot_id) -> table|nil
```

Parameters

- `container_id` ( *integer* ): The bag id. `0` is the backpack, `1` to `4` are the equipped bags.
- `slot_id` ( *integer* ): The slot within that bag, as `inventory_helper` reports it.

Returns

- `table|nil` : Stat name to value, or `nil` when the slot is empty or the item data is not cached yet.

Description

The stat **numbers** for a bag item. An item id and an item name are both blind to the random "of the ..." suffix that decides a green's real stats. This is the call that sees it.

```lua
local stats = core.inventory.get_container_item_stats(bag_id, bag_slot)
if stats then
    local agi = stats.agility or 0
    local sta = stats.stamina or 0
end
```

> [!TIP]
> The client answers with its own global-string tokens, `ITEM_MOD_AGILITY_SHORT` and friends. The `ITEM_MOD_` prefix and the `_SHORT` suffix are stripped and the rest lowercased, so you index `agility`, `stamina`, `crit_rating`, `attack_power`, `haste_rating`, `versatility`, `mastery_rating`.
>
> `RESISTANCE0_NAME` is aliased to **`armor`**, because resistance index 0 *is* armor and the raw token is the one key you would never guess. Anything else the client reports comes through lowercased as-is rather than being dropped, so a stat this core has never seen still reaches you.

`nil` and not an empty table, so you write `if stats then`. An empty slot and item data that is not cached yet are not distinguishable at this layer, which is why there is no second return value pretending otherwise.

---

### `core.inventory.get_inventory_item_stats`

Syntax

```lua
core.inventory.get_inventory_item_stats(inventory_slot) -> table|nil
```

Parameters

- `inventory_slot` ( *integer* ): The game's own inventory slot number. `1` to `19` is gear on every game version: `12` is the second ring, `14` the second trinket, `17` the off hand. For a bag slot, ask `get_bag_inventory_slot` , because bag slot numbers differ between game versions. A slot the current game version does not have raises an error.

Returns

- `table|nil` : Stat name to value, or `nil` when the slot is empty.

Description

The stat numbers for an **equipped** item. Same table shape and same renaming as `get_container_item_stats`. This is the side you compare a bag candidate against, which is the whole reason both exist:

```lua
local SECOND_RING = 12

local worn = core.inventory.get_inventory_item_stats(SECOND_RING)
local cand = core.inventory.get_container_item_stats(bag_id, bag_slot)

if worn and cand and (cand.agility or 0) > (worn.agility or 0) then
    core.input.equip_container_item(bag_id, bag_slot, SECOND_RING)
end
```

> [!NOTE]
> This reads your own equipment and takes no unit token, deliberately. A settable token would be a developer string inside a chunk that runs in the game Lua state, which the core's security rules forbid.

---

### `core.inventory.get_item_stats`

Syntax

```lua
core.inventory.get_item_stats(item_link: string) -> table | nil
```

**Parameters**

- `item_link` : `string` - A full item link. Any text is safe.

Returns

- `table` : Stat name to value, the **same keys** as `get_container_item_stats` ( `stamina` , `armor` , ...).
- `nil` : The client knows no stats for it yet.

Description

Stats for **any** item: quest rewards, vendor items, loot rolls. Same reader as the bag and equipment versions, so scores compare directly.

`nil` also means the client has not cached the item yet; ask again once it has been seen.

**Example Usage**

```lua
local link = core.game_ui.get_loot_roll_item_link(roll_id)
local stats = link and core.inventory.get_item_stats(link)
if stats then core.log("stamina " .. (stats.stamina or 0)) end
```

---

### Guild bank

Readable and writable only while the guild bank window is open, between `GUILDBANKFRAME_OPENED` and `GUILDBANKFRAME_CLOSED`. Outside that window every reader answers `0`, `nil` or `false`. Tabs are 1 based, slots are `1` to `98`.

| Function | Returns |
| --- | --- |
| `core.inventory.get_guild_bank_num_tabs()` | `integer` |
| `core.inventory.get_guild_bank_tab_info(tab)` | `name`, `is_viewable`, `can_deposit`, `num_withdrawals`, `remaining_withdrawals`, `icon`, or `nil` |
| `core.inventory.get_guild_bank_item_link(tab, slot)` | `string` or `nil` |
| `core.inventory.get_guild_bank_item_info(tab, slot)` | `count`, `is_locked`, `texture`, or `nil` for an empty slot |
| `core.inventory.get_guild_bank_money()` | copper |
| `core.inventory.deposit_guild_bank_money(copper)` | `boolean`, the call was reached |
| `core.inventory.withdraw_guild_bank_money(copper)` | `boolean`, the call was reached |
| `core.inventory.withdraw_guild_bank_item(tab, slot)` | `boolean`, moves it to your bags |

> [!TIP]
> There is no separate deposit call: `core.input.use_container_item` on a bag item while the guild bank is open moves it into the open tab, the same as right-clicking.

> [!NOTE]
> Your guild rank's daily limits are enforced by the server, so a refused withdrawal still returns `true`. Check `remaining_withdrawals` first.

---

### `core.inventory.get_bag_inventory_slot`

Syntax

```lua
core.inventory.get_bag_inventory_slot(container_id) -> integer|nil
```

Parameters

- `container_id` ( *integer* ): The bag. `1` to `4` are the equipped bags, `5` is the reagent bag on game versions that have one.

Returns

- `integer` : The inventory slot number that holds that bag on the game version you are running.
- `nil` : There is no such bag slot here. That covers `0` (the backpack is not held in a slot), `5` on a game version without a reagent bag, and any other number.

Description

The portable way to name a bag slot for [`equip_container_item`](/dev/api/input#equip_container_itemcontainer_id-slot_id-inventory_slot) and `get_inventory_item_stats`.

> [!WARNING]
> Gear slots `1` to `19` are numbered the same on every game version. Bag slots are not. The private-server clients keep the four bags at `20` to `23`. Retail keeps them at `31` to `34`, with the reagent bag at `35`, because `20` to `30` are profession gear there. A hardcoded bag slot is right on one of them and refused, or wrong, on the other. Ask this function instead: the answer comes from the game client itself.

The answer is looked up once and kept for the session, so calling this is cheap.

**Example Usage**

```lua
-- a bigger bag sits in the backpack at (bag_id, bag_slot): put it in the fourth bag slot
local slot = core.inventory.get_bag_inventory_slot(4)
if slot then
    core.input.equip_container_item(bag_id, bag_slot, slot)
end
```

---

## Game UI Functions 🎮

For game UI related functions such as loot window, battlefield status, cursor position, and more, see the dedicated [Game UI](/dev/api/game-ui) documentation.

---

## File I/O Functions 📁

For file operations including reading/writing data files, log files, and accessing game files, see the dedicated [File I/O](/dev/api/file-io) documentation.

---

## Character Functions 🧑

### `core.character.get_combat_rating_bonus`

Syntax

```lua
core.character.get_combat_rating_bonus(rating_index: integer) -> number
```

**Parameters**

- `rating_index` : `integer` - The combat rating index (e.g. crit, haste, mastery).

Returns

- `number` : The combat rating bonus for the given rating index.

Description

Returns the combat rating bonus for a given rating index (crit, haste, mastery, etc.).

**Example Usage**

```lua
local crit_bonus = core.character.get_combat_rating_bonus(9)
core.log("Crit rating bonus: " .. crit_bonus)
```

---

### `core.character.get_combat_rating_bonus_for_combat_rating_value`

Syntax

```lua
core.character.get_combat_rating_bonus_for_combat_rating_value(rating_index: integer, value: integer) -> number
```

**Parameters**

- `rating_index` : `integer` - The combat rating index.
- `value` : `integer` - The hypothetical rating value to evaluate.

Returns

- `number` : The bonus that the hypothetical rating value would provide.

Description

Returns what bonus a hypothetical rating value would provide for a given rating index. Useful for simulating stat changes.

**Example Usage**

```lua
local haste_bonus = core.character.get_combat_rating_bonus_for_combat_rating_value(18, 1000)
core.log("1000 haste rating would give: " .. haste_bonus .. "% bonus")
```

> [!WARNING]
> Returns `0` for every input on every Classic version. The game function it uses does not exist on Classic Era, TBC or MoP Classic. On Classic, work it out from the two rating functions that do work everywhere. Ratings convert at a fixed rate there, so this is exact, as long as you have some of that rating:
>
> ```lua
> local rating = core.character.get_combat_rating(index)
> local bonus  = rating > 0
>     and value * core.character.get_combat_rating_bonus(index) / rating
>     or 0
> ```

---

### `core.character.get_combat_rating`

Syntax

```lua
core.character.get_combat_rating(rating_index: integer) -> number
```

**Parameters**

- `rating_index` : `integer` - The combat rating index, the same one `get_combat_rating_bonus` takes.

Returns

- `number` : Your current rating for that index, from gear, buffs and enchants.

Description

Returns the rating **number** for your own character, the one shown in the character pane's stat tooltips. `get_combat_rating_bonus` returns the **percent** that rating gives. Local player only.

| Stat | Index | Stat | Index |
| --- | --- | --- | --- |
| Dodge | `3` | Haste (melee) | `18` |
| Parry | `4` | Haste (ranged) | `19` |
| Block | `5` | Haste (spell) | `20` |
| Crit (melee) | `9` | Avoidance | `21` |
| Crit (ranged) | `10` | Mastery | `26` |
| Crit (spell) | `11` | Versatility (damage done) | `29` |
| Speed | `14` | Versatility (damage taken) | `31` |
| Leech | `17` |  |  |

These are the retail indices. Works on every game version. Classic Era has almost no ratings, so expect `0` for most indices there.

On retail, `get_combat_rating_bonus_for_combat_rating_value(i, get_combat_rating(i))` equals `get_combat_rating_bonus(i)`. On Classic the first one is always `0`, see above.

> [!NOTE]
> Requires a core newer than 2.069.

**Example Usage**

```lua
local MASTERY = 26
local rating  = core.character.get_combat_rating(MASTERY)
local percent = core.character.get_combat_rating_bonus(MASTERY)
core.log(string.format("Mastery: %d rating = %.2f%%", rating, percent))
```

---

### `core.character.get_realm_name`

Syntax

```lua
core.character.get_realm_name() -> string
```

Returns

- `string` : The connected realm's display name, or an empty string when it is unavailable.

Description

Returns the connected realm's display name. The result may contain spaces and punctuation, so use it for UI text and player-facing messages.

**Example Usage**

```lua
local realm_name = core.character.get_realm_name()
core.log("Connected realm: " .. realm_name)
```

---

### `core.character.get_normalized_realm_name`

Syntax

```lua
core.character.get_normalized_realm_name() -> string
```

Returns

- `string` : The normalized realm name, or an empty string when it is unavailable.

Description

Returns the realm name without spaces or punctuation. On clients that do not expose a normalized realm API, this falls back to the display name.

**Example Usage**

```lua
local realm_key = core.character.get_normalized_realm_name()
core.log("Realm key: " .. realm_key)
```

---

### `core.character.is_resting`

Syntax

```lua
core.character.is_resting() -> boolean
```

Returns

- `boolean` : `true` while the local player is in a rest area, `false` otherwise.

Description

Returns whether the local player is resting. The player rests inside an inn or a major city, which is the state that accumulates rested XP.

This is a local player function. The underlying game API takes no unit token, so there is no `game_object` equivalent and it cannot be asked about another unit.

The result is always a boolean, including on the classic clients where the game's own function answers `1` or `nil`.

**Example Usage**

```lua
if core.character.is_resting() then
    core.log("Resting, safe to log out")
end
```

---

### `core.character.is_swimming`

Syntax

```lua
core.character.is_swimming() -> boolean
```

Returns

- `boolean` : `true` while the local player is swimming, `false` otherwise.

Description

Returns whether the local player is swimming, meaning submerged in water and moving under swim physics. Standing in shallow water is not swimming.

This is a local player function, for the same reason as `is_resting()`. The underlying game API takes no unit token, so there is no `game_object` equivalent and it cannot be asked about another unit.

The result is always a boolean, including on the classic clients where the game's own function answers `1` or `nil`.

**Example Usage**

```lua
if core.character.is_swimming() then
    core.log("Swimming, ground mounts unavailable")
end
```

---

### `core.character.get_breath`

Syntax

```lua
core.character.get_breath() -> character_breath_info
```

Returns

- `character_breath_info` : A table containing:
  - `active` : `boolean` - `true` only while a breath timer is running, so while the player is drowning.
  - `value` : `number` - Remaining breath in milliseconds.
  - `max` : `number` - The full breath bar in milliseconds.
  - `scale` : `number` - Change per second. Negative while the bar depletes, positive while it refills.
  - `paused` : `boolean` - `true` while the timer is held, for example during a loading screen.

Description

Returns the state of the swimming breath bar, which the game calls a mirror timer.

`active` is `false` whenever no breath timer is running, and the other fields are `0` or `false` then, so gate on `active` rather than on `value`. Pair it with `is_swimming()`: that answers "in the water", this one answers "running out of air". A player can swim on the surface indefinitely without ever starting a breath timer.

`value` and `max` are **milliseconds**, not seconds. Divide by 1000 before showing a countdown.

The core finds the breath timer by scanning the mirror timer slots rather than assuming a fixed index, and reads the interpolated live value where the client provides one, so `value` moves smoothly between the game's own timer events instead of stepping.

**Example Usage**

```lua
local breath = core.character.get_breath()

if breath.active and not breath.paused then
    local seconds_left = breath.value / 1000
    if seconds_left < 10 then
        core.log(string.format("Drowning in %.1fs", seconds_left))
    end
end
```

---

### `core.character.get_xp`

Syntax

```lua
core.character.get_xp() -> integer
```

Returns

- `integer` : Experience points earned in the current level. `0` at the level cap, and `0` when the client cannot answer.

Description

Returns the local player's current experience points, the game's `UnitXP("player")`. Works on every client. Added in the core update of 2026-10-06.

It is the same number as `local_player:get_xp()` (see [game_object](/dev/api/game-object)); both run the same code, so they never disagree. This one needs no object in hand. Local player only: the game never tells you another unit's XP.

**Example Usage**

```lua
local xp = core.character.get_xp()
local xp_max = core.character.get_xp_max()
if xp_max > 0 then
    core.log(string.format("XP: %d / %d (%.1f%%)", xp, xp_max, xp / xp_max * 100))
end
```

---

### `core.character.get_xp_max`

Syntax

```lua
core.character.get_xp_max() -> integer
```

Returns

- `integer` : The experience points needed to finish the current level. `0` when the client cannot answer.

Description

Returns the experience the local player's current level needs, the game's `UnitXPMax("player")`. Works on every client. Added in the core update of 2026-10-06.

It is the same number as `local_player:get_max_xp()`. Note the name: `get_xp_max` here, `get_max_xp` on the object. Both exist.

**Example Usage**

```lua
local to_go = core.character.get_xp_max() - core.character.get_xp()
core.log("XP to next level: " .. to_go)
```

---

### `core.character.get_rested_xp`

Syntax

```lua
core.character.get_rested_xp() -> integer | nil
```

Returns

- `integer` : The rested bonus pool, in experience points.
- `nil` : The player has no rested bonus. This is the game's own "none" answer, never `0` .

Description

Returns the local player's rested XP bonus pool, the game's `GetXPExhaustion()`. The pool drains as you earn XP from kills. Works on every client. Added in the core update of 2026-10-06.

Test it with `if rested then`, not with `rested > 0`: comparing `nil` raises a Lua error.

**Example Usage**

```lua
local rested = core.character.get_rested_xp()
if rested then
    core.log("Rested bonus: " .. rested .. " XP")
else
    core.log("Not rested")
end
```

---

## World Functions 🌍

### `core.world.is_flyable_area`

Syntax

```lua
core.world.is_flyable_area() -> boolean
```

Returns

- `boolean` : `true` if the current area allows regular flying, `false` otherwise.

Description

Returns whether the current area allows regular flying.

**Example Usage**

```lua
if core.world.is_flyable_area() then
    core.log("You can fly here!")
end
```

---

### `core.world.is_advanced_flyable_area`

Syntax

```lua
core.world.is_advanced_flyable_area() -> boolean
```

Returns

- `boolean` : `true` if the current area allows dynamic/skyriding flying, `false` otherwise.

Description

Returns whether the current area allows dynamic/skyriding flying.

**Example Usage**

```lua
if core.world.is_advanced_flyable_area() then
    core.log("Skyriding is available here!")
end
```

---

### `core.world.get_encounters_on_map`

Syntax

```lua
core.world.get_encounters_on_map(ui_map_id: integer) -> encounter_info[]
```

**Parameters**

- `ui_map_id` : `integer` - The UI map ID to query encounters for.

Returns

- `encounter_info[]` : An array of encounter info tables. Each entry contains:

| Field | Type | Description |
| --- | --- | --- |
| `encounter_id` | `integer` | The encounter ID |
| `map_x` | `number` | The X position on the map |
| `map_y` | `number` | The Y position on the map |

Description

Returns a list of encounters on the specified map.

Many classic-family dungeons (Classic Era, TBC Classic and Forever) have no UI map of their own, so there is no `ui_map_id` to pass. Use [`core.world.get_encounters_for_instance`](/dev/api/world#coreworldget_encounters_for_instance) there, which takes the instance map id instead.

**Example Usage**

```lua
local map_id = core.game_ui.get_current_map_id()
local encounters = core.world.get_encounters_on_map(map_id)
for _, enc in ipairs(encounters) do
    core.log(string.format("Encounter %d at (%.2f, %.2f)", enc.encounter_id, enc.map_x, enc.map_y))
end
```

---

## Taxi Functions ✈️

Flight master ("taxi") map access. Every function in this namespace only answers while the flight master's map is open, which is the window between the `TAXIMAP_OPENED` and `TAXIMAP_CLOSED` events (both delivered by [`core.register_on_game_event_callback`](/dev/api/events)). Outside it `num_nodes()` is `0`, `node_name()` is `""` and `take_node()` does nothing.

Node indices are 1-based and run from `1` to `num_nodes()`.

### `core.taxi.num_nodes`

Syntax

```lua
core.taxi.num_nodes() -> integer
```

Returns

- `integer` : The number of flight points on the open taxi map, `0` when no taxi map is open.

Description

Returns how many flight points the currently open taxi map lists. Treat a zero as "no map open" rather than as "this flight master serves nowhere".

---

### `core.taxi.node_name`

Syntax

```lua
core.taxi.node_name(index: integer) -> string
```

**Parameters**

- `index` : `integer` - The flight point index, `1` to `num_nodes()` .

Returns

- `string` : The flight point name, or `""` when no taxi map is open.

Description

Returns the name of one flight point on the open taxi map.

An out-of-range index is passed through as the game's own `"INVALID"` string rather than being flattened to an empty string, so the two failures stay distinguishable: `""` means the map is closed, `"INVALID"` means the index is bad.

---

### `core.taxi.node_position`

Syntax

```lua
core.taxi.node_position(index: integer) -> number, number
```

**Parameters**

- `index` : `integer` - 1-based node index, `1` to `num_nodes()` .

Returns

- `number, number` : x and y **normalised to the open taxi map** , both `0` to `1` , with `0, 0` at the map's top-left.

Description

Where a flight point sits on the taxi map. `num_nodes` and `node_name` let you enumerate the points and read their names, but not tell which one is where, so picking "the node nearest my destination" previously needed an offline table of every flight master in the game.

> [!WARNING]
> Not yards, and not comparable across continents. They only mean anything against the taxi map currently open, which is the continent you are standing on. Returns `0, 0` when the map is closed or the index is out of range, which is indistinguishable from a node genuinely at the top-left corner — bound the loop with `num_nodes()` instead of probing for `0, 0`.

---

### `core.taxi.node_type`

Syntax

```lua
core.taxi.node_type(index: integer) -> string
```

Returns

- `string` : `"REACHABLE"` , `"CURRENT"` , `"DISTANT"` , `"NONE"` , or `""` when the taxi map is closed. The client's own string, passed through unchanged.

Description

The only way to tell a flight point you can actually fly to from one the client is merely drawing. `REACHABLE` is a valid `take_node` target, `CURRENT` is where you are standing, `DISTANT` is a known node on another continent, `NONE` is undiscovered.

Calling `take_node` on every index without checking this tries to fly to points the character has never discovered.

**Example Usage**

```lua
for i = 1, core.taxi.num_nodes() do
    if core.taxi.node_type(i) == "REACHABLE" then
        local x, y = core.taxi.node_position(i)
        core.log(string.format("%s at %.3f, %.3f", core.taxi.node_name(i), x, y))
    end
end
```

---

### `core.taxi.take_node`

Syntax

```lua
core.taxi.take_node(index: integer) -> nil
```

**Parameters**

- `index` : `integer` - The flight point index, `1` to `num_nodes()` .

Returns

- `nil`

Description

Starts travelling to a flight point on the open taxi map. It is a no-op when no taxi map is open or the index is out of range.

Resolve the index by matching `node_name()`, never by caching an index across visits. The ordering is per flight master and shifts as the character discovers more flight points.

**Example Usage**

```lua
-- Fly to a named flight point, if this flight master offers it
local function fly_to(destination)
    for index = 1, core.taxi.num_nodes() do
        if core.taxi.node_name(index) == destination then
            core.taxi.take_node(index)
            return true
        end
    end

    return false
end
```

---

### `core.taxi.close`

Syntax

```lua
core.taxi.close() -> boolean
```

Returns

- `boolean` : `true` when the game's close call was reached. With no map open it does nothing and still answers `true` .

Description

Closes the flight map without flying anywhere, exactly as its own close button does. Before this call existed, `take_node()` was the only way to leave a map you had opened just to read the node names. The merchant and the trainer have the same call: [`core.input.close_merchant`](/dev/api/input) and [`core.quests.close_trainer`](/dev/api/quests).

**Example Usage**

```lua
-- Fly if this flight master serves the destination, otherwise close the map.
-- fly_to is the helper from the take_node example above.
if not fly_to("Shattrath, Terokkar Forest") then
    core.taxi.close()
end
```

---

## Additional Notes 📝

- **Performance Monitoring** : Utilize the time and CPU functions to monitor and optimize your script's performance.
- **Event Handling** : Register appropriate callbacks to handle events effectively within your script.
- **Logging Best Practices** : Consistently log important information for easier debugging and maintenance.