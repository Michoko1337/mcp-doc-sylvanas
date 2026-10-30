# Quest Functions

> Source: <https://docs.project-sylvanas.net/dev/api/quests>

## Overview

The `core.quests` module provides functions for interacting with quest dialogs, the quest log, gossip frames, trainer services, and item information. These functions cover the full lifecycle of quest management from accepting quests at NPCs to tracking and completing them.

---

## Quest Dialog Functions

### `core.quests.accept_quest`

Syntax

```lua
core.quests.accept_quest() -> nil
```

Description

Accepts the current quest dialog. Call this when the quest detail frame is shown after selecting a quest from an NPC.

---

### `core.quests.close_quest`

Syntax

```lua
core.quests.close_quest() -> nil
```

Description

Closes the quest dialog frame.

---

### `core.quests.decline_quest`

Syntax

```lua
core.quests.decline_quest() -> nil
```

Description

Declines the current quest dialog, dismissing the quest offer.

---

### `core.quests.complete_quest`

Syntax

```lua
core.quests.complete_quest() -> nil
```

Description

Completes the current quest dialog. Use this when turning in a quest that has no reward choices, or after selecting a reward with `get_quest_reward`.

---

### `core.quests.get_quest_reward`

Syntax

```lua
core.quests.get_quest_reward(choice: integer) -> nil
```

**Parameters**

- `choice` : `integer` - The index of the reward choice to select.

Description

Selects a reward choice and completes the quest. Use this for quests that offer multiple reward options.

**Example Usage**

```lua
-- Select the first reward option and complete the quest
core.quests.get_quest_reward(1)
```

---

### `core.quests.get_num_quest_choices`

Syntax

```lua
core.quests.get_num_quest_choices() -> integer
```

Returns

- `integer` : How many rewards the open quest reward panel lets you choose from. `0` when the quest gives everything (or nothing), and `0` with no reward panel open.

Description

The range of `get_quest_reward``(choice)`: valid choices run from `1` to this number. The game's own `GetNumQuestChoices`. Works on every client. Added in the core update of 2026-10-06.

**Example Usage**

```lua
for i = 1, core.quests.get_num_quest_choices() do
    core.log(i .. ": " .. core.quests.get_quest_item_link("choice", i))
end
```

---

### `core.quests.confirm_accept_quest`

Syntax

```lua
core.quests.confirm_accept_quest() -> nil
```

Description

Confirms quest acceptance for escort-type quests that require an additional confirmation step before starting.

---

### `core.quests.select_active_quest`

Syntax

```lua
core.quests.select_active_quest(index: integer) -> nil
```

**Parameters**

- `index` : `integer` - The index of the active quest in the NPC's quest list.

Description

Selects an active (in-progress or completable) quest at the NPC dialog. This opens the quest detail or completion frame for that quest.

---

### `core.quests.select_available_quest`

Syntax

```lua
core.quests.select_available_quest(index: integer) -> nil
```

**Parameters**

- `index` : `integer` - The index of the available quest in the NPC's quest list.

Description

Selects an available (not yet accepted) quest at the NPC dialog. This opens the quest detail frame for that quest.

---

### `core.quests.get_active_title`

Syntax

```lua
core.quests.get_active_title(index: integer) -> string
```

**Parameters**

- `index` : `integer` - The index of the active quest.

Returns

- `string` : The title of the active quest at the NPC.

Description

Returns the title of an active quest listed at the current NPC dialog.

---

### `core.quests.get_available_title`

Syntax

```lua
core.quests.get_available_title(index: integer) -> string
```

**Parameters**

- `index` : `integer` - The index of the available quest.

Returns

- `string` : The title of the available quest at the NPC.

Description

Returns the title of an available quest listed at the current NPC dialog.

---

### `core.quests.get_active_level`

Syntax

```lua
core.quests.get_active_level(index: integer) -> integer
```

**Parameters**

- `index` : `integer` - The index of the active quest.

Returns

- `integer` : The level of the active quest at the NPC.

Description

Returns the level of an active quest listed at the current NPC dialog.

---

### `core.quests.get_available_level`

Syntax

```lua
core.quests.get_available_level(index: integer) -> integer
```

**Parameters**

- `index` : `integer` - The index of the available quest.

Returns

- `integer` : The level of the available quest at the NPC.

