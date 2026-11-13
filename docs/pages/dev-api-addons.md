# Addon Integration Functions

> Source: <https://docs.project-sylvanas.net/dev/api/addons>

## Overview

The `core.addons` module provides functions for interacting with popular World of Warcraft addons. Each addon has its own sub-namespace. Always check `is_loaded()` before calling other functions in an addon's namespace, as the addon may not be installed or active.

---

## Zygor

### `core.addons.zygor.is_loaded`

Syntax

```lua
core.addons.zygor.is_loaded() -> boolean
```

Returns

- `boolean` : Whether the Zygor addon is loaded and active.

Description

Returns whether the Zygor Guides addon is currently loaded. Always check this before calling other Zygor functions.

---

### `core.addons.zygor.has_current_step`

Syntax

```lua
core.addons.zygor.has_current_step() -> boolean
```

Returns

- `boolean` : Whether Zygor currently has an active step.

Description

Returns whether Zygor has a current guide step available. If no guide is active or the guide is complete, this returns false.

---

### `core.addons.zygor.get_current_step`

Syntax

```lua
core.addons.zygor.get_current_step() -> table
```

Returns

- `table` : A table with the following fields:

| Field | Type | Description |
| --- | --- | --- |
| `num` | `integer` | The step number. |
| `is_complete` | `boolean` | Whether this step is complete. |
| `goals` | `table[]` | An array of goals for this step (see below). |

Each entry in `goals` has:

| Field | Type | Description |
| --- | --- | --- |
| `action` | `string` | The goal action type. |
| `quest_id` | `integer` | The quest ID associated with this goal. |
| `npc_id` | `integer` | The NPC ID associated with this goal. |
| `target_id` | `integer` | The target ID associated with this goal. |
| `target` | `string` | The target name. |
| `npc` | `string` | The NPC name. |
| `is_complete` | `boolean` | Whether this goal is complete. |

Description

Returns the current Zygor guide step and its goals. Check `has_current_step()` before calling.

**Example Usage**

```lua
if core.addons.zygor.has_current_step() then
    local step = core.addons.zygor.get_current_step()
    for _, goal in ipairs(step.goals) do
        if not goal.is_complete then
            core.log("Next: " .. goal.action .. " -> " .. goal.target)
            break
        end
    end
end
```

---

### `core.addons.zygor.get_current_stickies`

Syntax

```lua
core.addons.zygor.get_current_stickies() -> table[]
```

Returns

- `table[]` : Array of sticky step tables.

Description

Returns an array of Zygor sticky steps. Sticky steps are persistent guide objectives that remain visible alongside the current step.

---

### `core.addons.zygor.get_objectives`

Syntax

```lua
core.addons.zygor.get_objectives() -> (number|string)[]
```

Returns

- `(number|string)[]` : Array of objective values. A number is an NPC or object ID, a string is an object name for a goal that has no numeric ID.

Description

Returns every objective target for the current Zygor step and all sticky steps, in step order.

- A goal with several targets (kill-from or avoid lists) contributes **every** target ID, the same set Zygor's on-screen action button targets.
- `talk` and `clicknpc` goals contribute their NPC ID.
- `click` goals that carry only a name contribute that name as a string.
- Any other goal contributes its single target ID.

The array is not de-duplicated: the same ID can appear more than once when the current step and a sticky step share a target. Returns an empty table when Zygor is not loaded or has no step.

**Example Usage**

```lua
local wanted_ids, wanted_names = {}, {}

for _, objective in ipairs(core.addons.zygor.get_objectives()) do
    if type(objective) == "number" then
        wanted_ids[objective] = true
    else
        wanted_names[objective] = true
    end
end
```

---

### `core.addons.zygor.get_current_waypoint`

Syntax

```lua
core.addons.zygor.get_current_waypoint() -> zygor_waypoint_info
```

Returns

- `zygor_waypoint_info` : A table with the following fields:
  - `map_id` : `integer` - The map ID of the waypoint.
  - `x` : `number` - The X coordinate (0-1 range).
  - `y` : `number` - The Y coordinate (0-1 range).
  - `dist` : `number` - Distance to the waypoint.
  - `title` : `string` - Waypoint title text.
  - `type` : `string` - Waypoint type identifier.
  - `goal_num` : `integer` - Associated goal number.
  - `is_manual` : `boolean` - Whether the waypoint was manually placed.

Description

Returns the current active Zygor waypoint with its location, distance, and metadata.

---

### `core.addons.zygor.get_step_waypoints`

Syntax

```lua
core.addons.zygor.get_step_waypoints() -> zygor_waypoint_info[]
```

Returns

- `zygor_waypoint_info[]` : Array of waypoint tables (same structure as `get_current_waypoint` ).

Description

Returns all waypoints associated with the current Zygor guide step. This may include multiple waypoints when a step has several objectives in different locations.

---

### `core.addons.zygor.skip_current_step`

Syntax

```lua
core.addons.zygor.skip_current_step() -> boolean
```

Returns

- `boolean` : `true` when Zygor moved on; `false` when it is not loaded, has no current guide or step, or is following a party sync leader (Zygor ignores skips then).

Description

Moves Zygor past its current step, like left-clicking the next-step arrow on its viewer. Use it for optional steps your bot cannot or should not finish. Zygor goes to the next valid step, or into the next guide at the end of one. Needs core 2.173 or later.

**Example Usage**

```lua
local zygor = core.addons.zygor
if zygor.skip_current_step and zygor.has_current_step() then
    zygor.skip_current_step()
end
```

---

## RestedXP

The `core.addons.rested_xp` namespace reads guide state from the RestedXP Guides addon. Check `is_loaded()` before using it. `get_current_step()` and `get_current_waypoint()` return zero-valued tables when there is no active guide step or waypoint.

> [!WARNING]
> RestedXP is released for Retail, Classic Era, TBC Classic, MoP Classic and Forever, but not for Titan (China). There `is_loaded()` is always `false` and the other functions return empty or zero-valued tables.

### `core.addons.rested_xp.is_loaded`

Syntax

```lua
core.addons.rested_xp.is_loaded() -> boolean
```

Returns

- `boolean` : Whether RestedXP Guides is loaded and available.

Description

Returns whether the RestedXP Guides addon is loaded. Use this before reading any RestedXP guide state.

**Example Usage**

```lua
if core.addons.rested_xp.is_loaded() then
    core.log("RestedXP Guides is available")
end
```

---

### `core.addons.rested_xp.has_current_step`

Syntax

```lua
core.addons.rested_xp.has_current_step() -> boolean
```

Returns

- `boolean` : Whether RestedXP currently has an active guide step.

Description

Returns whether RestedXP has a non-empty current guide. Use this to distinguish an active step from the zero-valued result returned by `get_current_step()` when no guide is active.

**Example Usage**

```lua
if core.addons.rested_xp.is_loaded() and core.addons.rested_xp.has_current_step() then
    core.log("RestedXP has an active step")
end
```

---

### `core.addons.rested_xp.get_current_step`

Syntax

```lua
core.addons.rested_xp.get_current_step() -> rested_xp_step_info
```

Returns

- `rested_xp_step_info` : The current step with these fields:
  - `num` : `integer` - Current RestedXP step index.
  - `is_complete` : `boolean` - Whether RestedXP marks the step complete.
  - `active` : `boolean` - Whether RestedXP has **activated** the step. An inactive step's turn-ins do not count and it has no waypoint of its own.
  - `requires` : `string` - The step's `#requires` label, `""` when none.
  - `requires_step` : `integer` - The step that label points at, `0` when none. The step stays inactive until that one is done.
  - `level` : `integer` - Minimum character level for the step.
  - `label` : `string` - This step's own `#label` , `""` when none.
  - `goals` : `rested_xp_goal_info[]` - The step goals.
