# Lua Object Manager

> Source: <https://docs.project-sylvanas.net/dev/api/object-manager>

## Introduction 📃

The Lua Object Manager module is your gateway to interacting with game objects in your scripts. While the core engine provides fundamental functions, we've developed additional tools to enhance your scripting capabilities and optimize performance. Let's explore how to leverage these features effectively!

## Raw Functions 💣

### Local Player

### `core.object_manager.get_local_player() -> game_object`

- Retrieves the local player [game_object](/dev/api/game-object) .
- Returns: `game_object` - The local player [game_object](/dev/api/game-object) .

> [!TIP]
> Always verify the local player object before use. Implement a guard clause in your callbacks to prevent errors and ensure safe execution. Remember, the local_player is a pointer (8 bytes) to the game memory object, which can become invalid. Check its existence before each use.
>
> Example of a guard clause:
>
> ```lua
> local function on_update()
>     local local_player = core.object_manager.get_local_player()
>     if not local_player then
>         return -- Exit early if local_player is invalid
>     end
>
>     -- Your logic here, safely using local_player
> end
> ```
>
> This approach maintains code stability and prevents accessing invalid memory addresses.

### All Objects

### `core.object_manager.get_all_objects() -> table`

- Retrieves all game objects.
- Returns: `table` - A table containing all [game_objects](/dev/api/game-object) .

> [!WARNING]
> Use `get_all_objects()` and `get_visible_objects()` judiciously. These functions return a comprehensive list, including non-unit entities, which can be computationally expensive to process every frame.
>
> For most scenarios, our custom `unit_helper` library (discussed later) is recommended for optimized performance and more relevant object lists.

> [!TIP]
> New to scripting? Visualize objects with this example:
>
> ```lua
> ---@type color
> local color = require("common/color")
>
> core.register_on_render_callback(function()
>     local all_objects = core.object_manager.get_all_objects()
>     for _, object in ipairs(all_objects) do
>         local current_object_position = object:get_position()
>         core.graphics.circle_3d(current_object_position, 2.0, color.cyan(100), 30.0, 1.5)
>     end
> end)
> ```
>
> Code breakdown:
>
> 1. Import the `color` module for color creation.
> 2. Register a function for frame rendering.
> 3. Retrieve all game objects.
> 4. Iterate through each object.
> 5. Get each object's position (returns a `vec3` ).
> 6. Draw a 3D circle at each position:
>   - Center: Object's position
>   - Radius: 2.0 yards
>   - Color: Cyan (alpha 100)
>   - Thickness: 30.0 units
>   - Fade factor: 1.5 (higher value = faster fade)
>
> This visualization helps you grasp the scope of objects returned by `get_all_objects()`.