Description

Returns the level of an available quest listed at the current NPC dialog.

---

### `core.quests.get_reward_money`

Syntax

```lua
core.quests.get_reward_money() -> integer
```

Returns

- `integer` : The copper reward amount for the current quest.

Description

Returns the monetary reward in copper for the currently displayed quest dialog.

**Example Usage**

```lua
local copper = core.quests.get_reward_money()
local gold = math.floor(copper / 10000)
local silver = math.floor((copper % 10000) / 100)
core.log(string.format("Quest reward: %dg %ds", gold, silver))
```

---

### `core.quests.get_quest_item_link`

Syntax

```lua
core.quests.get_quest_item_link(type: string, index: integer) -> string
```

**Parameters**

- `type` : `string` - The type of quest item ( `"reward"` or `"choice"` ).
- `index` : `integer` - The index of the item.

Returns

- `string` : The item link for the quest reward or choice item.

Description

Returns the item link string for a quest reward or choice item in the current quest dialog.

---

## Quest Log Functions

The quest log functions work on every client, Forever included, and the ones that take an `index` take the **quest log index** everywhere. For questions about one quest, prefer the quest-ID functions (`get_quest_log_quest_ids`, `get_quest_objectives`, `is_quest_complete`, `abandon_quest_by_id`): a log index moves whenever a quest is added or finished, or a header is collapsed.

> [!NOTE]
> Before the core update of 2026-10-06, `get_num_quest_log_entries` always returned `0` on Forever, `get_quest_log_title` returned an empty entry there, and `select_quest_log_entry`, `add_quest_watch`, `remove_quest_watch`, `set_abandon_quest` and `abandon_quest` did nothing. On Retail, `select_quest_log_entry`, `add_quest_watch` and `remove_quest_watch` needed the quest ID instead of the log index. Code written that way keeps working, see `select_quest_log_entry`.

### `core.quests.get_num_quest_log_entries`

Syntax

```lua
core.quests.get_num_quest_log_entries() -> integer
```

Returns

- `integer` : The number of quest log entries (including headers).

Description

Returns the total number of entries in the quest log. This includes both zone headers and quest entries. This is the range `get_quest_log_title(1 .. count)` walks.

---

### `core.quests.get_open_quest_info`

Syntax

```lua
core.quests.get_open_quest_info() -> table | nil
```

Returns

- `table` : `title` and `quest_id` ( `0` on the rare panel the client cannot attach an id to).
- `nil` : No quest panel is open.

Description

Which quest the open quest panel is showing: detail, progress or reward. The `QUEST_DETAIL` / `QUEST_PROGRESS` / `QUEST_COMPLETE` events tell you a panel opened; this tells you which quest, so you accept or hand in the right one, and the state survives a reload.

**Example Usage**

```lua
core.register_on_game_event_callback(function(event_name)
    if event_name == "QUEST_DETAIL" then
        local q = core.quests.get_open_quest_info()
        if q then core.log("offered: " .. q.title .. " (" .. q.quest_id .. ")") end
    end
end)
```

---

### `core.quests.get_quest_log_title`

Syntax

```lua
core.quests.get_quest_log_title(index: integer) -> table
```

**Parameters**

- `index` : `integer` - The quest log entry index.

Returns

- `table` : A table containing quest log entry details.

**Return Table Fields:**

| Field | Type | Description |
| --- | --- | --- |
| `title` | `string` | The title of the quest or header |
| `level` | `integer` | The quest level |
| `quest_id` | `integer` | The unique quest ID |
| `is_header` | `boolean` | Whether this entry is a zone header |
| `is_complete` | `integer` or `nil` | `1` when the quest is ready to hand in, `-1` when it failed, `nil` otherwise |

Description

Returns detailed information about a quest log entry. Use `is_header` to distinguish zone headers from actual quests. Refer to the `.api` definition for the complete list of fields.

It answers the same way on every client. Three fixes arrived in the core update of 2026-10-06:

- Forever returned an empty entry; it now answers like every other client.
- Retail's `is_complete` was always `nil` ; it is now `1` , `-1` or `nil` like Classic.
- On the Classic versions `is_task` , `is_story` , `start_event` , `is_on_map` , `has_local_poi` and `is_hidden` were read from the wrong positions; they are now right. The fields from `title` to `quest_id` were always right.

