# Game UI Functions

> Source: <https://docs.project-sylvanas.net/dev/api/game-ui>

## Overview

The `core.game_ui` module provides functions for interacting with the World of Warcraft game interface. This includes accessing loot windows, battlefield information, cursor positions, and map utilities.

---

## Item Cursor & Bind State 🎒

The read side of the bag and bind functions in [Input](/dev/api/input).

### `core.game_ui.get_pending_equip_slot`

Syntax

```lua
core.game_ui.get_pending_equip_slot() -> integer | nil
```

Returns

- `integer` : The inventory slot (an `INVSLOT_*` id) of the bind-on-equip prompt the client is currently holding open.
- `nil` : Nothing is pending.

Description

`core.input.use_container_item` on a bind-on-equip item does not equip it and does not fail either. The engine withholds the equip, fires `AUTOEQUIP_BIND_CONFIRM` or `EQUIP_BIND_CONFIRM` carrying the inventory slot, and then waits. Only `core.input.equip_pending_item` releases it.

A plugin watching its own bags sees nothing but "the item did not move", which reads identically to a refused equip, and the usual reaction is to discard the upgrade for good. This is the read that separates the two: **a number means the client is still waiting for an answer, `nil` means it is not.**

> [!NOTE]
> The slot is latched from the drained events *before* that same batch reaches your `on_game_event` callback, so it is already set when you handle `AUTOEQUIP_BIND_CONFIRM`. It is **not** set on the line right after `use_container_item`, because the client fires its event on a later frame. Read it from an event handler or from your update loop.
>
> It is cleared by `core.input.equip_pending_item` and `core.input.cancel_pending_equip` on success, and by a `PLAYER_EQUIPMENT_CHANGED` naming the same slot, which is how a prompt the player answered by hand stops being reported.

**Example Usage**

```lua
core.register_on_update_callback(function()
    local slot = core.game_ui.get_pending_equip_slot()
    if slot then
        core.log("waiting on a bind confirm for slot " .. slot)
        core.input.equip_pending_item(slot)
    end
end)
```

---

### `core.game_ui.has_cursor_item`

Syntax

```lua
core.game_ui.has_cursor_item() -> boolean
```

Returns

- `boolean` : `true` when the mouse cursor is carrying an item.

Description

The check that makes `core.input.pickup_container_item` verifiable: that function returns `true` when the client's pick-up call was *reached*, not when the cursor actually took the item, and the client refuses locked slots and items in transit without erroring.

Also the guard that keeps `core.input.delete_cursor_item` from firing at an empty cursor. `core.input.destroy_container_item` performs both checks internally, so you do not need this when you use that one call.

**Example Usage**

```lua
core.input.pickup_container_item(bag_id, bag_slot)

if not core.game_ui.has_cursor_item() then
    core.log("the client refused the pick-up")
end
```

---

## Loot Window Functions 💰

### `core.game_ui.get_loot_item_count`

Syntax

```lua
core.game_ui.get_loot_item_count() -> integer
```

Returns

- `integer` : The number of lootable items currently available in the loot window.

Description

Retrieves the number of items currently available in the loot window.

**Example Usage**

```lua
local item_count = core.game_ui.get_loot_item_count()
core.log("Lootable items: " .. item_count)
```

---

### `core.game_ui.get_loot_item_id`

Syntax

```lua
core.game_ui.get_loot_item_id(index: integer) -> integer
```

**Parameters**

- `index` : `integer` - The index of the loot item.

Returns

- `integer` : The ID of the lootable item.

Description

Retrieves the item ID of a lootable item at the specified index.

**Example Usage**

```lua
local item_id = core.game_ui.get_loot_item_id(0)
core.log("First loot item ID: " .. item_id)
```

---

### `core.game_ui.get_loot_item_name`

Syntax

```lua
core.game_ui.get_loot_item_name(index: integer) -> string
```

**Parameters**

- `index` : `integer` - The index of the loot item.

Returns

- `string` : The name of the lootable item.

Description

Retrieves the name of the lootable item at the specified index.

**Example Usage**

```lua
local item_name = core.game_ui.get_loot_item_name(0)
core.log("First loot item: " .. item_name)
```

---

### `core.game_ui.get_loot_roll_item_link`

Syntax

```lua
core.game_ui.get_loot_roll_item_link(roll_id: integer) -> string | nil
```

**Parameters**

- `roll_id` : `integer` - `args[1]` of the `START_LOOT_ROLL` [game event](/dev/api/events) .

Returns

- `string` : The full item link of the item being rolled for.
- `nil` : The roll is gone.

Description

What a group loot roll is for. `START_LOOT_ROLL` carries only the roll id and the timer, so without this you can answer a roll but not know what it is.

---

### `core.game_ui.get_loot_roll_item_info`

Syntax

```lua
core.game_ui.get_loot_roll_item_info(roll_id: integer) -> table | nil
```

**Parameters**

- `roll_id` : `integer` - `args[1]` of `START_LOOT_ROLL` .

Returns

| Field | Type | Description |
| --- | --- | --- |
| `name` | `string` | Item name |
| `count` | `integer` | Stack size |
| `quality` | `integer` | `0` poor to `5` legendary |
| `bind_on_pickup` | `boolean` | Binds when looted |
| `can_need` | `boolean` | **`false` means a need roll is refused** |
| `can_greed` | `boolean` |  |
| `can_disenchant` | `boolean` |  |
| `texture` | `integer \| string` | Icon |

`nil` when the roll is gone.

Description

Read `can_need` before rolling need: the client refuses a need roll on an item this character cannot need.

**Example Usage**

```lua
core.register_on_game_event_callback(function(event_name, args)
    if event_name ~= "START_LOOT_ROLL" then return end
    local info = core.game_ui.get_loot_roll_item_info(args[1])
    if info and info.can_need and info.quality >= 3 then
        core.input.roll_on_loot(args[1], 1) -- need
    else
        core.input.roll_on_loot(args[1], 2) -- greed
    end
end)
```

---

### `core.game_ui.get_loot_is_gold`

Syntax

```lua
core.game_ui.get_loot_is_gold(index: integer) -> boolean
```

**Parameters**

- `index` : `integer` - The index of the loot item.

Returns

- `boolean` : `true` if the item is gold; otherwise, `false` .

Description

Checks if the lootable item at the specified index is gold.

**Example Usage**

```lua
if core.game_ui.get_loot_is_gold(0) then
    core.log("First loot slot contains gold!")
end
```

---

## Loot Window - Complete Example

```lua
local function process_loot()
    local count = core.game_ui.get_loot_item_count()
    
    for i = 0, count - 1 do
        if core.game_ui.get_loot_is_gold(i) then
            core.log("Slot " .. i .. ": Gold")
        else
            local name = core.game_ui.get_loot_item_name(i)
            local id = core.game_ui.get_loot_item_id(i)
            core.log("Slot " .. i .. ": " .. name .. " (ID: " .. id .. ")")
        end
    end
end
```

---

## Battlefield Functions ⚔️

> [!WARNING]
> On Classic Era, Titan (China) and the private-server clients (Vanilla 1.14 / TBC 2.5.3) every function in this section returns `nil` (`get_match_pvp_stat_columns` returns an empty table). On the other versions:
>
> | Function | Works on |
> | --- | --- |
> | `get_battlefield_status`, `get_battlefield_winner`, `get_battlefield_arena_faction` | Retail, TBC Classic, MoP Classic, Forever |
> | `get_battlefield_run_time` | TBC Classic, MoP Classic, Forever (`nil` on Retail) |
> | `get_battlefield_state`, `get_active_match_state` | Retail, Forever (always `0` on TBC Classic and MoP Classic) |
> | `get_active_match_winner`, `get_match_pvp_stat_column(s)`, `get_active_match_personal_rated_info`, `get_score_info` | Retail, Forever (`nil` or empty on TBC Classic and MoP Classic) |

### `core.game_ui.get_battlefield_status`

Syntax

```lua
core.game_ui.get_battlefield_status(index: integer) -> string | nil
```

**Parameters**

- `index` : `integer` - The battlefield queue index.

Returns

- `string` : The status of the battlefield queue.

Description

Retrieves the status of a battlefield queue at the specified index.

**Possible Return Values:**

| Value | Description |
| --- | --- |
| `"confirm"` | Battlefield is ready to join |
| `"queued"` | Currently in queue |
| `"active"` | Currently in the battlefield |
| `"error"` | Error state |
| `"none"` | Not queued |

**Example Usage**

```lua
local status = core.game_ui.get_battlefield_status(1)
if status == "confirm" then
    core.log("Battlefield ready! Accept the queue.")
elseif status == "queued" then
    core.log("Waiting in queue...")
end
```

---

### `core.game_ui.get_battlefield_state`

Syntax

```lua
core.game_ui.get_battlefield_state() -> integer | nil
```

Returns

- `integer` : The current state of the battlefield.

Description

Retrieves the current state of the battlefield.

**State Values:**

| Value | Description |
| --- | --- |
| `2` | Preparation phase |
| `3` | Active/In progress |
| `5` | Finished |

**Example Usage**

```lua
local state = core.game_ui.get_battlefield_state()
if state == 2 then
    core.log("Battlefield starting soon - preparation phase")
elseif state == 3 then
    core.log("Battlefield in progress!")
elseif state == 5 then
    core.log("Battlefield finished")
end
```

---

### `core.game_ui.get_battlefield_run_time`

Syntax