- `rested_xp_goal_info` : Each goal contains `action` ( `string` ), `quest_id` ( `integer` ), `text` ( `string` ), `is_complete` ( `boolean` ), `text_only` ( `boolean` ), `ids` ( `integer[]` , quest ids for multi-quest goals and item ids for `.itemcount` ), and:

| Field | For | Meaning |
| --- | --- | --- |
| `objective` | `.complete` | The quest objective index the guide means, `0` otherwise |
| `objective_max` | `.complete` | Target count, `0` when unset |
| `reward` | `.turnin` | The reward choice the guide picks, `0` = none |
| `money` | `.money` | Threshold in **copper** |
| `money_greater_than` | `.money` | `true` = done once money reaches it, `false` = once below |
| `item_total` | `.itemcount` | The count compared against |
| `item_operator` | `.itemcount` | `-1` less, `0` equal, `1` more |
| `item_eq` | `.itemcount` | `true` for `<=` / `>=` |
| `units` | `.target`, `.mob`, `.unitscan` | The unit names (or npc ids) the step means |

Description

Returns the current RestedXP guide step. If no current step is available, `num` is `0` and `goals` is empty.

**Example Usage**

```lua
if core.addons.rested_xp.has_current_step() then
    local step = core.addons.rested_xp.get_current_step()
    core.log("RestedXP step " .. step.num)
end
```

---

### `core.addons.rested_xp.get_current_stickies`

Syntax

```lua
core.addons.rested_xp.get_current_stickies() -> rested_xp_step_info[]
```

Returns

- `rested_xp_step_info[]` : Sticky guide steps, using the same fields as `get_current_step()` .

Description

Returns RestedXP sticky steps that remain visible beside the current guide step. The current step itself is not included.

**Example Usage**

```lua
for _, step in ipairs(core.addons.rested_xp.get_current_stickies()) do
    core.log("Sticky step " .. step.num)
end
```

---

### `core.addons.rested_xp.get_objectives`

Syntax

```lua
core.addons.rested_xp.get_objectives(quest_id: integer) -> rested_xp_objective_info[]
```

**Parameters**

- `quest_id` : `integer` - The quest ID to inspect.

Returns

- `rested_xp_objective_info[]` : An array of objective tables. Each contains `text` ( `string` ), `type` ( `string` ), `num_required` ( `integer` ), `num_fulfilled` ( `integer` ), and `finished` ( `boolean` ).

Description

Returns the RestedXP objective progress for the supplied quest. It returns an empty array when RestedXP has no matching objective data.

**Example Usage**

```lua
local objectives = core.addons.rested_xp.get_objectives(783)
for _, objective in ipairs(objectives) do
    core.log(objective.text .. ": " .. objective.num_fulfilled .. "/" .. objective.num_required)
end
```

---

### `core.addons.rested_xp.get_current_waypoint`

Syntax

```lua
core.addons.rested_xp.get_current_waypoint() -> rested_xp_waypoint_info
```

Returns

- `rested_xp_waypoint_info` : The current waypoint with `map_id` ( `integer` ), `x` and `y` ( `number` , normalized to 0-1), `dist` ( `number` ), `title` ( `string` ), `type` ( `string` ), `goal_num` ( `integer` ), `is_manual` ( `boolean` ), and `wrong_continent` ( `boolean` ).

Description

Returns RestedXP's current arrow target. When `wrong_continent` is true, `dist` is not meaningful. If no waypoint is active, the returned fields use zero or empty values.

**Example Usage**

```lua
local waypoint = core.addons.rested_xp.get_current_waypoint()
if waypoint.map_id ~= 0 and not waypoint.wrong_continent then
    core.log(waypoint.title .. ": " .. waypoint.dist)
end
```

---

### `core.addons.rested_xp.get_step_waypoints`

Syntax

```lua
core.addons.rested_xp.get_step_waypoints() -> rested_xp_waypoint_info[]
```

Returns

- `rested_xp_waypoint_info[]` : Active RestedXP waypoints for the current step, using the same fields as `get_current_waypoint()` .

Description

Returns RestedXP waypoints for active steps only. Future guide look-ahead waypoints are excluded. The `dist` field is `0` for this list because RestedXP only exposes distance for the current arrow target.

**Example Usage**

```lua
for _, waypoint in ipairs(core.addons.rested_xp.get_step_waypoints()) do
    core.log(waypoint.title .. " on map " .. waypoint.map_id)
end
```

---

### `core.addons.rested_xp.skip_current_step`

Syntax

```lua
core.addons.rested_xp.skip_current_step() -> boolean
```

Returns

- `boolean` : `true` when RestedXP moved on; `false` when it is not loaded or has no current step.

Description

Moves RestedXP past its current step, like clicking the next step in its window. Use it for optional steps your bot cannot or should not finish. RestedXP updates its stickies and the next step exactly as when a step completes normally.

**Example Usage**

```lua
local step = core.addons.rested_xp.get_current_step()
if step.num > 0 and not step.active and step.requires_step == 0 then
    core.addons.rested_xp.skip_current_step()
end
```

---

### `core.addons.rested_xp.set_display_suppressed`

Syntax

```lua
core.addons.rested_xp.set_display_suppressed(suppressed: boolean) -> boolean
```

**Parameters**

- `suppressed` : `true` to hide RestedXP's frames, `false` to show them again.

Returns

- `boolean` : `true` when applied; `false` when RestedXP is not loaded.

Description

Hides every RestedXP frame (guide window, arrow, active item, target and level split frames) while its guide engine keeps running. Steps still complete, skip and advance, and every `core.addons.rested_xp` read keeps working.

The frames are made fully transparent and click-through instead of hidden: hiding RestedXP's window stops its engine, at once for some goals and at the next loading screen for the rest.

> [!NOTE]
> A `/reload` clears it, so call it again after one. It does not change RestedXP's saved settings. If the player turned RestedXP's window off themselves, the engine stays off: check `get_display_state().reason`. Needs core 2.154 or later.

**Example Usage**

```lua
core.addons.rested_xp.set_display_suppressed(true)
```

---

### `core.addons.rested_xp.get_display_state`

Syntax

```lua
core.addons.rested_xp.get_display_state() -> table
```

Returns

- `table` :
  - `suppressed` ( *boolean* ): `true` while `set_display_suppressed(true)` is in effect.
  - `engine_running` ( *boolean* ): `true` when RestedXP is loaded, has a guide, and is checking and completing steps.
  - `reason` ( *string* ): `""` when the engine runs, otherwise why not:
    - `"not_loaded"` : RestedXP is not loaded.
    - `"window_hidden"` : RestedXP's own Hide Window option is on, or its window was toggled off.
    - `"loading_screen"` : during a loading screen.
    - `"no_guide"` : no guide is loaded.

Description

Whether RestedXP's display is suppressed and whether its guide engine is running. Needs core 2.154 or later.

**Example Usage**

```lua
local state = core.addons.rested_xp.get_display_state()
-- { suppressed = true, engine_running = true, reason = "" }
if not state.engine_running then
    core.log("RestedXP engine is off: " .. state.reason)
end
```

---

## Polestar