> [!NOTE]
> On a core older than 2026-10-06, keep the old rule: on the Classic versions trust only the fields from `title` to `quest_id`.

**Example Usage**

```lua
local num_entries = core.quests.get_num_quest_log_entries()
for i = 1, num_entries do
    local info = core.quests.get_quest_log_title(i)
    if not info.is_header then
        local status = info.is_complete == 1 and "COMPLETE" or "In Progress"
        core.log(string.format("[%d] %s (Lv %d) - %s", info.quest_id, info.title, info.level, status))
    end
end
```

---

### `core.quests.is_quest_flagged_completed`

Syntax

```lua
core.quests.is_quest_flagged_completed(quest_id: integer) -> boolean
```

**Parameters**

- `quest_id` : `integer` - The quest ID to check.

Returns

- `boolean` : `true` if the quest was ever completed by this character.

Description

Checks whether a quest has been completed at any point in the past. This queries the server's completion history, not the current quest log.

---

### `core.quests.is_on_quest`

Syntax

```lua
core.quests.is_on_quest(quest_id: integer) -> boolean
```

**Parameters**

- `quest_id` : `integer` - The quest ID to check.

Returns

- `boolean` : `true` if the quest is currently in the quest log.

Description

Checks whether a specific quest is currently active in the player's quest log.

**Example Usage**

```lua
local QUEST_ID = 12345
if core.quests.is_on_quest(QUEST_ID) then
    core.log("Quest is in progress")
elseif core.quests.is_quest_flagged_completed(QUEST_ID) then
    core.log("Quest already completed")
else
    core.log("Quest not started")
end
```

---

### `core.quests.get_quest_log_quest_ids`

Syntax

```lua
core.quests.get_quest_log_quest_ids() -> integer[]
```

Returns

- `integer[]` : The quest IDs of every quest in your log, in log order.

Description

Lists the quests in your log by quest ID. Header rows are skipped, and so are hidden tracking entries the game never shows. Works on every client. Added in the core update of 2026-10-06.

> [!WARNING]
> The game only lists the rows its quest log currently **shows**, so quests under a header you collapsed can be missing. Call `expand_quest_header(0)` first if you collapse headers.

**Example Usage**

```lua
for _, quest_id in ipairs(core.quests.get_quest_log_quest_ids()) do
    if core.quests.is_quest_complete(quest_id) then
        core.log("Ready to hand in: " .. quest_id)
    end
end
```

---

### `core.quests.get_quest_objectives`

Syntax

```lua
core.quests.get_quest_objectives(quest_id: integer) -> table[]
```

**Parameters**

- `quest_id` : `integer` - The quest ID, not a log index.

Returns

- `table[]` : One table per objective, empty when the quest is not in your log or has no objectives. Each table contains:

| Field | Type | Description |
| --- | --- | --- |
| `text` | `string` | The objective line as the tracker shows it, for example `"Kobold Vermin slain: 4/8"` |
| `type` | `string` | The objective kind as the game names it, for example `"monster"`, `"item"` or `"object"` |
| `finished` | `boolean` | `true` when this objective is done |
| `fulfilled` | `integer` | The current count, for example `4` |
| `required` | `integer` | The count needed, for example `8` |

Description

Returns the objectives of a quest in your log, by quest ID, from the game's `C_QuestLog.GetQuestObjectives`. Works on every client. Unlike `get_quest_log_leader_board` it needs no log index, and `fulfilled` / `required` give you the numbers without parsing the localized text.

Added in the core update of 2026-10-06. On an older core the function does not exist and `core.quests.get_quest_objectives` is `nil`.

**Example Usage**

```lua
for _, o in ipairs(core.quests.get_quest_objectives(quest_id)) do
    core.log(o.text .. (o.finished and " (done)" or ""))
end
```

---

### `core.quests.is_quest_complete`

Syntax

```lua
core.quests.is_quest_complete(quest_id: integer) -> boolean
```

**Parameters**

- `quest_id` : `integer` - The quest ID, not a log index.

Returns

- `boolean` : `true` when the quest is in your log and can be turned in.

Description

Returns whether a quest in your log is ready to hand in. Works on every client. Added in the core update of 2026-10-06.