```lua
core.game_ui.get_battlefield_run_time() -> number | nil
```

Returns

- `number` : Timer in milliseconds since the battlefield started.

Description

Retrieves the time elapsed since the battlefield started.

**Example Usage**

```lua
local run_time = core.game_ui.get_battlefield_run_time()
local minutes = math.floor(run_time / 60000)
local seconds = math.floor((run_time % 60000) / 1000)
core.log(string.format("Battlefield running for: %d:%02d", minutes, seconds))
```

---

### `core.game_ui.get_battlefield_winner`

Syntax

```lua
core.game_ui.get_battlefield_winner() -> integer|nil
```

Returns

- `integer|nil` : The winner of the battlefield, or `nil` if no winner yet.

Description

Retrieves the winner of the battlefield.

**Return Values:**

| Value | Description |
| --- | --- |
| `nil` | No winner yet (match in progress) |
| `0` | Horde won |
| `1` | Alliance won |
| `2` | Tie |

**Example Usage**

```lua
local winner = core.game_ui.get_battlefield_winner()
if winner == nil then
    core.log("Match still in progress")
elseif winner == 0 then
    core.log("Horde wins!")
elseif winner == 1 then
    core.log("Alliance wins!")
elseif winner == 2 then
    core.log("It's a tie!")
end
```

---

### `core.game_ui.get_active_match_winner`

Syntax

```lua
core.game_ui.get_active_match_winner() -> integer|nil
```

Returns

- `integer|nil` : The winning faction index, or `nil` if the match has no winner yet.

Description

Retrieves the faction index of the team that won the active PvP match (wraps `C_PvP.GetActiveMatchWinner`). Returns `nil` while the match is still in progress or when the C_PvP API is unavailable.

**Return Values:**

| Value | Description |
| --- | --- |
| `nil` | No winner yet (match in progress) or API unavailable |
| `0` | Horde won |
| `1` | Alliance won |

**Example Usage**

```lua
local winner = core.game_ui.get_active_match_winner()
if winner == 0 then
    core.log("Horde won the match!")
elseif winner == 1 then
    core.log("Alliance won the match!")
else
    core.log("Match still in progress")
end
```

---

### `core.game_ui.get_active_match_state`

Syntax

```lua
core.game_ui.get_active_match_state() -> integer | nil
```

Returns

- `integer` : The current PvP match state ( `Enum.PvPMatchState` ).

Description

Retrieves the current PvP match state (wraps `C_PvP.GetActiveMatchState`). This mirrors `get_battlefield_state` but is exposed under the C_PvP-style name for new logic. Returns `0` when the API is unavailable.

**State Values:**

| Value | Description |
| --- | --- |
| `0` | Inactive |
| `1` | Waiting |
| `2` | StartUp |
| `3` | Engaged |
| `4` | PostRound |
| `5` | Complete |

**Example Usage**

```lua
local state = core.game_ui.get_active_match_state()
if state == 3 then
    core.log("Match is engaged - fight!")
elseif state == 5 then
    core.log("Match complete")
end
```

---

### `core.game_ui.get_match_pvp_stat_column`

Syntax

```lua
core.game_ui.get_match_pvp_stat_column(pvp_stat_id: integer) -> pvp_stat_column|nil
```

**Parameters**

- `pvp_stat_id` : `integer` - The PvP stat ID of the column to fetch.

Returns

- `pvp_stat_column|nil` : The scoreboard stat column, or `nil` if not found / unavailable.

**`pvp_stat_column` Properties:**

| Field | Type | Description |
| --- | --- | --- |
| `pvp_stat_id` | `integer` | The PvP stat ID this column reports |
| `column_header_id` | `integer` | The column header ID |
| `order_index` | `integer` | The display order index of the column |
| `name` | `string` | The localized column name |
| `tooltip_title` | `string` | The tooltip title for the column header |
| `tooltip` | `string` | The tooltip body text for the column header |

Description

Retrieves a single PvP scoreboard stat column by its PvP stat ID (wraps `C_PvP.GetMatchPVPStatColumn`).

**Example Usage**

```lua
local column = core.game_ui.get_match_pvp_stat_column(123)
if column then
    core.log("Column: " .. column.name)
end
```

---

### `core.game_ui.get_match_pvp_stat_columns`

Syntax

```lua
core.game_ui.get_match_pvp_stat_columns() -> pvp_stat_column[]
```

Returns

- `pvp_stat_column[]` : An array of scoreboard stat column tables (empty if none / unavailable). Each element has the same `pvp_stat_column` fields as `core.game_ui.get_match_pvp_stat_column` .

Description

Retrieves every PvP scoreboard stat column for the active match (wraps `C_PvP.GetMatchPVPStatColumns`). The columns describe the scoreboard layout (kills, damage, healing, etc.) for the current battleground or arena.

**Example Usage**

```lua
local columns = core.game_ui.get_match_pvp_stat_columns()
for _, column in ipairs(columns) do
    core.log(string.format("[%d] %s", column.order_index, column.name))
end
```

---

### `core.game_ui.get_battlefield_arena_faction`

Syntax

```lua
core.game_ui.get_battlefield_arena_faction() -> integer | nil
```

Returns

- `integer | nil` : `0` = Horde, `1` = Alliance (your arena/battleground team), or `nil` if unavailable / not in a match.

Description

Returns the player's arena/battleground team faction (wraps `GetBattlefieldArenaFaction`). Useful for coloring friendly vs enemy scoreboard rows relative to your own team.

**Example Usage**

```lua
local my_faction = core.game_ui.get_battlefield_arena_faction()
if my_faction then
    core.log(my_faction == 0 and "On Horde team" or "On Alliance team")
end
```

---

### `core.game_ui.get_active_match_personal_rated_info`

Syntax

```lua
core.game_ui.get_active_match_personal_rated_info() -> pvp_personal_rated_info | nil
```

Returns

- `pvp_personal_rated_info | nil` : The player's rated info for the active match, or `nil` outside a rated match.

| Field | Type | Description |
| --- | --- | --- |
| `personal_rating` | `integer` | Current personal rating for the active bracket |
| `best_season_rating` | `integer` | Best rating achieved this season |
| `best_weekly_rating` | `integer` | Best rating achieved this week |
| `season_played` | `integer` | Matches played this season |
| `season_won` | `integer` | Matches won this season |
| `weekly_played` | `integer` | Matches played this week |
| `weekly_won` | `integer` | Matches won this week |
| `last_weeks_best_rating` | `integer` | Best rating from last week |
| `has_won_bracket_today` | `boolean` | Whether a match in this bracket was won today |
| `tier` | `integer` | Current tier ID |
| `ranking` | `integer` | Ladder ranking |
| `rounds_season_played` | `integer` | Solo‑shuffle rounds played this season (0 before patch 10.0) |
| `rounds_season_won` | `integer` | Solo‑shuffle rounds won this season (0 before patch 10.0) |
| `rounds_weekly_played` | `integer` | Solo‑shuffle rounds played this week (0 before patch 10.0) |
| `rounds_weekly_won` | `integer` | Solo‑shuffle rounds won this week (0 before patch 10.0) |

Description

Returns the player's rated info for the active match (wraps `C_PvP.GetPVPActiveMatchPersonalRatedInfo`).

**Example Usage**

```lua
local rated = core.game_ui.get_active_match_personal_rated_info()
if rated then
    core.log(string.format("Rating: %d (season: %d-%d)",
        rated.personal_rating, rated.season_won, rated.season_played - rated.season_won))
end
```

---

### `core.game_ui.get_score_info`

Syntax

```lua
core.game_ui.get_score_info(index: integer) -> pvp_score_info | nil
```

**Parameters**

- `index` : `integer` - 1‑based scoreboard row index.

Returns

- `pvp_score_info | nil` : The scoreboard row, or `nil` if not found / unavailable.

| Field | Type | Description |
| --- | --- | --- |
| `name` | `string` | Player name (may include realm) |
| `guid` | `string` | Player GUID |
| `killing_blows` | `integer` | Killing blows |
| `honorable_kills` | `integer` | Honorable kills |
| `deaths` | `integer` | Deaths |
| `honor_gained` | `integer` | Honor gained this match |
| `faction` | `integer` | Faction index (0 = Horde, 1 = Alliance) |
| `race_name` | `string` | Localized race name |
| `class_name` | `string` | Localized class name |
| `class_token` | `string` | Locale‑independent class token (e.g. `"MAGE"`) |
| `damage_done` | `integer` | Total damage done |
| `healing_done` | `integer` | Total healing done |
| `rating` | `integer` | Current rating |
| `rating_change` | `integer` | Rating change from this match |
| `prematch_mmr` | `integer` | Matchmaking rating before the match |
| `mmr_change` | `integer` | Matchmaking rating change from this match |
| `postmatch_mmr` | `integer` | Matchmaking rating after the match |
| `talent_spec` | `string` | Localized talent specialization name |
| `honor_level` | `integer` | Honor level |
| `role_assigned` | `integer` | Assigned role ID |
| `num_stats` | `integer` | Number of entries in the (unmarshalled) per‑row stats array |

Description

Returns a scoreboard row for the active match by index (wraps `C_PvP.GetScoreInfo`). The nested per‑row `stats` (`PVPStatInfo[]`) array is not marshalled; only its length is exposed via `num_stats`. Combine with `core.game_ui.get_match_pvp_stat_columns` to interpret the scoreboard layout.

**Example Usage**

