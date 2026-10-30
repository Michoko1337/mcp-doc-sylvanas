# Fire Mage Rotation Example

> Source: <https://docs.project-sylvanas.net/examples/legacy/fire-mage>

This example demonstrates how to create a complete combat rotation plugin for a Fire Mage using the Project Sylvanas API. This is a comprehensive example that covers menu creation, spell casting, target selection, buff tracking, spell prediction, and defensive/offensive logic flow.

> [!NOTE]
> This is an intentionally simplified code example. All logic shown here is for demonstration purposes only and may not cover all scenarios. Use these examples as a starting point and adapt as needed for real implementations.

## What You'll Learn

- How to validate player class and specialization before loading
- Creating interactive menu elements with checkboxes, keybinds, and tree nodes
- Importing and using core helper libraries and modules
- Implementing spell casting logic with cooldown checks
- Tracking and checking player buffs
- Using spell prediction for AoE placement
- Implementing target selection and filtering
- Creating defensive and offensive rotation flows
- Handling crowd control and immunity checks
- Drawing plugin state feedback
- Creating control panel integrations

## Plugin Structure

### header.lua

The header file validates the player's class and specialization before loading:

```lua
-- Note:
-- Keep in mind this is an example the core already has fire mage loaded by default
-- So in order to try this code properly you should disable default mage fire plugin

local plugin = {}

plugin["name"] = "Placeholder Script"
plugin["version"] = "0.10"
plugin["author"] = "Author Name"
plugin["load"] = true

-- check if local player exists before loading the script (user is on loading screen / not ingame)
local local_player = core.object_manager.get_local_player()
if not local_player then
    plugin["load"] = false
    return plugin
end

local enums = require("common/enums")
local player_class = local_player:get_class()

-- in this case we do not want to load unless mage class

local is_valid_class = player_class == enums.class_id.MAGE

if not is_valid_class then
    plugin["load"] = false
    return plugin
end

-- in this case we do not want to load unless its a mage fire specialization

local player_spec_id = core.spell_book.get_specialization_id()
local fire_mage = enums.class_spec_id.get_spec_id_from_enum(enums.class_spec_id.spec_enum.FIRE_MAGE)

if player_spec_id ~= fire_mage then
    plugin["load"] = false
    return plugin
end

return plugin
```

> [!TIP]
> This header demonstrates multi-layer validation:
>
> 1. Check if local player exists (prevents load screen errors)
> 2. Validate player class matches (only load for Mages)
> 3. Validate specialization matches (only load for Fire spec)
>
> This ensures the plugin only loads in the exact scenario it's designed for.

### main.lua

The main file contains the complete rotation logic:

```lua
-- Note:
-- Keep in mind this is an example the core already has fire mage loaded by default
-- So in order to try this code properly you should disable default mage fire plugin

-- Note:
-- This is an intentionally simplified code example.
-- All logic shown here is for demonstration purposes only and may not cover all scenarios.
-- Use these examples as a starting point and adapt as needed for real implementations.

-- Use this file as a general example to build your own code.
-- in this file, the following example functionalities are provided:

-- 1 -> create basic menu elements for the script and interact with them
-- 2 -> import the necessary Lua modules provided by the core developers
-- 3 -> cast a fireball to the target selector main target, if we are in a single-target situation, flamestrike if we are in an aoe situation.

-- first, let's include all required modules:
local enums = require("common/enums")
local pvp_utility = require("common/utility/pvp_helper")
local spell_queue = require("common/modules/spell_queue")
local unit_helper = require("common/utility/unit_helper")
local spell_helper = require("common/utility/spell_helper")
local buff_manager = require("common/modules/buff_manager")
local plugin_helper = require("common/utility/plugin_helper")
local spell_prediction = require("common/modules/spell_prediction")
local control_panel_helper = require("common/utility/control_panel_helper")

-- then, let's define some menu elements:
local menu_elements =
{
    main_tree = core.menu.tree_node(),
    keybinds_tree_node = core.menu.tree_node(),
    enable_script_check = core.menu.checkbox(false, "enable_script_check"),
    cast_flamestrike_only_when_instant = core.menu.checkbox(false, "cast_flamestrike_only_when_instant"),

    -- 7 "Undefined"
    -- 999 "Unbinded" but functional on control panel (so newcomer can see it and click)
    enable_toggle = core.menu.keybind(999, false, "toggle_script_check"),

    draw_plugin_state = core.menu.checkbox(true, "draw_plugin_state"),
    ts_custom_logic_override = core.menu.checkbox(true, "override_ts_logic")
}

-- and now render them:
local function my_menu_render()

    -- this is the node that will appear in the main memu, under the name "Placeholder Script Menu"
    menu_elements.main_tree:render("Fire Mage Example", function()
        -- this is the checkbohx that will appear upon opening the previous tree node
        menu_elements.enable_script_check:render("Enable Script")

        --  if the script is not enabled, then we can stop rendering the following menu elements
        if not menu_elements.enable_script_check:get_state() then
            return false
        end

        menu_elements.keybinds_tree_node:render("Keybinds", function()
            menu_elements.enable_toggle:render("Enable Script Toggle")
        end)

        menu_elements.ts_custom_logic_override:render("Enable TS Custom Settings Override")
        menu_elements.cast_flamestrike_only_when_instant:render("Only Allow Flamestrike Cast When Empowered")
        menu_elements.draw_plugin_state:render("Draw Plugin State")
    end)
end

-- lets craft a function to cast a fireball

-- first, define the spell datas
local fireball_spell_data =
{
    id = 133,
    name = "Fireball",

    -- add the extra information that you might find useful here (...)
}

local flamestrike_spell_data =
{
    id = 2120,
    name = "Flamestrike",

    -- add the extra information that you might find useful here (...)
}

local last_fireball_cast_time = 0.0

---@param local_player game_object
---@param target game_object
---@return boolean
local function cast_fireball(local_player, target)

    local time = core.time()
    -- add this check to avoid multiple calls to the same function
    if time - last_fireball_cast_time < 0.20 then
        return false
    end

    -- check if the spell is ready and we can cast it to the current target
    local is_spell_ready_to_be_casted = spell_helper:is_spell_castable(fireball_spell_data.id, local_player, target, false, false)
    if not is_spell_ready_to_be_casted then
        return false
    end

    -- dont cast if we are moving!
    if local_player:is_moving() then
        return false
    end

    spell_queue:queue_spell_target(fireball_spell_data.id, target, 1, "Casting Fireball To " .. target:get_name())
    last_fireball_cast_time = time

    return true
end

---@param local_player game_object
---@return boolean
local function is_flamestrike_instant(local_player)

    -- if you don't find the buff that you are looking for in the buff_db enum, you can send custom table.

    -- how to send custom table:
    -- local hot_streak = {333}
    -- in this example hot_streak is the same as enums.buff_db.HOT_STREAK
    -- feel free to report us any missing buff / debuff on enums.buff_db and we will add it for you <3

    -- note: why is it a table and not a number alone? because maybe one buff / debuff has multiple ids

    -- store the information of the buff cache
    local hot_streak_data = buff_manager:get_buff_data(local_player, enums.buff_db.HOT_STREAK)

    -- use the boolean inside "is_active", you also have .remaining returning in milliseconds format and .stacks
    if hot_streak_data.is_active then
        return true
    end

    -- we check one buff first, this way in case this buff is true, we no longer need to pay resources to check the 2nd one.

    local hyperthermia_data = buff_manager:get_buff_data(local_player, enums.buff_db.HYPERTHERMIA)
    if hyperthermia_data.is_active then
        return true
    end

    return false
end

local last_flamestrike_cast_time = 0.0

---@param local_player game_object
---@param target game_object
---@return boolean
local function cast_flamestrike(local_player, target)

    local time = core.time()
    -- add this check to avoid multiple calls to the same function
    if  time - last_flamestrike_cast_time < 0.20 then
        return false
    end

    local is_instant = is_flamestrike_instant(local_player)
    local is_only_casting_if_instant = menu_elements.cast_flamestrike_only_when_instant:get_state()
    if is_only_casting_if_instant then
        if not is_instant then
            return false
        end
    end

    -- dont cast if we are moving!
    if not is_flamestrike_instant then
        if local_player:is_moving() then
            return false
        end
    end

    -- check if the spell is ready and we can cast it to the current target
    local is_spell_ready_to_be_casted = spell_helper:is_spell_castable(flamestrike_spell_data.id, local_player, target, false, false)
    if not is_spell_ready_to_be_casted then
        return false
    end

    local flamestrike_radius = 8.0
    local flamestrike_radius_safe = flamestrike_radius * 0.90

    local flamestrike_range = 40
    local flamestrike_range_safe = flamestrike_range * 0.95

    local flamestrike_cast_time = 2.5
    local flamestrike_cast_time_safe = flamestrike_cast_time + 0.1

    local player_position = local_player:get_position()

    local prediction_spell_data = spell_prediction:new_spell_data(
        flamestrike_spell_data.id,                      -- spell_id
        flamestrike_range_safe,                         -- range
        flamestrike_radius_safe,                        -- radius
        flamestrike_cast_time_safe,                     -- cast_time
        0.0,                                            -- projectile_speed
        spell_prediction.prediction_type.MOST_HITS,     -- prediction_type
        spell_prediction.geometry_type.CIRCLE,          -- geometry_type
        player_position                                 -- source_position
    )

    local prediction_result = spell_prediction:get_cast_position(target, prediction_spell_data)
    if prediction_result.amount_of_hits <= 0 then
        return false
    end

    local cast_position = prediction_result.cast_position
    local cast_distance = cast_position:squared_dist_to(player_position)
    if cast_distance >= flamestrike_range then
        return false
    end

    spell_queue:queue_spell_position(flamestrike_spell_data.id, cast_position, 1, "Casting Flamestrike To " .. target:get_name())
    last_flamestrike_cast_time = time
    return true
end

-- Note:
-- This is an intentionally simplified code example.
-- All logic shown here is for demonstration purposes only and may not cover all scenarios.
-- Use these examples as a starting point and adapt as needed for real implementations.

---@param target game_object
---@return boolean
local function is_aoe(target)

    -- in range add the spell radius, in this case it's aprox 15 I suppose (didn't test)
    local units_around_target = unit_helper:get_enemy_list_around(target:get_position(), 15.0)
    return #units_around_target > 1
end

local function complete_cast_logic(local_player, target)

    -- flamestrike has priority over fireball.
    if is_aoe(target) then
        if cast_flamestrike(local_player, target) then
            return true
        end
    end

    -- if flamestrike wasn't casted, it means that either the target was alone (no aoe situation) or
    -- it means that flamestrike wasn't instant and the user set the "cast_flamestrike_only_when_instant" option
    -- to true
    return cast_fireball(local_player, target)
end

local target_selector = require("common/modules/target_selector")

-- this function is a simple one, not necessarily the best one for mage fires. This is just an example.
local is_ts_overriden = false
local function override_ts_settings()
    if is_ts_overriden then
        return
    end

    local is_override_allowed = menu_elements.ts_custom_logic_override:get_state()
    if not is_override_allowed then
        return
    end

    target_selector.menu_elements.settings.max_range_damage:set(40)

    target_selector.menu_elements.damage.weight_multiple_hits:set(true)
    target_selector.menu_elements.damage.slider_weight_multiple_hits:set(4)
    target_selector.menu_elements.damage.slider_weight_multiple_hits_radius:set(8)

    is_ts_overriden = true
end

local function my_on_update()

    -- Control Panel Drag & Drop
    control_panel_helper:on_update(menu_elements)

    -- no local player usually means that the user is in loading screen / not ingame
    local local_player = core.object_manager.get_local_player()
    if not local_player then
        return
    end

    -- check if the user disabled the script
    if not menu_elements.enable_script_check:get_state() then
        return
    end

    if not plugin_helper:is_toggle_enabled(menu_elements.enable_toggle) then
        return
    end

    local cast_end_time = local_player:get_active_spell_cast_end_time()
    if cast_end_time > 0.0 then
        return false
    end

    local channel_end_time = local_player:get_active_channel_cast_end_time()
    if channel_end_time > 0.0 then
        return false
    end

    -- do not run the rotation code while in mount, so you dont auto dismount by mistake
    if local_player:is_mounted() then
        return
    end

    -- NOTE: you should override the target selector settings according to your script requirements. You shouldn't leave these configuration
    -- options entirely to your users, since you are the one crafting the magical script, and you are the one who knows which settings will
    -- work best, according to your code. To see how to do this properly, check the Target Selector - Dev guide.
    override_ts_settings()

    -- Get all targets from the target selector
    local targets_list = target_selector:get_targets()

    -- Core useful boolean to determine if defensive actions are allowed
    local is_defensive_allowed = plugin_helper:is_defensive_allowed()

    -- Defensive logic: typically run defensive spells before any offensive actions
    -- This is a good place to implement your defensive routines.
    -- You can cast basic defensive spells directly, or loop through targets if specific targeting is needed.
    for index, target in ipairs(targets_list) do

        if is_defensive_allowed then
            -- **Add defensive spells here**
            -- (...)

            -- After each defensive cast, consider setting a delay before the next one

            -- e.g
            -- local time_in_seconds = 0.50
            -- plugin_helper:set_defensive_block_time(time_in_seconds)
        end
    end

    -- Some classes have healing capabilities and may also want to apply defensive logic to teammates.

    -- Get all healing targets using the target selector
    local heal_targets_list = target_selector:get_targets_heal()

    for index, heal_target in ipairs(heal_targets_list) do

        if pvp_utility:is_crowd_controlled(heal_target, pvp_utility.cc_flags.combine("CYCLONE"), 100) then

            -- Avoid trying to heal a friend in cyclone
            -- this also include other cc like hunter pvp trap or dh pvp imprision
            -- Any known CC that makes you immune to damage and healing
            goto continue
        end

        -- Here you should not use is_defensive_allowed or set_defensive_block_time unless heal_target is local_player
        -- (...)

        ::continue::
    end

    -- target selector gives up to 3 targets, in order of priority according to the user's settings.
    for index, target in ipairs(targets_list) do

        local is_target_in_combat = unit_helper:is_in_combat(target)
        if not is_target_in_combat then

            -- check that the unit is in combat, if we don't attack out of combat mobs
            -- by default target selector should not send you units out of combat, but this can be changed and you decide here in code if you acept them
            goto continue
        end

        if pvp_utility:is_damage_immune(target, pvp_utility.damage_type_flags.MAGICAL) then

            -- We dont want to waste spells on immune damage units
            -- With pvp_utility.damage_type_flags.BOTH you can decide which type of damage you want to filter, in this case we filter immune to magical
            goto continue
        end

        if pvp_utility:is_crowd_controlled(target, pvp_utility.cc_flags.combine("DISORIENT", "INCAPACITATE", "SAP"), 1000) then

            -- We dont want to break CC like polymorph
            goto continue
        end

        -- this is where your spells logic functions should go
        -- (...)

        -- when we cast a spell, we can already return from this function, as this was its primary use. We don't need to
        -- keep reading more code for other targets, at least untill next frame.
        if complete_cast_logic(local_player, target) then
            return true
        end

        -- (...)
        ::continue::
    end
end

-- render the "Disabled" rectangle box when the user has the script toggled off
local function my_on_render()

    local local_player = core.object_manager.get_local_player()
    if not local_player then
        return
    end

    if not menu_elements.enable_script_check:get_state() then
        return
    end

    if not plugin_helper:is_toggle_enabled(menu_elements.enable_toggle) then
        if menu_elements.draw_plugin_state:get_state() then
            plugin_helper:draw_text_character_center("DISABLED")
        end
    end
end

local key_helper = require("common/utility/key_helper")
local function on_control_panel_render()

    -- Enable Toggle on Control Panel, Default Unbinded, still clickeable tho.

    local control_panel_elements = {}

    if not menu_elements.enable_script_check:get_state() then -- if the plugin is disabled we return the empty control_panel_elements
        return control_panel_elements
    end

    control_panel_helper:insert_toggle(control_panel_elements,
    {
        name = "[" .. "MageTest" .. "] Enable (" .. key_helper:get_key_name(menu_elements.enable_toggle:get_key_code()) .. ") ",
        keybind = menu_elements.enable_toggle
    })

    return control_panel_elements
end

-- Register Callbacks
core.register_on_update_callback(my_on_update)
core.register_on_render_callback(my_on_render)
core.register_on_render_menu_callback(my_menu_render)
core.register_on_render_control_panel_callback(on_control_panel_render)
```