`false` for a failed quest, and for a quest that is not in your log, including one you already turned in. Use `is_quest_flagged_completed` for that.

This is the game's own answer and does not depend on Questie. [`core.addons.questie.is_quest_complete`](/dev/api/addons#coreaddonsquestieis_quest_complete) reads Questie's cache instead, which can be empty or stale: on Forever it answers `0` for quests that are ready to hand in.

**Example Usage**

```lua
local QUEST_ID = 12345
if core.quests.is_quest_complete(QUEST_ID) then
    core.log("Go hand it in")
end
```

---

### `core.quests.select_quest_log_entry`

Syntax

```lua
core.quests.select_quest_log_entry(index: integer) -> nil
```

**Parameters**

- `index` : `integer` - The quest log entry index to select, on every client.

Description

Selects a quest log entry. This is required before calling functions that operate on the "selected" quest, such as `quest_log_push_quest` or `set_abandon_quest`. A header row selects nothing.

It takes the **log index** on every client, Retail and Forever included, since the core update of 2026-10-06. The same rule applies to `add_quest_watch` and `remove_quest_watch`.

> [!NOTE]
> Older cores needed the quest ID on Retail. That still works: on Retail and Forever, a number that is not a quest row of your log but is the ID of a quest in your log is taken as that quest ID. When a number is valid both ways, which is only possible for very old, low quest IDs, the log index wins.

---

### `core.quests.expand_quest_header`

Syntax

```lua
core.quests.expand_quest_header(index?: integer, is_auto?: boolean) -> nil
```

**Parameters**

- `index` : `integer` *(optional)* - The quest log index of the header to expand. Defaults to `0` , which expands every header. Any index that does not point at a header also expands every header.
- `is_auto` : `boolean` *(optional)* - Pass `true` when the quest log is being reset to its default state. Defaults to `false` .

Description

Expands a quest log header so the quests grouped under it become visible in the quest log. Because collapsed headers hide their quests from the quest log indices, expanding all headers first is the reliable way to enumerate every quest.

```lua
-- expand every header, then walk the full quest log
core.quests.expand_quest_header(0)

for i = 1, core.quests.get_num_quest_log_entries() do
    local entry = core.quests.get_quest_log_title(i)
    core.log(entry.title)
end
```

---

### `core.quests.collapse_quest_header`

Syntax

```lua
core.quests.collapse_quest_header(index?: integer, is_auto?: boolean) -> nil
```

**Parameters**

- `index` : `integer` *(optional)* - The quest log index of the header to collapse. Defaults to `0` , which collapses every header. Any index that does not point at a header also collapses every header.
- `is_auto` : `boolean` *(optional)* - Pass `true` when the quest log is being reset to its default state. Defaults to `false` .

Description

Collapses a quest log header, hiding the quests grouped under it. This is the counterpart to `expand_quest_header` and is typically used to restore the player's quest log to how they left it.

```lua
core.quests.collapse_quest_header(0)
```

---

### `core.quests.get_num_quest_leader_boards`

Syntax

```lua
core.quests.get_num_quest_leader_boards(quest_log_index: integer) -> integer
```

**Parameters**

- `quest_log_index` : `integer` - The quest log entry index.

Returns

- `integer` : The number of objectives for the quest.

Description

Returns the number of objectives (leaderboard entries) for a quest in the quest log.

---

### `core.quests.get_quest_log_leader_board`

Syntax

```lua
core.quests.get_quest_log_leader_board(obj_index: integer, quest_log_index: integer) -> table
```

**Parameters**

- `obj_index` : `integer` - The objective index.
- `quest_log_index` (Optional): `integer` - The quest log entry index. Default is `0` .

Returns

- `table` : A table with the following fields:

| Field | Type | Description |
| --- | --- | --- |
| `description` | `string` | The objective description text, e.g. `"Wolves slain: 3/10"`. |
| `objective_type` | `string` | The type of objective. |
| `is_completed` | `boolean` | Whether this objective is completed. |

Description

Returns information about a specific quest objective. The `description` typically includes the current progress and goal.

**Example Usage**

```lua
local num_objectives = core.quests.get_num_quest_leader_boards(5)
for j = 1, num_objectives do
    local obj = core.quests.get_quest_log_leader_board(j, 5)
    core.log("  Objective: " .. obj.description .. (obj.is_completed and " [done]" or ""))
end
```