```lua
-- Print every scoreboard row's name, class and damage
local index = 1
while true do
    local row = core.game_ui.get_score_info(index)
    if not row then break end
    core.log(string.format("%s (%s): %d dmg, %d healing",
        row.name, row.class_token, row.damage_done, row.healing_done))
    index = index + 1
end
```

---

## Cursor Functions 🖱️

### `core.game_ui.get_wow_cursor_position`

Syntax

```lua
core.game_ui.get_wow_cursor_position() -> vec2
```

Returns

- `vec2` : The cursor position in WoW UI coordinates.

Description

Retrieves the current WoW cursor position in UI coordinates.

**Example Usage**

```lua
local cursor = core.game_ui.get_wow_cursor_position()
core.log(string.format("WoW Cursor: (%.2f, %.2f)", cursor.x, cursor.y))
```

---

### `core.game_ui.get_normalized_cursor_position`

Syntax

```lua
core.game_ui.get_normalized_cursor_position() -> vec2
```

Returns

- `vec2` : The cursor position normalized to 0-1 range.

Description

Retrieves the current cursor position in normalized coordinates (0-1 range).

**Example Usage**

```lua
local cursor = core.game_ui.get_normalized_cursor_position()
-- cursor.x and cursor.y will be between 0 and 1
core.log(string.format("Normalized Cursor: (%.3f, %.3f)", cursor.x, cursor.y))
```

---

### `core.game_ui.normalize_ui_position`

Syntax

```lua
core.game_ui.normalize_ui_position(pos: vec2) -> vec2
```

**Parameters**

- `pos` : `vec2` - The UI position to normalize.

Returns

- `vec2` : The normalized position (0-1 range).

Description

Normalizes a UI position to the 0-1 range.

**Example Usage**

```lua
local ui_pos = vec2.new(960, 540)
local normalized = core.game_ui.normalize_ui_position(ui_pos)
core.log(string.format("Normalized: (%.3f, %.3f)", normalized.x, normalized.y))
```

---

## Map Functions 🗺️

### `core.game_ui.get_current_map_id`

Syntax

```lua
core.game_ui.get_current_map_id() -> integer
```

Returns

- `integer` : The ID of the current map.

Description

Retrieves the ID of the current map from the game UI context.

**Example Usage**

```lua
local map_id = core.game_ui.get_current_map_id()
core.log("Current UI map ID: " .. map_id)
```

---

### `core.game_ui.is_map_open`

Syntax

```lua
core.game_ui.is_map_open() -> boolean
```

Returns

- `boolean` : `true` if the world map is currently open; otherwise, `false` .

Description

Checks whether the world map UI is currently open.

**Example Usage**

```lua
if core.game_ui.is_map_open() then
    core.log("Map is open - player is checking their location")
else
    core.log("Map is closed")
end
```

**Example: Pause Navigation While Map Open**

```lua
local function update_navigation()
    -- Don't process movement while player is looking at the map
    if core.game_ui.is_map_open() then
        return
    end
    
    -- Continue with navigation logic...
    movement:process()
end
```

---

### `core.game_ui.get_world_pos_from_map_pos`

Syntax

```lua
core.game_ui.get_world_pos_from_map_pos(map_id: integer, map_pos: vec2) -> vec2, integer
```

**Parameters**

- `map_id` : `integer` - The map ID.
- `map_pos` : `vec2` - The position on the map (normalized 0-1 coordinates).

Returns

- `vec2` : The X/Y world position (Z height not included).
- `integer` : The continent (instance map id) the map belongs to, `0` when unknown. Added October 2026; callers that read only the first value are unaffected. Compare it with your own continent before walking to a waypoint.

Description

Converts a map position to world coordinates. Returns a `vec2` with X and Y in 3D world format - note that the Z (height) component is not included.

**Example Usage**

```lua
local map_id = core.game_ui.get_current_map_id()
local map_pos = vec2.new(0.5, 0.5) -- Center of the map
local world_pos = core.game_ui.get_world_pos_from_map_pos(map_id, map_pos)
core.log(string.format("World position: (%.2f, %.2f)", world_pos.x, world_pos.y))

-- To get the Z coordinate, measure from above the ground. The ray starts only probe_up yards
-- above the z you pass (2 by default), so z = 0 on its own misses any ground higher than that.
local full_pos = vec3.new(world_pos.x, world_pos.y, 0)
local height = core.get_height_for_position(full_pos, { probe_up = 1000 })
```