The `core.addons.polestar` namespace reads guide state from [Polestar Guides](https://www.curseforge.com/wow/addons/polestar), the Forever leveling guide. It reads through Polestar's own engine, the same calls its guide window makes. Check `is_loaded()` before using it. Needs core 2.196 or later.

> [!WARNING]
> Polestar is released for Forever only. On every other version `is_loaded()` and `has_current_step()` are always `false` and the other functions return empty or zero-valued tables.

> [!NOTE]
> The player can page Polestar's window ahead or back without moving the route. `get_current_step()` is always the **live** step: the first step for this character that is not done or skipped. `get_current_waypoint()` is Polestar's arrow, which follows the **shown** step. `get_guide()` gives both (`live_step`, `viewed_step`).

**Goal fields** (`polestar_goal_info`, used by `get_current_step`, `get_step` and `get_along_goals`):

| Field | Type | Meaning |
| --- | --- | --- |
| `index` | integer | The goal's index in its step. |
| `type` | string | The guide verb: `accept`, `turnin`, `complete`, `kill`, `collect`, `goto`, `talk`, `interact`, `use`, `buy`, `vendor`, `train`, `sethome`, `hearth`, `fly`, `getfp`, `level`, `task`, `note`... |
| `status` | string | `"active"` or `"pending"` (open; `pending` when the window shows another step), `"done"`, `"skipped"`, or `"na"` (not for this character). |
| `is_complete` | boolean | `status == "done"`. |
| `text` | string | The guide window's line, e.g. `"Kill 8 Kobold Vermin"`. |
| `quest_id` | integer | The quest, 0 when none. |
| `objective` | integer | The quest objective index (1-based), 0 when none. |
| `npc_id`, `npc_name` | integer, string | The NPC. For `nearest` goals (vendor, trainer, innkeeper) the one Polestar picked. |
| `item_id` | integer | 0 when none. |
| `optional` | boolean | An optional goal never holds the step. |
| `is_current` | boolean | The goal Polestar's window marks and its arrow leads to. |
| `map_id`, `map_x`, `map_y` | integer, number | The goal's point on its UiMap, 0-1 in the live map frame. |
| `has_position` | boolean | `false` when the goal has no point or Polestar could not place it in the world. |
| `continent_id` | integer | Instance map id of `position`. 0 is Eastern Kingdoms, so check `has_position`. |
| `position` | vec3 | World position. `z` is the guide's own height there, 0 when unknown: use `core.get_height_for_position`. |
| `progress`, `progress_max` | integer | Kills, items... done so far and needed, 0 when the goal has no count. |
| `step` | integer | The goal's step (an along goal's own step). |

---

### `core.addons.polestar.is_loaded`

Syntax

```lua
core.addons.polestar.is_loaded() -> boolean
```

Returns

- `boolean` : Whether Polestar is loaded and logged in. Its engine runs only after login.

**Example Usage**

```lua
if core.addons.polestar.is_loaded() then
    core.log("Polestar is available")
end
```

---

### `core.addons.polestar.has_current_step`

Syntax

```lua
core.addons.polestar.has_current_step() -> boolean
```

Returns

- `boolean` : Whether a guide is loaded and has a live step left.

---

### `core.addons.polestar.get_guide`

Syntax

```lua
core.addons.polestar.get_guide() -> polestar_guide_info
```

Returns

- `polestar_guide_info` , zero-valued when no guide is loaded:
  - `id` ( *string* ): The guide id, e.g. `"forever/alliance/02-westfall"` .
  - `title` ( *string* )
  - `step_count` ( *integer* ): All steps of the guide.
  - `steps_done` ( *integer* ): Steps for this character that are done or skipped.
  - `steps_total` ( *integer* ): Steps for this character.
  - `live_step` ( *integer* ): The step the route is at, 0 when the guide is complete.
  - `viewed_step` ( *integer* ): The step the window shows.
  - `is_complete` ( *boolean* ): A guide is loaded and nothing is left in it.

**Example Usage**

```lua
local g = core.addons.polestar.get_guide()
core.log(string.format("%s: %d/%d", g.title, g.steps_done, g.steps_total))
```

---

### `core.addons.polestar.get_current_step`

Syntax

```lua
core.addons.polestar.get_current_step() -> polestar_step_info
```

Returns

- `polestar_step_info` , the live step, zero-valued when there is none:
  - `num` ( *integer* ): The step index.
  - `title` ( *string* )
  - `note` ( *string* ): The step's tip, `""` when none.
  - `status` ( *string* ): `"current"` (the step the window shows), `"upcoming"` , `"done"` , `"skipped"` or `"na"` .
  - `is_complete` ( *boolean* ): `status == "done"` .
  - `skipped` ( *boolean* ): The player skipped it.
  - `label` ( *string* ): The step's label, `""` when none.
  - `along` ( *boolean* ): An along step: its goals are done on the way, never a stop.
  - `why` ( *string* ): Why the step holds nothing for this character, `""` otherwise.
  - `current_goal` ( *integer* ): Index of the goal the window marks, 0 when none or not the shown step.
  - `is_viewed` ( *boolean* ): The step the guide window shows.
  - `goals` ( *polestar_goal_info[]* ): See the goal fields above.

**Example Usage**

```lua
local step = core.addons.polestar.get_current_step()
for _, goal in ipairs(step.goals) do
    if not goal.is_complete and goal.status ~= "na" and goal.has_position then
        core.log(string.format("%s at %.1f, %.1f", goal.text, goal.position.x, goal.position.y))
    end
end
```

---

### `core.addons.polestar.get_step`

Syntax

```lua
core.addons.polestar.get_step(index: integer) -> polestar_step_info
```

**Parameters**

- `index` : The step index (1-based).

Returns

- `polestar_step_info` : Same fields as `get_current_step()` , zero-valued when there is no such step. Use it to look ahead or back.

---

### `core.addons.polestar.get_along_goals`

Syntax

```lua
core.addons.polestar.get_along_goals() -> polestar_goal_info[]
```

Returns

- `polestar_goal_info[]` : The open goals Polestar lists "along the way" (along steps behind the live step, then quests the player pinned), each with its own `step` . Empty when none.

---

### `core.addons.polestar.get_current_waypoint`

Syntax

```lua
core.addons.polestar.get_current_waypoint() -> polestar_waypoint_info
```

Returns

- `polestar_waypoint_info` , Polestar's arrow target:
  - `is_valid` ( *boolean* ): `false` when the arrow has no target (no guide, a start gate, nothing on the step has a place).
  - `step` , `goal` ( *integer* ): The goal the arrow leads to.
  - `type` ( *string* ): The goal's verb.
  - `quest_id` ( *integer* )
  - `label` ( *string* ): The arrow's text.
  - `map_id` ( *integer* ), `map_x` , `map_y` ( *number* , 0-1, live map frame)
  - `has_position` ( *boolean* ), `continent_id` ( *integer* ), `position` ( *vec3* , `z` 0 when the guide has no height there)
  - `radius` ( *number* ): Arrival margin in yards.

**Example Usage**

```lua
local wp = core.addons.polestar.get_current_waypoint()
if wp.is_valid and wp.has_position then
    core.log(string.format("%s at %.1f, %.1f", wp.label, wp.position.x, wp.position.y))
end
```

---

### `core.addons.polestar.skip_current_step`

Syntax

```lua
core.addons.polestar.skip_current_step() -> boolean
```

Returns

- `boolean` : `true` when the live step was skipped; `false` when Polestar is not loaded or the guide is complete.

Description

Skips the live step, like the window's Skip button: saved, and Polestar's own undo brings it back. If the player is looking at another step, the window first goes back to the live one.

---

### `core.addons.polestar.toggle_goal`

Syntax