> [!TIP]
> Prefer the `is_completed` flag over parsing the `"3/10"` numbers out of `description` — the text is localized and its format varies by objective type.

---

### `core.quests.get_quest_log_item_link`

Syntax

```lua
core.quests.get_quest_log_item_link(type: string, index: integer, quest_id: integer) -> string
```

**Parameters**

- `type` : `string` - The type of item ( `"reward"` or `"choice"` ).
- `index` : `integer` - The item index.
- `quest_id` : `integer` - The quest ID.

Returns

- `string` : The item link for the quest log reward or choice item.

Description

Returns the item link string for a reward or choice item associated with a quest in the quest log.

---

### `core.quests.add_quest_watch`

Syntax

```lua
core.quests.add_quest_watch(index: integer, watch_time?: number) -> nil
```

**Parameters**

- `index` : `integer` - The quest log entry index, on every client.
- `watch_time` (optional): `number` - Seconds to keep the quest watched, Classic clients only. Defaults to `0` . Retail and Forever have no duration and ignore it.

Description

Adds a quest to the on-screen quest tracker. It takes the log index on every client since the core update of 2026-10-06, and still accepts a quest ID the way `select_quest_log_entry` does.

---

### `core.quests.remove_quest_watch`

Syntax

```lua
core.quests.remove_quest_watch(index: integer) -> nil
```

**Parameters**

- `index` : `integer` - The quest log entry index, on every client.

Description

Removes a quest from the on-screen quest tracker. It takes the log index on every client since the core update of 2026-10-06, and still accepts a quest ID the way `select_quest_log_entry` does.

---

### `core.quests.quest_log_push_quest`

Syntax

```lua
core.quests.quest_log_push_quest() -> nil
```

Description

Shares the currently selected quest log entry with the party. You must first select the quest using `select_quest_log_entry`.

---

### `core.quests.set_abandon_quest`

Syntax

```lua
core.quests.set_abandon_quest() -> nil
```

Description

Marks the currently selected quest log entry for abandonment. You must first select the quest using `select_quest_log_entry`, then call `abandon_quest` to confirm. To abandon a quest by quest ID in one call, use `abandon_quest_by_id`.

---

### `core.quests.abandon_quest`

Syntax

```lua
core.quests.abandon_quest() -> nil
```

Description

Confirms abandonment of the quest previously marked with `set_abandon_quest`.

> [!DANGER]
> The quest and its progress are gone.

**Example Usage**

```lua
-- Abandon quest at log index 3 (the log index on every client)
core.quests.select_quest_log_entry(3)
core.quests.set_abandon_quest()
core.quests.abandon_quest()
```

---

### `core.quests.abandon_quest_by_id`

Syntax

```lua
core.quests.abandon_quest_by_id(quest_id: integer) -> boolean
```

**Parameters**

- `quest_id` : `integer` - The quest ID, not a log index.

Returns

- `boolean` : `true` when the abandon was sent. `false` when the quest is not in your log, or the game says it cannot be abandoned.

Description

Abandons a quest by quest ID in one call: it selects the quest, marks it and abandons it, like the game's own quest map button. Works on every client. Added in the core update of 2026-10-06.

`true` means the request was sent, not that the quest is already gone. `is_on_quest``(quest_id)` turning `false` after the next `QUEST_LOG_UPDATE` event confirms it.

> [!DANGER]
> The quest and its progress are gone.

**Example Usage**

```lua
local QUEST_ID = 12345
if core.quests.abandon_quest_by_id(QUEST_ID) then
    core.log("Abandon sent, waiting for QUEST_LOG_UPDATE")
end
```

---

## Gossip Functions

> [!INFO]
> Retail **gained** its gossip fields in the 10.0.2 rework, which introduced a database-driven system where each option carries a persistent id plus status, flags and rewards. Blizzard's own Classic clients use that same system. Only on the private-server clients (Vanilla 1.14 / TBC 2.5.3) is an option's identity **its position in the list**, and those extra fields are not sent at all.
>
> | Field | Retail and Blizzard's Classic versions | Private-server clients (Vanilla 1.14 / TBC 2.5.3) |
> | --- | --- | --- |
> | `gossip_option_id` | real id | 1-based **row index** |
> | `quest_id` | real quest id | 1-based **row index** |
> | `icon` | real | `0` — recover from `gossip_type` |
> | `status`, `spell_id`, `flags` | real | `0` |
> | `rewards` | populated | empty |
>
> Both id fields still round-trip correctly from getter to selector on every version, which is what makes misuse easy: the value looks like an id and behaves like one right up until you persist it or compare it against an id from another source.
>
> **Two rules if you use these functions directly:** pass the id straight back to the matching selector in the same frame and never store it, and never treat `quest_id` as a real quest id without checking the game version first.