See [`core.get_height_for_position`](/dev/api/core#coreget_height_for_position) for the traps: the ray stops on the first surface it meets (a roof, a bridge), ignores water unless you ask for it, and answers `0` on a miss.

---

### `core.game_ui.get_map_at_position`

Syntax

```lua
core.game_ui.get_map_at_position(x: number, y: number) -> table | nil
```

**Parameters**

- `x` , `y` : `number` - A world position.

Returns

| Field | Type | Description |
| --- | --- | --- |
| `ui_map_id` | `integer` | The most specific map at that point |
| `name` | `string` | Its name, e.g. `"Razor Hill"` |
| `map_type` | `integer` | The client's `Enum.UIMapType` |

`nil` for a position the client cannot place.

Description

Names the zone of any world position without an offline zone table.

> [!WARNING]
> The lookup runs against the continent you are on. A position on another continent answers `nil` rather than a wrong zone.

> [!NOTE]
> Also `nil` inside a dungeon that has no UI map of its own, which is common on the classic-family clients (Classic Era, TBC Classic, Forever). That is the game's own answer, not a fault: such an instance has no map to name. For its bosses use [`core.world.get_encounters_for_instance`](/dev/api/world#coreworldget_encounters_for_instance).

**Example Usage**

```lua
local here = core.object_manager.get_local_player():get_position()
local map = core.game_ui.get_map_at_position(here.x, here.y)
if map then core.log(map.name) end
```

---

### `core.game_ui.get_hyperlink_tooltip`

Syntax

```lua
core.game_ui.get_hyperlink_tooltip(hyperlink: string | integer) -> table[]
```

**Parameters**

- `hyperlink` : `string | integer` - Any WoW hyperlink, usually an item link, or an item id (core 2.135+; older cores returned `{}` for a number). Any text is safe.

Returns

Each line, top to bottom: `left_text`, `left_r`, `left_g`, `left_b`, `right_text`, `right_r`, `right_g`, `right_b`. An empty table when unavailable.

Description

The tooltip the client would show for a link, with colours, without showing it. This is where red "cannot equip" lines, unique limits, class restrictions and Use / Equip effects live; none of those are in `get_item_stats`.

> [!NOTE]
> Read through `C_TooltipInfo` where the game has it, otherwise through a hidden tooltip the core keeps to itself (TBC 2.5.6 and the other Classic versions). `core.auction_house.get_item_tooltip` reads by item id and is not available on Classic; this one takes the full link, so random suffixes are kept. For the exact item sitting in a bag slot, use `get_container_item_tooltip`.

**Example Usage**

```lua
for _, line in ipairs(core.game_ui.get_hyperlink_tooltip(link)) do
    local red = line.left_r > 0.9 and line.left_g < 0.2
    if red then core.log("blocked: " .. line.left_text) end
end
```

---

### `core.game_ui.get_container_item_tooltip`

Syntax

```lua
core.game_ui.get_container_item_tooltip(container_id: integer, slot_id: integer) -> table[]
```

**Parameters**

- `container_id` : `integer` - The bag: `0` is the backpack, `1` to `4` the equipped bags.
- `slot_id` : `integer` - The slot in that bag, as `inventory_helper` reports it ( `bag_slot` ).

Returns

Each line, top to bottom: `left_text`, `left_r`, `left_g`, `left_b`, `right_text`, `right_r`, `right_g`, `right_b`. An empty table for an empty slot.

Description

The tooltip of the exact item in a bag slot, read without hovering it: random suffix, enchant, durability, charges and soulbound state, which an `"item:<id>"` link cannot carry. Same bag and slot numbers as `core.inventory` and `core.input.use_container_item`. Needs core 2.135 or newer.

---

### `core.game_ui.get_file_id_from_path`

Syntax

```lua
core.game_ui.get_file_id_from_path(path: string) -> integer | nil
```

Returns

- `integer | nil` : The game's file id for that texture, or `nil` when the game does not know it.

Description

Turns a texture path or icon name into the number the game uses for it. On TBC 2.5.6 the icon getters (`get_spell_icon_name`, `core.auction_house.get_item_icon_name`) return these numbers, not names, so a plugin that keys its icon cache by name converts each name once with this and compares numbers. A bare name such as `"Spell_Nature_Regeneration"` is also tried under `InterfaceIcons`. Try with and without the file extension. Needs core 2.135 or newer.

---

### `core.game_ui.get_cursor_info`

Syntax

```lua
core.game_ui.get_cursor_info() -> table | nil
```

Returns

- `table` : `type` ( `"item"` , `"spell"` , `"money"` , `"macro"` , ...) and `data1` to `data3` , the client's own values. For `"item"` , `data1` is the item id and `data2` the link.
- `nil` : The cursor is empty.

Description

What is on the cursor. `has_cursor_item` only says yes or no.

---

### `core.game_ui.get_action_info`

Syntax

```lua
core.game_ui.get_action_info(slot: integer) -> table | nil
```

**Parameters**

- `slot` : `integer` - Action slot, `1` to `120` .

Returns

- `table` : `type` ( `"spell"` , `"item"` , `"macro"` , ...), `id` , `sub_type` .
- `nil` : The slot is empty.

Description

What sits in an action bar slot. Use it with `core.input.pickup_spell` and `core.input.place_action` to set up bars.

---

### `core.game_ui.get_map_top_left`

Syntax

```lua
core.game_ui.get_map_top_left() -> vec2
```

Returns

- `vec2` : The top-left corner of the world map frame in UI coordinates.

Description

Returns the top-left corner position of the world map frame in UI coordinates.

> [!WARNING]
> On Retail and Forever both map corners are also multiplied by the UI scale, because their world map inherits it. On the other Classic versions they are not, because the classic map ignores the UI scale, so do not reuse Retail constants built on these values.
>
> Forever joined the Retail side in the core update of 2026-10-06. Before that its corners were wrong at any UI scale other than `1`.

---

### `core.game_ui.get_map_bottom_right`

Syntax

```lua
core.game_ui.get_map_bottom_right() -> vec2
```

Returns

- `vec2` : The bottom-right corner of the world map frame in UI coordinates.

Description

Returns the bottom-right corner position of the world map frame in UI coordinates. Same Retail and Classic unit difference as `get_map_top_left`.

---

### `core.game_ui.ui_pos_to_screen_pos`

Syntax

```lua
core.game_ui.ui_pos_to_screen_pos(ui_pos: vec2) -> vec2
```

**Parameters**

- `ui_pos` : `vec2` - The position in UI coordinates.

Returns

- `vec2` : The corresponding screen-space position in pixels.

Description

Converts a UI-space position to screen-space pixel coordinates.

---

### `core.game_ui.world_pos_to_map_pos_normalized`

Syntax

```lua
core.game_ui.world_pos_to_map_pos_normalized(world_pos: vec3) -> vec2
```

**Parameters**

- `world_pos` : `vec3` - A world position.

Returns

- `vec2` : The normalized map position (0-1 range).

Description

Converts a 3D world position to normalized map coordinates.

---

## UI Scale Functions 📐

### `core.game_ui.get_effective_scale`

Syntax

```lua
core.game_ui.get_effective_scale() -> number
```

Returns

- `number` : The effective UI scale factor.

Description

Retrieves the effective UI scale factor. This is used internally to convert between raw UI coordinates and screen-space coordinates.

**Example Usage**

```lua
local scale = core.game_ui.get_effective_scale()
core.log("Effective UI scale: " .. scale)
```

---

## Vendor Functions 🏪

### `core.game_ui.get_vendor_item_count`

Syntax

```lua
core.game_ui.get_vendor_item_count() -> integer
```

Returns

- `integer` : The total number of items the current vendor has for sale.

Description

Returns how many items the currently open vendor window contains.

**Example Usage**

```lua
local count = core.game_ui.get_vendor_item_count()
core.log("Vendor has " .. count .. " items for sale")
```

---

### `core.game_ui.get_vendor_item_info`

Syntax

```lua
core.game_ui.get_vendor_item_info(vendor_item_id: integer) -> vendor_item_info
```

**Parameters**

- `vendor_item_id` : `integer` - The 1-based index of the vendor item.

Returns

- `vendor_item_info` : A table containing the vendor item details.

**`vendor_item_info` Properties:**

| Field | Type | Description |
| --- | --- | --- |
| `cost` | `integer` | The cost of the item in copper |
| `is_usable` | `boolean` | Whether the item is usable by the player |
| `item_id` | `integer` | The item ID |
| `item_name` | `string` | The name of the item |
| `quantity` | `integer` | The quantity available |
| `vendor_item_index` | `integer` | The vendor slot index |

Description

Retrieves detailed information about a specific vendor item. The `vendor_item_id` parameter is 1-indexed (internally adjusted to 0-indexed).

Works on every client. `get_vendor_item_count` works everywhere too.

> [!NOTE]
> Before the core update of 2026-10-06, every call on Retail and Forever returned `cost` `0`, `item_id` `0`, an empty `item_name` and `vendor_item_index` `0`, with no error, because those two clients no longer have the game function the core read. The core now reads their replacement.

**Example Usage**

```lua
local count = core.game_ui.get_vendor_item_count()
for i = 1, count do
    local info = core.game_ui.get_vendor_item_info(i)
    local gold = math.floor(info.cost / 10000)
    local silver = math.floor((info.cost % 10000) / 100)
    core.log(string.format("%s - %dg %ds (qty: %d)", info.item_name, gold, silver, info.quantity))
end
```

---

## Death & Resurrection Functions 💀

### `core.game_ui.get_resurrect_corpse_delay`

Syntax

```lua
core.game_ui.get_resurrect_corpse_delay() -> number
```

Returns

- `number` : The delay in seconds before resurrection is possible.

Description

Retrieves the remaining time before the player can resurrect at their corpse.

**Example Usage**

```lua
local delay = core.game_ui.get_resurrect_corpse_delay()
if delay > 0 then
    core.log("Can resurrect in " .. delay .. " seconds")
else
    core.log("Ready to resurrect!")
end
```

---

### `core.game_ui.get_corpse_position`

Syntax

```lua
core.game_ui.get_corpse_position() -> vec3
```

Returns

- `vec3` : The position of the player's corpse. A zero vector `(0, 0, 0)` means there is no corpse.

Description

Retrieves the position of the player's corpse as a 3D vector.

> [!WARNING]
> On Forever this currently answers `inf` for x and y, so check for `math.huge` before using it. A fix is coming in a later core update: it will read the same corpse marker the world map shows whenever the direct read fails. On that path the height (`z`) will be the ground below the corpse, or your own height when the area is too far away to be loaded yet, so treat `z` as approximate until you get close.

**Example Usage**

```lua
local corpse_pos = core.game_ui.get_corpse_position()
if corpse_pos.x == 0 and corpse_pos.y == 0 then
    core.log("No corpse")
    return
end
core.log(string.format("Corpse at: (%.2f, %.2f, %.2f)", corpse_pos.x, corpse_pos.y, corpse_pos.z))

-- Calculate distance to corpse
local player = core.object_manager.get_local_player()
if player then
    local player_pos = player:get_position()
    local distance = player_pos:dist_to(corpse_pos)
    core.log("Distance to corpse: " .. string.format("%.1f", distance) .. " yards")
end
```

---

## Quest Log Functions 📜

### Quest log

> [!DANGER]
> This page documented both, with a worked example, and neither has ever been registered by the core. Calling either returns `nil`. They were listed as added in an old core version, removed again, and this page was never updated, which cost a plugin author real time in September 2026.
>
> The quest log lives on [`core.quests`](/dev/api/quests), not on `core.game_ui`:
>
> ```lua
> for i = 1, core.quests.get_num_quest_log_entries() do
>     local entry = core.quests.get_quest_log_title(i)
>     core.log(entry.title)
> end
> ```
>
> `core.quests.select_quest_log_entry`, `core.quests.get_num_quest_leader_boards` and the quest-ID functions such as `core.quests.get_quest_log_quest_ids` are the rest of that surface. They work on every client, Forever included, since the core update of 2026-10-06.

---

### `core.game_ui.get_all_completed_quest_ids`

Syntax

```lua
core.game_ui.get_all_completed_quest_ids() -> integer[]
```

Returns

- `integer[]` : An array of completed quest IDs.

Description

Returns a list of all quest IDs the player has completed. This queries the server's completed quest history, not just the current quest log. Works on every client.

The order is not meaningful, so treat the result as a set. It can hold tens of thousands of IDs on an old Retail character: build a lookup table once instead of calling this for every check, or use [`core.quests.is_quest_flagged_completed`](/dev/api/quests#corequestsis_quest_flagged_completed) for a single ID.

> [!NOTE]
> Before the core update of 2026-10-06 the list was always empty on Retail and Forever, and empty on every client once a character had more than about 8000 completed quests.

**Example Usage**

```lua
local completed = core.game_ui.get_all_completed_quest_ids()
core.log("Total completed quests: " .. #completed)

-- Build a lookup table once, then check as many quests as you like
local is_completed = {}
for _, quest_id in ipairs(completed) do
    is_completed[quest_id] = true
end

local target_quest_id = 12345
if is_completed[target_quest_id] then
    core.log("Quest " .. target_quest_id .. " has been completed!")
end
```

---

## Complete Examples 📚

### Example: Auto-Loot System

```lua
local function auto_loot()
    local count = core.game_ui.get_loot_item_count()
    if count == 0 then return end
    
    for i = 0, count - 1 do
        -- Always loot gold
        if core.game_ui.get_loot_is_gold(i) then
            core.input.loot_item(i)
        else
            local item_id = core.game_ui.get_loot_item_id(i)
            -- Add your item filter logic here
            if should_loot_item(item_id) then
                core.input.loot_item(i)
            end
        end
    end
end
```

### Example: Battlefield Status Monitor

```lua
local function check_battlefield_status()
    -- Check all queue slots
    for i = 1, 3 do
        local status = core.game_ui.get_battlefield_status(i)
        
        if status == "confirm" then
            core.graphics.add_notification(
                "bg_ready_" .. i,
                "Battlefield Ready!",
                "Queue " .. i .. " is ready to join",
                5000,
                color.new(0, 255, 0, 255)
            )
        end
    end
    
    -- If in battlefield, show timer
    local state = core.game_ui.get_battlefield_state()
    if state == 3 then -- Active
        local run_time = core.game_ui.get_battlefield_run_time()
        local minutes = math.floor(run_time / 60000)
        local seconds = math.floor((run_time % 60000) / 1000)
        -- Display timer...
    end
end
```

### Example: Corpse Run Helper

```lua
local function corpse_run_helper()
    local player = core.object_manager.get_local_player()
    if not player or not player:is_dead() then return end
    
    local corpse_pos = core.game_ui.get_corpse_position()
    local player_pos = player:get_position()
    local distance = player_pos:dist_to(corpse_pos)
    
    -- Draw line to corpse
    core.graphics.line_3d(player_pos, corpse_pos, color.new(255, 255, 0, 200), 2)
    
    -- Draw circle at corpse
    core.graphics.circle_3d(corpse_pos, 5, color.new(255, 255, 0, 200), 2)
    
    -- Show distance
    local screen_pos = core.graphics.w2s(corpse_pos)
    if screen_pos then
        core.graphics.text_2d(
            string.format("%.0f yards", distance),
            screen_pos,
            16,
            color.new(255, 255, 255, 255),
            true
        )
    end
    
    -- Check resurrection delay
    local delay = core.game_ui.get_resurrect_corpse_delay()
    if delay > 0 then
        core.log("Wait " .. delay .. " seconds to resurrect")
    end
end
```

### Example: Vendor Auto-Buy

```lua
local function buy_from_vendor(item_name, quantity)
    local count = core.game_ui.get_vendor_item_count()
    for i = 1, count do
        local info = core.game_ui.get_vendor_item_info(i)
        if info.item_name == item_name and info.is_usable then
            core.input.buy_item(i, quantity)
            local gold = math.floor(info.cost * quantity / 10000)
            core.log(string.format("Bought %dx %s for %dg", quantity, item_name, gold))
            return true
        end
    end
    core.log("Item not found at vendor: " .. item_name)
    return false
end
```

---

## Instance Functions 🔄

### `core.game_ui.reset_instances`

Syntax

```lua
core.game_ui.reset_instances() -> nil
```

Description

Resets all instances for the local player.

**Example Usage**

```lua
core.game_ui.reset_instances()
core.log("All instances have been reset")
```

---

## Tooltip Functions 💬

### `core.game_ui.get_tooltip_info`

Syntax

```lua
core.game_ui.get_tooltip_info() -> tooltip_info
```

Returns

- `tooltip_info` : A table containing the current tooltip information.

**`tooltip_info` Properties:**

| Field | Type | Description |
| --- | --- | --- |
| `type` | `string` | The tooltip type: `"unit"`, `"spell"`, `"item"`, or `""` |
| `id` | `integer` | The ID of the tooltip subject |
| `name` | `string` | The name of the tooltip subject |
| `num_lines` | `integer` | The number of lines in the tooltip |
| `lines` | `table[]` | Text and colour of every line as shown, up to 64 (core 2.135+). Same shape as `get_hyperlink_tooltip` |

Description

Retrieves information about the currently displayed tooltip. For an item under the cursor, `lines` is that exact item: random suffix, durability, and the red requirement lines for your character.

**Example Usage**

```lua
local info = core.game_ui.get_tooltip_info()
if info.type ~= "" then
    core.log(string.format("Tooltip: %s - %s (ID: %d)", info.type, info.name, info.id))
end
```

---

### `core.game_ui.setup_tooltip_processor`

> [!WARNING]
> Removed on May 10, 2026 in core 1.930+. This field will be `nil` at runtime. Do not call it.

Syntax

```lua
core.game_ui.setup_tooltip_processor() -> boolean
```

Returns

- `boolean` : `true` if the tooltip processor was set up successfully, `false` otherwise.

Description

Sets up the tooltip data processor hook for displaying IDs in tooltips.

**Example Usage**

```lua
local success = core.game_ui.setup_tooltip_processor()
if success then
    core.log("Tooltip processor initialized")
end
```

---

### `core.game_ui.set_tooltip_npc_id`

> [!WARNING]
> Removed on May 10, 2026 in core 1.930+. This field will be `nil` at runtime. Do not call it.

Syntax

```lua
core.game_ui.set_tooltip_npc_id(npc_id: integer) -> nil
```

**Parameters**

- `npc_id` : `integer` - The NPC ID to set as fallback for the tooltip processor.

Description

Sets a fallback NPC ID for the tooltip processor.

**Example Usage**

```lua
core.game_ui.set_tooltip_npc_id(12345)
```

---

### `core.game_ui.add_tooltip_line`

Syntax

```lua
core.game_ui.add_tooltip_line(text: string, r?: number, g?: number, b?: number) -> nil
```

**Parameters**

- `text` : `string` - The text to add to the tooltip.
- `r` (optional): `number` - Red color component (0.0-1.0). Defaults to 1.0.
- `g` (optional): `number` - Green color component (0.0-1.0). Defaults to 1.0.
- `b` (optional): `number` - Blue color component (0.0-1.0). Defaults to 0.0.

Description

Adds a colored line to the GameTooltip. Default color is yellow (1.0, 1.0, 0.0).

**Example Usage**

```lua
core.game_ui.add_tooltip_line("Custom info line", 0.0, 1.0, 0.0)
```

---

### `core.game_ui.add_tooltip_double_line`

Syntax

```lua
core.game_ui.add_tooltip_double_line(left_text: string, right_text: string, lr?: number, lg?: number, lb?: number, rr?: number, rg?: number, rb?: number) -> nil
```

**Parameters**

- `left_text` : `string` - The left-side text.
- `right_text` : `string` - The right-side text.
- `lr` (optional): `number` - Left text red component (0.0-1.0).
- `lg` (optional): `number` - Left text green component (0.0-1.0).
- `lb` (optional): `number` - Left text blue component (0.0-1.0).
- `rr` (optional): `number` - Right text red component (0.0-1.0).
- `rg` (optional): `number` - Right text green component (0.0-1.0).
- `rb` (optional): `number` - Right text blue component (0.0-1.0).

Description

Adds a double-line entry to the GameTooltip with separate left and right text, each with optional color.

**Example Usage**

```lua
core.game_ui.add_tooltip_double_line("Item Level", "450", 1.0, 1.0, 1.0, 0.0, 1.0, 0.0)
```

---

## Countdown

### `core.game_ui.do_countdown`

Syntax

```lua
core.game_ui.do_countdown(seconds: integer) -> boolean
```

**Parameters**

- `seconds` : `integer` - The countdown duration in seconds.

Returns

- `boolean` : Whether the countdown was started successfully.

Description

Starts a countdown timer in the party or raid group using `C_PartyInfo.DoCountdown`.

**Example Usage**

```lua
-- Start a 10 second countdown
local success = core.game_ui.do_countdown(10)
```

---

## Talents

### `core.game_ui.get_talent_info`

Syntax

```lua
core.game_ui.get_talent_info(arg1: integer, arg2: integer, arg3?: integer) -> table
```

**Parameters**

- `arg1` : `integer` - Tab index (Classic) or tier (Retail).
- `arg2` : `integer` - Talent index (Classic) or column (Retail).
- `arg3` (optional): `integer` - Is inspect flag (Classic) or spec group index (Retail).

Returns

- `table` : Talent information. Fields vary by game version:

**Classic fields:**

| Field | Type | Description |
| --- | --- | --- |
| `name` | `string` | The talent name |
| `texture` | `integer` | The icon texture ID |
| `tier` | `integer` | The talent tier |
| `column` | `integer` | The talent column |
| `rank` | `integer` | Current rank |
| `max_rank` | `integer` | Maximum rank |
| `is_exceptional` | `boolean` | Whether the talent is exceptional |
| `available` | `boolean` | Whether the talent is available |

**Retail fields:**

| Field | Type | Description |
| --- | --- | --- |
| `talent_id` | `integer` | The talent ID |
| `name` | `string` | The talent name |
| `texture` | `integer` | The icon texture ID |
| `selected` | `boolean` | Whether the talent is selected |
| `available` | `boolean` | Whether the talent is available |
| `spell_id` | `integer` | Associated spell ID |
| `row` | `integer` | The talent row |
| `column` | `integer` | The talent column |
| `known` | `boolean` | Whether the talent is known |

Description

Returns talent information for a given talent position. The return format is automatically detected based on the game version (Classic vs Retail).

> [!WARNING]
> Since core 2.134 this works whether or not the game's "load deprecation fallbacks" setting is on (older cores returned an empty table with it off).
>
> - **Classic Era and TBC Classic:** `is_exceptional` is never set, and `available` holds the talent's preview rank, not whether it is available. Read `rank` and `max_rank` only.
> - **MoP Classic:** you pass `(tab, talent_index)` , you get the Classic fields and no `talent_id` , and the game itself marks `rank` and `max_rank` as unreliable on this version.
> - **Forever:** uses talent trees like Retail. Use `get_active_talents` and `get_talent_node_info` instead.

**Example Usage**

```lua
-- Classic: get info for tab 1, talent 3
local info = core.game_ui.get_talent_info(1, 3)
print(info.name, info.rank .. "/" .. info.max_rank)

-- Retail: get info for tier 2, column 1, active spec
local info = core.game_ui.get_talent_info(2, 1, 1)
print(info.name, info.spell_id)
```

---

### `core.game_ui.get_active_talents`

Syntax

```lua
core.game_ui.get_active_talents() -> active_talent_entry[]
```

Returns

- `active_talent_entry[]` - Array of tables, each containing:

| Field | Type | Description |
| --- | --- | --- |
| `node_id` | `integer` | The talent node ID. |
| `spell_id` | `integer` | The spell ID associated with the talent. |
| `name` | `string` | The talent name. |
| `rank` | `integer` | The current rank purchased. |
| `max_rank` | `integer` | The maximum rank available. |

Description

Returns all active talent nodes for the player using the retail 10.0+ C_Traits API. Each entry represents a talent node with at least 1 rank purchased, including the talent rank. Returns an empty table on classic.

> [!WARNING]
> Forever uses the same talent trees as Retail, so this and the other talent tree functions below (`get_talent_tree_ids`, `get_talent_tree_nodes`, `get_talent_node_info`, `can_purchase_talent_rank`) answer there too. They return empty, `nil` or `false` on Classic Era, TBC Classic, MoP Classic and Titan (China).

**Example Usage**

```lua
local talents = core.game_ui.get_active_talents()
for _, t in ipairs(talents) do
    print(t.name, t.spell_id, t.rank .. "/" .. t.max_rank)
end
```

---

### `core.game_ui.learn_talent`

Syntax

```lua
core.game_ui.learn_talent(arg1: integer, arg2?: integer) -> boolean
```

**Parameters**

- `arg1` : `integer` - Tab index (talent trees), talent id (MoP), or node id (Midnight).
- `arg2` (optional): `integer` - Talent index (talent trees) or entry id (Midnight choice nodes). Omit on the one-argument forms.

Returns

- `boolean` : `true` when the client accepted the request. See the warning below, this is not the same claim on every version.

Description

Spends a talent point, or picks a trait entry, whichever the running client has. WoW has shipped four different talent systems and this is one call for all of them, so the two arguments mean different things per version. They are the same numbers the matching read function already gave you.

| Client | Call | Where the numbers come from |
| --- | --- | --- |
| 1.12, 1.14, 1.15, 2.5 | `learn_talent(tab_index, talent_index)` | both 1 based, `get_num_talent_tabs` and `get_num_talents` |
| MoP 5.5 | `learn_talent(talent_id)` | the `talent_id` field of `get_talent_info(tier, column, spec_group)` |
| Midnight 12.1, normal node | `learn_talent(node_id)` | `get_talent_tree_nodes` or `get_active_talents` |
| Midnight 12.1, choice node | `learn_talent(node_id, entry_id)` | `entry_ids` from `get_talent_node_info` |

> [!WARNING]
> Forever has the same talent trees as Retail, so use the Midnight rows there. On MoP Classic, `get_talent_info` returns no `talent_id` (see its warning), so the MoP row cannot be fed from it.

On Midnight the purchase is staged into the pending config and then committed in the same call, so there is no separate commit step to remember. A node whose `node_type` is `2` is a choice node and needs the entry id; anything else does not.

> [!WARNING]
> On the talent tree and MoP clients the underlying `LearnTalent` returns nothing at all, so `true` means only that the call was reached. Confirm the point actually landed with `get_talent_info(...).rank` or `get_unspent_talent_points()`. On Midnight the commit result is the answer, so `false` there is a real refusal: in combat, no currency left, or a prerequisite missing.

**Example Usage**

```lua
-- Classic: put one point into tab 1, talent 3
if core.game_ui.get_unspent_talent_points() > 0 then
    core.game_ui.learn_talent(1, 3)
end

-- Midnight: buy the first node the client says is buyable
local tree_ids = core.game_ui.get_talent_tree_ids()
for _, node_id in ipairs(core.game_ui.get_talent_tree_nodes(tree_ids[1])) do
    if core.game_ui.can_purchase_talent_rank(node_id) then
        core.game_ui.learn_talent(node_id)
        break
    end
end
```

---

### Staged talent editing

`learn_talent` buys one rank and applies it on the spot, and cannot refund. To apply a whole build over the current one (a loadout import), use these six instead. They work like the talent window: `reset_talent_tree` and `stage_talent` only change the **pending** build, and nothing is real until `commit_talents` (the Apply button), or it is thrown away with `rollback_talents`.

Retail and Forever only (the talent trees with nodes). On other game versions every one answers `false`. They always work on your active talent setup. Added in the core update of 2026-10-11.

| Function | Returns | What it does |
| --- | --- | --- |
| `core.game_ui.can_change_talents()` | `boolean, string \| nil` | Whether talents can change right now, plus the game's reason when not (combat, casting, ...) |
| `core.game_ui.reset_talent_tree()` | `boolean` | Refunds every point in the tree. Staged. |
| `core.game_ui.stage_talent(node_id, entry_id?)` | `boolean` | Buys the node's next rank, or with `entry_id` picks that entry on a choice / hero node. Staged. |
| `core.game_ui.commit_talents()` | `boolean` | Applies everything staged. `true` = the game accepted it and started applying. |
| `core.game_ui.rollback_talents()` | `boolean` | Throws away everything staged since the last commit. |
| `core.game_ui.has_staged_talent_changes()` | `boolean` | Whether anything is waiting for `commit_talents`. |

Node and entry ids are the ones `get_talent_tree_nodes` and `get_talent_node_info` give you. `stage_talent` answers `false` when the game refuses a node (no points left, prerequisite not staged yet), so stage in tree order, top to bottom.

```lua
-- Apply a build: { {node_id}, {node_id, entry_id}, ... } in tree order
local function apply_build(build)
    local ok, reason = core.game_ui.can_change_talents()
    if not ok then
        core.log("cannot change talents: " .. (reason or "unknown"))
        return
    end

    core.game_ui.reset_talent_tree()
    for _, pick in ipairs(build) do
        if not core.game_ui.stage_talent(pick[1], pick[2]) then
            core.log("node refused: " .. pick[1])
            core.game_ui.rollback_talents()
            return
        end
    end

    core.game_ui.commit_talents()
end
```

---

### `core.game_ui.get_unspent_talent_points`

Syntax

```lua
core.game_ui.get_unspent_talent_points() -> integer
```

Returns

- `integer` : Unspent talent points. `0` when the client has none to report.

Description

How many points are still waiting to be spent. Every source the client has is asked in turn and the first positive answer wins. On the talent-tree versions (vanilla, Classic Era, TBC, Wrath) the final fallback is the game's own rule, one point per level from 10, minus the points spent in each tab, because on some of those clients the unspent-points APIs answer 0 even when points are waiting. Forever answers the same way as Midnight, below.

> [!TIP]
> Up to core 2.087 this returned `0` on TBC regardless of how many points you had. A `0` now means the character genuinely has none to spend.

On Midnight 12.1 this is the **first tree currency**, which is the class pool. The trait trees carry several currencies at once (class, spec, and the hero pool from 11.0) and they are not interchangeable, so they cannot honestly be added into one number: two spec points do not buy a class node. When you need the others, ask per node with `can_purchase_talent_rank`, which is the question the client can actually answer.

**Example Usage**

```lua
local points = core.game_ui.get_unspent_talent_points()
if points > 0 then
    core.log("talent points waiting: " .. points)
end
```

---

### `core.game_ui.confirm_talent_wipe`

Syntax

```lua
core.game_ui.confirm_talent_wipe() -> boolean
```

Returns

- `boolean` : `true` when the client had the function and it was called.

Description

Confirms a talent reset at a trainer. This is the answer to the [`CONFIRM_TALENT_WIPE`](/dev/api/events) game event and not a convenience wrapper: the engine withholds the respec and waits, exactly like the bind confirmations, so the reset never happens until something calls this. Blizzard's own UI answers it from a popup, which is why it looks like a UI feature rather than engine state.

The boolean says the call was reached. The gold is spent and the talents are gone by the next `CHARACTER_POINTS_CHANGED`, not on the next line.

> [!DANGER]
> There is no second confirmation anywhere in the path. Every spent point is refunded and the respec cost is charged at the trainer's current price.

**Example Usage**

```lua
core.register_on_game_event_callback(function(event_name, args)
    if event_name == "CONFIRM_TALENT_WIPE" then
        core.game_ui.confirm_talent_wipe()
    end
end)
```

---

### `core.game_ui.get_num_talent_tabs`

Syntax

```lua
core.game_ui.get_num_talent_tabs() -> integer
```

Returns

- `integer` : Number of talent tabs, normally `3` . `0` when the client has no talent trees.

Description

The talent tree tabs on a 1.12, 1.14, 1.15 or 2.5 client. Retail and Forever answer `0` because they genuinely have no tabs, so a loop over this runs zero times there instead of needing a version check in your plugin. MoP Classic still has the game function behind this one, so do not rely on a `0` there without checking it on your client.

**Example Usage**

```lua
for tab = 1, core.game_ui.get_num_talent_tabs() do
    local info = core.game_ui.get_talent_tab_info(tab)
    core.log(info.name .. ": " .. info.points_spent)
end
```

---

### `core.game_ui.get_num_talents`

Syntax

```lua
core.game_ui.get_num_talents(tab_index: integer) -> integer
```

**Parameters**

- `tab_index` : `integer` - 1 based tab index.

Returns

- `integer` : Number of talents in that tab. `0` when the client has no talent trees.

Description

How many talents live in one tree tab. Pair it with `get_talent_info` to walk a whole tab.

**Example Usage**

```lua
for i = 1, core.game_ui.get_num_talents(1) do
    local t = core.game_ui.get_talent_info(1, i)
    core.log(t.name .. " " .. t.rank .. "/" .. t.max_rank)
end
```

---

### `core.game_ui.get_talent_tab_info`

Syntax

```lua
core.game_ui.get_talent_tab_info(tab_index: integer) -> table | nil
```

**Parameters**

- `tab_index` : `integer` - 1 based tab index.

Returns

- `table` : Tab header information.
- `nil` : The client has no talent trees.

| Field | Type | Description |
| --- | --- | --- |
| `id` | `integer` | Talent tab id. **Absent on 1.12.** |
| `name` | `string` | Localized tab name, for example "Fire" |
| `description` | `string` | Localized tab description. **Absent on 1.12.** |
| `texture` | `string` | Icon texture path for the tab |
| `points_spent` | `integer` | Points spent in this tab |
| `background` | `string` | Background art name for the tab |

Description

The header row of one talent tree tab: its name, its art, and how many points you have put into it.

`GetTalentTabInfo` gained two fields in 1.14 and renamed nothing, so `id` and `description` are simply missing on a 1.12 client. They read `nil` there, not `0` and not an empty string, so check for `nil` before using them if your plugin runs on vanilla.

> [!WARNING]
> On the current game versions the game answers through a compatibility layer that returns the icon as a number, so `texture` is `nil` there. Before core 2.134 the whole function returned `nil` when the game's "load deprecation fallbacks" setting was off.

**Example Usage**

```lua
local info = core.game_ui.get_talent_tab_info(2)
if info then
    core.log(info.name .. " has " .. info.points_spent .. " points")
end
```

---

### `core.game_ui.get_talent_prereqs`

Syntax

```lua
core.game_ui.get_talent_prereqs(tab_index: integer, talent_index: integer) -> table | nil
```

**Parameters**

- `tab_index` : `integer` - 1 based tab index.
- `talent_index` : `integer` - 1 based talent index inside the tab.

Returns

- `table` : The prerequisite talent.
- `nil` : The talent has no prerequisite. This is the common case and is not an error.

| Field | Type | Description |
| --- | --- | --- |
| `tier` | `integer` | Tier (row) of the required talent, 1 based |
| `column` | `integer` | Column of the required talent, 1 based |
| `is_learnable` | `boolean` | `true` when that requirement is met right now |

Description

The talent that gates this one, on the tree clients. Only the first prerequisite is reported, because no talent in any shipped tree has a second one.

**Example Usage**

```lua
local req = core.game_ui.get_talent_prereqs(1, 7)
if req and not req.is_learnable then
    core.log("blocked by the talent at tier " .. req.tier .. ", column " .. req.column)
end
```

---

### `core.game_ui.get_specialization`

Syntax

```lua
core.game_ui.get_specialization() -> integer | nil
```

Returns

- `integer` : The 1 based specialization index, `1` to `4` .
- `nil` : The client has no specializations (the talent tree versions).

Description

The index of the active specialization, counted the way the class orders its own spec list.

> [!INFO]
> [`core.spell_book.get_specialization_id`](/dev/api/spellbook) answers the global `ChrSpecialization` id, `250` for Blood, `577` for Havoc, which is what a database lookup wants. This function answers the small index the client's own talent UI counts with, and that index is the only thing `set_specialization` accepts. They are both correct and they are not interchangeable.

**Example Usage**

```lua
local index = core.game_ui.get_specialization()
if index then
    core.log("spec slot " .. index)
end
```

---

### `core.game_ui.set_specialization`

Syntax

```lua
core.game_ui.set_specialization(spec_index: integer) -> boolean
```

**Parameters**

- `spec_index` : `integer` - 1 based specialization index, the value `get_specialization` returns. Never a `ChrSpecialization` id.

Returns

- `boolean` : `true` when the client had the function and it was called.

Description

Switches the player to another specialization. Available on MoP 5.5 and Midnight 12.1.

The boolean says the call was reached, nothing more. The client then runs its own "Activating Specialization" cast, which takes several seconds, can be interrupted, and is refused outright in combat. Watch `PLAYER_TALENT_UPDATE`, or poll `get_specialization`, to learn whether it finished.

> [!WARNING]
> Changing specialization reloads every Lua plugin. Anything you were holding in memory is gone, so treat this call as the end of the current run rather than one step in a sequence.

**Example Usage**

```lua
if core.game_ui.get_specialization() ~= 2 then
    core.game_ui.set_specialization(2)
end
```

---

### `core.game_ui.get_talent_tree_ids`

Syntax

```lua
core.game_ui.get_talent_tree_ids() -> integer[]
```

Returns

- `integer[]` : Trait tree ids of the active config, class tree first. Empty on every client older than 10.0.

Description

The entry point to the Midnight 12.1 trait trees. A node id only means something inside a tree, and the config those trees belong to is not reachable from a plugin, so the core resolves the active config itself and hands you the tree ids.

**Example Usage**

```lua
local tree_ids = core.game_ui.get_talent_tree_ids()
if #tree_ids > 0 then
    core.log("class tree: " .. tree_ids[1])
end
```

---

### `core.game_ui.get_talent_tree_nodes`

Syntax

```lua
core.game_ui.get_talent_tree_nodes(tree_id: integer) -> integer[]
```

**Parameters**

- `tree_id` : `integer` - A tree id from `get_talent_tree_ids` .

Returns

- `integer[]` : Every node id in that tree. Empty on every client older than 10.0.

Description

Every node in the tree, bought or not. `get_active_talents` lists what you **have**; this lists what **exists**, which is the list you need before buying something you do not have yet.

A current class tree has roughly 100 nodes, so cache the result. The set only changes when the tree itself changes, which is a patch, not a frame.

**Example Usage**

```lua
local tree_ids = core.game_ui.get_talent_tree_ids()
local nodes = core.game_ui.get_talent_tree_nodes(tree_ids[1])
core.log(#nodes .. " nodes in the class tree")
```

---

### `core.game_ui.get_talent_node_info`

Syntax

```lua
core.game_ui.get_talent_node_info(node_id: integer) -> table | nil
```

**Parameters**

- `node_id` : `integer` - A node id from `get_talent_tree_nodes` or `get_active_talents` .

Returns

- `table` : The node's state in the active config.
- `nil` : The client is older than 10.0, or the node is not part of the active config.

| Field | Type | Description |
| --- | --- | --- |
| `node_id` | `integer` | The node id |
| `active_rank` | `integer` | Ranks currently active on the node |
| `ranks_purchased` | `integer` | Ranks bought in the active config |
| `max_ranks` | `integer` | Maximum ranks the node can hold |
| `node_type` | `integer` | `0` single, `1` tiered, `2` selection |
| `is_available` | `boolean` | The node's requirements are met |
| `is_visible` | `boolean` | The node is shown in the tree |
| `can_purchase_rank` | `boolean` | The client would allow another rank right now |
| `can_refund_rank` | `boolean` | The client would allow refunding a rank |
| `active_entry_id` | `integer` | Chosen entry id, `0` when nothing is chosen |
| `entry_ids` | `integer[]` | Every entry the node offers |

Description

One trait node, read out of the active config.

`node_type` is the field that decides how `learn_talent` has to be called. A `2` is a choice node and needs one of the `entry_ids`; `0` and `1` take the node id alone. `active_entry_id` is `0` when nothing has been chosen yet, so test it against `0` rather than `nil`.

**Example Usage**

```lua
local info = core.game_ui.get_talent_node_info(node_id)
if info and info.node_type == 2 and info.active_entry_id == 0 then
    -- an unchosen choice node: take the first side
    core.game_ui.learn_talent(info.node_id, info.entry_ids[1])
end
```

---

### `core.game_ui.can_purchase_talent_rank`

Syntax

```lua
core.game_ui.can_purchase_talent_rank(node_id: integer, entry_id?: integer) -> boolean
```

**Parameters**

- `node_id` : `integer` - A node id from `get_talent_tree_nodes` or `get_active_talents` .
- `entry_id` (optional): `integer` - A specific entry. Omit to let the core resolve it from the node: the active entry first, then the node's first entry.

Returns

- `boolean` : `true` when the client would accept the purchase right now. `false` on every client without trait trees.

Description

The client's own answer to "would buying this work", which is what makes `learn_talent` safe to call in a loop. It covers currency, prerequisites and edge requirements in a single question, and none of those can be worked out from `get_talent_node_info` alone.

Pass `entry_id` explicitly when you want to ask about one specific side of a choice node.

**Example Usage**

```lua
local tree_ids = core.game_ui.get_talent_tree_ids()
for _, node_id in ipairs(core.game_ui.get_talent_tree_nodes(tree_ids[1])) do
    if core.game_ui.can_purchase_talent_rank(node_id) then
        core.log("buyable: " .. node_id)
    end
end
```

---

## Party Keystones

There is no game API for "what keystone is my party member carrying". The client never tells you; the number travels over the addon-message channel, and the de facto protocol for it is [LibKeystone](https://github.com/BigWigsMods/LibKeystone), which BigWigs, Details and the Mythic+ addons all speak. These two functions let a plugin join that conversation, and the answers come back through the [`CHAT_MSG_ADDON` game event](/dev/api/events) you already have.

Retail only. Keystones do not exist on classic.

### `core.game_ui.register_keystone_prefix`

Syntax

```lua
core.game_ui.register_keystone_prefix() -> boolean
```

Returns

- `boolean` : `true` when the `"LibKS"` prefix is registered, including when it already was.

Description

Registers the `"LibKS"` addon-message prefix so `CHAT_MSG_ADDON` starts delivering LibKeystone traffic. Call it once at plugin load, never per frame. It is idempotent.

Registration is what makes the client deliver that prefix at all. Without it the event never fires for `LibKS` and `request_party_keystones` looks like it silently failed.

Register even if you only ever call `request_party_keystones`, because peers also broadcast their key **unprompted** when it changes at the end of a run, and those updates only reach you if you were already registered when they landed.

**Example Usage**

```lua
-- once, at load
core.game_ui.register_keystone_prefix()
```

---

### `core.game_ui.request_party_keystones`

Syntax

```lua
core.game_ui.request_party_keystones() -> boolean
```

Returns

- `boolean` : `true` when the client accepted the request for sending. This is **not** a promise that anybody answered.

Description

Broadcasts the LibKeystone request to your party. Every group member running a LibKeystone-speaking addon answers with their key. The prefix is registered first, so a single call is enough to get working.

Each answer arrives as an ordinary `CHAT_MSG_ADDON` event:

| `args` | Value |
| --- | --- |
| `args[1]` | `"LibKS"` |
| `args[2]` | `"<level>,<challenge_map_id>,<mythic_plus_rating>"`, three integers |
| `args[3]` | `"PARTY"` |
| `args[4]` | `"Name-Realm"`, the full sender identity |

> [!INFO]
> `args[4]` is the raw sender the client sent, so it keeps the realm. This differs from LibKeystone itself, which runs `Ambiguate(sender, "none")` and hands its own consumers a bare name. The core does not touch the argument.

> [!WARNING]
> Replies land asynchronously over the next moment or two, and a member running no addon never answers at all. Treat a member you heard nothing from as **unknown**, not as holding no key.
>
> `false` means nothing went out: you are not in a group, the client has no addon-message API, or its own throttle refused the send. The protocol allows one request per 3 seconds and peers ignore a second one inside that window, so back off on `false` rather than retrying in a loop.

> [!NOTE]
> You never receive your own addon message. Fill in your own row with [`core.get_keystone_level`](/dev/api/core#coreget_keystone_level) and [`core.get_keystone_map_id`](/dev/api/core#coreget_keystone_map_id).

**Example Usage**

```lua
local party_keys = {}

core.register_on_game_event_callback(function(event_name, args)
    if event_name ~= "CHAT_MSG_ADDON" or args[1] ~= "LibKS" then
        return
    end

    local level, map_id, rating = args[2]:match("^(%d+),(%d+),(%d+)$")
    if not level then
        return -- "R" is another plugin's request, not an answer
    end

    party_keys[args[4]] = {
        level = tonumber(level),
        map_id = tonumber(map_id),
        rating = tonumber(rating),
    }
end)

-- at load
core.game_ui.register_keystone_prefix()

-- when you want the party's keys, no more than once every 3 seconds
core.game_ui.request_party_keystones()

-- your own key never arrives over the wire, so read it directly. Keep it out of the table
-- above: those rows are keyed "Name-Realm" and your own name is not.
local own_key = {
    level = core.get_keystone_level(),
    map_id = core.get_keystone_map_id(),
}
```

---

## Context Menu

### `core.game_ui.show_context_menu`

> [!WARNING]
> Removed on May 10, 2026 in core 1.930+. This field will be `nil` at runtime. Do not call it.

Syntax

```lua
core.game_ui.show_context_menu(items: table[]) -> nil
```

**Parameters**

- `items` : `table[]` - Array of menu entries. Each entry is a table with:
  - `text` : `string` - The button label.
  - `id` : `integer` - The button identifier.

Description

Shows a context menu at the cursor with simple text buttons. Uses WoW's `MenuUtil.CreateContextMenu` (Retail only). Poll the result with `get_context_menu_result()`.

**Example Usage**

```lua
core.game_ui.show_context_menu({
    { text = "Option A", id = 1 },
    { text = "Option B", id = 2 },
    { text = "Cancel",   id = 3 },
})
```

---

### `core.game_ui.get_context_menu_result`

> [!WARNING]
> Removed on May 10, 2026 in core 1.930+. This field will be `nil` at runtime. Do not call it.

Syntax

```lua
core.game_ui.get_context_menu_result() -> integer
```

Returns

- `integer` : The `id` of the clicked button, or `0` if nothing was clicked.

Description

Polls the result of the last context menu shown with `show_context_menu`. Reading the result consumes it (one-shot) — subsequent calls return `0` until a new menu option is clicked.

**Example Usage**

```lua
local result = core.game_ui.get_context_menu_result()
if result == 1 then
    -- Option A was clicked
elseif result == 2 then
    -- Option B was clicked
end
```

---

## Unit Context Menu Buttons 🖱️

These functions let you inject custom buttons into the right-click context menus that appear on unit frames (player, target, focus, party, raid, arena, boss, pet, vehicle). Clicks are queued and polled asynchronously.

### `core.game_ui.add_unit_menu_button`

> [!WARNING]
> Removed on May 10, 2026 in core 1.930+. This field will be `nil` at runtime. Do not call it.

Syntax

```lua
core.game_ui.add_unit_menu_button(text: string) -> integer
```

**Parameters**

- `text` : `string` - The button label text.

Returns

- `integer` : The button ID, used with `set_unit_menu_button_text` , `remove_unit_menu_button` , and returned in `poll_unit_menu_click` results.

Description

Adds a custom button to all unit right-click context menus. The button appears for all common unit menu types (self, player, target, focus, party, raid, arena enemy, boss, pet, vehicle). Use `poll_unit_menu_click()` to detect when the button is clicked.

**Example Usage**

```lua
local btn_id = core.game_ui.add_unit_menu_button("Focus Target")
```

---

### `core.game_ui.set_unit_menu_button_text`

> [!WARNING]
> Removed on May 10, 2026 in core 1.930+. This field will be `nil` at runtime. Do not call it.

Syntax

```lua
core.game_ui.set_unit_menu_button_text(id: integer, text: string)
```

**Parameters**

- `id` : `integer` - The button ID returned by `add_unit_menu_button` .
- `text` : `string` - The new button label text.

Description

Updates the label of an existing unit menu button.

**Example Usage**

```lua
core.game_ui.set_unit_menu_button_text(btn_id, "Updated Label")
```

---

### `core.game_ui.remove_unit_menu_button`

> [!WARNING]
> Removed on May 10, 2026 in core 1.930+. This field will be `nil` at runtime. Do not call it.

Syntax

```lua
core.game_ui.remove_unit_menu_button(id: integer)
```

**Parameters**

- `id` : `integer` - The button ID returned by `add_unit_menu_button` .

Description

Removes a unit menu button entirely. The ID becomes orphaned and will no longer appear in context menus.

**Example Usage**

```lua
core.game_ui.remove_unit_menu_button(btn_id)
```

---

### `core.game_ui.poll_unit_menu_click`

> [!WARNING]
> Removed on May 10, 2026 in core 1.930+. This field will be `nil` at runtime. Do not call it.

Syntax

```lua
core.game_ui.poll_unit_menu_click() -> table | nil
```

Returns

- `table | nil` : The click info table, or `nil` if no clicks are pending. Contains:

| Field | Type | Description |
| --- | --- | --- |
| `button_id` | `integer` | The ID of the button that was clicked |
| `unit_token` | `string` | The unit token (e.g. `"target"`, `"party1"`) |
| `unit_name` | `string` | The unit's name |
| `unit_guid` | `string` | The unit's GUID |
| `menu_tag` | `string` | The menu context tag (e.g. `"MENU_UNIT_PLAYER"`) |

Description

Pops the oldest queued click from unit menu buttons. Clicks are consumed one at a time — call in a loop to drain the queue.

**Example Usage**

```lua
local click = core.game_ui.poll_unit_menu_click()
if click then
    core.log("Button " .. click.button_id .. " clicked on " .. click.unit_name
        .. " (" .. click.unit_token .. ") [" .. click.menu_tag .. "]")
end
```

---

## Ping System 📡

### `core.game_ui.is_ping_enabled`

Syntax

```lua
core.game_ui.is_ping_enabled() -> boolean
```

Returns

- `boolean` : `true` if the ping system is currently enabled, `false` otherwise.

Description

Checks whether the in-game ping system (`C_Ping`) is enabled and available. Use this before calling `send_ping` to avoid silent failures.

> [!WARNING]
> On Classic Era, TBC Classic, MoP Classic and Titan (China) this can return `true` while `send_ping` still does nothing, because those clients cannot send a ping from a script.

**Example Usage**

```lua
if core.game_ui.is_ping_enabled() then
    core.game_ui.send_ping()
end
```

---

### `core.game_ui.send_ping`

Syntax

```lua
core.game_ui.send_ping(ping_type?, target?)
```

**Parameters**

- `ping_type` ( `integer` , optional): The ping type ID. Pass `-1` or omit for a default contextual ping.
- `target` ( `game_object` , optional): A game object to ping on. Omit for a contextual ping at the cursor position.

Description

Sends a ping in the game world. Can be a contextual ping (no arguments), a typed ping, or a targeted ping on a specific game object (e.g., an NPC).

> [!WARNING]
> On Classic Era, TBC Classic, MoP Classic and Titan (China) this does nothing and raises no error.

**Example Usage**

```lua
-- Contextual ping (default)
core.game_ui.send_ping()

-- Typed ping on a specific target
local target = core.object_manager.get_object_by_index(1)
if target then
    core.game_ui.send_ping(3, target)
end
```