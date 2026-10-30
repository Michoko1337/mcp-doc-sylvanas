# World Functions

> Source: <https://docs.project-sylvanas.net/dev/api/world>

## Overview

The `core.world` module exposes world-level state queries, including flying availability, map encounter positions, active Mythic+ keystone information, the active challenge run and its completion result, and raid world markers.

---

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
    core.log("Regular flying is available here")
end
```

---

### `core.world.is_advanced_flyable_area`

Syntax

```lua
core.world.is_advanced_flyable_area() -> boolean
```

Returns

- `boolean` : `true` if the current area allows advanced flying, `false` otherwise.

Description

Returns whether the current area allows advanced dynamic flying or skyriding.

> [!WARNING]
> Always `false` on every other game version, Forever included.

**Example Usage**

```lua
if core.world.is_advanced_flyable_area() then
    core.log("Advanced flying is available here")
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

- `encounter_info[]` : An array of encounter info tables.

Each encounter table contains:

| Field | Type | Description |
| --- | --- | --- |
| `encounter_id` | `integer` | The encounter ID |
| `map_x` | `number` | The normalized X position on the map |
| `map_y` | `number` | The normalized Y position on the map |

Description

Returns encounter data for the specified UI map ID. Each entry contains the encounter ID and its normalized map position.

> [!WARNING]
> Always returns an empty table on the private-server clients (Vanilla 1.14 / TBC 2.5.3).

