# Waypoint Recorder Example

> Source: <https://docs.project-sylvanas.net/examples/legacy/waypoint-recorder>

This example demonstrates how to create a waypoint recording and playback system using the `simple_movement` utility library. We'll build a plugin that records your walking path, saves it to a file, and can replay it automatically with loop support.

*The plugin displays recorded waypoints as green lines and circles in the game world, with a cyan circle showing the current navigation target during playback.*

## What You'll Learn

- How to use the `simple_movement` utility library for automated navigation
- Recording waypoints automatically while walking
- Saving and loading waypoint data to files
- Creating interactive menus with buttons, checkboxes, and sliders
- Drawing 3D path visualization in the game world
- Implementing loop functionality for continuous path following
- Choosing between `look_at` and `turn` movement systems

## Plugin Structure

### header.lua

The header file initializes the plugin and validates the game state:

```lua
local plugin = {}

plugin.name = "Waypoint Recorder"
plugin.version = "1.01"
plugin.author = "Silvi"
plugin.load = true

local local_player = core.object_manager.get_local_player()

if not local_player or not local_player:is_valid() then
    plugin.load = false
    return plugin
end

return plugin
```

> [!TIP]
> Always validate the local player in your header file. Setting `plugin.load = false` prevents the plugin from loading during loading screens or invalid game states.

### main.lua

The main file contains our waypoint recording and playback logic:

```lua
--[[
    Waypoint Recorder - A practical example of using simple_movement
    
    This plugin demonstrates how to:
        - Record waypoints while walking around the game world
        - Save and load waypoint paths to persistent files
        - Replay recorded paths with optional looping
        - Visualize paths with 3D graphics
        - Use the menu system for user interaction
        - Choose between look_at and turn-based movement systems
    
    Author: Silvi
]]

-- ============================================================================
-- DEPENDENCIES
-- ============================================================================

local vec3 = require("common/geometry/vector_3")
local color = require("common/color")

---@type simple_movement
local movement = require("common/utility/simple_movement")

-- ============================================================================
-- CONSTANTS
-- ============================================================================

local DATA_FILE = "waypoint_recorder_data"  -- File name for saving waypoints

-- Colors for visualization
local COLOR_PATH_RECORDING = color.new(255, 100, 100, 255)  -- Red when recording
local COLOR_PATH_SAVED = color.new(80, 255, 80, 200)        -- Green for saved path
local COLOR_WAYPOINT = color.new(255, 255, 0, 255)          -- Yellow waypoint markers
local COLOR_TARGET = color.new(0, 255, 255, 255)            -- Cyan current target

-- ============================================================================
-- STATE VARIABLES
-- ============================================================================

local is_recording = false
local is_playing = false
local recorded_waypoints = {}
local last_record_pos = nil

-- Saved path data (persisted to file)
local saved_waypoints = {}

-- Button click flags (menu buttons set these, update callback handles them)
local btn_start_record = false
local btn_stop_record = false
local btn_add_waypoint = false
local btn_play = false
local btn_stop = false
local btn_clear = false

-- ============================================================================
-- MENU CONFIGURATION
-- ============================================================================

local config = {
    -- Tree nodes for organization
    main_tree = core.menu.tree_node(),
    record_tree = core.menu.tree_node(),
    playback_tree = core.menu.tree_node(),
    settings_tree = core.menu.tree_node(),
    
    -- Checkboxes
    enabled = core.menu.checkbox(true, "wp_enabled"),
    loop_enabled = core.menu.checkbox(false, "wp_loop"),
    smooth_enabled = core.menu.checkbox(true, "wp_smooth"),
    use_look_at = core.menu.checkbox(true, "wp_use_look_at"),
    
    -- Slider for recording distance
    record_distance = core.menu.slider_int(1, 10, 3, "wp_record_dist"),
    
    -- Buttons
    btn_start_record = core.menu.button("wp_btn_start"),
    btn_stop_record = core.menu.button("wp_btn_stop"),
    btn_add_waypoint = core.menu.button("wp_btn_add"),
    btn_play = core.menu.button("wp_btn_play"),
    btn_stop = core.menu.button("wp_btn_stop_play"),
    btn_clear = core.menu.button("wp_btn_clear"),
}

-- ============================================================================
-- FILE I/O FUNCTIONS
-- ============================================================================

local function save_waypoints_to_file()
    if #saved_waypoints == 0 then return end
    
    -- Build JSON-like string manually
    local wp_strings = {}
    for i = 1, #saved_waypoints do
        local wp = saved_waypoints[i]
        wp_strings[i] = string.format('{"x":%.2f,"y":%.2f,"z":%.2f}', wp.x, wp.y, wp.z)
    end
    
    local content = '{"waypoints":[' .. table.concat(wp_strings, ",") .. ']}'
    
    core.create_data_file(DATA_FILE)
    core.write_data_file(DATA_FILE, content)
    
    core.log("[WaypointRecorder] Saved " .. #saved_waypoints .. " waypoints to file")
end

local function load_waypoints_from_file()
    local content = core.read_data_file(DATA_FILE)
    saved_waypoints = {}
    
    if not content or content == "" then
        return
    end
    
    -- Parse the JSON-like format
    for x, y, z in content:gmatch('{"x":([%d%.%-]+),"y":([%d%.%-]+),"z":([%d%.%-]+)}') do
        local waypoint = vec3.new(tonumber(x), tonumber(y), tonumber(z))
        table.insert(saved_waypoints, waypoint)
    end
    
    if #saved_waypoints > 0 then
        core.log("[WaypointRecorder] Loaded " .. #saved_waypoints .. " waypoints from file")
    end
end

-- ============================================================================
-- RECORDING FUNCTIONS
-- ============================================================================

local function start_recording()
    is_recording = true
    recorded_waypoints = {}
    last_record_pos = nil
    
    -- Stop playback if active
    if is_playing then
        movement:stop()
        is_playing = false
    end
    
    core.log("[WaypointRecorder] Recording started - walk around!")
end

local function stop_recording()
    is_recording = false
    
    if #recorded_waypoints > 0 then
        -- Copy recorded waypoints to saved list
        saved_waypoints = {}
        for i = 1, #recorded_waypoints do
            local wp = recorded_waypoints[i]
            table.insert(saved_waypoints, vec3.new(wp.x, wp.y, wp.z))
        end
        
        save_waypoints_to_file()
        core.log("[WaypointRecorder] Saved " .. #recorded_waypoints .. " waypoints")
    else
        core.log("[WaypointRecorder] No waypoints recorded")
    end
end

local function add_waypoint_manual()
    local player = core.object_manager.get_local_player()
    if not player then return end
    
    local pos = player:get_position()
    if not pos then return end
    
    -- Start recording if not already
    if not is_recording then
        is_recording = true
        recorded_waypoints = {}
    end
    
    table.insert(recorded_waypoints, vec3.new(pos.x, pos.y, pos.z))
    last_record_pos = pos
    
    core.log(string.format("[WaypointRecorder] Waypoint %d added at (%.1f, %.1f, %.1f)",
        #recorded_waypoints, pos.x, pos.y, pos.z))
end

local function update_recording()
    if not is_recording then return end
    
    local player = core.object_manager.get_local_player()
    if not player then return end
    
    local pos = player:get_position()
    if not pos then return end
    
    -- Get recording distance from slider
    local record_distance = config.record_distance:get()
    
    -- Auto-record based on distance traveled
    if last_record_pos then
        local dist = pos:dist_to(last_record_pos)
        if dist >= record_distance then
            table.insert(recorded_waypoints, vec3.new(pos.x, pos.y, pos.z))
            last_record_pos = pos
        end
    else
        -- First waypoint
        table.insert(recorded_waypoints, vec3.new(pos.x, pos.y, pos.z))
        last_record_pos = pos
    end
end

-- ============================================================================
-- PLAYBACK FUNCTIONS
-- ============================================================================

local function start_playback()
    if #saved_waypoints == 0 then
        core.log("[WaypointRecorder] No waypoints to play!")
        return
    end
    
    -- Stop recording if active
    if is_recording then
        stop_recording()
    end
    
    -- Configure movement settings
    movement:set_debug(true)
    movement:set_smoothing_enabled(config.smooth_enabled:get_state())
    movement:set_use_look_at(config.use_look_at:get_state())
    
    -- Start navigation from beginning
    local loop = config.loop_enabled:get_state()
    movement:navigate(saved_waypoints, loop, true)  -- true = start from beginning
    is_playing = true
    
    local system = config.use_look_at:get_state() and "look_at" or "turns"
    core.log(string.format("[WaypointRecorder] Playing %d waypoints (loop: %s, system: %s)",
        #saved_waypoints, tostring(loop), system))
end

local function stop_playback()
    movement:stop()
    movement:clear_navigation()
    is_playing = false
    core.log("[WaypointRecorder] Playback stopped")
end

local function update_playback()
    if not is_playing then return end
    
    -- Process movement each frame
    local reached = movement:process()
    
    if reached then
        local loop = config.loop_enabled:get_state()
        if loop then
            -- Restart from beginning
            core.log("[WaypointRecorder] Loop - restarting path")
            movement:navigate(saved_waypoints, true, true)
        else
            movement:clear_navigation()
            is_playing = false
            core.log("[WaypointRecorder] Playback complete!")
        end
    end
end

local function clear_waypoints()
    saved_waypoints = {}
    recorded_waypoints = {}
    save_waypoints_to_file()
    movement:clear_navigation()
    core.log("[WaypointRecorder] Cleared all waypoints")
end

-- ============================================================================
-- MENU RENDERING
-- ============================================================================

local function render_menu()
    config.main_tree:render("Waypoint Recorder", function()
        
        config.enabled:render("Enable Plugin")
        
        if not config.enabled:get_state() then return end
        
        -- Status display
        local status = "Idle"
        if is_recording then
            status = "RECORDING (" .. #recorded_waypoints .. " waypoints)"
        elseif is_playing then
            local progress = movement:get_progress()
            local idx = movement:get_current_index()
            local total = movement:get_waypoint_count()
            status = string.format("PLAYING %d%% (%d/%d)", progress, idx, total)
        end
        core.menu.header():render("Status: " .. status, color.white())
        core.menu.header():render("Saved waypoints: " .. #saved_waypoints, color.white())
        
        -- Recording section
        config.record_tree:render("Recording", function()
            if not is_recording then
                if config.btn_start_record:render("Start Recording") then
                    btn_start_record = true
                end
            else
                if config.btn_stop_record:render("Stop Recording") then
                    btn_stop_record = true
                end
            end
            
            if config.btn_add_waypoint:render("+ Add Waypoint Here") then
                btn_add_waypoint = true
            end
            
            config.record_distance:render("Auto-record Distance (yards)")
        end)
        
        -- Playback section
        config.playback_tree:render("Playback", function()
            if not is_playing then
                if config.btn_play:render("Play Path") then
                    btn_play = true
                end
            else
                if config.btn_stop:render("Stop Playback") then
                    btn_stop = true
                end
            end
            
            config.loop_enabled:render("Loop Path")
            config.use_look_at:render("Use Look At System")
            core.menu.header():render("^ Unchecked = use turn_left/turn_right", 
                color.new(150, 150, 150, 255))
        end)
        
        -- Settings section
        config.settings_tree:render("Settings", function()
            config.smooth_enabled:render("Path Smoothing")
            
            if config.btn_clear:render("Clear All Waypoints") then
                btn_clear = true
            end
        end)
    end)
end

-- ============================================================================
-- PATH VISUALIZATION
-- ============================================================================

local function render_path()
    if not config.enabled:get_state() then return end
    
    local player = core.object_manager.get_local_player()
    if not player then return end
    
    local player_pos = player:get_position()
    if not player_pos then return end
    
    -- Determine which waypoints to draw
    local waypoints_to_draw = {}
    local line_color = COLOR_PATH_SAVED
    
    if is_recording and #recorded_waypoints > 0 then
        waypoints_to_draw = recorded_waypoints
        line_color = COLOR_PATH_RECORDING
    elseif #saved_waypoints > 0 then
        waypoints_to_draw = saved_waypoints
    end
    
    -- Draw path lines between waypoints
    for i = 1, #waypoints_to_draw - 1 do
        local p1 = waypoints_to_draw[i]
        local p2 = waypoints_to_draw[i + 1]
        
        -- Only draw nearby waypoints for performance
        if player_pos:dist_to(p1) < 100 or player_pos:dist_to(p2) < 100 then
            core.graphics.line_3d(p1, p2, line_color, 2.0)
        end
    end
    
    -- Draw waypoint markers
    for i = 1, #waypoints_to_draw do
        local wp = waypoints_to_draw[i]
        if player_pos:dist_to(wp) < 50 then
            core.graphics.circle_3d(wp, 0.4, COLOR_WAYPOINT, 8, 2)
        end
    end
    
    -- Draw current target during playback
    if is_playing then
        local target = movement:get_target()
        if target then
            core.graphics.circle_3d(target, 1.0, COLOR_TARGET, 16, 3)
        end
    end
end

-- ============================================================================
-- MAIN CALLBACKS
-- ============================================================================

local initialized = false

local function on_update()
    -- One-time initialization
    if not initialized then
        load_waypoints_from_file()
        movement:set_debug(true)
        initialized = true
        core.log("[WaypointRecorder] Plugin loaded!")
    end
    
    if not config.enabled:get_state() then return end
    
    -- Handle button clicks (from menu)
    if btn_start_record then
        btn_start_record = false
        start_recording()
    end
    
    if btn_stop_record then
        btn_stop_record = false
        stop_recording()
    end
    
    if btn_add_waypoint then
        btn_add_waypoint = false
        add_waypoint_manual()
    end
    
    if btn_play then
        btn_play = false
        start_playback()
    end
    
    if btn_stop then
        btn_stop = false
        stop_playback()
    end
    
    if btn_clear then
        btn_clear = false
        clear_waypoints()
    end
    
    -- Update systems
    update_recording()
    update_playback()
end

-- ============================================================================
-- REGISTER CALLBACKS
-- ============================================================================

core.register_on_update_callback(on_update)
core.register_on_render_menu_callback(render_menu)
core.register_on_render_callback(render_path)
```