### `core.quests.get_gossip_options`

Syntax

```lua
core.quests.get_gossip_options() -> table
```

Returns

- `table` : An array of gossip options. Each entry has the following fields:

| Field | Type | Description |
| --- | --- | --- |
| `name` | `string` | The gossip option name. |
| `gossip_type` | `string` | The gossip type. |
| `gossip_option_id` | `integer` | Pass this to `select_gossip_option`. A real option id on Retail and Blizzard's Classic versions; the **1-based row index** on the private-server clients (Vanilla 1.14 / TBC 2.5.3). Opaque either way — do not store or compare it. |
| `icon` | `integer` | The gossip icon. `0` on the private-server clients — derive it from `gossip_type` instead. |
| `status` | `integer` | The gossip status. |
| `spell_id` | `integer` | The associated spell ID. |
| `flags` | `integer` | The gossip flags. |
| `order_index` | `integer` | The order index. |
| `rewards` | `table[]` | The rewards for this option (see below). |

Each entry in `rewards` has:

| Field | Type | Description |
| --- | --- | --- |
| `id` | `integer` | The reward item ID. |
| `quantity` | `integer` | The reward quantity. |
| `reward_type` | `integer` | The reward type. |

Description

Returns the list of gossip options available from the currently open gossip frame. Each entry contains information about a dialog option the NPC offers.

> [!WARNING]
> Select by `gossip_option_id`, not by array position. On retail the order of the list is not stable between NPCs or between visits to the same NPC. On the private-server clients the two happen to be the same number, but write it as `gossip_option_id` anyway so the code stays correct on every version.

---

### `core.quests.select_gossip_option`

Syntax

```lua
core.quests.select_gossip_option(id: integer) -> nil
```

**Parameters**

- `id` : `integer` - The gossip option ID to select.

Description

Selects a gossip option from the NPC dialog.

---

### `core.quests.get_gossip_available_quests`

Syntax

```lua
core.quests.get_gossip_available_quests() -> table
```

Returns

- `table` : An array of quests. Each entry has the following fields:

| Field | Type | Description |
| --- | --- | --- |
| `title` | `string` | The quest title. |
| `quest_id` | `integer` | A real quest id on Retail and Blizzard's Classic versions; the **1-based row index** on the private-server clients (Vanilla 1.14 / TBC 2.5.3), which expose no quest id. Match on `title` if you need identity across frames. |
| `quest_level` | `integer` | The quest level. |
| `frequency` | `integer` | The quest frequency. |
| `is_trivial` | `boolean` | Whether the quest is trivial (grey). |
| `is_repeatable` | `boolean` | Whether the quest is repeatable. |
| `is_complete` | `boolean` | Whether the quest is complete. |
| `is_legendary` | `boolean` | Whether the quest is legendary. |
| `is_ignored` | `boolean` | Whether the quest is ignored. |
| `is_important` | `boolean` | Whether the quest is important. |
| `is_meta` | `boolean` | Whether the quest is a meta quest. |

Description

Returns the list of quests available to pick up from the gossip NPC.

> [!TIP]
> Skip grey quests when levelling by filtering on `is_trivial`, and pass `quest_id` — not the array index — to `select_gossip_available_quest`. On the private-server clients `quest_id` is itself the row index, so selection still round-trips, but the value is not a quest id and must not be persisted or looked up.

---

### `core.quests.get_gossip_active_quests`

Syntax

```lua
core.quests.get_gossip_active_quests() -> table
```

Returns

- `table` : An array of quests, with the same fields as `get_gossip_available_quests` .

Description

Returns the list of active (in-progress or completable) quests at the gossip NPC.

> [!TIP]
> `is_complete` is the useful one here — it tells you which of the NPC's active quests can be turned in right now.

