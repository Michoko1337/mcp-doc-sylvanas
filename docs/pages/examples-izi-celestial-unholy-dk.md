# Celestial Unholy Death Knight Rotation ([IZI SDK](/dev/libraries/izi))

> Source: <https://docs.project-sylvanas.net/examples/izi/celestial-unholy-dk>

This example demonstrates how to create a complete, production-ready combat rotation plugin for an Unholy Death Knight using the [**IZI SDK**](/dev/libraries/izi). This is a comprehensive example that showcases advanced rotation techniques including cooldown management, defensive handling, artifact powers, and resource optimization.

> [!INFO]
> This is a feature-complete rotation example designed for the Unholy Death Knight with Rider of Apocalypse hero tree support. It includes advanced features like Time To Die (TTD) validation, health forecasting, automatic pet management, and Remix Time artifact integration.

## Links

- **[Download from Plugin Marketplace](https://project-sylvanas.net/panel/plugins/detail/287)** - Get the latest version
- **[View Source Code on GitHub](https://github.com/bluesilvi/project-sylvanas/tree/main/izi/celestial_unholy_death_knight)** - Full source code

## What You'll Learn

- **Advanced Cooldown Management** - TTD validation, cooldown tracking, and optimal usage timing
- **Resource Management** - Runic Power and Rune optimization for maximum damage
- **Defensive Automation** - Health forecasting with Anti-Magic Shell, Lichborne, and Icebound Fortitude
- **Pet & Minion Tracking** - Automatic pet summoning and minion state detection
- **Artifact Powers** - Twisted Crusade and Remix Time integration for WoW Remix
- **Disease Management** - Pandemic-aware Virulent Plague and Frost Fever spreading
- **Menu System** - Comprehensive configuration with validators and control panel integration
- **DoT Spreading** - Using [`izi.spread_dot()`](/dev/libraries/izi#izispread_dot) for multi-target disease application
- **Target Filtering** - Using [`izi_spell:cast_target_if()`](/dev/libraries/izi/izi-spells#cast_target_if) and [`izi_spell:cast_target_if_safe()`](/dev/libraries/izi/izi-spells#cast_target_if_safe) for smart target selection
- **AoE vs Single Target** - Dynamic rotation switching based on enemy count

## Recommended Talent Build

This rotation is optimized for AoE scenarios with the following talent string:

```text
CwPAclESCN5uIs3wGGVadXqL3BwMDzYmxwMzMzMTDjZMzMGAAAAAAAAmZmZDzYmBAsNDzY2mZmxYGgFzihhMwsxQjFMAzAYA
```

**Hero Tree:** Rider of Apocalypse

## Plugin Structure

This rotation consists of four main files:

1. **header.lua** - Validates class/spec and determines if plugin should load
2. **spells.lua** - Defines all spells with IDs and debuff tracking
3. **menu.lua** - Creates menu interface with validators for rotation logic
4. **main.lua** - Contains the complete rotation logic

### File Overview

#### header.lua

The header file validates the player's class and specialization before loading the plugin:

```lua
local plugin = {}

plugin.name = "Unholy Death Knight"
plugin.version = "1.0.0"
plugin.author = "Voltz"
plugin.load = true

local local_player = core.object_manager:get_local_player()

if not local_player or not local_player:is_valid() then
    plugin.load = false
    return plugin
end

---@type enums
local enums = require("common/enums")
local player_class = local_player:get_class()

local is_valid_class = player_class == enums.class_id.DEATHKNIGHT

if not is_valid_class then
    plugin.load = false
    return plugin
end

local spec_id = enums.class_spec_id
local player_spec_id = local_player:get_specialization_id()

local is_valid_spec = player_spec_id == spec_id.get_spec_id_from_enum(spec_id.spec_enum.UNHOLY_DEATHKNIGHT)

if not is_valid_spec then
    plugin.load = false
    return plugin
end

return plugin
```

**Validation Flow:**

1. Check if local player exists (prevents loading screen errors)
2. Validate player class is Death Knight
3. Validate specialization is Unholy
4. Only load if all checks pass

#### spells.lua

The spells file defines all abilities with spell IDs and debuff tracking:

```lua
local izi = require("common/izi_sdk")
local enums = require("common/enums")
local spell = izi.spell

local BUFFS = enums.buff_db

---@class dk_unholy_spells
local SPELLS =
{
    --Damage
    FESTERING_STRIKE = spell(85948),
    FESTERING_SCYTHE = spell(455397, 458128),
    CLAWING_SHADOWS = spell(207311),
    SOUL_REAPER = spell(343294),
    DEATH_COIL = spell(47541),
    EPIDEMIC = spell(207317),
    OUTBREAK = spell(77575),
    DEATH_AND_DECAY = spell(43265),
    DEATH_STRIKE = spell(49998),

    --Cooldowns
    LEGION_OF_SOULS = spell(383269),
    APOCALYPSE = spell(275699),
    RAISE_ABOMINATION = spell(455395),
    UNHOLY_ASSAULT = spell(207289),

    --Remix
    REMIX_TIME = spell(1236723),
    ARTIFACT_TWISTED_CRUSADE = spell(1237711),
    ARTIFACT_TWISTED_CRUSADE_FELSPIKE = spell(1242973),

    --Defensives
    ANTI_MAGIC_SHELL = spell(48707),
    ICEBOUND_FORTITUDE = spell(48792),
    LICHBORNE = spell(49039),

    --Utility
    RAISE_DEAD = spell(46584),

    --Passives (these are just used to check for talents)
    IMPROVED_DEATH_COIL = spell(377580),
    SUPERSTRAIN = spell(390283),
}

--For outbreak we want to track virulent plague for spreading dots with izi.spread_dot
SPELLS.OUTBREAK:track_debuff(BUFFS.VIRULENT_PLAGUE)

return SPELLS
```

**Key Features:**

- Organized by category (Damage, Cooldowns, Remix, Defensives, Utility)
- Uses [`izi.spell()`](/dev/libraries/izi/izi-spells#creating-a-new-spell) for creating spell objects
- [`track_debuff()`](/dev/libraries/izi/izi-spells#track_debuff) enables DoT spreading with [`izi.spread_dot()`](/dev/libraries/izi#izispread_dot)
- Passive talents tracked for rotation conditionals

#### menu.lua

The menu file creates a comprehensive configuration interface with validators:

```lua
local m = core.menu
local color = require("common/color")
local key_helper = require("common/utility/key_helper")
local control_panel_utility = require("common/utility/control_panel_helper")

--Constants
local PLUGIN_PREFIX = "celestial_dk_unholy"
local WHITE = color.white(150)
local TTD_MIN = 1
local TTD_MAX = 120
local TTD_DEFAULT = 16
local TTD_DEFAULT_AOE = 20

---Creates an ID with prefix for our rotation so we don't need to type it every time
---@param key string
local function id(key)
    return string.format("%s_%s", PLUGIN_PREFIX, key)
end

---@class unholy_dk_menu
local menu =
{
    --Global
    MAIN_TREE = m.tree_node(),
    GLOBAL_CHECK = m.checkbox(true, id("global_toggle")),

    --Keybinds
    KEYBIND_TREE = m.tree_node(),
    ROTATION_KEYBIND = m.keybind(999, false, id("rotation_toggle")),

    --Cooldowns (Raise Abomination, Apocalypse, Legion of Souls, Unholy Assault, Twisted Crusade)
    COOLDOWNS_TREE = m.tree_node(),

    RAISE_ABOMINATION_TREE = m.tree_node(),
    RAISE_ABOMINATION_CHECK = m.checkbox(true, id("abomination_toggle")),
    RAISE_ABOMINATION_MIN_TTD = m.slider_float(TTD_MIN, TTD_MAX, TTD_DEFAULT, id("abomination_min_ttd")),
    RAISE_ABOMINATION_MIN_TTD_AOE = m.slider_float(TTD_MIN, TTD_MAX, TTD_DEFAULT_AOE, id("abomination_min_ttd_aoe")),

    --Defensives (Anti-Magic Shell, Lichborne, Icebound Fortitude, Death Strike)
    DEFENSIVES_TREE = m.tree_node(),

    ANTI_MAGIC_SHELL_TREE = m.tree_node(),
    ANTI_MAGIC_SHELL_CHECK = m.checkbox(true, id("anti_magic_shell_toggle")),
    ANTI_MAGIC_SHELL_MAX_HP = m.slider_int(1, 100, 95, id("anti_magic_shell_max_hp")),
    ANTI_MAGIC_SHELL_FUTURE_HP = m.slider_int(1, 100, 90, id("anti_magic_shell_max_future_hp")),

    --Utility
    UTILITY_TREE = m.tree_node(),
    AUTO_RAISE_DEAD_CHECK = m.checkbox(true, id("auto_raise_dead")),
    AUTO_REMIX_TIME_CHECK = m.checkbox(true, id("auto_remix_time")),
    AUTO_REMIX_TIME_MIN_TIME_STANDING = m.slider_float(0, 15, 2.5, id("auto_remix_time_min_time_standing"))
}

---@alias menu_validator_fn fun(value: number): boolean

---Creates a new validator function validating a checkbox and relevant slider value
---@param checkbox checkbox
---@param slider slider_int|slider_float
---@param type? "min"|"max"|"equal"
---@return menu_validator_fn
function menu.new_validator_fn(checkbox, slider, type)
    type = type or "min"

    return function(value)
        local is_checked = checkbox:get_state()

        if is_checked then
            local slider_value = slider:get()

            if type == "min" then
                return value >= slider_value
            elseif type == "max" then
                return value <= slider_value
            elseif type == "equal" then
                return value == slider_value
            end
        end

        return false
    end
end

--Returns true if the plugin is enabled
---@return boolean enabled
function menu:is_enabled()
    return self.GLOBAL_CHECK:get_state()
end

--Returns true if the plugin and rotation are enabled
---@return boolean enabled
function menu:is_rotation_enabled()
    return self.GLOBAL_CHECK:get_state() and self.ROTATION_KEYBIND:get_toggle_state()
end

--Cooldown Validators
menu.validate_raise_abomination = menu.new_validator_fn(menu.RAISE_ABOMINATION_CHECK, menu.RAISE_ABOMINATION_MIN_TTD)
menu.validate_raise_abomination_aoe = menu.new_validator_fn(menu.RAISE_ABOMINATION_CHECK, menu.RAISE_ABOMINATION_MIN_TTD_AOE)
-- ... (additional validators)

return menu
```

**Menu Features:**

- **Organized categories** - Cooldowns, Defensives, Utility sections
- **TTD Validation** - Separate thresholds for single target and AoE scenarios
- **Health Thresholds** - Current and forecasted HP for defensive triggers
- **Validator Functions** - Reusable functions for rotation logic
- **Control Panel Integration** - Displays rotation toggle with keybind

**Key Concept: Validators**

Validators are functions that check if an ability should be used based on menu settings:

```lua
-- Create validator
menu.validate_raise_abomination = menu.new_validator_fn(
    menu.RAISE_ABOMINATION_CHECK,  -- Is checkbox enabled?
    menu.RAISE_ABOMINATION_MIN_TTD -- Minimum TTD value
)

-- Use in rotation
local ttd = target:time_to_die()
if menu.validate_raise_abomination(ttd) then
    -- TTD is >= configured minimum, safe to use cooldown
end
```

This pattern allows users to configure thresholds while keeping rotation logic clean.

## Core Rotation Features

### 1. Time To Die (TTD) Validation

The rotation uses TTD to determine if cooldowns should be used:

```lua
--Get TTD to check if we should use CDs
local ttd = target:time_to_die()
local raise_abomination_valid = menu.validate_raise_abomination(ttd)

--Cast Raise Abomination only if TTD is sufficient
if raise_abomination_valid and SPELLS.RAISE_ABOMINATION:cast_safe() then
    return true
end
```

**TTD Benefits:**

- Prevents wasting cooldowns on targets that will die quickly
- Separate thresholds for single target vs AoE scenarios
- Configurable per-ability for fine-tuned control

For AoE scenarios, use [`izi.get_time_to_die_global()`](/dev/libraries/izi#iziget_time_to_die_global) to get the average TTD across all targets.

### 2. Minion Tracking

The rotation tracks active minions to optimize ability usage:

```lua
---Returns true if the unit has a minion with the given NPC ID
---@param unit game_object
---@param npc_id number
---@return boolean has_minion
local function unit_has_minion(unit, npc_id)
    local minions = unit:get_all_minions()

    for i = 1, #minions do
        local minion = minions[i]
        if minion:get_npc_id() == npc_id then
            return true
        end
    end

    return false
end

---Checks if the unit has an abomination active
---@param unit game_object
---@return boolean abomination_active
local function unit_has_abomination(unit)
    local abomination_npc_id = 149555
    return unit_has_minion(unit, abomination_npc_id)
end
```

**Usage in Rotation:**

```lua
--While Raise Abomination is active, you only cast Festering Strike when you are at 0 Festering Wounds
local has_abomination = unit_has_abomination(me)
local maximum_festering_wounds = has_abomination and 0 or 2
local should_festering_strike = target_festering_wound_stacks <= maximum_festering_wounds
```

### 3. Pandemic Disease Management

The rotation uses pandemic thresholds to optimize disease uptime:

```lua
--Calculate the pandemic value for VIRULENT_PLAGUE
local VIRULENT_PLAGUE_PANDEMIC_THRESHOLD_SEC = 13.5 * 0.30
local VIRULENT_PLAGUE_PANDEMIC_THRESHOLD_MS = VIRULENT_PLAGUE_PANDEMIC_THRESHOLD_SEC * 1000

--Cast Outbreak if Virulent Plague can be refreshed (pandemic)
if target:debuff_remains_sec(BUFFS.VIRULENT_PLAGUE) < VIRULENT_PLAGUE_PANDEMIC_THRESHOLD_SEC then
    local should_apply_plague = not apocalypse_ready_soon and not raise_abomination_ready_soon

    if should_apply_plague then
        if SPELLS.OUTBREAK:cast_safe(target, "Refreshing Virulent Plague") then
            return true
        end
    end
end
```

**Pandemic Mechanics:**

- Refreshing DoTs early extends duration instead of overwriting
- Optimal refresh window is 30% of base duration
- Prevents wasting GCDs on unnecessary refreshes

### 4. DoT Spreading with IZI

The rotation uses [`izi.spread_dot()`](/dev/libraries/izi#izispread_dot) for intelligent disease application:

```lua
--In spells.lua - Enable DoT tracking
SPELLS.OUTBREAK:track_debuff(BUFFS.VIRULENT_PLAGUE)

--In main.lua - Spread diseases to targets missing them
if izi.spread_dot(SPELLS.OUTBREAK, enemies, VIRULENT_PLAGUE_PANDEMIC_THRESHOLD_MS, nil, "Spread Plague") then
    return true
end
```

**How spread_dot Works:**

- Automatically finds targets missing the tracked debuff
- Respects pandemic thresholds for efficient refreshing
- Prioritizes targets based on remaining duration
- Only casts if a valid target is found

### 5. Defensive Automation with Health Forecasting

The rotation uses [`cast_defensive()`](/dev/libraries/izi/izi-spells#cast_defensive) for intelligent defensive usage:

```lua
---@type defensive_filters
local anti_magic_shell_filters =
{
    health_percentage_threshold_raw = menu.ANTI_MAGIC_SHELL_MAX_HP:get(),
    health_percentage_threshold_incoming = menu.ANTI_MAGIC_SHELL_FUTURE_HP:get(),
    magical_damage_percentage_threshold = 15
}

if SPELLS.ANTI_MAGIC_SHELL:cast_defensive(me, anti_magic_shell_filters, "Anti-Magic Shell", { skip_gcd = true }) then
    return true
end
```

**Defensive Filter Options:**

- `health_percentage_threshold_raw` - Current HP threshold
- `health_percentage_threshold_incoming` - Forecasted HP threshold
- `magical_damage_percentage_threshold` - Minimum magical damage required
- `block_time` - Time window for damage prediction (seconds)

**How It Works:**

[`cast_defensive()`](/dev/libraries/izi/izi-spells#cast_defensive) analyzes incoming damage and predicts future health:

1. Checks current HP against `health_percentage_threshold_raw`
2. Forecasts HP after `block_time` seconds of current damage rate
3. Casts if either threshold is met and damage type matches

This prevents panic healing and ensures defensives are used proactively.

### 6. Target Selection with cast_target_if

The rotation uses [`cast_target_if()`](/dev/libraries/izi/izi-spells#cast_target_if) and [`cast_target_if_safe()`](/dev/libraries/izi/izi-spells#cast_target_if_safe) for smart target selection:

```lua
---Filter function returns a value to compare
---@param enemy game_object
---@return number|nil
local function festering_wound_filter(enemy)
    if enemy:has_debuff(BUFFS.FESTERING_WOUND) then
        return enemy:get_debuff_stacks(BUFFS.FESTERING_WOUND)
    end
end

--Cast Apocalypse on the target with the least Festering Wounds
if apocalypse_valid and SPELLS.APOCALYPSE:cast_target_if_safe(enemies, "min", festering_wound_filter) then
    return true
end

--Cast Clawing Shadows if any target has a Festering Wound prioritizing the highest stack
if SPELLS.CLAWING_SHADOWS:cast_target_if_safe(enemies, "max", festering_wound_filter) then
    return true
end
```

**Target Selection Modes:**

- `"min"` - Select target with lowest filter value
- `"max"` - Select target with highest filter value

**Filter Function:**

- Returns a number to compare (or `nil` to skip target)
- IZI automatically finds the best target based on mode
- Validates target is castable before selecting

This is powerful for abilities that should be used on specific targets (lowest HP, most stacks, etc.).

### 7. Artifact Powers (Remix Time)

The rotation includes automatic Remix Time usage to refresh cooldowns:

```lua
--Automatically remix time if cooldowns are not active and are on cooldown
local last_movement = time_since_last_movement_sec()

--Check if player has artifact trait that allows casting while moving
local can_cast_while_moving = me:has_aura(REMIX_CASTING_MOVE_BUFF_IDS)

--Check if we should remix time
local remix_time_valid = can_cast_while_moving or menu.validate_remix_time(last_movement)

if remix_time_valid then
    --Check cooldowns are active
    local has_legion_of_souls = me:has_buff(BUFFS.LEGION_OF_SOULS)
    local has_abomination = unit_has_abomination(me)
    local has_apocalypse = unit_has_apocalypse(me)
    local has_unholy_assault = me:has_buff(BUFFS.UNHOLY_ASSAULT)
    local has_twisted_crusade = me:has_buff(SPELLS.ARTIFACT_TWISTED_CRUSADE:id())

    --Make sure no cooldowns are active
    local cooldowns_inactive =
        not has_legion_of_souls and not has_abomination
        and not has_apocalypse and not has_unholy_assault
        and not has_twisted_crusade

    if cooldowns_inactive then
        --Get the cooldown remaining time for each CD
        local abomination_cooldown_sec = SPELLS.RAISE_ABOMINATION:cooldown_remains()
        local legion_of_souls_cooldown_sec = SPELLS.LEGION_OF_SOULS:cooldown_remains()
        local apocalypse_cooldown_sec = SPELLS.APOCALYPSE:cooldown_remains()
        local unholy_assault_cooldown_sec = SPELLS.UNHOLY_ASSAULT:cooldown_remains()
        local twisted_crusade_cooldown_sec = SPELLS.ARTIFACT_TWISTED_CRUSADE:cooldown_remains()

        --Get the highest cooldown remaining time
        local max_cooldown_sec = math.max(
            abomination_cooldown_sec,
            legion_of_souls_cooldown_sec,
            apocalypse_cooldown_sec,
            unholy_assault_cooldown_sec,
            twisted_crusade_cooldown_sec
        )

        --Check if the highest cooldown remaining time is greater than or equal to the minimum cooldown time
        local should_remix_time = max_cooldown_sec >= MINIMUM_COOLDOWN_SEC

        if should_remix_time then
            if SPELLS.REMIX_TIME:cast_safe(nil, "Remix Time (Refresh Cooldowns)") then
                return true
            end
        end
    end
end
```

**Remix Time Logic:**

1. Only use when standing still (or with casting while moving buff)
2. Ensure no major cooldowns are currently active
3. Check if longest cooldown >= 30 seconds remaining
4. Cast to reset all cooldowns

This maximizes Remix Time value by ensuring cooldowns are on actual cooldown.

**Twisted Crusade:**

```lua
--Cast Twisted Crusade Felspike before it falls off
local twisted_crusade_id = SPELLS.ARTIFACT_TWISTED_CRUSADE:id()
local has_twisted_crusade = me:has_buff(twisted_crusade_id)

if has_twisted_crusade then
    --Get the current GCD and account for ping to determine if we should cast Felspike
    local minimum_twisted_crusade_remaining_sec = gcd + ping_sec
    local twisted_crusade_remaining_sec = me:buff_remains_sec(twisted_crusade_id)

    --If the remaining duration of Twisted Crusade is less than the minimum required duration, cast Felspike
    if twisted_crusade_remaining_sec < minimum_twisted_crusade_remaining_sec then
        if SPELLS.ARTIFACT_TWISTED_CRUSADE_FELSPIKE:cast() then
            return true
        end
    end
end
```

Twisted Crusade is cast when TTD validation passes, and Felspike is used on the last possible GCD before the buff expires.

## Single Target Rotation Priority

The single target rotation follows this priority:

1. **Raise Abomination** - If TTD validation passes
2. **Legion of Souls** - If TTD validation passes
3. **Build Festering Wounds** - If Apocalypse is ready soon, build to 4 stacks
4. **Apocalypse** - With 4 Festering Wounds
5. **Unholy Assault** - If Apocalypse minions are active
6. **Outbreak** - If diseases need refreshing (pandemic) and cooldowns aren't ready soon
7. **Festering Scythe** - Off cooldown
8. **Soul Reaper** - If target is below 35% HP or will be when expires
9. **Death Coil** - With 80+ Runic Power or Sudden Doom proc
10. **Clawing Shadows** - With Festering Wounds and Rotten Touch
11. **Festering Strike** - With 2 or fewer Festering Wounds (0 with Abomination)
12. **Death Coil** - To refresh Death Rot before it expires
13. **Clawing Shadows** - With 3+ Festering Wounds
14. **Death Coil** - Fallback filler

```lua
---Handles single target rotation
---@param me game_object
---@param target game_object
---@return boolean success
local function single_target(me, target)
    --Cooldowns
    --Get TTD to check if we should use CDs
    local ttd = target:time_to_die()
    local raise_abomination_valid = menu.validate_raise_abomination(ttd)
    local legion_of_souls_valid = menu.validate_legion_of_souls(ttd)
    local apocalypse_valid = menu.validate_apocalypse(ttd)
    local unholy_assault_valid = menu.validate_unholy_assault(ttd)

    local apocalypse_ready_soon = apocalypse_valid and
        SPELLS.APOCALYPSE:cooldown_remains() <= COOLDOWN_READY_SOON_SEC

    local raise_abomination_ready_soon = raise_abomination_valid and
        SPELLS.RAISE_ABOMINATION:cooldown_remains() <= COOLDOWN_READY_SOON_SEC

    --Cast Raise Abomination
    if raise_abomination_valid and SPELLS.RAISE_ABOMINATION:cast_safe() then
        return true
    end

    --Cast Legion of Souls
    if legion_of_souls_valid and SPELLS.LEGION_OF_SOULS:cast_safe() then
        return true
    end

    --Cast Festering Strike until you have 4 Festering Wounds if Apocalypse is ready or is about to be ready.
    if apocalypse_ready_soon then
        local festering_wounds_cap = 4
        local target_festering_wound_stacks = target:get_debuff_stacks(BUFFS.FESTERING_WOUND)
        local has_festering_wounds_cap = target_festering_wound_stacks >= festering_wounds_cap

        if not has_festering_wounds_cap then
            SPELLS.FESTERING_STRIKE:cast_safe(target)
            return true -- We always return true because we want to build festering wounds to 4 on the target
        end

        --Cast Apocalypse with 4 Festering Wounds.
        if SPELLS.APOCALYPSE:cast_safe() then
            return true
        end
    end

    --Cast Unholy Assault
    local apocalypse_active = unit_has_apocalypse(me)

    if apocalypse_active then
        if unholy_assault_valid and SPELLS.UNHOLY_ASSAULT:cast_safe() then
            return true
        end
    end

    --Cast Outbreak if Virulent Plague can be refreshed (pandemic) and Apocalypse or Raise Abomination have more than 7 seconds remaining on their cooldown.
    if target:debuff_remains_sec(BUFFS.VIRULENT_PLAGUE) < VIRULENT_PLAGUE_PANDEMIC_THRESHOLD_SEC then
        local should_apply_plague = not apocalypse_ready_soon and not raise_abomination_ready_soon

        if should_apply_plague then
            if SPELLS.OUTBREAK:cast_safe(target, "Refreshing Virulent Plague") then
                return true
            end
        end
    end

    --Cast Festering Scythe off cooldown
    if SPELLS.FESTERING_SCYTHE:cast_safe(target) then
        return true
    end

    --Cast Soul Reaper if the enemy is below 35% health or will be when this expires.
    if SPELLS.SOUL_REAPER:cooldown_up() then -- We check if the cooldown is up to save calls to health_prediction
        if should_soul_reaper(target) then
            if SPELLS.SOUL_REAPER:cast_safe(target) then
                return true
            end
        end
    end

    --Cast Death Coil when you have more than 80 Runic Power or when Sudden Doom is active.
    local death_coil_min_runic_power = 80
    local has_sudden_doom = me:has_buff(BUFFS.SUDDEN_DOOM)
    local should_death_coil = runic_power >= death_coil_min_runic_power or has_sudden_doom

    if should_death_coil then
        if SPELLS.DEATH_COIL:cast_safe(target) then
            return true
        end
    end

    --Cast Clawing Shadows when you have 1 or more Festering Wounds and Rotten Touch is on the target.
    local target_has_festering_wound = target:has_debuff(BUFFS.FESTERING_WOUND)
    local target_has_rotten_touch = target:has_debuff(BUFFS.ROTTEN_TOUCH)
    local should_clawing_shadows = target_has_festering_wound and target_has_rotten_touch

    if should_clawing_shadows then
        if SPELLS.CLAWING_SHADOWS:cast_safe(target) then
            return true
        end
    end

    --Cast Festering Strike when you have 2 or less Festering Wounds.
    --While Raise Abomination is active, you only cast Festering Strike when you are at 0 Festering Wounds
    local has_abomination = unit_has_abomination(me)
    local maximum_festering_wounds = has_abomination and 0 or 2
    local target_festering_wound_stacks = target:get_debuff_stacks(BUFFS.FESTERING_WOUND)
    local should_festering_strike = target_festering_wound_stacks <= maximum_festering_wounds

    if should_festering_strike then
        if SPELLS.FESTERING_STRIKE:cast_safe(target) then
            return true
        end
    end

    --Cast Death Coil if Death Rot is about to fall off.
    local minimum_death_rot_remaining_sec = gcd + ping_sec
    local death_rot_remaining_sec = target:debuff_remains_sec(BUFFS.DEATH_ROT)
    local should_refresh_death_rot = death_rot_remaining_sec > 0 and death_rot_remaining_sec < minimum_death_rot_remaining_sec

    if should_refresh_death_rot then
        if SPELLS.DEATH_COIL:cast_safe(target, "Refreshing Death Rot") then
            return true
        end
    end

    --Cast Clawing Shadows when you have 3 or more Festering Wounds.
    if target_festering_wound_stacks >= 3 then
        if SPELLS.CLAWING_SHADOWS:cast_safe(target) then
            return true
        end
    end

    --Cast Death Coil.
    if SPELLS.DEATH_COIL:cast_safe(target) then
        return true
    end

    return false
end
```

## AoE Rotation Priority

The AoE rotation switches between burst and building phases:

**Building Phase (No Death and Decay):**

1. **Festering Scythe** - Off cooldown
2. **Soul Reaper** - On target below 35% HP (prioritize lowest HP)
3. **Raise Abomination** - If TTD validation passes
4. **Legion of Souls** - If TTD validation passes
5. **Apocalypse** - On target with least Festering Wounds
6. **Unholy Assault** - If TTD validation passes
7. **Clawing Shadows** - If Plaguebringer is not active
8. **Outbreak** - Spread diseases with [`izi.spread_dot()`](/dev/libraries/izi#izispread_dot)
9. **Clawing Shadows** - On target with Trollbane's Chains of Ice
10. **Epidemic/Death Coil** - With less than 4 Runes or Sudden Doom
11. **Death and Decay** - Place under enemies

**Burst Phase (Death and Decay Active):**

1. **Unholy Assault** - If TTD validation passes
2. **Epidemic/Death Coil** - With Sudden Doom proc
3. **Clawing Shadows** - On target with most Festering Wounds
4. **Epidemic/Death Coil** - If no targets have Festering Wounds
5. **Clawing Shadows** - Fallback
6. **Epidemic/Death Coil** - Fallback filler

**Epidemic vs Death Coil:**

```lua
--Switch to Epidemic at 3+ targets, 4+ with Improved Death Coil
local has_improved_death_coil = SPELLS.IMPROVED_DEATH_COIL:is_learned()
local minimum_epidemic_targets = has_improved_death_coil and 4 or 3
local virulent_plague_enemies = izi.enemies_if(8, function(enemy)
    return enemy:has_debuff(BUFFS.VIRULENT_PLAGUE)
end)

local epidemic_or_death_coil = #virulent_plague_enemies >= minimum_epidemic_targets
    and SPELLS.EPIDEMIC or SPELLS.DEATH_COIL
```

This dynamically selects the optimal spell based on target count and talents.

### Complete AoE Implementation

```lua
---Filter function returns a value to compare
---@param enemy game_object
---@return number|nil
local function festering_wound_filter(enemy)
    if enemy:has_debuff(BUFFS.FESTERING_WOUND) then
        return enemy:get_debuff_stacks(BUFFS.FESTERING_WOUND)
    end
end

---Filter function to find Soul Reaper targets
---@param enemy game_object
---@return number|nil
local function find_soul_reaper_target(enemy)
    local in_execute, health = should_soul_reaper(enemy)

    if in_execute then
        return health
    end
end

---Handles AoE rotation
---@param me game_object
---@param target game_object -- Hud Target
---@param enemies game_object[] --- Enemies within 30yd
---@param enemies_melee game_object[] --- Enemies within melee range
---@return boolean
local function aoe(me, target, enemies, enemies_melee)
    local ttd = izi.get_time_to_die_global()
    local raise_abomination_valid = menu.validate_raise_abomination_aoe(ttd)
    local legion_of_souls_valid = menu.validate_legion_of_souls_aoe(ttd)
    local apocalypse_valid = menu.validate_apocalypse_aoe(ttd)
    local unholy_assault_valid = menu.validate_unholy_assault_aoe(ttd)

    --When you are in an AoE situation, you should switch to using Epidemic over Death Coil at 3 stacked targets.
    --However, when you are talented into Improved Death Coil this changes to 4 stacked targets.
    local has_improved_death_coil = SPELLS.IMPROVED_DEATH_COIL:is_learned()
    local minimum_epidemic_targets = has_improved_death_coil and 4 or 3
    local virulent_plague_enemies = izi.enemies_if(8, function(enemy)
        return enemy:has_debuff(BUFFS.VIRULENT_PLAGUE)
    end)

    local epidemic_or_death_coil = #virulent_plague_enemies >= minimum_epidemic_targets
        and SPELLS.EPIDEMIC or SPELLS.DEATH_COIL

    -- Cast Festering Scythe if it is available.
    if SPELLS.FESTERING_SCYTHE:cast_safe(target) then
        return true
    end

    --Cast Soul Reaper if an enemy is below 35% health or will be when this expires.
    if SPELLS.SOUL_REAPER:cooldown_up() then -- We check if the cooldown is up to save calls to health_prediction
        if SPELLS.SOUL_REAPER:cast_target_if(enemies_melee, "min", find_soul_reaper_target) then
            return true
        end
    end

    --Cooldowns
    --Cast Raise Abomination
    if raise_abomination_valid and SPELLS.RAISE_ABOMINATION:cast_safe() then
        return true
    end

    --Cast Legion of Souls.
    if legion_of_souls_valid and SPELLS.LEGION_OF_SOULS:cast_safe() then
        return true
    end

    --Cast Apocalypse on the target with the least Festering Wounds.
    if apocalypse_valid and SPELLS.APOCALYPSE:cast_target_if_safe(enemies, "min", festering_wound_filter) then
        return true
    end

    --Cast Unholy Assault.
    if unholy_assault_valid and SPELLS.UNHOLY_ASSAULT:cast_safe(target) then
        return true
    end

    local has_death_and_decay = me:has_buff(BUFFS.DEATH_AND_DECAY)

    --Cast Clawing Shadows if Plaguebringer is not active.
    local has_plaguebringer = me:has_buff(BUFFS.PLAGUEBRINGER)

    if not has_plaguebringer then
        if SPELLS.CLAWING_SHADOWS:cast_safe(target, "Plaguebringer") then
            return true
        end
    end

    --Cast Outbreak if Virulent Plague or Frost Fever is missing on any target
    --and Apocalypse have more than 7 seconds remaining on their cooldown.
    local apocalypse_off_cd_soon = SPELLS.APOCALYPSE:cooldown_remains() <= COOLDOWN_READY_SOON_SEC
    local apocalypse_not_ready_soon = not apocalypse_valid or not apocalypse_off_cd_soon

    if apocalypse_not_ready_soon then
        if izi.spread_dot(SPELLS.OUTBREAK, enemies, VIRULENT_PLAGUE_PANDEMIC_THRESHOLD_MS, nil, "Spread Plague") then
            return true
        end
    end

    --Burst Phase
    if has_death_and_decay then
        --Cast Unholy Assault.
        if unholy_assault_valid and SPELLS.UNHOLY_ASSAULT:cast_safe(target) then
            return true
        end

        --Cast Epidemic or death coil if Sudden Doom is active.
        local has_sudden_doom = me:has_buff(BUFFS.SUDDEN_DOOM)

        if has_sudden_doom then
            if epidemic_or_death_coil:cast_safe(target, "sudden doom") then
                return true
            end
        end

        --Cast Clawing Shadows if any target has a Festering Wound prioritizing the highest stack.
        if SPELLS.CLAWING_SHADOWS:cast_target_if_safe(enemies, "max", festering_wound_filter) then
            return true
        end

        --Cast Epidemic or death coil if no targets have Festering Wounds.
        local festering_wound_enemy = get_first_festering_wound_enemy(enemies)

        if not festering_wound_enemy then
            if epidemic_or_death_coil:cast_safe(target, "no targets have festering wound") then
                return true
            end
        end

        --Cast Clawing Shadows.
        if SPELLS.CLAWING_SHADOWS:cast_safe(target) then
            return true
        end

        --Cast Epidemic or death coil.
        if epidemic_or_death_coil:cast_safe(target, "fallback") then
            return true
        end
    else --Building Phase
        --Cast Clawing Shadows if Trollbane's Chains of Ice is up.
        local active_trollbanes_enemy = get_trollbanes_enemy(enemies)

        if active_trollbanes_enemy then
            if SPELLS.CLAWING_SHADOWS:cast_safe(active_trollbanes_enemy) then
                return true
            end
        end

        --Cast Epidemic or death coil if you have less than 4 Runes or if Sudden Doom is active.
        local has_sudden_doom = me:has_buff(BUFFS.SUDDEN_DOOM)
        local should_epidemic_or_death_coil = has_sudden_doom or runes < 4

        if should_epidemic_or_death_coil then
            if epidemic_or_death_coil:cast_safe(target, "sudden death or less than 4 runes") then
                return true
            end
        end

        --Cast Death and Decay if it is missing.
        if SPELLS.DEATH_AND_DECAY:cast_safe(target) then
            return true
        end
    end

    return false
end
```

## Main Update Loop

The rotation's main update loop ties everything together. This is registered with [`core.register_on_update_callback()`](/dev/api/core#coreregister_on_update_callback) and runs every game tick.

### Update Loop Structure

```lua
core.register_on_update_callback(function()
    --Check if the rotation is enabled
    if not menu:is_enabled() then
        return
    end

    --Get the local player
    local me = izi.me()

    --Check if the local player exists and is valid
    if not (me and me.is_valid and me:is_valid()) then
        return
    end

    --Update our commonly used values
    ping_ms = core.get_ping()
    ping_sec = ping_ms / 1000
    game_time_ms = izi.now_game_time_ms()
    gcd = me:gcd()
    runic_power = me:get_power(enums.power_type.RUNICPOWER)
    runes = me:get_power(enums.power_type.RUNES)

    --Update the local player's last movement time
    if me:is_moving() then
        last_movement_time_ms = game_time_ms
    end

    --Update the local player's last mounted time
    if me:is_mounted() then
        last_mounted_time_ms = game_time_ms
        return
    end

    --Delay actions after dismounting (prevent trying to summon pet for example while we wait for it to resummon when phasing out)
    local time_dismounted_ms = time_since_last_dismount_ms()

    if time_dismounted_ms < DISMOUNT_DELAY_MS then
        return
    end

    --If the rotation is paused let's return early
    if not menu:is_rotation_enabled() then
        return
    end

    --Get enemies that are in combat within 30 yards
    local enemies = me:get_enemies_in_range(30)

    --Get enemies within melee range
    local enemies_melee = me:get_enemies_in_melee_range(8)

    --Check if we are in an AoE scenario
    local is_aoe = #enemies > 1

    --Execute our utils
    if utility(me) then
        return
    end

    --Get target selector targets
    local targets = izi.get_ts_targets()

    --Iterate over targets and run rotation logic on each one
    for i = 1, #targets do
        local target = targets[i]

        --Check if the target is valid otherwise skip it
        if not (target and target.is_valid and target:is_valid()) then
            goto continue
        end

        --If the target is immune to any damage, skip it
        if target:is_damage_immune(target.DMG.ANY) then
            goto continue
        end

        --If the target is in a CC that breaks from damage, skip it
        if target:is_cc_weak() then
            goto continue
        end

        --Execute our defensives
        if defensives(me, target) then
            return
        end

        --Execute artifact powers (Remix)
        if artifact_powers(me, target, is_aoe) then
            return
        end

        --Damage rotation
        if is_aoe then
            --If we are in aoe lets call our AoE handler
            if aoe(me, target, enemies, enemies_melee) then
                return
            end
        else
            --If we are single target lets call our single target handler
            if single_target(me, target) then
                return
            end
        end

        --Our continue label to jump to the next target if previous checks fail
        ::continue::
    end
end)
```

### Update Loop Flow

The update loop follows a structured flow with multiple validation layers:

#### 1. Early Exit Checks

```lua
--Check if the rotation is enabled
if not menu:is_enabled() then
    return
end

--Get the local player
local me = izi.me()

--Check if the local player exists and is valid
if not (me and me.is_valid and me:is_valid()) then
    return
end
```

**Purpose:**

- Prevents rotation from running when plugin is disabled
- Ensures player exists (handles loading screens, disconnects, etc.)
- Early exits save CPU cycles when rotation shouldn't run

#### 2. Resource Caching

```lua
--Update our commonly used values
ping_ms = core.get_ping()
ping_sec = ping_ms / 1000
game_time_ms = izi.now_game_time_ms()
gcd = me:gcd()
runic_power = me:get_power(enums.power_type.RUNICPOWER)
runes = me:get_power(enums.power_type.RUNES)
```

**Performance Optimization:**

- Cache values once per tick instead of multiple calls throughout rotation
- Reduces API overhead significantly
- Ensures consistent values across entire rotation logic

#### 3. State Tracking

```lua
--Update the local player's last movement time
if me:is_moving() then
    last_movement_time_ms = game_time_ms
end

--Update the local player's last mounted time
if me:is_mounted() then
    last_mounted_time_ms = game_time_ms
    return
end
```

**Movement Tracking:**

- Tracks when player last moved for Remix Time logic
- Only cast certain abilities after standing still for configured duration

**Mount Handling:**

- Returns immediately if mounted (can't cast while mounted)
- Tracks dismount time to delay actions after dismounting

#### 4. Dismount Delay

```lua
--Delay actions after dismounting
local time_dismounted_ms = time_since_last_dismount_ms()

if time_dismounted_ms < DISMOUNT_DELAY_MS then
    return
end
```

**Why This Matters:**

- Prevents trying to summon pet immediately after dismounting
- Avoids issues with phasing/loading after dismounting
- `DISMOUNT_DELAY_MS` constant set to 1000ms (1 second)

#### 5. Rotation Toggle Check

```lua
--If the rotation is paused let's return early
if not menu:is_rotation_enabled() then
    return
end
```

**Purpose:**

- Respects rotation keybind toggle state
- Allows plugin to be enabled but rotation temporarily disabled
- Useful for manual control during specific mechanics

#### 6. Enemy Detection

```lua
--Get enemies that are in combat within 30 yards
local enemies = me:get_enemies_in_range(30)

--Get enemies within melee range
local enemies_melee = me:get_enemies_in_melee_range(8)

--Check if we are in an AoE scenario
local is_aoe = #enemies > 1
```

**Enemy Lists:**

- `enemies` - All enemies within 30 yards (for ranged abilities, disease spreading)
- `enemies_melee` - Enemies within 8 yards (for melee abilities like Soul Reaper)
- `is_aoe` - Simple check if multiple enemies present

**AoE Detection:**

- Single boolean flag determines rotation branch
- Simplifies decision-making throughout rotation
- `#enemies > 1` means any multi-target scenario uses AoE rotation

#### 7. Utility Execution

```lua
--Execute our utils
if utility(me) then
    return
end
```

**Utility Function:**

- Handles non-combat actions (pet summoning, Remix Time)
- Runs before damage rotation to ensure prerequisites met
- Returns true if an action was taken, causing early exit

#### 8. Target Selection Loop

```lua
--Get target selector targets
local targets = izi.get_ts_targets()

--Iterate over targets and run rotation logic on each one
for i = 1, #targets do
    local target = targets[i]
```

**Why Loop Through Targets:**

- Target selector provides prioritized list of potential targets
- If primary target can't be attacked, try next target
- Ensures rotation always finds something to cast on

**Target Validation:**

```lua
--Check if the target is valid otherwise skip it
if not (target and target.is_valid and target:is_valid()) then
    goto continue
end

--If the target is immune to any damage, skip it
if target:is_damage_immune(target.DMG.ANY) then
    goto continue
end

--If the target is in a CC that breaks from damage, skip it
if target:is_cc_weak() then
    goto continue
end
```

**Three-Layer Validation:**

1. **Validity Check** - Ensure target exists and is still in world
2. **Immunity Check** - Skip targets with damage immunity (e.g., Divine Shield)
3. **CC Check** - Avoid breaking crowd control effects

#### 9. Rotation Priority Execution

```lua
--Execute our defensives
if defensives(me, target) then
    return
end

--Execute artifact powers (Remix)
if artifact_powers(me, target, is_aoe) then
    return
end

--Damage rotation
if is_aoe then
    --If we are in aoe lets call our AoE handler
    if aoe(me, target, enemies, enemies_melee) then
        return
    end
else
    --If we are single target lets call our single target handler
    if single_target(me, target) then
        return
    end
end
```

**Execution Order:**

1. **Defensives** - Highest priority, can interrupt GCD
2. **Artifact Powers** - Twisted Crusade Felspike before buff expires
3. **Damage Rotation** - Either AoE or single target based on enemy count

**Early Return Pattern:**

- Each function returns `true` if a spell was cast
- Main loop exits immediately after successful cast
- Next game tick re-evaluates with updated state

#### 10. Target Fallback

```lua
--Our continue label to jump to the next target if previous checks fail
::continue::
```

**Fallback Mechanism:**

- If nothing was cast on current target, loop continues to next target
- Ensures rotation doesn't get stuck on uncastable targets
- Maximizes uptime by always finding a valid target

### Key Design Patterns

#### Pattern 1: Early Exit Strategy

```lua
if not condition then
    return
end
```

**Benefits:**

- Reduces nesting depth (avoids "pyramid of doom")
- Saves CPU by exiting as early as possible
- Makes code easier to read and maintain

#### Pattern 2: Single Responsibility Functions

```lua
if utility(me) then return end
if defensives(me, target) then return end
if artifact_powers(me, target, is_aoe) then return end
```

**Benefits:**

- Each function handles one aspect of rotation
- Easy to disable/modify specific behaviors
- Testable in isolation

#### Pattern 3: Cached State

```lua
local ping_ms = core.get_ping()
local runic_power = me:get_power(enums.power_type.RUNICPOWER)
```

**Benefits:**

- Single API call per tick instead of multiple
- Consistent values throughout rotation
- Significant performance improvement

#### Pattern 4: Priority-Based Execution

```lua
if most_important_action() then return end
if important_action() then return end
if filler_action() then return end
```

**Benefits:**

- Clear priority hierarchy
- First successful cast exits loop
- Simple to reorder priorities

### Common Pitfalls to Avoid

> [!WARNING]
> Cache values like `get_power()`, `get_ping()`, `gcd()` at the start of the update loop. Calling them inside every rotation function wastes CPU cycles.

> [!WARNING]
> Always validate targets before attempting to cast. Invalid targets, immune targets, and CC'd targets should be skipped to avoid wasted casts.

> [!TIP]
> Structure your code with early returns for invalid states. This keeps code readable and performant.

> [!INFO]
> [`izi.get_ts_targets()`](/dev/libraries/izi#iziget_ts_targets) returns targets in priority order. Loop through them to ensure you always have a valid target to attack.

## Menu System Architecture

### Validator Pattern

The menu uses a validator pattern for clean rotation logic:

```lua
--Create validator function
menu.validate_apocalypse = menu.new_validator_fn(
    menu.APOCALYPSE_CHECK,      -- Checkbox: is feature enabled?
    menu.APOCALYPSE_MIN_TTD     -- Slider: minimum TTD threshold
)

--Use in rotation
local ttd = target:time_to_die()
if menu.validate_apocalypse(ttd) then
    -- Checkbox is enabled AND ttd >= threshold
    if SPELLS.APOCALYPSE:cast_safe() then
        return true
    end
end
```

**Validator Types:**

- `"min"` - Value must be >= slider (default)
- `"max"` - Value must be <= slider
- `"equal"` - Value must == slider

This pattern keeps menu configuration separate from rotation logic.

### Control Panel Integration

The control panel displays the rotation toggle with keybind:

```lua
core.register_on_render_control_panel_callback(function()
    local rotation_toggle_key = M.ROTATION_KEYBIND:get_key_code()
    local rotation_toggle =
    {
        name = string.format("[Celestial] Enabled (%s)", key_helper:get_key_name(rotation_toggle_key)),
        keybind = M.ROTATION_KEYBIND
    }

    local control_panel_elements = {}

    if M:is_enabled() then
        control_panel_utility:insert_toggle_(control_panel_elements, rotation_toggle.name, rotation_toggle.keybind, false)
    end

    return control_panel_elements
end)
```

Users can click the toggle or use the keybind to enable/disable rotation.

## Performance Optimizations

### Early Returns

The rotation uses early returns throughout to avoid unnecessary processing:

```lua
--Don't process if plugin is disabled
if not menu:is_enabled() then
    return
end

--Don't process if player is invalid
if not (me and me.is_valid and me:is_valid()) then
    return
end

--Don't process if just dismounted
if time_since_last_dismount_ms() < DISMOUNT_DELAY_MS then
    return
end
```

### Conditional Cooldown Checks

Expensive operations like [`time_to_die()`](/dev/libraries/izi/izi-object-extensions#time_to_die) are gated behind cooldown checks:

```lua
--Only check TTD if spell is actually off cooldown
if SPELLS.SOUL_REAPER:cooldown_up() then
    if should_soul_reaper(target) then
        if SPELLS.SOUL_REAPER:cast_safe(target) then
            return true
        end
    end
end
```

This avoids calling health prediction when the spell couldn't be cast anyway.

### Target Validation

Invalid targets are skipped early in the loop:

```lua
for i = 1, #targets do
    local target = targets[i]

    if not (target and target.is_valid and target:is_valid()) then
        goto continue
    end

    if target:is_damage_immune(target.DMG.ANY) then
        goto continue
    end

    if target:is_cc_weak() then
        goto continue
    end

    --Rotation logic here...

    ::continue::
end
```

## Customization

### Adjusting Default TTD Thresholds

Modify constants at the top of menu.lua:

```lua
local TTD_DEFAULT = 16      -- Change default single target TTD
local TTD_DEFAULT_AOE = 20  -- Change default AoE TTD
```

Or adjust in-game via the menu sliders.

### Disabling Specific Abilities By Default

Uncheck abilities in the menu, or modify defaults in menu.lua:

```lua
APOCALYPSE_CHECK = m.checkbox(false, id("apocalypse_toggle")), -- Disabled by default
```

## Tips & Best Practices

> [!TIP]
> The rotation sequences cooldowns (Apocalypse → Unholy Assault) to maximize damage during burst windows. Pay attention to minion tracking to ensure optimal timing.

> [!INFO]
> Time To Die validation prevents wasting cooldowns on targets that will die quickly. Adjust thresholds based on your content (lower for dungeons, higher for raids).

> [!WARNING]
> Always maintain Virulent Plague uptime. The rotation uses pandemic thresholds (30% of duration) to optimize refreshing without wasting GCDs.

> [!TIP]
> Health forecasting predicts future HP based on incoming damage. This allows proactive defensive usage before you're in danger, improving survivability.

> [!INFO]
> The rotation manages Runic Power and Runes carefully, spending RP before capping and maintaining enough Runes for important abilities like Festering Strike.

## Related Documentation

- [IZI SDK](/dev/libraries/izi) - IZI SDK overview
- [IZI Spell](/dev/libraries/izi/izi-spells) - `izi_spell` object and methods
- [IZI Game Object Extensions](/dev/libraries/izi/izi-object-extensions) - [`game_object`](/dev/api/game-object) extensions
- [IZI spread_dot](/dev/libraries/izi#izispread_dot) - DoT spreading helper
- [IZI get_time_to_die_global](/dev/libraries/izi#iziget_time_to_die_global) - AoE TTD calculation

## Conclusion

The Celestial Unholy Death Knight rotation showcases advanced IZI SDK features that go beyond basic rotation development:

**Core Features:**

- **Comprehensive cooldown management** with TTD validation for both single target and AoE
- **Intelligent defensive handling** with health forecasting and damage type detection
- **Artifact power integration** for WoW Remix (Twisted Crusade, Remix Time)
- **DoT spreading** with [`izi.spread_dot()`](/dev/libraries/izi#izispread_dot) for efficient multi-target disease application
- **Smart target selection** with [`cast_target_if()`](/dev/libraries/izi/izi-spells#cast_target_if) and filter functions
- **Resource optimization** managing Runic Power and Runes for maximum damage output
- **Flexible menu system** with validators, control panel integration, and user-configurable thresholds

**Advanced Techniques:**

- Minion tracking for cooldown sequencing
- Pandemic-aware disease management
- Movement and mount state tracking
- Performance-optimized resource caching
- Priority-based execution with early returns
- Target fallback mechanism for maximum uptime

This example demonstrates production-ready rotation development with the IZI SDK, suitable for high-level mythic+ and raid content. The code is well-structured, maintainable, and serves as a comprehensive template for building your own advanced rotations.

---

I hope you found this example helpful and educational! The IZI SDK combined with thoughtful architecture enables powerful, efficient rotations. Feel free to use this as a foundation for your own projects and adapt the patterns to your projects.

— Voltz