## Code Breakdown

### 1. Importing simple_movement

```lua
---@type simple_movement
local movement = require("common/utility/simple_movement")
```

The `---@type simple_movement` annotation enables IntelliSense in your IDE. Always access `simple_movement` methods with `:` (colon), not `.` (dot).

> [!WARNING]
> ```lua
> -- Correct
> movement:navigate(waypoints)
> movement:process()
>
> -- Wrong - will cause errors
> movement.navigate(waypoints)
> movement.process()
> ```

### 2. Menu Configuration

```lua
local config = {
    main_tree = core.menu.tree_node(),
    enabled = core.menu.checkbox(true, "wp_enabled"),
    loop_enabled = core.menu.checkbox(false, "wp_loop"),
    record_distance = core.menu.slider_int(1, 10, 3, "wp_record_dist"),
    btn_start_record = core.menu.button("wp_btn_start"),
}
```

**Menu Element Types:**

- `tree_node()` - Collapsible section
- `checkbox(default, id)` - Toggle with persistent state
- `slider_int(min, max, default, id)` - Integer slider
- `button(id)` - Clickable button that returns `true` when clicked

The string IDs (like `"wp_enabled"`) persist settings between sessions.

### 3. File I/O for Persistence

```lua
local function save_waypoints_to_file()
    local wp_strings = {}
    for i = 1, #saved_waypoints do
        local wp = saved_waypoints[i]
        wp_strings[i] = string.format('{"x":%.2f,"y":%.2f,"z":%.2f}', wp.x, wp.y, wp.z)
    end
    
    local content = '{"waypoints":[' .. table.concat(wp_strings, ",") .. ']}'
    
    core.create_data_file(DATA_FILE)
    core.write_data_file(DATA_FILE, content)
end
```

