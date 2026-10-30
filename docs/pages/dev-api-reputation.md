# Reputation Functions

> Source: <https://docs.project-sylvanas.net/dev/api/reputation>

## Overview

The `core.reputation` namespace reads your character's standing with every faction, the same data the in-game reputation panel shows. It works on every game version: the classic versions and retail answer through different game functions, and you get the same table either way.

Two ways in:

- **By faction id** , with `get_faction_info_by_id` . The simplest way to answer "am I Honored with the Aldor?", and it does not care how the panel is arranged.
- **By list row** , with `get_num_factions` and `get_faction_info` , to walk everything.

> [!WARNING]
> The row functions count exactly what the reputation panel shows, **headers included**. A collapsed header hides its factions, so they are not in the list at all, and expanding or collapsing a header shifts every row after it. To walk every faction, call `expand_all_faction_headers()` first. Header state is shared with the reputation panel the player sees, and nothing here changes it behind your back.

### Standing and progress

`standing_id` is the game's own number:

| `standing_id` | Standing |
| --- | --- |
| `1` | Hated |
| `2` | Hostile |
| `3` | Unfriendly |
| `4` | Neutral |
| `5` | Friendly |
| `6` | Honored |
| `7` | Revered |
| `8` | Exalted |

`bar_min`, `bar_max` and `bar_value` are **absolute** reputation, not progress within the standing. Honored with 3500 into it reads `bar_min = 9000`, `bar_max = 21000`, `bar_value = 12500`. Progress in the current standing is `bar_value - bar_min` out of `bar_max - bar_min`.

Standings change on the `UPDATE_FACTION` [game event](/dev/api/events). Re-read there instead of polling every frame.

---

## The `faction_info` table

Returned by `get_faction_info` and `get_faction_info_by_id`.

| Field | Type | Description |
| --- | --- | --- |
| `faction_id` | `integer` or `nil` | The faction id. `nil` for a row the game gives no id. |
| `name` | `string` | The faction name, or the header's name for a header row. |
| `description` | `string` | The faction description, `""` when there is none. |
| `standing_id` | `integer` | `1` Hated to `8` Exalted, see the table above. |
| `bar_min` | `integer` | Absolute reputation where the current standing starts. |
| `bar_max` | `integer` | Absolute reputation where the next standing starts. |
| `bar_value` | `integer` | Your absolute reputation. |
| `at_war_with` | `boolean` | You are at war with this faction. |
| `can_toggle_at_war` | `boolean` | The at-war flag can be changed for it. |
| `is_header` | `boolean` | A header row that groups other rows. |
| `is_collapsed` | `boolean` | A header row that is collapsed, hiding its rows. |
| `has_rep` | `boolean` | A header row that also has a standing of its own. |
| `is_watched` | `boolean` | The faction tracked on the reputation bar. |
| `is_child` | `boolean` | A row the panel nests under another row. |

---

### `core.reputation.get_faction_info_by_id`

Syntax

```lua
core.reputation.get_faction_info_by_id(faction_id: integer) -> faction_info | nil
```

**Parameters**

- `faction_id` : `integer` - The faction id, for example `932` for The Aldor.

Returns

- `faction_info` : The faction, wherever it sits in the list and whether or not its header is collapsed.
- `nil` : The game does not know this faction id.

Description

The direct way to check one faction. It does not depend on header state, so it is the right call for "am I Revered yet" checks.

**Example Usage**

```lua
local HONORED = 6

local aldor = core.reputation.get_faction_info_by_id(932)
if aldor and aldor.standing_id >= HONORED then
    core.log("Honored or better with " .. aldor.name)
end
```

---

### `core.reputation.get_num_factions`

Syntax

```lua
core.reputation.get_num_factions() -> integer
```

Returns

- `integer` : How many rows the reputation list has right now, headers included. `0` when the game cannot answer.

Description

The row count to loop `get_faction_info` over. It shrinks and grows as headers collapse and expand.

---

### `core.reputation.get_faction_info`

Syntax

```lua
core.reputation.get_faction_info(index: integer) -> faction_info | nil
```

**Parameters**

- `index` : `integer` - The row, `1` to `get_num_factions()` .

Returns

- `faction_info` : That row. Header rows come back too, with `is_header = true` .
- `nil` : The index is past the end of the list.

Description

One row of the list the reputation panel shows.

**Example Usage**

```lua
-- Log every faction the character has met, with progress in its current standing
core.reputation.expand_all_faction_headers()

for index = 1, core.reputation.get_num_factions() do
    local info = core.reputation.get_faction_info(index)
    if info and not info.is_header then
        local into = info.bar_value - info.bar_min
        local span = info.bar_max - info.bar_min
        core.log(string.format("%s: standing %d, %d / %d", info.name, info.standing_id, into, span))
    end
end
```

---

### `core.reputation.expand_faction_header`

Syntax

```lua
core.reputation.expand_faction_header(index: integer) -> boolean
```

**Parameters**

- `index` : `integer` - The header's row, `1` to `get_num_factions()` .

Returns

- `boolean` : `true` when the game's call was reached. It does not tell you the row was a collapsed header.

Description

Expands one header, inserting its rows right after it. Every row index after the header moves, so re-read `get_num_factions()` after it. To open everything, `expand_all_faction_headers()` is simpler and avoids that trap.

---

### `core.reputation.collapse_faction_header`

Syntax

```lua
core.reputation.collapse_faction_header(index: integer) -> boolean
```

**Parameters**

- `index` : `integer` - The header's row, `1` to `get_num_factions()` .

Returns

- `boolean` : `true` when the game's call was reached.

Description

Collapses one header, removing its rows from the list.

---

### `core.reputation.expand_all_faction_headers`

Syntax

```lua
core.reputation.expand_all_faction_headers() -> boolean
```

Returns

- `boolean` : `true` when the game's call was reached.

Description

Opens every header at once, so `get_num_factions()` counts every faction the character has met. Use it before walking the whole list. The reputation panel the player sees opens too.

---

### `core.reputation.collapse_all_faction_headers`

Syntax

```lua
core.reputation.collapse_all_faction_headers() -> boolean
```

Returns

- `boolean` : `true` when the game's call was reached.

Description

Closes every header at once, hiding every row that sits under one.