```lua
core.addons.polestar.toggle_goal(step: integer, goal: integer) -> boolean
```

**Parameters**

- `step` : The step index.
- `goal` : The goal index in that step.

Returns

- `boolean` : `true` when the tick changed; `false` for a note, a goal already done by the game, or no such goal.

Description

Ticks a goal done, or clears its tick, like clicking it in the window. Meant for `task` goals Polestar cannot see, which hold the step until ticked.

**Example Usage**

```lua
local step = core.addons.polestar.get_current_step()
for _, goal in ipairs(step.goals) do
    if goal.type == "task" and goal.status == "active" then
        core.addons.polestar.toggle_goal(step.num, goal.index)
    end
end
```

---

## Dungeon Journal

The `core.addons.dungeon_journal` namespace reads the map of ForeverDungeonJournal ("DungeonJournal" by Exehn), the Forever dungeon journal. Inside one of its dungeons, the journal lays its own dungeon map over the World Map. The World Map itself stays on the continent (947 inside a classic dungeon), so `core.game_ui.get_current_map_id()` cannot tell you a dungeon map is on the screen: ask here. Check `is_loaded()` before using it. Needs core 2.200 or later.

> [!WARNING]
> ForeverDungeonJournal is released for Forever only. On every other version `is_loaded()` and `is_map_attached()` are always `false` and `get_shown_map()` has `is_valid` set to `false`.

---

### `core.addons.dungeon_journal.is_loaded`

Syntax

```lua
core.addons.dungeon_journal.is_loaded() -> boolean
```

Returns

- `boolean` : Whether ForeverDungeonJournal is loaded.

---

### `core.addons.dungeon_journal.is_map_attached`

Syntax

```lua
core.addons.dungeon_journal.is_map_attached() -> boolean
```

Returns

- `boolean` : Whether the journal's dungeon map is over the World Map right now.

Description

`false` when the World Map is closed, the player right-clicked back to the world map, the journal window is open on its own, or the journal's world map option is off.

---

### `core.addons.dungeon_journal.get_shown_map`

Syntax

```lua
core.addons.dungeon_journal.get_shown_map() -> dungeon_journal_map_info
```

Returns

- `dungeon_journal_map_info` , the dungeon and floor the journal's map shows:

| Field | Type | Meaning |
| --- | --- | --- |
| `is_valid` | boolean | A dungeon with a journal map is selected and a floor of it was rendered. |
| `is_attached` | boolean | The map is over the World Map right now, same as `is_map_attached()`. |
| `dungeon` | string | The journal's key for the dungeon, its English name (`"Wailing Caverns"`). `""` when none. |
| `floor` | integer | The floor shown, 1-based. 0 when `is_valid` is `false`. |
| `floor_count` | integer | How many floors the journal has for this dungeon. |
| `ui_map_id` | integer | That floor's UiMapID (279 for Wailing Caverns). 0 when the floor has none (Forever's new dungeons: Ruins of Lordaeron, Hall of Thanes...). |

Description

While `is_attached` is `true` this is the picture on the World Map. Otherwise it is what the journal's own window shows (or last showed). A floor picked with the map's floor buttons is seen at once.

**Example Usage**

```lua
local m = core.addons.dungeon_journal.get_shown_map()
if m.is_valid and m.is_attached then
    core.log(m.dungeon .. " floor " .. m.floor .. " of " .. m.floor_count .. ", UiMap " .. m.ui_map_id)
end
```

---

## BigWigs

### `core.addons.bigwigs.is_loaded`

Syntax

```lua
core.addons.bigwigs.is_loaded() -> boolean
```

Returns

- `boolean` : Whether the BigWigs addon is loaded and active.

Description

Returns whether the BigWigs boss mod addon is currently loaded. Always check this before calling other BigWigs functions.

---

### `core.addons.bigwigs.has_active_bars`

Syntax

```lua
core.addons.bigwigs.has_active_bars() -> boolean
```

Returns

- `boolean` : Whether there are any active BigWigs timer bars.

Description

Returns whether BigWigs currently has any active timer bars displayed. Use this as a quick check before iterating over bars.

---

### `core.addons.bigwigs.get_bars`

Syntax

```lua
core.addons.bigwigs.get_bars() -> bigwigs_bar_info[]
```

Returns

- `bigwigs_bar_info[]` : Array of bar tables, each containing:
  - `key` : `integer` - Unique bar identifier.
  - `text` : `string` - The bar label text (ability name).
  - `remaining` : `number` - Seconds remaining on the timer.
  - `duration` : `number` - Total duration of the timer in seconds.
  - `expire_time` : `number` - Game time when the bar expires.
  - `is_emphasized` : `boolean` - Whether the bar is emphasized (important/imminent).

Description

Returns all active BigWigs timer bars. Each bar represents an upcoming boss ability or mechanic with timing information.

---

### `core.addons.bigwigs.get_stage`

Syntax

```lua
core.addons.bigwigs.get_stage() -> number|nil, number|nil, integer|nil
```

Returns

- `stage` : `number|nil` - The stage BigWigs has set: `1` , `2` , ... with `.5` for intermissions ( `1.5` , `2.5` ). `nil` when the boss module does not use stages.
- `elapsed` : `number|nil` - Seconds since that stage began. Until the first stage change this counts from the pull.
- `encounter_id` : `integer|nil` - The boss's encounter id, the same one `ENCOUNTER_START` carries.

Description

Returns the stage of the boss BigWigs is currently fighting, so a plugin can time things from the start of a stage instead of from the pull. BigWigs works the stage out itself, with its own logic for each boss. Needs core 2.129 or newer.

All three are `nil` when BigWigs is not loaded or not in a boss fight. Only the boss BigWigs is engaged with is read, because BigWigs keeps the last fight's stage on a boss after the fight ends.

```lua
local stage, elapsed, encounter_id = core.addons.bigwigs.get_stage()
if stage == 2 and elapsed and elapsed >= 4.1 then
    -- e.g. a note line "ph:2;time:4.1;spellid:31884;"
end
```

---

## ExBoss

ExBoss, also shipped as EXWIND, is a boss timer addon. It predicts upcoming boss and trash ability casts and counts them down as timer bars, so this namespace is the ExBoss counterpart of the BigWigs one above.

The two are separate addons and separate namespaces. A plugin that supports both queries each and merges the results itself. Note that `exboss_bar_info.key` is a **spell id**, while the BigWigs `key` is an opaque bar identifier, so a lookup written against one is not portable to the other without changing that field.

> [!WARNING]
> ExBoss only exists for Retail. On the Classic versions `is_loaded()` and `has_active_bars()` are always `false` and `get_bars()` always returns an empty table.

### `core.addons.exboss.is_loaded`

Syntax

```lua
core.addons.exboss.is_loaded() -> boolean
```

Returns

- `boolean` : Whether the ExBoss addon is loaded and active.

Description

Returns whether the ExBoss addon is currently loaded. Always check this before calling other ExBoss functions.

It confirms the addon's prediction scheduler specifically, not merely that the global exists, so a partially initialized addon reads as not loaded.

---

### `core.addons.exboss.has_active_bars`

Syntax

```lua
core.addons.exboss.has_active_bars() -> boolean
```

Returns

- `boolean` : Whether ExBoss currently shows any timer bars.

Description

Returns whether ExBoss has any timer bars on screen. Use it as a cheap gate in front of `get_bars()` in a per-frame path.

---

### `core.addons.exboss.get_bars`

Syntax

```lua
core.addons.exboss.get_bars() -> exboss_bar_info[]
```

Returns