**File API:**

- `core.create_data_file(name)` - Creates a file in the scripts data directory
- `core.write_data_file(name, content)` - Writes string content to the file
- `core.read_data_file(name)` - Reads file content as a string

Files are stored in `scripts_data/` and persist between game sessions.

### 4. Auto-Recording While Walking

```lua
local function update_recording()
    if not is_recording then return end
    
    local player = core.object_manager.get_local_player()
    local pos = player:get_position()
    
    local record_distance = config.record_distance:get()
    
    if last_record_pos then
        local dist = pos:dist_to(last_record_pos)
        if dist >= record_distance then
            table.insert(recorded_waypoints, vec3.new(pos.x, pos.y, pos.z))
            last_record_pos = pos
        end
    else
        table.insert(recorded_waypoints, vec3.new(pos.x, pos.y, pos.z))
        last_record_pos = pos
    end
end
```

The recording system tracks the player's position and adds a new waypoint whenever they've moved the configured distance from the last waypoint. This creates a path that follows your actual walking route.

### 5. Playback with simple_movement

```lua
local function start_playback()
    -- Configure movement
    movement:set_smoothing_enabled(config.smooth_enabled:get_state())
    movement:set_use_look_at(config.use_look_at:get_state())
    
    -- Start navigation
    movement:navigate(saved_waypoints, loop, true)
    is_playing = true
end

local function update_playback()
    if not is_playing then return end
    
    local reached = movement:process()  -- MUST call every frame!
    
    if reached then
        if loop then
            movement:navigate(saved_waypoints, true, true)
        else
            is_playing = false
        end
    end
end
```