---

### `core.quests.select_gossip_available_quest`

Syntax

```lua
core.quests.select_gossip_available_quest(quest_id: integer) -> nil
```

**Parameters**

- `quest_id` : `integer` - The quest ID to select.

Description

Selects an available quest from the gossip frame by quest ID.

---

### `core.quests.select_gossip_active_quest`

Syntax

```lua
core.quests.select_gossip_active_quest(quest_id: integer) -> nil
```

**Parameters**

- `quest_id` : `integer` - The quest ID to select.

Description

Selects an active quest from the gossip frame by quest ID.

---

### `core.quests.close_gossip`

Syntax

```lua
core.quests.close_gossip() -> nil
```

Description

Closes the gossip frame.

---

### `core.quests.is_gossip_frame_shown`

Syntax

```lua
core.quests.is_gossip_frame_shown() -> boolean
```

Returns

- `boolean` : `true` if the gossip frame is currently open; otherwise, `false` .

Description

Checks whether the gossip frame is currently displayed.

**Example Usage**

```lua
if core.quests.is_gossip_frame_shown() then
    local options = core.quests.get_gossip_options()
    core.log("Gossip options available: " .. #options)
end
```

---

## Trainer Functions

### `core.quests.get_num_trainer_services`

Syntax

```lua
core.quests.get_num_trainer_services() -> integer
```

Returns

- `integer` : The number of services available from the trainer.

Description

Returns the number of training services available from the currently open trainer window.

---

### `core.quests.get_trainer_service_info`

Syntax

```lua
core.quests.get_trainer_service_info(index: integer) -> table
```

**Parameters**

- `index` : `integer` - The index of the trainer service.

Returns

- `table` : A table with the following fields:

| Field | Type | Description |
| --- | --- | --- |
| `spell_name` | `string` | The spell name. |
| `rank` | `string` | The spell rank, e.g. `"Rank 1"`. `""` when it has none. |
| `category` | `string` | The service type: `"available"`, `"unavailable"`, `"used"` or `"header"`. |
| `expanded` | `integer` | Whether a header row is expanded. Always `0` on Forever, which has no expandable headers. |

> [!NOTE]
> Forever's game returns these values in a different order, so on cores up to 2.103 `rank` read `"available"` / `"unavailable"` and `category` was empty there. Fixed in the next core update; the fields then mean the same on every game version.

Description

Returns detailed information about a specific trainer service at the given index.

---

### `core.quests.get_trainer_service_cost`

Syntax

```lua
core.quests.get_trainer_service_cost(index: integer) -> table
```

**Parameters**

- `index` : `integer` - The index of the trainer service.

Returns

- `table` : A table with the following fields:

| Field | Type | Description |
| --- | --- | --- |
| `service_cost` | `integer` | The service cost in copper. |
| `talent_cost` | `integer` | The talent cost. |
| `profession_cost` | `integer` | The profession cost. |

Description

Returns the costs of a trainer service at the given index.