- `exboss_bar_info[]` : Array of bar tables, each containing:
  - `key` : `integer` - Spell id of the timed ability, `0` when ExBoss did not record one. This is not a bar handle.
  - `text` : `string` - The bar label, the ability's timer bar name or its display name.
  - `remaining` : `number` - Seconds until the ability fires. Clamped at `0` , never negative.
  - `duration` : `number` - Full bar duration in seconds.
  - `expire_time` : `number` - Absolute `GetTime()` value at which the ability fires.
  - `is_emphasized` : `boolean` - Whether this is a high priority bar, which ExBoss emphasizes on screen.

Description

Returns the ExBoss timer bars currently on screen. Only bars ExBoss is actually displaying are reported, so timers the user filtered out do not appear. Timing is read live from the prediction scheduler rather than from the bar widget, so `remaining` is accurate on the frame you read it.

Returns an empty array when the addon's bar UI is unavailable, even if `is_loaded()` returns `true`.

**Example Usage**

```lua
-- Warn about the next ExBoss ability inside a 5 second window
if core.addons.exboss.is_loaded() and core.addons.exboss.has_active_bars() then
    for _, bar in ipairs(core.addons.exboss.get_bars()) do
        if bar.remaining < 5.0 then
            core.log(string.format("%s in %.1fs (spell %d)", bar.text, bar.remaining, bar.key))
        end
    end
end
```

---

## Conroc

> [!WARNING]
> ConROC exists for Classic Era and TBC Classic. Retail has a different addon, ConRO, which these functions do not read, so on Retail `is_loaded()` is always `false` and both lists are empty.

### `core.addons.conroc.is_loaded`

Syntax

```lua
core.addons.conroc.is_loaded() -> boolean
```

Returns

- `boolean` : Whether the Conroc addon is loaded and active.

Description

Returns whether the Conroc rotation helper addon is currently loaded. Always check this before calling other Conroc functions.

---

### `core.addons.conroc.get_suggested_spells`

Syntax

```lua
core.addons.conroc.get_suggested_spells() -> table
```

Returns

- `table` : The suggested spell list from Conroc.

Description

Returns the list of spells that Conroc is currently suggesting for the player's rotation. These represent the optimal next abilities to use.

---

### `core.addons.conroc.get_suggested_utility_spells`

Syntax

```lua
core.addons.conroc.get_suggested_utility_spells() -> table
```

Returns

- `table` : The suggested utility spell list from Conroc.

Description

Returns the list of utility spells that Conroc is currently suggesting. These are non-rotational spells such as interrupts, defensives, or movement abilities.

---

## Questie

> [!WARNING]
> Questie only exists for the Classic versions. On Retail these always return nothing: `is_loaded()` and `is_ready()` are `false`, the id lists are empty, and the query calls return `nil`.

### `core.addons.questie.is_loaded`

Syntax

```lua
core.addons.questie.is_loaded() -> boolean
```

Returns

- `boolean` : Whether the Questie addon is loaded and active.

Description

Returns whether the Questie quest helper addon is currently loaded. Always check this before calling other Questie functions.

---

### `core.addons.questie.get_quest_npc_ids`

Syntax

```lua
core.addons.questie.get_quest_npc_ids() -> integer[]
```

Returns

- `integer[]` : NPC IDs related to the player's active quests.

Description

Returns a table of NPC IDs that are relevant to the player's current quests, as tracked by Questie. This can be used to identify quest targets in the game world.

---

### `core.addons.questie.get_quest_ids`

Syntax

```lua
core.addons.questie.get_quest_ids() -> integer[]
```

Returns

- `integer[]` : Every quest ID in Questie's compiled quest database, or an empty array when Questie is not ready.

Description

Returns all quest IDs indexed by Questie's compiled quest database. This is the complete Questie ID set, not only the player's active quests. Call `is_ready()` first when readiness matters.

**Example Usage**

```lua
if core.addons.questie.is_ready() then
    local quest_ids = core.addons.questie.get_quest_ids()
    core.log("Questie indexes " .. #quest_ids .. " quests")
end
```

---

### `core.addons.questie.get_party_quests`

Syntax

```lua
core.addons.questie.get_party_quests(player_name: string) -> table<integer, table[]>
```

**Parameters**

- `player_name` : `string` - The party member's name: `"Name"` on your realm, `"Name-Realm"` otherwise. A name without a realm also matches a cross-realm member.

Returns

- `table<integer, table[]>` : Keyed by quest ID. Each value is the list of that quest's objectives, each a table with:
  - `index` : `integer` - Objective index in the quest.
  - `id` : `integer` - Questie's target ID for it (NPC, object or item), `0` when Questie has none.
  - `type` : `string` - Questie's objective type letter, e.g. `"m"` monster, `"o"` object, `"i"` item, `"e"` event.
  - `finished` : `boolean`
  - `fulfilled` : `integer` - Progress so far.
  - `required` : `integer` - Progress needed.

Description

Returns the quests and progress Questie has received for one party member through its own addon messages. Only party members who run Questie show up, and your own quests never do (use `core.quests` for those). Empty table when Questie is not loaded or holds nothing for that player. Needs core 2.176 or later.

**Example Usage**

```lua
for quest_id, objectives in pairs(core.addons.questie.get_party_quests("Bob")) do
    for _, o in ipairs(objectives) do
        core.log(quest_id .. " #" .. o.index .. ": " .. o.fulfilled .. "/" .. o.required)
    end
end
```

---

### `core.addons.questie.is_ready`

Syntax

```lua
core.addons.questie.is_ready() -> boolean
```

Returns

- `boolean` : Whether Questie is loaded and its API is ready.

Description

Returns whether Questie's API and database are ready for query calls. Use this before calling the `query_*_single` helpers if your code needs a quick readiness gate.

---

### `core.addons.questie.query_quest_single`

Syntax

```lua
core.addons.questie.query_quest_single(quest_id: integer, key: string) -> questie_query_value|nil
```

**Parameters**

- `quest_id` : `integer` - The Questie quest ID.
- `key` : `string` - The QuestieDB field key to read.

Returns

- `questie_query_value|nil` : A number, string, boolean, nested query table, or nil when Questie is not ready or the key is missing.

Description

Queries a single field from Questie's quest database.

---

### `core.addons.questie.query_npc_single`

Syntax

```lua
core.addons.questie.query_npc_single(npc_id: integer, key: string) -> questie_query_value|nil
```

**Parameters**

- `npc_id` : `integer` - The NPC ID.
- `key` : `string` - The QuestieDB field key to read.

Returns

- `questie_query_value|nil` : A number, string, boolean, nested query table, or nil when Questie is not ready or the key is missing.

Description

Queries a single field from Questie's NPC database.

---

### `core.addons.questie.query_object_single`

Syntax

```lua
core.addons.questie.query_object_single(object_id: integer, key: string) -> questie_query_value|nil
```

**Parameters**

- `object_id` : `integer` - The object ID.
- `key` : `string` - The QuestieDB field key to read.

Returns

- `questie_query_value|nil` : A number, string, boolean, nested query table, or nil when Questie is not ready or the key is missing.

Description

Queries a single field from Questie's object database.

---

### `core.addons.questie.query_item_single`

Syntax

```lua
core.addons.questie.query_item_single(item_id: integer, key: string) -> questie_query_value|nil
```

**Parameters**

- `item_id` : `integer` - The item ID.
- `key` : `string` - The QuestieDB field key to read.

Returns

- `questie_query_value|nil` : A number, string, boolean, nested query table, or nil when Questie is not ready or the key is missing.