> [!NOTE]
> Many classic-family dungeons (Classic Era, TBC Classic and Forever, for example Forever's Excavation Site: Wetlands) have no UI map of their own, so there is no `ui_map_id` to pass. [`core.game_ui.get_map_at_position`](/dev/api/game-ui) answers `nil` inside them, and the game itself shows the outdoor zone. Use `core.world.get_encounters_for_instance` there.

**Example Usage**

```lua
local map_id = core.game_ui.get_current_map_id()
local encounters = core.world.get_encounters_on_map(map_id)

for _, encounter in ipairs(encounters) do
    core.log(string.format(
        "Encounter %d at %.2f, %.2f",
        encounter.encounter_id,
        encounter.map_x,
        encounter.map_y
    ))
end
```

---

### `core.world.get_encounters_for_instance`

Syntax

```lua
core.world.get_encounters_for_instance(instance_map_id?: integer) -> instance_encounters
```

**Parameters**

- `instance_map_id` (optional): `integer` - The instance map id, as [`core.get_instance_id`](/dev/api/core#coreget_instance_id) returns it. Omit it, or pass `0` , for the instance you are in. This is **not** a UI map id.

Returns

- `instance_encounters` : A table with these fields:

| Field | Type | Description |
| --- | --- | --- |
| `journal_instance_id` | `integer` | The Encounter Journal's id for the instance, `0` when it has none |
| `encounters` | `table[]` | The bosses in journal order, empty when unknown. Fields below |

Each entry of `encounters` contains:

| Field | Type | Description |
| --- | --- | --- |
| `encounter_id` | `integer` | Journal encounter id, the same id space `get_encounters_on_map` answers |
| `dungeon_encounter_id` | `integer` | The id the `ENCOUNTER_START` and `ENCOUNTER_END` events carry for this boss |
| `name` | `string` | The boss name, localized |

Description

Returns the bosses of an instance from the Encounter Journal, by the instance's **map** id rather than a UI map. That makes it work inside dungeons that have no map of their own, where `get_encounters_on_map` has nothing to ask. Added in the core update of 2026-10-06.

`encounters` is empty and `journal_instance_id` is `0` when you are not in an instance, or when the game has no journal entry for it. Then nothing can list the bosses, and what remains is the `boss1` to `boss5` units and the `ENCOUNTER_START` event.

It is a separate function on purpose: `core.game_ui.get_map_at_position` and `get_encounters_on_map` answer exactly as before on the expansions where dungeons have maps.

> [!NOTE]
> This function is new and has not been confirmed in game in every classic dungeon yet. If it returns something unexpected there, report what you got.

**Example Usage**

```lua
local info = core.world.get_encounters_for_instance()
for _, boss in ipairs(info.encounters) do
    core.log(boss.name .. " " .. boss.dungeon_encounter_id)
end
```

---

### `core.world.get_active_keystone_info`

Syntax

```lua
core.world.get_active_keystone_info() -> active_keystone_info
```

Returns

- `active_keystone_info` : A table containing active Mythic+ keystone data. Returns an empty table when unavailable or when no active keystone exists.

The returned table contains:

| Field | Type | Description |
| --- | --- | --- |
| `level` | `integer` | The active keystone level |
| `was_charged` | `boolean` | Whether the active keystone was charged |
| `affix_ids` | `integer[]` | The active keystone affix IDs |

Description

Returns active Mythic+ keystone information from the client challenge mode API.

> [!WARNING]
> Always an empty table on Classic Era, TBC Classic, MoP Classic and Titan (China), which have no keystone API.

**Example Usage**

```lua
local keystone = core.world.get_active_keystone_info()

if keystone.level then
    core.log("Active keystone level: " .. keystone.level)

    for _, affix_id in ipairs(keystone.affix_ids) do
        core.log("Affix: " .. affix_id)
    end
end
```

---

### `core.world.get_active_challenge_map_id`

Syntax

```lua
core.world.get_active_challenge_map_id() -> integer|nil
```

Returns

- `integer|nil` : The challenge map ID of the Mythic+ run in progress, or `nil` when no run is active.

Description

Returns the challenge map ID of the Mythic+ run you are currently in. When no challenge mode is active, or the client has no challenge mode API, this returns `nil` rather than `0`, so a plain `if` check is safe.

> [!WARNING]
> MoP Classic has Challenge Mode dungeons, so this can answer there too. Classic Era and TBC Classic have no challenge modes and always return `nil`. Only the Retail behavior has been tested.

**Example Usage**

```lua
local challenge_map_id = core.world.get_active_challenge_map_id()

if challenge_map_id then
    core.log("Mythic+ run in progress, challenge map " .. challenge_map_id)
end
```

---

### `core.world.get_challenge_completion_info`

Syntax

```lua
core.world.get_challenge_completion_info() -> challenge_completion_info|nil
```

Returns

- `challenge_completion_info|nil` : A table describing the most recent Mythic+ completion, or `nil` when there is none.

The returned table contains:

| Field | Type | Description |
| --- | --- | --- |
| `map_challenge_mode_id` | `integer` | Challenge map ID of the completed run |
| `level` | `integer` | Keystone level of the run |
| `time` | `number` | Completion time in milliseconds |
| `on_time` | `boolean` | Whether the run finished within the timer |
| `keystone_upgrade_levels` | `integer` | How many levels the keystone was upgraded by |
| `practice_run` | `boolean` | Whether the run was a practice run |
| `old_overall_dungeon_score` | `integer` | Overall Mythic+ rating before the run |
| `new_overall_dungeon_score` | `integer` | Overall Mythic+ rating after the run |
| `is_map_record` | `boolean` | Whether the run set a new best for this map |
| `is_affix_record` | `boolean` | Whether the run set a new best for this affix week |
| `is_eligible_for_score` | `boolean` | Whether the run counted toward rating |
| `members` | `challenge_completion_member[]` | Party members of the run |

Each `members` entry is `{ guid, name }`, both strings. Either can be an empty string when the client did not supply it.

Description

Returns the client's most recent Mythic+ completion, with field names converted to snake_case. The natural moment to read it is the `CHALLENGE_MODE_COMPLETED` [game event](/dev/api/events), which fires with no arguments when a run finishes. Returns `nil` when the client has no completion info or no challenge mode API. A field the client leaves out reads `0` for numbers and `false` for flags, so check for `nil` on the table itself, not on its fields.

> [!WARNING]
> MoP Classic has Challenge Mode dungeons and fires `CHALLENGE_MODE_COMPLETED`, so this can answer there too. Classic Era and TBC Classic have no challenge modes and always return `nil`. Only the Retail behavior has been tested.

**Example Usage**

```lua
local info = core.world.get_challenge_completion_info()

if info then
    core.log(string.format(
        "+%d on map %d in %.1fs, %s, rating %d -> %d",
        info.level,
        info.map_challenge_mode_id,
        info.time / 1000,
        info.on_time and "timed" or "depleted",
        info.old_overall_dungeon_score,
        info.new_overall_dungeon_score
    ))

    for _, member in ipairs(info.members) do
        core.log("Member: " .. member.name)
    end
end
```

---

## Raid world markers

Raid world markers are the coloured flares placed on the ground, indices `1` through `8`. They are not the same thing as the target icons that ride on a unit: for those, see [`game_object:set_target_marker_index`](/dev/api/game-object) and [`game_object:get_target_marker_index`](/dev/api/game-object).

> [!CAUTION]
> World markers are a raid tool and the client enforces that. Placing or clearing one requires party or raid lead, or an assist. The API also only exists on Mists of Pandaria and later clients, so on older clients these calls do nothing and return `false` rather than raising an error. Always check the return value instead of assuming the marker landed.

---

### `core.world.place_raid_marker`

Syntax

```lua
core.world.place_raid_marker(index: integer, position?: vec3) -> boolean
```

**Parameters**

- `index` : `integer` - World marker index, `1` through `8` .
- `position` (Optional): [vec3](/dev/api/vector-3) - World position to place the marker at. When omitted, the marker is placed at the terrain point under the player's cursor.

Returns

- `boolean` : `true` when the client accepted the placement, `false` when it refused it or the API is unavailable.

Description

Places a raid world marker.

Called with only an index, this behaves exactly like clicking the marker button in the raid manager: the marker lands wherever the player's cursor is pointing at the terrain.

Called with a position, it places the marker at that world position, with no cursor involved. This is the form to use from a script, since it does not depend on where the player happens to be looking. The position is a normal world-space `vec3`, so a unit position or a computed point both work directly.

**Example Usage**

```lua
local me = core.object_manager.get_local_player()
if not me then return end

-- Drop marker 1 on the local player's own position.
core.world.place_raid_marker(1, me:get_position())

-- Drop marker 2 five yards in front of the player.
local ahead = me:get_position() + (me:get_direction() * 5)
core.world.place_raid_marker(2, ahead)
```

---

### `core.world.clear_raid_marker`

Syntax

```lua
core.world.clear_raid_marker(index?: integer) -> boolean
```

**Parameters**

- `index` (Optional): `integer` - World marker index `1` through `8` . Omit it, or pass `0` , to clear every world marker at once.

Returns

- `boolean` : `true` when the client accepted the call, `false` when it refused it or the API is unavailable.

Description

Removes a raid world marker from the world.

To clear a target icon on a unit instead of a flare on the ground, call `game_object:set_target_marker_index(0)` on that unit.

**Example Usage**

```lua
-- Clear just marker 1.
core.world.clear_raid_marker(1)

-- Clear all world markers.
core.world.clear_raid_marker()
```

---

### `core.world.is_raid_marker_active`

Syntax

```lua
core.world.is_raid_marker_active(index: integer) -> boolean
```

**Parameters**

- `index` : `integer` - World marker index, `1` through `8` .

Returns

- `boolean` : `true` when that world marker is currently placed in the world.

Description

Returns whether a raid world marker is currently placed. Useful for toggling a marker rather than placing it unconditionally.

**Example Usage**

```lua
local index = 1

if core.world.is_raid_marker_active(index) then
    core.world.clear_raid_marker(index)
else
    local me = core.object_manager.get_local_player()
    if me then
        core.world.place_raid_marker(index, me:get_position())
    end
end
```