**Key simple_movement Methods:**

- `navigate(waypoints, is_loop, start_from_beginning)` - Start following a path
- `process()` - **Must be called every frame** - returns `true` when destination reached
- `stop()` - Immediately stop movement
- `clear_navigation()` - Stop and reset all waypoint data

### 6. Movement System Selection

```lua
movement:set_use_look_at(config.use_look_at:get_state())
```

`simple_movement` supports two movement systems:

| System | Method | Behavior |
| --- | --- | --- |
| **look_at** (default) | `set_use_look_at(true)` | Smooth interpolated direction using `core.input.look_at()`. Natural-looking movement. |
| **turns** | `set_use_look_at(false)` | Legacy `turn_left_start()`/`turn_right_stop()`. Keeps moving forward even on turns. |

### 7. Path Visualization

```lua
local function render_path()
    -- Draw lines between waypoints
    for i = 1, #waypoints_to_draw - 1 do
        local p1 = waypoints_to_draw[i]
        local p2 = waypoints_to_draw[i + 1]
        
        if player_pos:dist_to(p1) < 100 or player_pos:dist_to(p2) < 100 then
            core.graphics.line_3d(p1, p2, line_color, 2.0)
        end
    end
    
    -- Draw waypoint markers
    for i = 1, #waypoints_to_draw do
        local wp = waypoints_to_draw[i]
        if player_pos:dist_to(wp) < 50 then
            core.graphics.circle_3d(wp, 0.4, COLOR_WAYPOINT, 8, 2)
        end
    end
end
```

**Graphics Functions:**

- `core.graphics.line_3d(start, end, color, thickness)` - Draw a line in 3D space
- `core.graphics.circle_3d(position, radius, color, segments, thickness)` - Draw a circle

> [!TIP]
> Only draw waypoints within a reasonable distance (50-100 yards) from the player. Drawing hundreds of distant markers impacts FPS unnecessarily.

### 8. Button Click Pattern

```lua
-- In menu render callback
if config.btn_start_record:render("Start Recording") then
    btn_start_record = true  -- Set flag, don't execute here
end

-- In update callback
if btn_start_record then
    btn_start_record = false  -- Clear flag
    start_recording()         -- Execute action
end
```

This pattern separates the UI (render callback) from game logic (update callback). Menu buttons return `true` on the frame they're clicked, so we capture that in a flag and handle it in the update loop.

## simple_movement API Reference

### Core Functions

| Function | Description |
| --- | --- |
| `navigate(waypoints, is_loop, start_from_beginning)` | Start navigating through waypoints |
| `process()` | Update movement (call every frame!) |
| `stop()` | Stop all movement immediately |
| `clear_navigation()` | Stop and clear all waypoint data |
| `move_to_position(vec3)` | Move to a single position |