> [!NOTE]
> Compare `service_cost` against [`core.inventory.get_gold`](/dev/api/core#coreinventoryget_gold) before calling `buy_trainer_service` — both are in copper.

---

### `core.quests.buy_trainer_service`

Syntax

```lua
core.quests.buy_trainer_service(index: integer) -> nil
```

**Parameters**

- `index` : `integer` - The index of the trainer service to purchase.

Description

Purchases a trainer service at the given index.

**Example Usage**

```lua
local num_services = core.quests.get_num_trainer_services()
for i = 1, num_services do
    local info = core.quests.get_trainer_service_info(i)
    local cost = core.quests.get_trainer_service_cost(i)
    local gold = math.floor(cost.service_cost / 10000)
    core.log(string.format("Service %d, %s: %dg", i, info.spell_name, gold))
end

-- Buy the first service
core.quests.buy_trainer_service(1)
```

---

### `core.quests.close_trainer`

Syntax

```lua
core.quests.close_trainer() -> boolean
```

Returns

- `boolean` : `true` when the game's close call was reached. With no trainer open it does nothing and still answers `true` , so it is not an "is a trainer open" check.

Description

Closes the trainer window, exactly as its own close button does, so a training run can leave the window when it is done. The merchant and the flight map have the same call: [`core.input.close_merchant`](/dev/api/input) and [`core.taxi.close`](/dev/api/core).

The trainer window is open between the `TRAINER_SHOW` and `TRAINER_CLOSED` events, which [`core.register_on_game_event_callback`](/dev/api/events) delivers. That is also the only time the trainer functions above have anything to answer.

**Example Usage**

```lua
-- List what a trainer offers, then leave
core.register_on_game_event_callback(function(event_name)
    if event_name ~= "TRAINER_SHOW" then
        return
    end

    for i = 1, core.quests.get_num_trainer_services() do
        local info = core.quests.get_trainer_service_info(i)
        core.log(string.format("%d: %s %s (%s)", i, info.spell_name, info.rank, info.category))
    end

    core.quests.close_trainer()
end)
```

---

## Item Info Functions

### `core.quests.get_item_spell`

Syntax

```lua
core.quests.get_item_spell(item_id_or_link) -> table
```

**Parameters**

- `item_id_or_link` : `integer|string` - An item ID, an item link or an item name.

Returns

- `table` : `{ spell_name = string, spell_id = integer }` . Empty name and `0` when the item has no use spell.

Description

Returns the spell an item casts when used. Useful for identifying quest items that trigger specific actions. The first call for an item the game has not loaded yet can come back empty; ask again a moment later.

**Example Usage**

```lua
local info = core.quests.get_item_spell(6948) -- Hearthstone
core.log(info.spell_name .. " " .. info.spell_id)
```

> [!NOTE]
> Before the core update of 2026-10-06 this was always empty on Forever, and on the other versions whenever the game setting `loadDeprecationFallbacks` was off. It now works on every version.

---

### `core.quests.get_item_info`

Syntax

```lua
core.quests.get_item_info(item_id_or_link) -> table
```

**Parameters**

- `item_id_or_link` : `integer|string` - An item ID or item link string.

Returns

- `table` : A table with the following fields:

| Field | Type | Description |
| --- | --- | --- |
| `name` | `string` | The item name. |
| `item_link` | `string` | The item link string. |
| `quality` | `integer` | The item quality (`0` to `8`). |
| `item_level` | `integer` | The item level. |
| `min_level` | `integer` | The minimum required level. |
| `item_type` | `string` | The item type. |
| `item_sub_type` | `string` | The item sub type. |
| `stack_count` | `integer` | The max stack count. |
| `equip_loc` | `string` | The equip location. |
| `texture` | `integer` | The item texture ID. |
| `sell_price` | `integer` | The sell price in copper. |
| `class_id` | `integer` | The item class ID. |
| `subclass_id` | `integer` | The item subclass ID. |
| `bind_type` | `integer` | The bind type. |
| `expansion_id` | `integer` | The expansion ID. |
| `set_id` | `integer` | The set ID. |
| `is_crafting_reagent` | `boolean` | Whether the item is a crafting reagent. |
| `description` | `string` | The item description. |

Description

Returns an information table for the specified item.

---

## Complete Examples

### Example: Auto-Accept and Turn In Quests at NPC

```lua
local function handle_npc_quests()
    -- Check if gossip frame is open
    if not core.quests.is_gossip_frame_shown() then
        return
    end

    -- First, turn in any completable active quests
    local active = core.quests.get_gossip_active_quests()
    for _, quest in ipairs(active) do
        core.quests.select_gossip_active_quest(quest.quest_id)
        core.quests.complete_quest()
        return -- Process one at a time
    end

    -- Then, accept any available quests
    local available = core.quests.get_gossip_available_quests()
    for _, quest in ipairs(available) do
        core.quests.select_gossip_available_quest(quest.quest_id)
        core.quests.accept_quest()
        return -- Process one at a time
    end
end
```

### Example: Quest Progress Tracker

```lua
local function print_quest_progress()
    local num_entries = core.quests.get_num_quest_log_entries()

    for i = 1, num_entries do
        local info = core.quests.get_quest_log_title(i)
        if not info.is_header then
            core.log(string.format("[%d] %s", info.quest_id, info.title))

            local num_objectives = core.quests.get_num_quest_leader_boards(i)
            for j = 1, num_objectives do
                local text = core.quests.get_quest_log_leader_board(j, i)
                core.log("    " .. text)
            end
        end
    end
end
```