## Code Breakdown

### 1. Module Imports

```lua
local enums = require("common/enums")
local pvp_utility = require("common/utility/pvp_helper")
local spell_queue = require("common/modules/spell_queue")
local unit_helper = require("common/utility/unit_helper")
local spell_helper = require("common/utility/spell_helper")
local buff_manager = require("common/modules/buff_manager")
local plugin_helper = require("common/utility/plugin_helper")
local spell_prediction = require("common/modules/spell_prediction")
local control_panel_helper = require("common/utility/control_panel_helper")
```

**Key Modules:**

- `enums` - Constants for classes, specs, buffs, and more
- [`pvp_utility`](/dev/libraries/mini-libs/pvp-helper) - PvP-specific helpers (CC checks, immunity checks)
- `spell_queue` - Queues spells for casting
- [`unit_helper`](/dev/libraries/mini-libs/unit-helper) - Unit-related utilities (combat checks, enemy lists)
- [`spell_helper`](/dev/api/spellbook/helper) - Spell casting validation
- [`buff_manager`](/dev/api/buffs#2---buff-manager-module-) - Buff and debuff tracking
- `plugin_helper` - Plugin state management and helpers
- [`spell_prediction`](/dev/libraries/modules/spell-prediction) - AoE spell positioning predictions
- `control_panel_helper` - Control panel drag & drop interface

### 2. Menu Elements Definition

```lua
local menu_elements =
{
    main_tree = core.menu.tree_node(),
    keybinds_tree_node = core.menu.tree_node(),
    enable_script_check = core.menu.checkbox(false, "enable_script_check"),
    cast_flamestrike_only_when_instant = core.menu.checkbox(false, "cast_flamestrike_only_when_instant"),

    -- 7 "Undefined"
    -- 999 "Unbinded" but functional on control panel (so newcomer can see it and click)
    enable_toggle = core.menu.keybind(999, false, "toggle_script_check"),

    draw_plugin_state = core.menu.checkbox(true, "draw_plugin_state"),
    ts_custom_logic_override = core.menu.checkbox(true, "override_ts_logic")
}
```

**Menu Element Types:**

- [`tree_node()`](/dev/api/ui/#tree-node-) - Collapsible menu sections
- [`checkbox(default, id)`](/dev/api/ui/#checkboxdefault_state-id) - Boolean toggles
- [`keybind(key_code, is_toggle, id)`](/dev/api/ui/#keybinddefault_value-initial_toggle_state-id) - Key bindings (999 = unbound but clickable)

### 3. Menu Rendering

```lua
local function my_menu_render()
    menu_elements.main_tree:render("Fire Mage Example", function()
        menu_elements.enable_script_check:render("Enable Script")

        if not menu_elements.enable_script_check:get_state() then
            return false
        end

        menu_elements.keybinds_tree_node:render("Keybinds", function()
            menu_elements.enable_toggle:render("Enable Script Toggle")
        end)

        menu_elements.ts_custom_logic_override:render("Enable TS Custom Settings Override")
        menu_elements.cast_flamestrike_only_when_instant:render("Only Allow Flamestrike Cast When Empowered")
        menu_elements.draw_plugin_state:render("Draw Plugin State")
    end)
end
```

**Menu Structure:**

- Main tree node contains all sub-elements
- Early return if script is disabled (hides remaining options)
- Nested tree nodes for organization (Keybinds section)
- Logical grouping of related options

### 4. Spell Data Definitions

```lua
local fireball_spell_data =
{
    id = 133,
    name = "Fireball"
}

local flamestrike_spell_data =
{
    id = 2120,
    name = "Flamestrike"
}
```

> [!TIP]
> Creating spell data tables keeps spell IDs and names organized in one place. You can expand these tables with additional properties like range, cooldown, cost, etc.

### 5. Fireball Casting Logic

```lua
local last_fireball_cast_time = 0.0

---@param local_player game_object
---@param target game_object
---@return boolean
local function cast_fireball(local_player, target)
    local time = core.time()
    if time - last_fireball_cast_time < 0.20 then
        return false
    end

    local is_spell_ready_to_be_casted = spell_helper:is_spell_castable(fireball_spell_data.id, local_player, target, false, false)
    if not is_spell_ready_to_be_casted then
        return false
    end

    if local_player:is_moving() then
        return false
    end

    spell_queue:queue_spell_target(fireball_spell_data.id, target, 1, "Casting Fireball To " .. target:get_name())
    last_fireball_cast_time = time

    return true
end
```

**Casting Flow:**

1. **Throttle Check** - Prevent rapid re-casting (200ms cooldown)
2. **Spell Validation** - Use [`spell_helper:is_spell_castable()`](/dev/api/spellbook/helper#is_spell_castablespell_id-caster-target-skip_facing-skips_range) to verify the spell can be cast
3. **Movement Check** - Don't cast while moving (Fireball requires standing still)
4. **Queue Spell** - Use `spell_queue:queue_spell_target()` to execute the cast
5. **Update Timestamp** - Track last cast time
6. **Return Success** - Return `true` to signal successful cast

### 6. Buff Checking for Instant Flamestrike

```lua
---@param local_player game_object
---@return boolean
local function is_flamestrike_instant(local_player)
    local hot_streak_data = buff_manager:get_buff_data(local_player, enums.buff_db.HOT_STREAK)

    if hot_streak_data.is_active then
        return true
    end

    local hyperthermia_data = buff_manager:get_buff_data(local_player, enums.buff_db.HYPERTHERMIA)
    if hyperthermia_data.is_active then
        return true
    end

    return false
end
```

**Buff Manager Usage:**

- `buff_manager:get_buff_data()` returns a table with:
  - `is_active` - Boolean if buff is present
  - `remaining` - Time remaining in milliseconds
  - `stacks` - Number of stacks
- Check buffs in order of likelihood for performance
- Use `enums.buff_db` constants or custom arrays `{spell_id}`

### 7. Flamestrike with Spell Prediction

```lua
local last_flamestrike_cast_time = 0.0

---@param local_player game_object
---@param target game_object
---@return boolean
local function cast_flamestrike(local_player, target)
    local time = core.time()
    if time - last_flamestrike_cast_time < 0.20 then
        return false
    end

    local is_instant = is_flamestrike_instant(local_player)
    local is_only_casting_if_instant = menu_elements.cast_flamestrike_only_when_instant:get_state()
    if is_only_casting_if_instant then
        if not is_instant then
            return false
        end
    end

    if not is_flamestrike_instant then
        if local_player:is_moving() then
            return false
        end
    end

    local is_spell_ready_to_be_casted = spell_helper:is_spell_castable(flamestrike_spell_data.id, local_player, target, false, false)
    if not is_spell_ready_to_be_casted then
        return false
    end

    local flamestrike_radius = 8.0
    local flamestrike_radius_safe = flamestrike_radius * 0.90

    local flamestrike_range = 40
    local flamestrike_range_safe = flamestrike_range * 0.95

    local flamestrike_cast_time = 2.5
    local flamestrike_cast_time_safe = flamestrike_cast_time + 0.1

    local player_position = local_player:get_position()

    local prediction_spell_data = spell_prediction:new_spell_data(
        flamestrike_spell_data.id,
        flamestrike_range_safe,
        flamestrike_radius_safe,
        flamestrike_cast_time_safe,
        0.0,
        spell_prediction.prediction_type.MOST_HITS,
        spell_prediction.geometry_type.CIRCLE,
        player_position
    )

    local prediction_result = spell_prediction:get_cast_position(target, prediction_spell_data)
    if prediction_result.amount_of_hits <= 0 then
        return false
    end

    local cast_position = prediction_result.cast_position
    local cast_distance = cast_position:squared_dist_to(player_position)
    if cast_distance >= flamestrike_range then
        return false
    end

    spell_queue:queue_spell_position(flamestrike_spell_data.id, cast_position, 1, "Casting Flamestrike To " .. target:get_name())
    last_flamestrike_cast_time = time
    return true
end
```

**Spell Prediction Flow:**

1. **Instant Cast Check** - Check if player has Hot Streak or Hyperthermia
2. **Menu Option Check** - Respect user preference for instant-only casts
3. **Movement Check** - Only prevent cast if not instant
4. **Define Spell Parameters** - Set radius, range, cast time with safety margins (90-95% to be conservative)
5. **Create Prediction Data** - Use [`spell_prediction:new_spell_data()`](/dev/libraries/modules/spell-prediction#new_spell_dataspell_id-max_range-radius-cast_time-projectile_speed-prediction_mode-geometry-source_position-intersection_factor-angle-exception_is_heal-exception_player_included) with:
  - `MOST_HITS` - Find position hitting most enemies
  - `CIRCLE` - Circular AoE geometry
6. **Get Cast Position** - [`spell_prediction:get_cast_position()`](/dev/libraries/modules/spell-prediction#get_cast_positiontarget-spell_data) calculates optimal placement
7. **Validate Result** - Check if prediction found valid targets
8. **Range Check** - Ensure position is in range
9. **Queue Position Spell** - Use `spell_queue:queue_spell_position()` for ground-targeted spell

> [!TIP]
> Spell prediction calculates where to place AoE spells by predicting enemy movement. Use `prediction_type.MOST_HITS` for damage abilities and `geometry_type.CIRCLE` or `geometry_type.RECTANGLE` based on spell shape.

### 8. AoE Detection

```lua
---@param target game_object
---@return boolean
local function is_aoe(target)
    local units_around_target = unit_helper:get_enemy_list_around(target:get_position(), 15.0)
    return #units_around_target > 1
end
```

**AoE Logic:**

- Use [`unit_helper:get_enemy_list_around()`](/dev/libraries/mini-libs/unit-helper#get_enemy_list_aroundpoint-vec3-range-number-incl_out_combat-boolean-incl_blacklist-boolean---tablegame_object) to find enemies near target
- Range should include spell radius for accurate detection
- Return `true` if more than one enemy (AoE situation)

### 9. Complete Cast Logic

```lua
local function complete_cast_logic(local_player, target)
    if is_aoe(target) then
        if cast_flamestrike(local_player, target) then
            return true
        end
    end

    return cast_fireball(local_player, target)
end
```

**Spell Priority:**

1. Check for AoE situation
2. Try to cast Flamestrike if AoE
3. Fall back to Fireball for single target or if Flamestrike fails

### 10. Target Selector Override

```lua
local target_selector = require("common/modules/target_selector")

local is_ts_overriden = false
local function override_ts_settings()
    if is_ts_overriden then
        return
    end

    local is_override_allowed = menu_elements.ts_custom_logic_override:get_state()
    if not is_override_allowed then
        return
    end

    target_selector.menu_elements.settings.max_range_damage:set(40)
    target_selector.menu_elements.damage.weight_multiple_hits:set(true)
    target_selector.menu_elements.damage.slider_weight_multiple_hits:set(4)
    target_selector.menu_elements.damage.slider_weight_multiple_hits_radius:set(8)

    is_ts_overriden = true
end
```

**Target Selector Customization:**

- Override once using `is_ts_overriden` flag
- Respect user's menu choice for override
- Set max range to 40 yards (Flamestrike range)
- Prioritize targets near other enemies (multi-hit weighting)
- Weight value of 4 = strong preference for AoE opportunities
- Radius of 8 yards matches Flamestrike radius

> [!TIP]
> You should override the target selector settings according to your script requirements. You know your rotation best, so configure the target selector to find the most optimal targets for your spell priorities.

### 11. Main Update Loop

```lua
local function my_on_update()
    control_panel_helper:on_update(menu_elements)

    local local_player = core.object_manager.get_local_player()
    if not local_player then
        return
    end

    if not menu_elements.enable_script_check:get_state() then
        return
    end

    if not plugin_helper:is_toggle_enabled(menu_elements.enable_toggle) then
        return
    end

    local cast_end_time = local_player:get_active_spell_cast_end_time()
    if cast_end_time > 0.0 then
        return false
    end

    local channel_end_time = local_player:get_active_channel_cast_end_time()
    if channel_end_time > 0.0 then
        return false
    end

    if local_player:is_mounted() then
        return
    end

    override_ts_settings()

    local targets_list = target_selector:get_targets()
    local is_defensive_allowed = plugin_helper:is_defensive_allowed()

    -- Defensive logic for offensive targets
    for index, target in ipairs(targets_list) do
        if is_defensive_allowed then
            -- **Add defensive spells here**
            -- (...)
            -- local time_in_seconds = 0.50
            -- plugin_helper:set_defensive_block_time(time_in_seconds)
        end
    end

    -- Healing/defensive logic for friendly targets
    local heal_targets_list = target_selector:get_targets_heal()

    for index, heal_target in ipairs(heal_targets_list) do
        if pvp_utility:is_crowd_controlled(heal_target, pvp_utility.cc_flags.combine("CYCLONE"), 100) then
            goto continue
        end

        -- **Add healing/support spells here**
        -- (...)

        ::continue::
    end

    -- Offensive rotation
    for index, target in ipairs(targets_list) do
        local is_target_in_combat = unit_helper:is_in_combat(target)
        if not is_target_in_combat then
            goto continue
        end

        if pvp_utility:is_damage_immune(target, pvp_utility.damage_type_flags.MAGICAL) then
            goto continue
        end

        if pvp_utility:is_crowd_controlled(target, pvp_utility.cc_flags.combine("DISORIENT", "INCAPACITATE", "SAP"), 1000) then
            goto continue
        end

        if complete_cast_logic(local_player, target) then
            return true
        end

        ::continue::
    end
end
```

**Update Loop Flow:**

1. **Control Panel Update** - Handle drag & drop state
2. **Validation Checks:**
  - Local player exists
  - Script enabled in menu
  - Toggle keybind enabled
  - Not currently casting
  - Not currently channeling
  - Not mounted
3. **Target Selector Override** - Apply custom settings once
4. **Defensive Phase** - Cast defensive spells before offense
5. **Healing Phase** - Support friendly targets (if applicable to class)
6. **Offensive Phase** - Main rotation with filtering:
  - Skip out-of-combat targets
  - Skip immune targets ( `is_damage_immune` for magical damage)
  - Skip crowd-controlled targets (avoid breaking CC like Polymorph)
  - Execute spell casting logic

> [!WARNING]
> Always check for crowd control before dealing damage. Breaking CC effects like Polymorph, Sap, or other incapacitates can be detrimental in both PvE and PvP scenarios.

### 12. Render Callback

```lua
local function my_on_render()
    local local_player = core.object_manager.get_local_player()
    if not local_player then
        return
    end

    if not menu_elements.enable_script_check:get_state() then
        return
    end

    if not plugin_helper:is_toggle_enabled(menu_elements.enable_toggle) then
        if menu_elements.draw_plugin_state:get_state() then
            plugin_helper:draw_text_character_center("DISABLED")
        end
    end
end
```

**Visual Feedback:**

- Only draw if script is enabled in menu
- Show "DISABLED" text when toggle is off
- Respect user's draw preference
- Uses `plugin_helper:draw_text_character_center()` for centered screen text

### 13. Control Panel Integration

```lua
local key_helper = require("common/utility/key_helper")

local function on_control_panel_render()
    local control_panel_elements = {}

    if not menu_elements.enable_script_check:get_state() then
        return control_panel_elements
    end

    control_panel_helper:insert_toggle(control_panel_elements,
    {
        name = "[" .. "MageTest" .. "] Enable (" .. key_helper:get_key_name(menu_elements.enable_toggle:get_key_code()) .. ") ",
        keybind = menu_elements.enable_toggle
    })

    return control_panel_elements
end
```

**Control Panel:**

- Returns empty control panel elements if the plugin is disabled
- Displays toggle in the drag & drop control panel
- Shows current keybind in the display name
- Allows users to enable/disable without opening full menu

### 14. Callback Registration

```lua
core.register_on_update_callback(my_on_update)
core.register_on_render_callback(my_on_render)
core.register_on_render_menu_callback(my_menu_render)
core.register_on_render_control_panel_callback(on_control_panel_render)
```

**Callback Types:**

- [`on_update`](/dev/api/core#coreregister_on_update_callback) - Main game loop (rotation logic)
- [`on_render`](/dev/api/core#coreregister_on_render_callback) - Visual feedback
- [`on_render_menu`](/dev/api/core#coreregister_on_render_menu_callback) - Menu UI rendering
- [`on_render_control_panel`](/dev/api/core#coreregister_on_render_control_panel_callback) - Control panel UI

## Key Concepts

### Spell Casting Best Practices

1. **Throttle Rapid Calls** - Use timestamps to prevent function spam
2. **Validate Before Casting** - Use [`spell_helper:is_spell_castable()`](/dev/api/spellbook/helper#is_spell_castablespell_id-caster-target-skip_facing-skips_range)
3. **Check Movement** - Hard-cast spells require standing still
4. **Queue Spells** - Use `spell_queue` for proper execution
5. **Return Early** - Exit rotation after successful cast

### Target Filtering

```lua
-- Skip out-of-combat (optional based on settings)
if not unit_helper:is_in_combat(target) then
    goto continue
end

-- Skip immune targets
if pvp_utility:is_damage_immune(target, pvp_utility.damage_type_flags.MAGICAL) then
    goto continue
end

-- Skip CC'd targets (avoid breaking)
if pvp_utility:is_crowd_controlled(target, pvp_utility.cc_flags.combine("DISORIENT", "INCAPACITATE", "SAP"), 1000) then
    goto continue
end
```

### Performance Optimizations

1. **Early Returns** - Exit functions as soon as conditions aren't met
2. **Ordered Checks** - Check cheap conditions before expensive ones
3. **Buff Caching** - [`buff_manager`](/dev/api/buffs#2---buff-manager-module-) caches buff data
4. **Target Selection** - Let target_selector handle complex filtering
5. **Single Flag Variables** - `is_ts_overriden` prevents repeated operations

## Customization

### Adding More Spells

Create spell data and casting functions:

```lua
local scorch_spell_data = { id = 2948, name = "Scorch" }

local function cast_scorch(local_player, target)
    -- Similar pattern to cast_fireball
    -- Scorch can be cast while moving
end
```

Add to rotation:

```lua
-- Add in complete_cast_logic or offensive loop
if local_player:is_moving() then
    if cast_scorch(local_player, target) then
        return true
    end
end
```

### Adding Defensive Spells

In the defensive phase:

```lua
if is_defensive_allowed then
    local health_percent = local_player:get_health_percentage()

    if health_percent < 30 then
        -- Cast Ice Block or other emergency defensive
        plugin_helper:set_defensive_block_time(0.50)
    end
end
```

### Customizing Target Selection

Modify the override function:

```lua
target_selector.menu_elements.settings.max_range_damage:set(30)  -- Shorter range
target_selector.menu_elements.damage.slider_weight_multiple_hits:set(2)  -- Less AoE focus
```

## Related Documentation

- [Target Selector](/dev/libraries/modules/target-selector) - Target selection system
- [Buff Manager](/dev/api/buffs#2---buff-manager-module-) - Buff/debuff tracking
- [Spell Helper](/dev/api/spellbook/helper) - Spell utilities
- [Unit Helper](/dev/libraries/mini-libs/unit-helper) - Unit utilities
- [PvP Helper](/dev/libraries/mini-libs/pvp-helper) - PvP-specific checks
- [Spell Prediction](/dev/libraries/modules/spell-prediction) - AoE positioning

## Tips

> [!TIP]
> Always run defensive logic before offensive logic. Your character's survival is more important than damage output. The example shows this pattern with defensive checks happening before the offensive rotation.

> [!WARNING]
> Use [`pvp_utility:is_crowd_controlled()`](/dev/libraries/mini-libs/pvp-helper#is_crowd_controlledunit-game_object-type_flags-number-min_remaining-number---boolean-number-number) to avoid breaking important CC effects. In PvP, breaking a friendly Polymorph or Sap can cost your team the match. In PvE, it can cause dangerous situations with trash packs.

> [!INFO]
> For AoE spells, use [`spell_prediction`](/dev/libraries/modules/spell-prediction) to calculate optimal placement. The prediction system accounts for enemy movement, spell travel time, and cast time to position spells where they'll hit the most targets.

> [!TIP]
> Organize your menu logically with tree nodes for related options. Put the master enable toggle at the top, and only show additional options when the script is enabled (early return pattern).

> [!WARNING]
> Always check for damage immunity before casting. Use [`pvp_utility:is_damage_immune()`](/dev/libraries/mini-libs/pvp-helper#is_damage_immuneunit-game_object-type_flags-number-min_remaining-number---boolean-number-number) with the appropriate damage type flag (`MAGICAL`, `PHYSICAL`, or `BOTH`). Wasting cooldowns on immune targets is a common mistake.

## Conclusion

This legacy Fire Mage rotation example demonstrates the foundational concepts needed to build complete combat rotations using the Project Sylvanas core API. While this approach requires more manual implementation compared to modern solutions like the IZI SDK, it provides full control and deep understanding of the underlying systems.

**Key Takeaways:**

- **Manual Control** - Direct access to core systems gives you maximum flexibility
- **Module Integration** - Learn how to combine multiple helper modules ( `spell_helper` , `buff_manager` , `spell_prediction` , etc.)
- **Target Selection** - Implement custom target selector configurations optimized for your rotation
- **Spell Prediction** - Manually configure AoE spell positioning for optimal damage
- **Defensive Logic** - Separate defensive and offensive phases for proper priority handling
- **Performance Awareness** - Implement throttling, caching, and early returns for efficiency

**When to Use Legacy API:**

- You need low-level control not available in higher-level abstractions
- You're maintaining existing legacy plugins
- You want to understand the internals before using simplified SDKs
- You need custom behavior that doesn't fit IZI's patterns

**Consider [IZI SDK](/dev/libraries/izi) Instead:**

If you're building a new rotation from scratch, consider the [IZI SDK Fire Mage Example](/examples/izi/fire-mage) which provides the same functionality with significantly less code. The [IZI SDK](/dev/libraries/izi) offers:

- Reduced boilerplate while maintaining full flexibility
- Simpler spell casting with [`izi_spell:cast_safe()`](/dev/libraries/izi/izi-spells#cast_safe)
- Automatic spell prediction for ground-targeted spells
- Countless [`game_object`](/dev/api/game-object) extensions to make working with game_objects easier
- Works alongside the legacy APIs

Both approaches are valid - choose based on your needs, preferences, and whether you're working with existing code or starting fresh.

---

I hope you enjoyed this example and found it helpful! This Fire Mage rotation demonstrates the core concepts you'll need to build rotations for any class. Feel free to adapt and expand upon this code for your own projects.

— Barney