### Configuration

| Function | Description |
| --- | --- |
| `set_use_look_at(bool)` | `true` = smooth look_at, `false` = turn keys |
| `set_smoothing_enabled(bool)` | Enable Catmull-Rom path smoothing |
| `set_threshold(yards)` | Waypoint arrival distance (1-10) |
| `set_debug(bool)` | Enable debug logging |

### State Queries

| Function | Description |
| --- | --- |
| `is_moving()` | Returns `true` if navigation is active |
| `get_target()` | Get current waypoint (vec3 or nil) |
| `get_progress()` | Progress percentage (0-100) |
| `get_current_index()` | Current waypoint index |
| `get_waypoint_count()` | Total waypoints in path |

## Customization

### Adding Hotkey Support

```lua
local last_f5_state = false

local function check_hotkeys()
    local f5_pressed = core.input.is_key_pressed(0x74)  -- VK_F5
    if f5_pressed and not last_f5_state then
        if is_playing then
            stop_playback()
        else
            start_playback()
        end
    end
    last_f5_state = f5_pressed
end

-- Call in update callback
check_hotkeys()
```

### Changing Path Colors

```lua
local COLOR_PATH_RECORDING = color.new(255, 100, 100, 255)  -- Red
local COLOR_PATH_SAVED = color.new(80, 255, 80, 200)        -- Green
local COLOR_WAYPOINT = color.new(255, 255, 0, 255)          -- Yellow
local COLOR_TARGET = color.new(0, 255, 255, 255)            -- Cyan
```

See the [Color API](/dev/api/color) for available colors and creation methods.

### Adjusting Movement Parameters

```lua
-- More responsive turning
movement:set_turn_speed(0.25)

-- Closer arrival distance
movement:set_threshold(2.0)

-- More path smoothing
movement:set_smoothing_subdivisions(10)
```

## Related Documentation

- [Simple Movement API](/dev/api/simple-movement) - Full movement library documentation
- [Menu API](/dev/api/ui) - Creating interactive menus
- [Graphics API](/dev/api/graphics) - Drawing functions
- [Core API](/dev/api/core) - File I/O and callbacks
- [Vector3 API](/dev/api/vector-3) - Position and direction math

## Tips

> [!TIP]
> The `movement:process()` function **must be called every frame** in your update callback. Without it, the character won't actually move. It returns `true` when the destination is reached.

> [!WARNING]
> When restarting a loop, always use `start_from_beginning = true`:
>
> ```lua
> movement:navigate(waypoints, true, true)  -- Third parameter is crucial!
> ```
>
> Otherwise, `find_closest_waypoint()` will find the endpoint (where you just arrived) and think you're already done.

> [!INFO]
> Path smoothing uses Catmull-Rom splines to create curved paths through your waypoints. This makes movement look more natural but increases the actual waypoint count. Disable it with `set_smoothing_enabled(false)` if you need exact waypoint following.

> [!TIP]
> - Use **look_at** (default) for smooth, natural-looking movement
> - Use **turns** if look_at doesn't work in your situation - it keeps moving forward even during turns, accepting slight path deviation rather than stopping

## Conclusion

This Waypoint Recorder example demonstrates practical usage of the `simple_movement` utility library for automated navigation. By combining recording, playback, and visualization, you've created a useful tool for testing paths or automating travel routes.

**Key Takeaways:**

- **simple_movement Import** - Use `---@type simple_movement` for IntelliSense, access methods with `:`
- **process() Every Frame** - The `movement:process()` function must be called in your update callback for movement to work
- **Loop Restart** - Use `start_from_beginning = true` when restarting loops to avoid getting stuck at the endpoint
- **Menu Pattern** - Capture button clicks in flags, handle them in update callback
- **File Persistence** - Use `core.create_data_file()` , `core.write_data_file()` , `core.read_data_file()` for saving data
- **Performance** - Only render nearby waypoints and use distance checks before drawing
- **Movement Systems** - Choose between smooth `look_at` or legacy `turns` based on your needs

---

I hope you found this example helpful for understanding both the `simple_movement` library and general plugin patterns! Feel free to expand upon this code for your own automation needs.