Description

Queries a single field from Questie's item database.

---

### `core.addons.questie.is_quest_doable`

Syntax

```lua
core.addons.questie.is_quest_doable(quest_id: integer) -> boolean|nil
```

**Parameters**

- `quest_id` : `integer` - The Questie quest ID.

Returns

- `boolean|nil` : True if doable, false if not doable, or nil if Questie is not ready.

Description

Returns whether Questie considers the quest doable for the current character.

---

### `core.addons.questie.is_quest_complete`

Syntax

```lua
core.addons.questie.is_quest_complete(quest_id: integer) -> integer|nil
```

**Parameters**

- `quest_id` : `integer` - The Questie quest ID.

Returns

- `integer|nil` : `1` for complete, `0` for incomplete, `-1` for failed, or nil if Questie is not ready.

Description

Returns Questie's completion status for a quest.

> [!WARNING]
> `0` means "incomplete" **and** "not in Questie's cache"; the two are indistinguishable. Questie fills that cache from the classic quest log API, which the Forever client does not have, so on Forever this answers `0` even for a quest that is ready to hand in.
>
> To ask the game itself, use [`core.quests.is_quest_complete`](/dev/api/quests#corequestsis_quest_complete)`(quest_id)` (core update of 2026-10-06). It works on every client and does not need Questie.

---

## TSM (TradeSkillMaster)

### `core.addons.tsm.is_loaded`

Syntax

```lua
core.addons.tsm.is_loaded() -> boolean
```

Returns

- `boolean` : Whether the TSM addon is loaded and active.

Description

Returns whether the TradeSkillMaster addon is currently loaded. Always check this before calling other TSM functions.

---

### `core.addons.tsm.get_item_prices`

Syntax

```lua
core.addons.tsm.get_item_prices(item_id: integer) -> table
```

**Parameters**

- `item_id` : `integer` - The item ID to look up prices for.

Returns

- `table` : A table with the following fields:

| Field | Type | Description |
| --- | --- | --- |
| `market_value` | `number` | The current market value in copper. |
| `min_buyout` | `number` | The minimum buyout price in copper. |
| `historical` | `number` | The historical price in copper. |
| `region_market_avg` | `number` | The region market average in copper. |
| `region_historical` | `number` | The region historical price in copper. |
| `region_sale_avg` | `number` | The region sale average in copper. |
| `region_sale_rate` | `number` | The region sale rate, `0.0` to `1.0`. |
| `region_sold_per_day` | `number` | The average number sold per day. |
| `vendor_sell` | `number` | The vendor sell price in copper. |

Description

Returns TSM price data for a specific item.

> [!TIP]
> `region_sale_rate` and `region_sold_per_day` are the liquidity signals — a huge gap between `min_buyout` and `market_value` means nothing if nobody buys the item. Gate flips on both price and sale rate.

---

### `core.addons.tsm.get_market_data`

Syntax

```lua
core.addons.tsm.get_market_data(item_ids: integer[]) -> table
```

**Parameters**

- `item_ids` : `integer[]` - Array of item IDs to look up market data for.

Returns

- `table` : A table keyed by item ID , where each value has the same fields as `get_item_prices` .

Description

Returns market data for multiple items at once. More efficient than calling `get_item_prices` individually when you need data for many items.

> [!WARNING]
> The result is keyed by item ID, not a sequential array — iterate it with `pairs`, not `ipairs`:
>
> ```lua
> local prices = core.addons.tsm.get_market_data({ 171276, 190316, 194123 })
> for item_id, p in pairs(prices) do
>     core.log(item_id .. " market value: " .. p.market_value)
> end
> ```

---

### `core.addons.tsm.get_sniper_max_price`

Syntax

```lua
core.addons.tsm.get_sniper_max_price(item_id: integer) -> number
```

**Parameters**

- `item_id` : `integer` - The item ID to check.

Returns

- `number` : The sniper threshold price in copper.

Description

Returns the maximum price threshold for TSM's sniper feature for the given item. Prices are in copper (1 gold = 10000 copper).

---

### `core.addons.tsm.get_shopping_max_price`

Syntax

```lua
core.addons.tsm.get_shopping_max_price(item_id: integer) -> number
```

**Parameters**

- `item_id` : `integer` - The item ID to check.

Returns

- `number` : The shopping maximum price in copper.

Description

Returns the maximum shopping price for an item as configured in TSM shopping operations. Prices are in copper.

---

### `core.addons.tsm.get_auctioning_prices`

Syntax

```lua
core.addons.tsm.get_auctioning_prices(item_id: integer) -> table
```

**Parameters**

- `item_id` : `integer` - The item ID to check.

Returns

- `table` : A table containing `min_price` , `normal_price` , and `max_price` fields (all in copper).

Description

Returns the auctioning operation prices for an item. The returned table contains the minimum, normal, and maximum posting prices as configured in TSM auctioning operations.

---

### `core.addons.tsm.get_shopping_restock_quantity`

Syntax

```lua
core.addons.tsm.get_shopping_restock_quantity(item_id: integer) -> integer
```

**Parameters**

- `item_id` : `integer` - The item ID to check.

Returns

- `integer` : The restock quantity needed.

Description

Returns how many of an item need to be purchased to reach the restock target as defined in TSM shopping operations.

---

## Details

### `core.addons.details.is_loaded`

Syntax

```lua
core.addons.details.is_loaded() -> boolean
```

Returns

- `boolean` : Whether the Details addon is loaded and active.

Description

Returns whether the Details! Damage Meter addon is currently loaded. Always check this before calling other Details functions.

---

### `core.addons.details.get_combat_info`

Syntax

```lua
core.addons.details.get_combat_info(segment_id?: integer) -> table
```

**Parameters**

- `segment_id` (optional): `integer` - The segment ID. `0` = current (default), `-1` = overall, `1-25` = specific segment.

Returns

- `table` : Combat information with the following fields:

| Field | Type | Description |
| --- | --- | --- |
| `combat_time` | `number` | Combat duration in seconds |
| `combat_name` | `string` | The combat/encounter name |
| `total_damage` | `number` | Total damage dealt in the segment |
| `total_healing` | `number` | Total healing done in the segment |

Description

Returns summary information about a combat segment, including total damage, healing, and duration.

---

### `core.addons.details.get_damage_done`

Syntax

```lua
core.addons.details.get_damage_done(segment_id?: integer) -> table[]
```

**Parameters**

- `segment_id` (optional): `integer` - The segment ID. `0` = current (default), `-1` = overall, `1-25` = specific segment.

Returns

- `table[]` : Array of actor entries with the following fields:

| Field | Type | Description |
| --- | --- | --- |
| `name` | `string` | Actor name |
| `class_id` | `integer` | Class ID |
| `total` | `number` | Total damage dealt |
| `per_second` | `number` | Damage per second (DPS) |
| `is_player` | `boolean` | Whether the actor is a player |
| `is_group_member` | `boolean` | Whether the actor is in the group |
| `unit` | `game_object\|nil` | The game object if found in the world |

Description

Returns per-actor damage done data for a combat segment. The `unit` field is resolved by matching the actor name against visible game objects.

---

### `core.addons.details.get_healing_done`

Syntax

```lua
core.addons.details.get_healing_done(segment_id?: integer) -> table[]
```

**Parameters**

- `segment_id` (optional): `integer` - The segment ID. `0` = current (default), `-1` = overall, `1-25` = specific segment.

Returns

- `table[]` : Array of actor entries (same structure as `get_damage_done` ).

Description

Returns per-actor healing done data for a combat segment.

---

### `core.addons.details.get_damage_taken`

Syntax

```lua
core.addons.details.get_damage_taken(segment_id?: integer) -> table[]
```

**Parameters**

- `segment_id` (optional): `integer` - The segment ID. `0` = current (default), `-1` = overall, `1-25` = specific segment.

Returns

- `table[]` : Array of actor entries (same structure as `get_damage_done` ).

Description

Returns per-actor damage taken data for a combat segment.

---

### `core.addons.details.get_segments`

Syntax

```lua
core.addons.details.get_segments() -> table[]
```

Returns

- `table[]` : Array of segment entries with the following fields:

| Field | Type | Description |
| --- | --- | --- |
| `index` | `integer` | The segment index |
| `name` | `string` | The segment name |
| `duration` | `number` | The segment duration in seconds |

Description

Returns all available combat segments from the Details addon.

---

## Timeline Reminders

### `core.addons.timeline_reminders.is_loaded`

Syntax

```lua
core.addons.timeline_reminders.is_loaded() -> boolean
```

Returns

- `boolean` : Whether the Timeline Reminders addon is loaded and active.

Description

Returns whether the Timeline Reminders addon is currently loaded. Always check this before calling other Timeline Reminders functions.

---

### `core.addons.timeline_reminders.get_reminders`

Syntax

```lua
core.addons.timeline_reminders.get_reminders(encounter_id: integer, difficulty_id: integer) -> table[]
```

**Parameters**

- `encounter_id` : `integer` - The encounter ID.
- `difficulty_id` : `integer` - The difficulty ID.

Returns

- `table[]` : Array of reminder entries with the following fields:

| Field | Type | Description |
| --- | --- | --- |
| `trigger_time` | `number` | Time in seconds when the reminder triggers |
| `duration` | `number` | Duration of the reminder in seconds |
| `linger` | `number` | Linger time after the reminder fires |
| `hide_on_use` | `boolean` | Whether to hide after triggering |
| `region` | `string` | Display region |
| `display_type` | `string` | Display type |
| `spell_id` | `integer` | Associated spell ID |
| `text` | `string` | Reminder text |
| `load_type` | `string` | Load condition type |
| `load_class` | `string` | Class load condition |
| `load_spec` | `integer` | Specialization load condition |
| `load_role` | `string` | Role load condition |
| `load_name` | `string` | Name load condition |
| `countdown_enabled` | `boolean` | Whether countdown is enabled |
| `countdown_start` | `integer` | Countdown start time in seconds |

Description

Returns all configured reminders for a specific encounter and difficulty. Each reminder includes trigger timing, display settings, and load conditions for filtering by class/spec/role.

---

## MaxDps

> [!WARNING]
> MaxDps is released for Retail, Classic Era, TBC Classic and MoP Classic only. On Titan (China) and Forever `is_loaded()` is always `false` and `get_next_spell()` returns `0`.

### `core.addons.maxdps.is_loaded`

Syntax

```lua
core.addons.maxdps.is_loaded() -> boolean
```

Returns

- `boolean` : Whether the MaxDps addon is loaded and active.

Description

Returns whether the MaxDps rotation helper addon is currently loaded. Always check this before calling other MaxDps functions.

**Example Usage**

```lua
if core.addons.maxdps.is_loaded() then
    local spell_id = core.addons.maxdps.get_next_spell()
    core.log("MaxDps suggests spell: " .. spell_id)
end
```

---

### `core.addons.maxdps.get_next_spell`

Syntax

```lua
core.addons.maxdps.get_next_spell() -> integer
```

Returns

- `integer` : The spell ID of the next recommended ability from MaxDps.

Description

Returns the spell ID that MaxDps is currently recommending as the next ability to cast. This is the spell that MaxDps highlights on the action bars.

**Example Usage**

```lua
if core.addons.maxdps.is_loaded() then
    local next_spell = core.addons.maxdps.get_next_spell()
    if next_spell > 0 then
        core.log("Next recommended spell ID: " .. next_spell)
    end
end
```

---

## Swing Timer

### `core.addons.swing_timer.is_loaded`

Syntax

```lua
core.addons.swing_timer.is_loaded() -> boolean
```

Returns

- `boolean` : Whether the Swing Timer addon is loaded and active.

Description

Returns whether the Swing Timer addon is currently loaded. Always check this before calling other Swing Timer functions.

**Example Usage**

```lua
if core.addons.swing_timer.is_loaded() then
    local info = core.addons.swing_timer.get_player_ranged_info()
    core.log("Last swing: " .. info.last_swing)
end
```

---

### `core.addons.swing_timer.get_player_ranged_info`

Syntax

```lua
core.addons.swing_timer.get_player_ranged_info() -> swing_timer_ranged_info
```

Returns

- `table` : A table containing the player's ranged swing timer data:

| Field | Type | Description |
| --- | --- | --- |
| `expiration_time` | `number` | The time when the current auto-shot expires |
| `last_swing` | `number` | The time of the last ranged swing |
| `auto_shot_cast_time` | `number` | The cast time of the auto-shot |

Description

Returns the player's ranged auto-shot swing timer information. Useful for tracking auto-shot timing in ranged rotations to avoid clipping auto-shots.

**Example Usage**

```lua
if core.addons.swing_timer.is_loaded() then
    local info = core.addons.swing_timer.get_player_ranged_info()
    local current_time = core.time()
    local time_until_next = info.expiration_time - current_time
    if time_until_next > 0 then
        core.log("Next auto-shot in: " .. string.format("%.2f", time_until_next) .. "s")
    end
end
```

---

### `core.addons.swing_timer.get_player_mainhand_info`

Syntax

```lua
core.addons.swing_timer.get_player_mainhand_info() -> swing_timer_hand_info
```

Returns

- `table` : Main-hand swing timer info.

| Field | Type | Description |
| --- | --- | --- |
| `expiration_time` | `number` | The time when the current melee swing expires |
| `last_swing` | `number` | The time of the last melee swing |
| `swing_speed` | `number` | Current melee swing speed |
| `base_swing_speed` | `number` | Base melee swing speed |

---

### `core.addons.swing_timer.get_player_offhand_info`

Syntax

```lua
core.addons.swing_timer.get_player_offhand_info() -> swing_timer_hand_info|nil
```

Returns

- `table|nil` : Off-hand swing timer info, or nil when the player is not dual wielding.

The returned table has the same fields as `get_player_mainhand_info`.

---

## Arena Core

> [!WARNING]
> Arena Core only exists for Retail. On the Classic versions `is_loaded()` is always `false` and the other functions return nothing (`nil`, an empty string, or `0`).

### `core.addons.arena_core.is_loaded`

Syntax

```lua
core.addons.arena_core.is_loaded() -> boolean
```

Returns

- `boolean` : Whether Arena Core is loaded and available.

Description

Returns whether Arena Core data can be read.

---

### `core.addons.arena_core.get_frame_info`

Syntax

```lua
core.addons.arena_core.get_frame_info(arena_index) -> arena_core_frame_info|nil
```

**Parameters**

- `arena_index` : `integer` - The arena frame index.

Returns

- `table|nil` : Arena frame info, or nil when unavailable.

| Field | Type | Description |
| --- | --- | --- |
| `unit` | `string` | Arena unit token, such as `arena1` |
| `id` | `integer` | Arena frame ID |
| `class` | `string` | Class name |
| `spec_id` | `integer` | Specialization ID |
| `spec_icon_texture` | `string` | Specialization icon texture path |
| `class_icon` | `integer` | Class icon texture ID |
| `spec_icon` | `integer` | Specialization icon texture ID |

---

### `core.addons.arena_core.get_class`

Syntax

```lua
core.addons.arena_core.get_class(arena_index) -> string
```

**Parameters**

- `arena_index` : `integer` - The arena frame index.

Returns

- `string` : The class name, or an empty string when unavailable.

---

### `core.addons.arena_core.get_spec_id`

Syntax

```lua
core.addons.arena_core.get_spec_id(arena_index) -> integer
```

**Parameters**

- `arena_index` : `integer` - The arena frame index.

Returns

- `integer` : The specialization ID, or 0 when unavailable.

---

## Method Dungeon Tools

> [!WARNING]
> Mythic Dungeon Tools only exists for Retail and MoP Classic. On the other Classic versions `is_loaded()` is always `false`, the counts are `0`, and the other functions return `nil`.

### `core.addons.mdt.is_loaded`

Syntax

```lua
core.addons.mdt.is_loaded() -> boolean
```

Returns

- `boolean` : Whether Method Dungeon Tools is loaded and available.

---

### `core.addons.mdt.get_current_preset_meta`

Syntax

```lua
core.addons.mdt.get_current_preset_meta() -> mdt_preset_meta|nil
```

Returns

- `table|nil` : Current MDT preset metadata, or nil when unavailable.

| Field | Type | Description |
| --- | --- | --- |
| `text` | `string` | Current preset display text |
| `current_dungeon_idx` | `integer` | Current MDT dungeon index |
| `current_pull` | `integer` | Current pull index |
| `current_sublevel` | `integer` | Current dungeon sublevel |
| `week` | `integer` | Configured affix week |
| `difficulty` | `integer` | Configured difficulty |
| `uid` | `string` | Preset UID |

---

### `core.addons.mdt.get_pull_count`

Syntax

```lua
core.addons.mdt.get_pull_count() -> integer
```

Returns

- `integer` : Number of pulls in the current preset.

---

### `core.addons.mdt.get_pull`

Syntax

```lua
core.addons.mdt.get_pull(pull_idx) -> mdt_pull|nil
```

**Parameters**

- `pull_idx` : `integer` - The pull index.

Returns

- `table|nil` : Pull data, or nil when unavailable.

| Field | Type | Description |
| --- | --- | --- |
| `color` | `string` | Pull color |
| `enemies` | `table[]` | Entries containing `enemy_idx` and `clones` |

Each `enemies` entry contains `enemy_idx` (`integer`) and `clones` (`integer[]`).

---

### `core.addons.mdt.get_object_count`

Syntax

```lua
core.addons.mdt.get_object_count() -> integer
```

Returns

- `integer` : Number of MDT map objects in the current preset.

---

### `core.addons.mdt.get_object`

Syntax

```lua
core.addons.mdt.get_object(obj_idx) -> mdt_object|nil
```

**Parameters**

- `obj_idx` : `integer` - The object index.

Returns

- `table|nil` : Map object data, or nil when unavailable.

| Field | Type | Description |
| --- | --- | --- |
| `kind` | `string` | `line`, `arrow`, `note`, or `unknown` |
| `color` | `string` | Object color |
| `note_text` | `string` | Note text |
| `note_x` | `number` | Note X coordinate |
| `note_y` | `number` | Note Y coordinate |
| `arrow_angle` | `number` | Arrow angle |
| `points` | `number[]` | Flat array of object points |

---

### `core.addons.mdt.get_dungeon_enemy_count`

Syntax

```lua
core.addons.mdt.get_dungeon_enemy_count(dungeon_idx) -> integer
```

**Parameters**

- `dungeon_idx` : `integer` - The MDT dungeon index.

Returns

- `integer` : Number of enemies in the dungeon's MDT data.

---

### `core.addons.mdt.get_dungeon_enemy_info`

Syntax

```lua
core.addons.mdt.get_dungeon_enemy_info(dungeon_idx, enemy_idx) -> mdt_dungeon_enemy_info|nil
```

**Parameters**

- `dungeon_idx` : `integer` - The MDT dungeon index.
- `enemy_idx` : `integer` - The enemy index.

Returns

- `table|nil` : Static dungeon enemy info, or nil when unavailable.

| Field | Type | Description |
| --- | --- | --- |
| `name` | `string` | Enemy name |
| `id` | `integer` | NPC ID |
| `count` | `integer` | Enemy count value |
| `health` | `integer` | Enemy health value |
| `scale` | `number` | Enemy scale |
| `display_id` | `integer` | Display ID |
| `creature_type` | `string` | Creature type |
| `level` | `integer` | Enemy level |
| `is_boss` | `boolean` | Whether this enemy is a boss |
| `encounter_id` | `integer` | Encounter ID |
| `instance_id` | `integer` | Instance ID |
| `clone_count` | `integer` | Number of clone placements |

---

### `core.addons.mdt.get_dungeon_enemy_clone`

Syntax

```lua
core.addons.mdt.get_dungeon_enemy_clone(dungeon_idx, enemy_idx, clone_idx) -> mdt_dungeon_enemy_clone|nil
```

**Parameters**

- `dungeon_idx` : `integer` - The MDT dungeon index.
- `enemy_idx` : `integer` - The enemy index.
- `clone_idx` : `integer` - The clone index.

Returns

- `table|nil` : Clone placement info, or nil when unavailable.

| Field | Type | Description |
| --- | --- | --- |
| `x` | `number` | Clone X coordinate |
| `y` | `number` | Clone Y coordinate |
| `g` | `integer` | Clone group |
| `sublevel` | `integer` | Dungeon sublevel |
| `scale` | `number` | Clone scale |

---

## Complete Examples

### Checking BigWigs Bars for Upcoming Mechanics

```lua
local function check_boss_timers()
    if not core.addons.bigwigs.is_loaded() then
        return
    end

    if not core.addons.bigwigs.has_active_bars() then
        return
    end

    local bars = core.addons.bigwigs.get_bars()
    for _, bar in ipairs(bars) do
        if bar.remaining < 3.0 then
            core.log("IMMINENT: " .. bar.text .. " in " .. string.format("%.1f", bar.remaining) .. "s")
        end

        if bar.is_emphasized then
            core.log("IMPORTANT: " .. bar.text .. " (" .. string.format("%.1f", bar.remaining) .. "s)")
        end
    end
end
```

### TSM Price Checking for Auction House Decisions

```lua
local function evaluate_item(item_id)
    if not core.addons.tsm.is_loaded() then
        core.log("TSM is not loaded")
        return
    end

    local prices = core.addons.tsm.get_item_prices(item_id)
    if not prices then
        core.log("No price data for item: " .. item_id)
        return
    end

    local auctioning = core.addons.tsm.get_auctioning_prices(item_id)
    if auctioning then
        local min_gold = auctioning.min_price / 10000
        local normal_gold = auctioning.normal_price / 10000
        local max_gold = auctioning.max_price / 10000
        core.log(string.format("Auctioning - Min: %.1fg, Normal: %.1fg, Max: %.1fg", min_gold, normal_gold, max_gold))
    end

    local sniper_max = core.addons.tsm.get_sniper_max_price(item_id)
    if sniper_max then
        core.log(string.format("Sniper threshold: %.1fg", sniper_max / 10000))
    end

    local restock = core.addons.tsm.get_shopping_restock_quantity(item_id)
    if restock and restock > 0 then
        core.log("Need to restock: " .. restock .. " units")
    end
end

-- Example: Check price data for Draconium Ore (item ID 190312)
evaluate_item(190312)
```