![](https://downloads.project-sylvanas.net/1726763795067-docs_object_manager_all_circles.jpg)

> [!TIP]
> Want to dive deeper? Try accessing more object properties:
>
> ```lua
> ---@type enums
> local enums = require("common/enums")
>
> core.register_on_render_callback(function()
>     local all_objects = core.object_manager.get_all_objects()
>     for _, object in ipairs(all_objects) do
>         local name = object:get_name()
>         local health = object:get_health()
>         local max_health = object:get_max_health()
>         local position = object:get_position()
>         local class_id = object:get_class()
>
>         -- Convert class_id to a readable string
>         local class_name = "Unknown"
>         if class_id == enums.class_id.WARRIOR then
>             class_name = "Warrior"
>         elseif class_id == enums.class_id.WARLOCK then
>             class_name = "Warlock"
>         -- Add more class checks as needed
>         end
>
>         -- Log the information
>         core.log(string.format("Name: %s, Class: %s, Health: %d/%d, Position: (%.2f, %.2f, %.2f)",
>                             name, class_name, health, max_health, position.x, position.y, position.z))
>     end
> end)
> ```
>
> This example showcases how to access various game object properties and use the `enums` module for interpreting class IDs. Feel free to expand on this for more complex visualizations or analysis tools!

### Visible Objects

> [!WARNING]
> ---- Not currently implemented ----

### `core.object_manager.get_visible_objects() -> table`

- Retrieves all visible game objects.
- Returns: `table` - A table containing all visible [game_objects](/dev/api/game-object) .

### Object From GUID

### `core.object_manager.get_object_from_guid(guid: string) -> game_object | nil`

- Retrieves the game object for a **GUID string or a WoW unit token** , or `nil` if the client does not hold it right now.
- Parameters: `guid` ( `string` ) - A GUID string as `game_object:get_guid()` returns it ( `"Creature-0-1-0-0-3124-00000019EB"` ), or a unit token such as `"player"` or `"nameplate7"` .
- Returns: `game_object | nil` - The matching [game_object](/dev/api/game-object) , or `nil` if nothing matches.

> [!WARNING]
> Cores built before 2026-09-01 accepted a unit token only, and a `game_object:get_guid()` string returned `nil` on every game version. Current cores take both, on every game version: a GUID reaches any object the client holds, tokened or not, and a string that is not a GUID is resolved as a token: `"player"`, `"target"`, `"focus"`, `"pet"`, `"party1"`, `"raid23"`, `"boss2"`, `"arena1"`, `"nameplate7"`.
>
> The token form matters because game event payloads speak in tokens rather than GUIDs. [`UNIT_AURA`](/dev/api/events) hands you `"nameplate7"`, and this is the only function that turns an **arbitrary** token into an object: `get_mouse_over_object`, `core.input.get_focus` and `get_arena_target` are the same native call with a fixed token, and there is no accessor for `"nameplate7"` or `"raid23"`.
>
> A token is only true for the instant you read it. The client recycles nameplate, party and raid tokens onto different units, so resolve to a GUID and store the GUID, never the token.
>
> **Forever:** the game scrambles creature and other world GUIDs before scripts see them. Before core 2.135 this returned `nil` for every creature GUID on Forever, and `get_guid()` did not match what the combat log shows. Both now match the game's own strings. A world GUID saved in an earlier session no longer resolves on Forever.
>
> ```lua
> -- Turn a unit token from a game event into a stable identity.
> local object = core.object_manager.get_object_from_guid("nameplate7")
> local guid = object and object:get_guid() or nil
> ```

## Unit Helper - Optimized Object Retrieval 🚀

To address performance concerns and provide targeted functionality, we've developed the `unit_helper` library. This toolkit offers optimized methods for retrieving specific types of game objects, utilizing caching and filtering for improved performance.

> [!NOTE]
> To use the `unit_helper` module, include it in your script:
>
> ```lua
> ---@type unit_helper
> local unit_helper = require("common/utility/unit_helper")
> ```

### Enemies Around

### `unit_helper:get_enemy_list_around(point: vec3, range: number, include_out_of_combat: boolean, include_blacklist: boolean) -> table`

- Retrieves a list of enemy units around a specified point.
- Returns: `table` - A table containing [enemy game_objects](/dev/api/game-object) .

Parameters:

- `point` : [vec3](/dev/api/vector-3) - The center point to search around.
- `range` : number - The radius (in yards) to search within.
- `include_out_of_combat` : boolean - If true, includes units not in combat.
- `include_blacklist` : boolean - If true, includes special units (use with caution).

Example usage:

```lua
---@type color
local color = require("common/color")

---@type unit_helper
local unit_helper = require("common/utility/unit_helper")

core.register_on_render_callback(function()
    local local_player = core.object_manager.get_local_player()
    if not local_player then
        return
    end

    local local_player_position = local_player:get_position()
    local range_to_check = 40.0 -- yards
    local enemies_around = unit_helper:get_enemy_list_around(local_player_position, range_to_check, false, false)

    for _, enemy in ipairs(enemies_around) do
        local enemy_position = enemy:get_position()
        core.graphics.circle_3d(enemy_position, 2.0, color.red(255), 30.0, 1.2)
    end
end)
```

This code visualizes enemies around the player with red circles, demonstrating the focused nature of `unit_helper` functions.

![](https://downloads.project-sylvanas.net/1726764094321-docs_object_manager_unit_helper_circles.jpg)

### Allies Around

### `unit_helper:get_ally_list_around(point: vec3, range: number, players_only: boolean, party_only: boolean) -> table`

- Retrieves a list of allied units around a specified point.
- Returns: `table` - A table containing [allied game_objects](/dev/api/game-object) .

Parameters:

- `point` : [vec3](/dev/api/vector-3) - The center point to search around.
- `range` : number - The radius (in yards) to search within.
- `players_only` : boolean - If true, only includes player characters.
- `party_only` : boolean - If true, only includes party members.

Example usage:

```lua
---@type color
local color = require("common/color")

---@type unit_helper
local unit_helper = require("common/utility/unit_helper")

local function my_on_render()
    local local_player = core.object_manager.get_local_player()
    if not local_player then
        return
    end

    local range_to_check = 40.0 -- yards
    local green_color = color.new(0, 255, 0, 230)
    local player_position = local_player:get_position()
    local allies_around = unit_helper:get_ally_list_around(player_position, range_to_check, false, false)

    for _, ally in ipairs(allies_around) do
        local ally_position = ally:get_position()
        core.graphics.circle_3d(ally_position, 2.0, green_color, 30.0, 1.5)
    end
end

core.register_on_render_callback(my_on_render)
```

Let's break down the optimizations in this code:

1. **Module Imports** : We import necessary modules for color and unit helper functions.
2. **Named Function** : We use a named function `my_on_render()` for better readability and debugging.
3. **Early Exit** : We implement a guard clause for the local player check.
4. **Pre-loop Calculations** : We define constants and calculate values outside the loop for efficiency.
5. **Optimized Retrieval** : We use `unit_helper:get_ally_list_around()` for targeted, efficient object retrieval.
6. **Efficient Looping** : We use `ipairs()` for optimal iteration.

![](https://downloads.project-sylvanas.net/1726764402678-docs_object_manager_unit_helper_ally_circles.jpg)

## Performance Considerations 🏎️

This code showcases several key performance optimizations:

1. **Color Calculation** : Pre-calculating the color object reduces redundant calculations.
2. **Player Position** : Calculating `player_position` once avoids repeated calls.
3. **Targeted Retrieval** : Using `unit_helper` functions significantly reduces processed objects.
4. **Efficient Looping** : Proper use of `ipairs()` ensures optimal iteration.

## Optimization Principles 📊

Key principles demonstrated:

1. **Minimize Repetitive Calculations** : Perform constant calculations outside loops.
2. **Use Specialized Functions** : Employ targeted functions for efficient processing.
3. **Early Exit** : Use guard clauses to avoid unnecessary computations.
4. **Readability and Maintainability** : Balance optimizations with code clarity.

> [!TIP]
> The `unit_helper` functions not only boost performance but also provide more relevant data for most scripting scenarios. By using these functions, you can create more efficient and focused scripts, reducing unnecessary iterations and checks.

Remember, effective scripting often involves balancing raw data access with optimized helper functions. As you develop more complex scripts, consider the performance implications of your choices and leverage the `unit_helper` library when appropriate. Happy scripting! 🚀

## More Object Manager Functions

### Mouse over Oject

### `object_manager.get_mouse_over_object() -> game_object`

Returns the object that you are hovering with your mouse.

### `get_arena_target(index: integer)`

Retrieves the game object associated with the given arena frame index. Returns `nil` if not in an arena.

Parameters:

- **`index`** ( *integer* ) — The arena frame index.

Returns: *game_object | nil* — The player corresponding to the arena frame, or `nil` if not available.

---

### `get_arena_frames()`

Retrieves the list of game objects representing all arena frames.

Returns: *game_object[]* — A list of all arena frame objects.

---

### `core.object_manager.get_party_frames`

Syntax

```lua
core.object_manager.get_party_frames() -> game_object[]
```

Returns

- `game_object[]` : An array of party frame game objects for `party1` through `party4` , excluding the local player.

Description

Returns party unit frame objects in frame order. The local player is not included.

> [!WARNING]
> This returns `game_object` values, and a `game_object` only exists for a unit the client has actually loaded. Party members outside that range have no object to return, so they are **missing from this array entirely**.
>
> That is by design and it cannot be worked around here: there is nothing to hand back. It bites hardest out in the world, where a party member can be on the far side of the map, or in another zone, and will simply never appear. Inside a dungeon the whole group is always close enough to be loaded, which is why this function looks like it only works in instances.
>
> The array is also **compact, not indexed by party slot**. If `party2` is out of range, `party3` moves into index `2`. Do not treat the array index as the party number.
>
> When you need the full roster, the party slot number, or anything about a member you cannot see, use `core.object_manager.get_party_members` instead. It answers for out-of-range members and carries the object when there is one.

**Example Usage**

```lua
local party_members = core.object_manager.get_party_frames()
for i, party_member in ipairs(party_members) do
    core.log("Party " .. i .. ": " .. party_member:get_name())
end
```

---

### `core.object_manager.get_party_members`

Syntax

```lua
core.object_manager.get_party_members() -> party_member[]
```

Returns

- `party_member[]` : One entry per occupied party slot, in slot order, excluding the local player.

Each entry contains:

| Field | Type | Description |
| --- | --- | --- |
| `index` | `integer` | Party slot, `1` to `4`, matching the `party1`..`party4` unit tokens |
| `unit_token` | `string` | The unit token for this slot, for example `"party2"` |
| `name` | `string` | Member name, without the realm suffix |
| `realm` | `string` | Realm name for a cross-realm member, empty string when same realm |
| `is_online` | `boolean` | `false` while the member is disconnected |
| `is_visible` | `boolean` | Whether the client considers the member within visible range |
| `role` | `string` | Assigned group role: `"TANK"`, `"HEALER"`, `"DAMAGER"` or `"NONE"` |
| `class_name` | `string` | Localized class name, for example `"Paladin"` on an English client |
| `class_file` | `string` | Locale-independent class token, for example `"PALADIN"` |
| `class_id` | `integer` | Numeric class id |
| `object` | `game_object` or `nil` | The member's game object, `nil` when out of object range |
| `is_on_taxi` | `boolean` or `nil` | Whether the member is on a flight path. Only in range: `nil` when the member is not visible (core 2.177+) |
| `map_id` | `integer` or `nil` | UiMap the member is on, the world map's party dot. Works out of range, `nil` when unknown (core 2.177+) |
| `map_x` | `number` or `nil` | Position on `map_id`, `0` to `1`. `nil` when the game hides it (core 2.177+) |
| `map_y` | `number` or `nil` | Position on `map_id`, `0` to `1`. `nil` when the game hides it (core 2.177+) |

Description

Returns the full party roster, one entry per occupied slot.

Unlike `get_party_frames`, this answers for members the client holds no object for. Everything except `object` comes from the unit token rather than from a loaded object, so a member an entire zone away still reports a name, a slot number, a role and a class. Only `object` requires the member to be in object range, and it is `nil` otherwise.

`map_id`, `map_x` and `map_y` are the member's dot on the world map, so they answer at any distance, without an object. Turn them into world coordinates with [`core.game_ui.get_world_pos_from_map_pos`](/dev/api/game-ui). The game hides the position inside instances, and they are `nil` then. `is_on_taxi` is different: the game reads it from the loaded member, so it is `nil` out of range (unknown, not "not flying"). The four fields need core 2.177 or later; older cores leave them out (`nil`).

Use `class_file` when branching on class. `class_name` is localized and will differ on a French or Chinese client, so comparing against it breaks for those users.

> [!NOTE]
> `role` is `"NONE"` on clients with no role system, and for any member who has not been assigned one.

**Example Usage**

```lua
for _, member in ipairs(core.object_manager.get_party_members()) do
    if member.object then
        core.log(member.index .. ": " .. member.name .. " (" .. member.role .. ") at "
            .. tostring(member.object:get_position()))
    else
        core.log(member.index .. ": " .. member.name .. " (" .. member.role .. ", "
            .. member.class_file .. ") out of range")
    end
end

-- Where is an out-of-range member, and are they flying?
for _, member in ipairs(core.object_manager.get_party_members()) do
    if not member.object and member.map_x then
        local world = core.game_ui.get_world_pos_from_map_pos(member.map_id,
            vec2.new(member.map_x, member.map_y))
        core.log(member.name .. " at " .. tostring(world))
    end
end
```

Healing only the party members you can actually reach, while still knowing who exists:

```lua
for _, member in ipairs(core.object_manager.get_party_members()) do
    if member.is_online and member.object then
        local unit = member.object
        if unit:get_health() / unit:get_max_health() < 0.5 then
            -- unit is a real game_object, safe to act on
        end
    end
end
```

---

### `core.object_manager.get_arena_opponent_spec`

Syntax

```lua
core.object_manager.get_arena_opponent_spec(index: integer) -> integer
```

**Parameters**

- `index` : `integer` - The arena opponent index.

Returns

- `integer` : The specialization ID of the arena opponent. Returns 0 if unavailable.

Description

Returns the specialization ID of an arena opponent at the given index. Returns 0 if not in an arena or the opponent data is unavailable.

**Example Usage**

```lua
local spec_id = core.object_manager.get_arena_opponent_spec(1)
if spec_id ~= 0 then
    core.log("Opponent 1 spec ID: " .. spec_id)
end
```

---

### `core.object_manager.get_boss_frames`

Syntax

```lua
core.object_manager.get_boss_frames() -> game_object[]
```

Returns

- `game_object[]` : An array of boss game objects from boss unit frames.

Description

Returns the boss game objects from the boss unit frames.

**Example Usage**

```lua
local bosses = core.object_manager.get_boss_frames()
for i, boss in ipairs(bosses) do
    core.log("Boss " .. i .. ": " .. boss:get_name())
end
```

---

### `core.object_manager.get_boss_count`

Syntax

```lua
core.object_manager.get_boss_count() -> integer
```

Returns

- `integer` : The number of active boss unit frames (0-8).

Description

Returns the number of active boss unit frames, ranging from 0 to 8.

**Example Usage**

```lua
local boss_count = core.object_manager.get_boss_count()
core.log("Active bosses: " .. boss_count)
```

---

### `core.object_manager.get_all_missiles`

Syntax

```lua
core.object_manager.get_all_missiles() -> missile[] | nil
```

Returns

- `missile[] | nil` : An array of missile tables, or `nil` if there are no in-flight missiles.

Each missile table contains:

| Field | Type | Description |
| --- | --- | --- |
| `source` | `game_object \| nil` | The source object that fired the missile |
| `caster` | `game_object \| nil` | The caster object |
| `target` | `game_object \| nil` | The target object |
| `source_position` | `vec3` | The position where the missile was fired from |
| `current_position` | `vec3` | The missile's current position in the world |
| `impact_position` | `vec3` | The missile's destination/impact position |
| `spell_id` | `integer` | The spell ID of the missile |
| `speed` | `number` | The missile's travel speed |

Description

Returns all in-flight spell missiles (projectiles) currently in the world. This includes any visible spell projectile traveling from a caster to a target.

**Example Usage**

```lua
local missiles = core.object_manager.get_all_missiles()
if missiles then
    for _, m in ipairs(missiles) do
        local caster_name = m.caster and m.caster:get_name() or "unknown"
        core.log("Spell " .. m.spell_id .. " from " .. caster_name .. " at speed " .. m.speed)
        core.graphics.circle_3d(m.current_position, 0.5, color.red(200), 20, 1.0)
    end
end
```