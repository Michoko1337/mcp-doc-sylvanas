# Game Events

> Source: <https://docs.project-sylvanas.net/dev/api/events>

## Overview

`core.register_on_game_event_callback` lets a plugin subscribe to native WoW game events (combat log, encounters, group changes, auction house, and more). The core buffers every event fired since the last tick and drains them once per frame on the main thread, then invokes your callback **once per event**.

Unlike the buff/combat helpers in the IZI SDK, there is **one callback for all events** — you register a single function and dispatch on the event name yourself. Register it once at load; do not register inside your update loop.

> [!INFO]
> `register_on_spell_cast_callback` and friends hand you a structured data table for one specific concept. `register_on_game_event_callback` is a generic firehose: it forwards **any** registered WoW event, with its raw positional arguments, so you get breadth at the cost of having to interpret the `args` array per event.

---

## `core.register_on_game_event_callback`

Syntax

```lua
core.register_on_game_event_callback(callback: fun(event_name: string, args: (string|number|boolean|nil)[]))
```

**Parameters**

- `callback` : `function` - Invoked once per buffered event. It receives:
  - `event_name` : `string` - The WoW event name, e.g. `"ENCOUNTER_START"` .
  - `args` : `array` - A positional (1‑based) array of that event's arguments. Original types are preserved: `string` , `number` , `boolean` , or `nil` holes. Complex values (table / function / userdata) arrive as their `tostring()` representation.

Description

Registers a callback fired for each buffered game event. Each plugin has a maximum number of callbacks; exceeding it raises a Lua error, so register once.

> [!WARNING]
> For `COMBAT_LOG_EVENT_UNFILTERED`, the `args` array is **not** the raw event payload — it is the flattened result of `CombatLogGetCurrentEventInfo()` (`timestamp`, `sub_event`, `hide_caster`, `source_guid`, …). See the **combat‑log example** below.

> [!WARNING]
> `UNIT_AURA` does not carry WoW's own arguments either, and it is the one event that fires your callback **once per aura** instead of once per event. `args[1]` is a sub-type telling you which kind of record you got. See **Auras** below.

---

## Registered events

The pump registers the events below. Adding an unknown name on a given client is harmless — it is simply ignored. The `args` column lists the positional arguments in order.

### Combat & encounters

| Event | `args` (in order) |
| --- | --- |
| `COMBAT_LOG_EVENT_UNFILTERED` | `CombatLogGetCurrentEventInfo()` — see below |
| `PLAYER_REGEN_DISABLED` | *(none)* — you entered combat |
| `PLAYER_REGEN_ENABLED` | *(none)* — you left combat |
| `ENCOUNTER_START` | `encounter_id`, `encounter_name`, `difficulty_id`, `group_size` |
| `ENCOUNTER_END` | `encounter_id`, `encounter_name`, `difficulty_id`, `group_size`, `success` |
| `CHALLENGE_MODE_COMPLETED` | *(none)*, a Mythic+ or Challenge Mode run just finished |

`CHALLENGE_MODE_COMPLETED` is only the signal. It carries no arguments; read the result, including the level, the time, whether it was timed and the rating change, with [`core.world.get_challenge_completion_info`](/dev/api/world).

> [!WARNING]
> It fires on Retail (Mythic+) and on MoP Classic (Challenge Mode dungeons). Classic Era, TBC Classic and Titan (China) have no challenge modes, so it never fires there. Forever is not confirmed.

```lua
core.register_on_game_event_callback(function(event_name, args)
    if event_name ~= "CHALLENGE_MODE_COMPLETED" then
        return
    end

    local info = core.world.get_challenge_completion_info()
    if info then
        core.log(string.format("+%d finished, %s", info.level, info.on_time and "timed" or "depleted"))
    end
end)
```

### Player

| Event | `args` (in order) |
| --- | --- |
| `PLAYER_STARTED_MOVING` | *(none)* |
| `PLAYER_STOPPED_MOVING` | *(none)* |
| `PLAYER_EQUIPMENT_CHANGED` | `equipment_slot`, `has_current` |
| `PLAYER_FLAGS_CHANGED` | `unit_token` (e.g. `"player"`) |
| `PLAYER_LOGOUT` | *(none)* |
| `SPELLS_CHANGED` | *(none)* |
| `START_PLAYER_COUNTDOWN` | `initiated_by`, `time_remaining`, `total_time` |
| `CANCEL_PLAYER_COUNTDOWN` | `initiated_by` |

### Auras

| Event | `args` (in order) |
| --- | --- |
| `UNIT_AURA` | `sub`, then fields that depend on `sub` (see below) |

`UNIT_AURA` is the only event that arrives as **several callbacks per game event**. On retail (9.0+) WoW fires it as `(unit, update_info)` where `update_info` is a table, and aura data is readable only inside the client's secure environment, so the core unpacks it there and emits one flat record per aura. `args[1]` tells you which kind of record you have:

| `args[1]` | The rest of `args` |
| --- | --- |
| `"full"` | `unit`. The unit's entire aura set was resent: drop what you cached for it, a burst of `"added"` records for that same unit follows immediately. |
| `"added"` | `unit`, `instance_id`, `spell_id`, `name`, `stacks`, `duration`, `expiration_time`, `source_unit`, `is_helpful`, `is_harmful`, `dispel_name` |
| `"updated"` | The same 12 fields as `"added"`, already re-queried for you by instance id. |
| `"removed"` | `unit`, `instance_id` |

Three things to know before using it:

- **`unit` and `source_unit` are unit tokens, not GUIDs** ( `"player"` , `"party2"` , `"nameplate7"` ). The client recycles tokens onto different units, so resolve them with [`core.object_manager.get_object_from_guid`](/dev/api/object-manager) , which accepts a token, and store the GUID. `source_unit` is `nil` when the client does not know the caster.
- **`instance_id` is the client's stable aura handle.** It is the only thing `"updated"` and `"removed"` name the aura by, and unlike the old per-unit slot index it is not reused the moment an aura fades. Key your own tables by it.
- **`duration` and `expiration_time` are seconds on WoW's `GetTime()` clock** , not the `core.game_time()` milliseconds that `game_object:get_buffs()` uses. The two do not mix.

A client whose `UNIT_AURA` carries no `update_info` table sends just `{ unit }`: no sub-type, no aura fields and no instance id anywhere. Compare `args[1]` against the four names above to tell the two shapes apart.

> [!WARNING]
> The shape follows the client's aura system, not its version number. Retail, Forever, Titan (China) and the current Classic Era, TBC Classic and MoP Classic clients all have the modern aura API, so they all get the flat records above. The private-server clients (Vanilla 1.14 / TBC 2.5.3) are not confirmed either way, so check `args[1]` before relying on the fields there.

### Spell casting

Twenty `UNIT_SPELLCAST_*` events cover the whole cast lifecycle, for **every** unit the client has a frame for. `args[1]` is always the **caster's** unit token — Blizzard names that parameter `unitTarget`, which reads like the opposite — and the common payload after it is `cast_guid` then `spell_id`.

| Event | `args` (in order) |
| --- | --- |
| `UNIT_SPELLCAST_SENT` | `unit`, `target_name`, `cast_guid`, `spell_id` |
| `UNIT_SPELLCAST_START` | `unit`, `cast_guid`, `spell_id` |
| `UNIT_SPELLCAST_STOP` | `unit`, `cast_guid`, `spell_id` |
| `UNIT_SPELLCAST_SUCCEEDED` | `unit`, `cast_guid`, `spell_id` |
| `UNIT_SPELLCAST_DELAYED` | `unit`, `cast_guid`, `spell_id` |
| `UNIT_SPELLCAST_FAILED` | `unit`, `cast_guid`, `spell_id` |
| `UNIT_SPELLCAST_FAILED_QUIET` | `unit`, `cast_guid`, `spell_id` |
| `UNIT_SPELLCAST_INTERRUPTED` | `unit`, `cast_guid`, `spell_id` |
| `UNIT_SPELLCAST_INTERRUPTIBLE` | `unit` |
| `UNIT_SPELLCAST_NOT_INTERRUPTIBLE` | `unit` |
| `UNIT_SPELLCAST_CHANNEL_START` | `unit`, `cast_guid`, `spell_id` |
| `UNIT_SPELLCAST_CHANNEL_UPDATE` | `unit`, `cast_guid`, `spell_id` |
| `UNIT_SPELLCAST_CHANNEL_STOP` | `unit`, `cast_guid`, `spell_id` |
| `UNIT_SPELLCAST_EMPOWER_START` | `unit`, `cast_guid`, `spell_id` |
| `UNIT_SPELLCAST_EMPOWER_UPDATE` | `unit`, `cast_guid`, `spell_id` |
| `UNIT_SPELLCAST_EMPOWER_STOP` | `unit`, `cast_guid`, `spell_id`, `complete` |
| `UNIT_SPELLCAST_RETICLE_TARGET` | `unit`, `cast_guid`, `spell_id` |
| `UNIT_SPELLCAST_RETICLE_CLEAR` | `unit`, `cast_guid`, `spell_id` |
| `UNIT_SPELLMISS` | `unit`, `cast_guid`, `spell_id`, `miss_type` |
| `UNIT_SPELL_DIMINISH_CATEGORY_STATE_UPDATED` | `unit`, `category`, `start_time`, `duration`, `is_immune`, `show_countdown` (see below) |

The `EMPOWER_STOP`, `RETICLE_*` and `UNIT_SPELLMISS` rows are the least travelled of the family, and their trailing arguments have moved between client builds. Log `args` once on the client you target before depending on anything past `args[1]` for those.

#### Diminishing returns (`UNIT_SPELL_DIMINISH_CATEGORY_STATE_UPDATED`)

The game hands this event a table, which cannot cross into your plugin, so the core flattens it into positional arguments (needs a core newer than 2.118; older cores put the text `"table: 000001EB..."` in `args[2]`):

| Index | Name | Type | Meaning |
| --- | --- | --- | --- |
| 1 | `unit` | string | Unit token (`"target"`, `"arena1"`, `"nameplate4"`, ...) |
| 2 | `category` | number | `Enum.SpellDiminishCategory`: 0 Root, 1 Taunt, 2 Stun, 3 AoEKnockback, 4 Incapacitate, 5 Disorient, 6 Silence, 7 Disarm |
| 3 | `start_time` | number | When the DR window started, `GetTime()` seconds |
| 4 | `duration` | number | How long the DR window lasts, seconds (reset at `start_time + duration`) |
| 5 | `is_immune` | boolean | The next CC of this category will be immuned |
| 6 | `show_countdown` | boolean | Blizzard's own UI shows a timer for it |

`start_time` is on the game's `GetTime()` clock in **seconds**, not `core.game_time()` milliseconds. The event carries no spell id and no step count: count DR steps yourself per unit and category, or rely on `is_immune` for the immune step. Not yet verified in game.

```lua
local dr = {} -- dr[guid][category] = { start_time, duration, is_immune }

core.register_on_game_event_callback(function(event_name, args)
    if event_name ~= "UNIT_SPELL_DIMINISH_CATEGORY_STATE_UPDATED" then return end
    local unit = core.object_manager.get_object_from_guid(args[1])
    if not unit or type(args[2]) ~= "number" then return end
    local guid = unit:get_guid()
    dr[guid] = dr[guid] or {}
    dr[guid][args[2]] = { start_time = args[3], duration = args[4], is_immune = args[5] }
end)
```

> [!WARNING]
> No current game version knows `UNIT_SPELLMISS`: Retail, Classic Era, TBC Classic, MoP Classic, Titan (China) and Forever all lack it, so it never reaches your callback there. Use the combat log's `*_MISSED` sub-events instead. The private-server clients (Vanilla 1.14 / TBC 2.5.3) are not confirmed.

#### The lifecycle

Records reach your callback in the order they fired, so a cast reads as a sequence:

| Cast kind | Order |
| --- | --- |
| Instant | `SENT` → `SUCCEEDED` |
| Hard cast | `SENT` → `START` → (`DELAYED`…) → `SUCCEEDED` → `STOP` |
| Channel | `SENT` → `SUCCEEDED` → `CHANNEL_START` → (`CHANNEL_UPDATE`…) → `CHANNEL_STOP` |
| Interrupted | `SENT` → `START` → `INTERRUPTED` → `STOP` |

A channel reports `SUCCEEDED` **before** `CHANNEL_START`, not at the end of the channel. That one catches everybody once.

> [!WARNING]
> `unit` is a unit token (`"target"`, `"arena2"`, `"nameplate7"`), never a GUID, and the client recycles tokens onto different units. Resolve it with [`core.object_manager.get_object_from_guid`](/dev/api/object-manager), which accepts a token, and store the GUID for anything that outlives the callback.
>
> `UNIT_SPELLCAST_SENT` is the exception twice over. Its second argument is the target's **name** — a plain string, not a token — which pushes `cast_guid` and `spell_id` to positions 3 and 4. And it only ever fires for units you control (`player`, `pet`, `vehicle`), because it reports the request your own client sent rather than something it observed.

> [!WARNING]
> The three `CHANNEL_*` events carry no cast GUID, so `args[2]` is a **hole** and `spell_id` is still at `args[3]`. With the nil-hole rule from the top of this page, `#args` tells you nothing there. Key channels by `unit` plus `spell_id` instead.

> [!WARNING]
> `UNIT_SPELLCAST_STOP` fires on completion, on self-cancel and on a kick alike — `SUCCEEDED` is the completion signal. `UNIT_SPELLCAST_INTERRUPTED` is caster-side and covers the caster moving or cancelling as well as being kicked, so it does not tell you that anyone kicked, let alone who. For interrupt **attribution**, use the combat log's `SPELL_INTERRUPT` sub-event, which names both sides.

`UNIT_SPELLCAST_INTERRUPTIBLE` and `UNIT_SPELLCAST_NOT_INTERRUPTIBLE` carry only the unit. They say the flag on that unit's current cast changed; they do not say which cast, so they are only useful once you are already holding it.

> [!INFO]
> These register for all units rather than a filtered few, so every unit the client has a frame for reports: target, focus, party, raid, arena, boss and every nameplate. `SUCCEEDED` and `START` are the busy ones in a raid or a crowded zone. Filter on the first line of your handler, not after the work.

`EMPOWER_*` and `RETICLE_*` belong to Retail spells, and `UNIT_SPELL_DIMINISH_CATEGORY_STATE_UPDATED` is newer than both. The Classic clients know the names but have nothing that raises them, so they never fire there, which is harmless.

> [!TIP]
> [`game_object`](/dev/api/game-object) already answers the same state by polling: `is_casting_spell`, `get_active_spell_id`, `get_active_spell_target`, `get_active_spell_cast_start_time` / `get_active_spell_cast_end_time`, `is_active_spell_interruptable`, `is_channelling_spell`, `get_active_channel_spell_id`, and the empower stage accessors. Those are what a rotation should use — they answer "what is this unit casting *right now*". The events are for what polling cannot give you: the exact frame of an edge, a `cast_guid` that ties one `START` to its own `SUCCEEDED` or `INTERRUPTED`, and units you are not already iterating.

### Confirmations

These are a different kind of event from everything else on this page. They are not "something happened", they report an action the engine has **withheld** and is holding open until it is answered. Nothing times them out, and each one has exactly one call that releases it.

| Event | `args` (in order) | The one call that releases it |
| --- | --- | --- |
| `AUTOEQUIP_BIND_CONFIRM` | `inventory_slot` | `core.input.equip_pending_item(inventory_slot)` |
| `EQUIP_BIND_CONFIRM` | `inventory_slot` | `core.input.equip_pending_item(inventory_slot)` |
| `CONFIRM_BINDER` | `binder_name` | `core.input.confirm_binder()` |
| `LOOT_BIND_CONFIRM` | `loot_slot` | `core.input.confirm_loot_slot(loot_slot - 1)` |
| `REPLACE_ENCHANT` | `existing`, `new` | `core.input.replace_enchant()` (core 2.120+) |
| `BIND_ENCHANT` | none | `core.input.bind_enchant()` (core 2.120+) |

The two `*_ENCHANT` events answer [`core.input.apply_container_item_to_inventory_slot`](/dev/api/input), which applies poisons, stones, oils and lures to an equipped weapon.

Blizzard's default UI answers all of them from popup accept buttons, which is why they look like UI concerns rather than engine state. Full descriptions of the calls are in [Input → Bind Confirmations](/dev/api/input).

> [!WARNING]
> `AUTOEQUIP_BIND_CONFIRM` does not exist on Retail, Classic Era, TBC Classic, MoP Classic, Titan (China) or Forever. There, equipping a bind-on-equip item from your bags raises `EQUIP_BIND_CONFIRM`. Keep handling both names, as the example below does: the private-server clients (Vanilla 1.14 / TBC 2.5.3) are not confirmed.

> [!WARNING]
> The event reports WoW's **1 based** loot slot. `core.input.confirm_loot_slot` takes the **0 based** index that `core.input.loot_item` and every `core.game_ui.get_loot_*` reader use. Forwarding `args[1]` straight through confirms the slot after the one that asked.

> [!INFO]
> The core keeps the pending inventory slot, so `core.game_ui.get_pending_equip_slot()` answers the same value from anywhere, not just inside the callback. That is what lets a plugin tell "the client is waiting for me" from "the client refused the equip", instead of silently discarding an upgrade.

```lua
core.register_on_game_event_callback(function(event_name, args)
    if event_name == "AUTOEQUIP_BIND_CONFIRM" or event_name == "EQUIP_BIND_CONFIRM" then
        core.input.equip_pending_item(args[1])

    elseif event_name == "CONFIRM_BINDER" then
        core.log("binding home at " .. tostring(args[1]))
        core.input.confirm_binder()

    elseif event_name == "LOOT_BIND_CONFIRM" then
        core.input.confirm_loot_slot(args[1] - 1)
    end
end)
```

### Group

| Event | `args` (in order) |
| --- | --- |
| `GROUP_ROSTER_UPDATE` | *(none)* |
| `GROUP_JOINED` | `category`, `party_guid` |
| `GROUP_LEFT` | `category`, `party_guid` |

### Talents

| Event | `args` (in order) |
| --- | --- |
| `CHARACTER_POINTS_CHANGED` | `change` (points gained, negative when spent) |
| `CONFIRM_TALENT_WIPE` | *(none)* |
| `PLAYER_TALENT_UPDATE` | *(none)*, 1.14 and later |
| `TRAIT_CONFIG_UPDATED` | `config_id`, Retail and Forever |
| `TRAIT_NODE_CHANGED` | `node_id`, Retail and Forever |

Every talent write in [Game UI](/dev/api/game-ui) is asynchronous, so these are how you learn that one landed. `CHARACTER_POINTS_CHANGED` fires on every talent client, `PLAYER_TALENT_UPDATE` from 1.14, and the two `TRAIT_*` events are what tell a Midnight caller that a `C_Traits` purchase finally committed.

> [!WARNING]
> The trainer **withholds** the respec and waits, the same way the bind confirmations above do. Nothing happens until [`core.game_ui.confirm_talent_wipe`](/dev/api/game-ui) answers it, so a plugin that resets talents and never registers this event simply hangs at the trainer.

```lua
core.register_on_game_event_callback(function(event_name, args)
    if event_name == "CONFIRM_TALENT_WIPE" then
        core.game_ui.confirm_talent_wipe()
    elseif event_name == "CHARACTER_POINTS_CHANGED" then
        core.log("talent points left: " .. core.game_ui.get_unspent_talent_points())
    end
end)
```

### Prompts the engine withholds

These are **not** notifications. Like the confirmations above, the engine holds the action and waits, and nothing happens until the matching call answers it. A session that ignores them stops dead.

| Event | `args` | Answer with |
| --- | --- | --- |
| `START_LOOT_ROLL` | `roll_id`, `roll_time` | [`core.input.roll_on_loot`](/dev/api/input) |
| `CONFIRM_LOOT_ROLL` | `roll_id`, `roll_type` | `core.input.roll_on_loot` |
| `PARTY_INVITE_REQUEST` | `sender` | `core.input.answer_group_invite` |
| `GROUP_INVITE_CONFIRMATION` | `invite`, `name`, `type`, `guid` (core 2.190+) | `core.input.answer_invite_confirmation` |
| `GUILD_INVITE_REQUEST` | `inviter`, `guild_name` | `core.input.answer_guild_invite` |
| `DUEL_REQUESTED` | `challenger` | `core.input.answer_duel` |
| `DUEL_FINISHED` | *(none)* | - |
| `RESURRECT_REQUEST` | `caster` | `core.input.answer_resurrect` |
| `READY_CHECK` | `initiator`, `time` | `core.input.confirm_ready_check` |
| `CONFIRM_XP_LOSS` | *(none)* | `core.input.accept_xp_loss` |

`GROUP_INVITE_CONFIRMATION` is "X has requested to join your group" (`type` = `"request"`), or a group member suggesting someone (`"suggest"`). The game sends it with no arguments; the core attaches the pending request itself. Needs core 2.190 or newer.

> [!WARNING]
> The client reports you as **not ready** when the check times out, so a session that ignores `READY_CHECK` reads to the group as a declining member.

### Lifecycle and progression

| Event | `args` |
| --- | --- |
| `PLAYER_ENTERING_WORLD` | `is_initial_login`, `is_reloading_ui` |
| `PLAYER_LEAVING_WORLD` | *(none)* |
| `PLAYER_DEAD` | *(none)* |
| `PLAYER_ALIVE` | *(none)* |
| `PLAYER_UNGHOST` | *(none)* |
| `PLAYER_LEVEL_UP` | `new_level`, … the client's own arguments |
| `UNIT_PET` | `unit_token` |
| `SKILL_LINES_CHANGED` | *(none)* |
| `QUEST_QUERY_COMPLETE` | *(none)* |
| `COMPANION_LEARNED` | *(none)*, WotLK and later |
| `COMPANION_UPDATE` | `companion_type`, WotLK and later |

The loading-screen pair is the one that cannot be derived by polling: no state says "a load just started". The rest were commonly emulated by watching state change, which is both more expensive and up to a frame late.

### Gossip & quests

Registered so a plugin can drive the pick-up / turn-in sequence on an edge instead of polling for it: `GOSSIP_SHOW`, `GOSSIP_CLOSED`, `QUEST_GREETING`, `QUEST_DETAIL`, `QUEST_PROGRESS`, `QUEST_COMPLETE`, `QUEST_FINISHED`, `QUEST_ACCEPTED`, `QUEST_TURNED_IN`, `QUEST_LOG_UPDATE`, `QUEST_ITEM_UPDATE`.

Read these as "the panel changed, go look at it" rather than as carriers of data. `GOSSIP_SHOW` and `GOSSIP_CLOSED` bracket the frames in which the gossip readers have anything to say; `QUEST_DETAIL`, `QUEST_PROGRESS` and `QUEST_COMPLETE` are the three panel states; and `QUEST_GREETING` is the multi-quest picker. It is common on Classic and rarer on Retail, where most NPCs use gossip instead, but Retail still fires it for NPCs that do not. The arguments a few of them carry are not the same across game versions, so take the quest itself from [Quests](/dev/api/quests) rather than off `args`.

### NPC windows

| Event | `args` (in order) |
| --- | --- |
| `MERCHANT_SHOW` | *(none)*, a merchant window opened |
| `MERCHANT_CLOSED` | *(none)* |
| `TRAINER_SHOW` | *(none)*, a trainer window opened |
| `TRAINER_CLOSED` | *(none)* |
| `TAXIMAP_OPENED` | `ui_map_system`, the flight map opened |
| `TAXIMAP_CLOSED` | *(none)* |

Each pair brackets the only time the matching functions have anything to say: the vendor readers in [Game UI](/dev/api/game-ui), the trainer functions in [Quests](/dev/api/quests) and the taxi functions in [Core](/dev/api/core). Each window also has a close call: [`core.input.close_merchant`](/dev/api/input), [`core.quests.close_trainer`](/dev/api/quests) and [`core.taxi.close`](/dev/api/core).

> [!NOTE]
> The game's own window calls its close function again while it hides, so a `*_CLOSED` event may arrive twice for one visit. Read it as "the window is closed now", never as a counter.

### Reputation

| Event | `args` (in order) |
| --- | --- |
| `UPDATE_FACTION` | *(none)* |

Fires when a standing changes and when the faction list itself changes, including right after a header is expanded or collapsed. It is the moment to re-read [Reputation](/dev/api/reputation) instead of polling it every frame.

### Hunter stable

| Event | `args` (in order) |
| --- | --- |
| `PET_STABLE_SHOW` | *(none)*, the stable master's window opened |
| `PET_STABLE_UPDATE` | *(none)*, the stable changed |
| `PET_STABLE_CLOSED` | *(none)* |

The [Pet Stable](/dev/api/pet-stable) functions only have data between `PET_STABLE_SHOW` and `PET_STABLE_CLOSED`, and its actions only send a request: `PET_STABLE_UPDATE` is when the result shows up.

```lua
core.register_on_game_event_callback(function(event_name)
    if event_name == "PET_STABLE_SHOW" or event_name == "PET_STABLE_UPDATE" then
        local pet = core.pet_stable.get_pet_info(0)
        core.log("active pet: " .. (pet and pet.name or "none"))
    end
end)
```

### Interaction outcome

[`core.input.interact_with_object`](/dev/api/input) only sends the request and always returns `true`. Whether the game accepted it arrives as an event:

| Result | Event |
| --- | --- |
| Accepted | the window's open event: `GOSSIP_SHOW`, `QUEST_GREETING`, `QUEST_DETAIL`, `MERCHANT_SHOW`, `TRAINER_SHOW`, `TAXIMAP_OPENED`, `PET_STABLE_SHOW`, `AUCTION_HOUSE_SHOW`, or one below |
| Accepted (modern clients) | `PLAYER_INTERACTION_MANAGER_FRAME_SHOW`, fires for every window above |
| Refused | `UI_ERROR_MESSAGE`, match on `args[3]` |
| Nothing | neither within about a second |

| Event | `args` (in order) |
| --- | --- |
| `PLAYER_INTERACTION_MANAGER_FRAME_SHOW` / `_HIDE` | `interaction_type` (`Enum.PlayerInteractionType`), Retail, Forever, Titan (China) and the current Classic Era, TBC and MoP Classic clients |
| `PLAYER_SOFT_INTERACT_CHANGED` | `old_guid`, `new_guid`, the unit the interact key would use now, every current game version |
| `BANKFRAME_OPENED` / `BANKFRAME_CLOSED` | *(none)* |
| `GUILDBANKFRAME_OPENED` / `GUILDBANKFRAME_CLOSED` | *(none)*, not on Classic Era, which has no guild bank |
| `MAIL_SHOW` / `MAIL_CLOSED` | *(none)* |
| `LOOT_OPENED` / `LOOT_CLOSED` | the client's own arguments |
| `ITEM_TEXT_BEGIN` / `ITEM_TEXT_CLOSED` | *(none)*, a book or plaque |
| `BATTLEFIELDS_SHOW` / `BATTLEFIELDS_CLOSED` | the client's own arguments, a battlemaster |
| `PETITION_SHOW` / `PETITION_CLOSED` | *(none)* |
| `GUILD_REGISTRAR_SHOW` / `GUILD_REGISTRAR_CLOSED` | *(none)* |
| `OPEN_TABARD_FRAME` / `CLOSE_TABARD_FRAME` | *(none)* |
| `BARBER_SHOP_OPEN` / `BARBER_SHOP_CLOSE` | *(none)*, Wrath and later |
| `TRANSMOGRIFY_OPEN` / `TRANSMOGRIFY_CLOSE` | *(none)*, Cataclysm and later |
| `CONFIRM_XP_LOSS` | *(none)*, the spirit healer's prompt |

A client that does not have one of these events simply never sends it.

```lua
core.register_on_game_event_callback(function(event_name, args)
    if event_name == "UI_ERROR_MESSAGE" then
        core.log("interaction refused: " .. tostring(args[3] or args[2]))
    elseif event_name == "MERCHANT_SHOW" or event_name == "BANKFRAME_OPENED" then
        core.log("interaction accepted: " .. event_name)
    end
end)
```

### Chat & UI

| Event | `args` (in order) |
| --- | --- |
| `CHAT_MSG_ADDON` | `prefix`, `message`, `channel`, `sender` |
| `CHAT_MSG_SYSTEM` | `text` |
| `CHAT_MSG_WHISPER` | `text`, `sender`, … |
| `CHAT_MSG_WHISPER_INFORM` | `text`, `recipient`, … — your own outgoing whisper |
| `CHAT_MSG_SAY` / `_YELL` / `_EMOTE` | `text`, `sender`, … |
| `CHAT_MSG_GUILD` | `text`, `sender`, … |
| `CHAT_MSG_CHANNEL` | `text`, `sender`, `language`, `channel_string`, … |
| `CHAT_MSG_COMBAT_XP_GAIN` | `text` |
| `CHAT_MSG_PARTY` | `text`, `sender`, `language_name`, `channel_name`, … — the client's own arguments |
| `CHAT_MSG_PARTY_LEADER` | same as `CHAT_MSG_PARTY`, for a line written by the party leader |
| `UI_ERROR_MESSAGE` | `error_type`, `message`, `string_id` |
| `UI_INFO_MESSAGE` | `message_type`, `message`, `string_id` |

`error_type` is a number that changes between game versions and `message` is in the player's language. `string_id` is the game's own name for the message, such as `"ERR_USE_TOO_FAR"`, and is the same on every version, so compare against that. It is `nil` on a client too old to provide it.

`CHAT_MSG_ADDON` carries another addon's traffic, and `sender` is the raw `"Name-Realm"` the client sent, realm included. You only receive a prefix somebody has registered, and you never receive your own messages. For Mythic+ keystones there is a pair of helpers that registers the `"LibKS"` prefix and asks the party, with the answers arriving on this event: see [Party Keystones](/dev/api/game-ui).

`CHAT_MSG_SYSTEM` is the load-bearing one of the chat family: loot rolls, bind confirmations, quest XP and most "that did not work" feedback arrive there and nowhere else.

`CHAT_MSG_PARTY` and `CHAT_MSG_PARTY_LEADER` pass the game's arguments through unchanged, so the first two are always the line and its author. The leader's own messages arrive as `CHAT_MSG_PARTY_LEADER`, not `CHAT_MSG_PARTY`, so listen for both to see the whole party channel.

```lua
core.register_on_game_event_callback(function(event_name, args)
    if event_name == "CHAT_MSG_PARTY" or event_name == "CHAT_MSG_PARTY_LEADER" then
        local text, sender = args[1], args[2]
        core.log(string.format("[party] %s: %s", tostring(sender), tostring(text)))
    end
end)
```

### Auction house

The `AUCTION_HOUSE_*` and commodity/item‑search family are also registered: `AUCTION_HOUSE_SHOW`, `AUCTION_HOUSE_CLOSED`, `AUCTION_HOUSE_DISABLED`, `AUCTION_HOUSE_NEW_RESULTS_RECEIVED`, `AUCTION_HOUSE_BROWSE_RESULTS_UPDATED`, `AUCTION_HOUSE_BROWSE_RESULTS_ADDED`, `AUCTION_HOUSE_BROWSE_FAILURE`, `AUCTION_HOUSE_FAVORITES_UPDATED`, `AUCTION_HOUSE_AUCTIONS_EXPIRED`, `AUCTION_HOUSE_AUCTION_CREATED`, `AUCTION_HOUSE_THROTTLED_SYSTEM_READY`, `AUCTION_CANCELED`, `OWNED_AUCTIONS_UPDATED`, `BIDS_UPDATED`, `COMMODITY_SEARCH_RESULTS_UPDATED`, `COMMODITY_SEARCH_RESULTS_RECEIVED`, `COMMODITY_PRICE_UPDATED`, `COMMODITY_PRICE_UNAVAILABLE`, `COMMODITY_PURCHASE_SUCCEEDED`, `COMMODITY_PURCHASE_FAILED`, `COMMODITY_PURCHASED`, `ITEM_SEARCH_RESULTS_UPDATED`, `ITEM_SEARCH_RESULTS_ADDED`, `REPLICATE_ITEM_LIST_UPDATE`, `AUCTION_MULTISELL_START`, `AUCTION_MULTISELL_UPDATE`, `AUCTION_MULTISELL_FAILURE`.

Most carry no arguments (they signal "state changed — re‑query the AH API"); the commodity price and multisell events carry a small number of numeric arguments matching their Blizzard signatures.

> [!WARNING]
> The browse, search, commodity, favorites, owned auction, bid and replicate events belong to the modern auction house that Retail, MoP Classic and Forever have. Classic Era and TBC Classic do not have it, so there those events never fire. Only `AUCTION_HOUSE_SHOW`, `AUCTION_HOUSE_CLOSED`, `AUCTION_HOUSE_DISABLED` and the three `AUCTION_MULTISELL_*` events fire on those two versions.

---

## The dispatch pattern

Because one callback receives every event, the idiomatic structure is a **handler table** keyed by event name:

```lua
local handlers = {}

function handlers.ENCOUNTER_START(args)
    local encounter_id, encounter_name = args[1], args[2]
    core.log(("Pull! [%d] %s"):format(encounter_id or 0, encounter_name or "?"))
end

function handlers.PLAYER_REGEN_DISABLED()
    core.log("Entered combat")
end

core.register_on_game_event_callback(function(event_name, args)
    local handler = handlers[event_name]
    if handler then
        handler(args)
    end
end)
```

Everything below fits inside this pattern — each example is one `handlers.EVENT_NAME` function.

---

## Advanced example 1 — combat log (many arguments)

`COMBAT_LOG_EVENT_UNFILTERED` is the richest event. Its `args` are the flattened `CombatLogGetCurrentEventInfo()` payload: 11 fixed fields followed by sub‑event‑specific fields.

**Fixed prefix (always present):**

| # | Field | Type |
| --- | --- | --- |
| 1 | `timestamp` | number |
| 2 | `sub_event` | string (e.g. `SPELL_DAMAGE`, `SPELL_INTERRUPT`, `SPELL_AURA_APPLIED`) |
| 3 | `hide_caster` | boolean |
| 4 | `source_guid` | string |
| 5 | `source_name` | string |
| 6 | `source_flags` | number |
| 7 | `source_raid_flags` | number |
| 8 | `dest_guid` | string |
| 9 | `dest_name` | string |
| 10 | `dest_flags` | number |
| 11 | `dest_raid_flags` | number |

For `SPELL_*` sub‑events, fields 12‑14 are `spell_id`, `spell_name`, `spell_school`.

```lua
-- Log every interrupt that lands, and every big hit you deal.
local me_guid  -- resolved lazily; the local player's GUID

function handlers.COMBAT_LOG_EVENT_UNFILTERED(args)
    local sub_event   = args[2]
    local source_guid = args[4]
    local source_name = args[5]
    local dest_name   = args[9]

    if sub_event == "SPELL_INTERRUPT" then
        -- SPELL_* prefix: [12]=spell_id [13]=spell_name; extra: [15]=extra_spell_name
        local spell_name       = args[13]
        local interrupted_spell = args[15]
        core.log(("%s interrupted %s's %s (via %s)"):format(
            source_name or "?", dest_name or "?", interrupted_spell or "?", spell_name or "?"))

    elseif sub_event == "SPELL_DAMAGE" then
        -- SPELL_DAMAGE suffix after the [12..14] spell fields: [15]=amount
        local spell_name = args[13]
        local amount     = args[15] or 0

        me_guid = me_guid or (core.object_manager.get_local_player()
            and core.object_manager.get_local_player():get_guid())

        if source_guid == me_guid and amount >= 100000 then
            core.log(("Big hit: %s for %d to %s"):format(spell_name or "?", amount, dest_name or "?"))
        end
    end
end
```

Note how the meaning of `args[15]` depends on `sub_event` — always branch on `args[2]` first.

---

## Advanced example 2 — encounters (named positional arguments)

`ENCOUNTER_START` and `ENCOUNTER_END` carry a fixed, well‑defined argument list, so you can unpack them directly into named locals. `ENCOUNTER_END` adds a `success` flag (WoW sends `1`/`0`).

```lua
function handlers.ENCOUNTER_START(args)
    local encounter_id, encounter_name, difficulty_id, group_size =
        args[1], args[2], args[3], args[4]

    core.log(("ENCOUNTER_START: [%d] %s (difficulty %d, %d players)"):format(
        encounter_id or 0, encounter_name or "?", difficulty_id or 0, group_size or 0))
end

function handlers.ENCOUNTER_END(args)
    local encounter_id, encounter_name = args[1], args[2]
    local success = args[5]  -- 1 = kill, 0 = wipe

    if success == 1 then
        core.log(("Killed [%d] %s"):format(encounter_id or 0, encounter_name or "?"))
    else
        core.log(("Wiped on [%d] %s"):format(encounter_id or 0, encounter_name or "?"))
    end
end
```

---

## Advanced example 3 — addon messages (`CHAT_MSG_ADDON`)

`CHAT_MSG_ADDON` is useful for talking to WeakAuras / other addons. Its args are `prefix`, `message`, `channel`, `sender`.

```lua
function handlers.CHAT_MSG_ADDON(args)
    local prefix, message, channel, sender = args[1], args[2], args[3], args[4]

    if prefix == "MyPluginSync" then
        core.log(("Sync from %s (%s): %s"):format(sender or "?", channel or "?", message or ""))
    end
end
```

---

## Advanced example 4 - unit auras (many records per event)

`UNIT_AURA` is the richest event after the combat log, and the only one where a single game event turns into a burst of callbacks. This handler answers the three questions the payload is usually wanted for: which unit the aura is on, who cast it, and which aura it is across updates.

```lua
local my_auras = {}   -- [instance_id] = { spell_id, name, stacks, expiration_time, ... }

-- Unit tokens resolve through get_object_from_guid, which takes a token as well as a GUID.
local function guid_of(token)
    if not token then
        return nil
    end
    local object = core.object_manager.get_object_from_guid(token)
    return object and object:get_guid() or nil
end

function handlers.UNIT_AURA(args)
    local sub = args[1]

    -- A client without the modern aura API sends { unit } with no sub-type at all.
    if sub ~= "full" and sub ~= "added" and sub ~= "updated" and sub ~= "removed" then
        return
    end

    local unit_token = args[2]
    if unit_token ~= "player" then
        return                        -- filter early: this event is very high volume
    end

    if sub == "full" then
        my_auras = {}                 -- the replacement "added" records follow immediately
        return
    end

    if sub == "removed" then
        my_auras[args[3]] = nil       -- args[3] is the instance id
        return
    end

    -- "added" and "updated" both carry the full 12 fields.
    local instance_id, spell_id, name = args[3], args[4], args[5]
    local stacks, duration, expiration_time = args[6], args[7], args[8]
    local source_token = args[9]

    local unit_guid   = guid_of(unit_token)     -- the unit the aura sits on
    local caster_guid = guid_of(source_token)   -- the unit that applied it
    local is_mine     = caster_guid ~= nil and caster_guid == guid_of("player")

    my_auras[instance_id] = {
        spell_id = spell_id,
        name = name,
        stacks = stacks,
        expiration_time = expiration_time,
        unit_guid = unit_guid,
        caster_guid = caster_guid,
        is_mine = is_mine,
    }

    if is_mine then
        -- expiration_time is GetTime() seconds, core.game_time() is milliseconds.
        local remaining = (duration or 0) > 0
            and (expiration_time - core.game_time() / 1000)
            or -1

        core.log(("[aura] %s (%d) x%d instance %d on %s, %s"):format(
            name or "?", spell_id or 0, stacks or 0, instance_id,
            unit_guid or unit_token,
            remaining < 0 and "permanent" or ("%.1fs left"):format(remaining)))
    end
end
```

Two notes on shaping this for a real plugin. Drop the `unit_token ~= "player"` filter and you track every unit the client has a frame for, including nameplates, at a real cost in a raid. And `is_mine` can also be answered with `source_token == "player"`, which is free but only ever answers it for yourself: the GUID comparison is the one that still works when you care about a specific party member's dispel or your pet's debuff.

A ready-to-run version, with the full aura table and an on-screen view of it, is the `UNIT_AURA` handler in the `playground_events` example plugin.

---

## Advanced example 5 - spell casting (edges and cast identity)

The cast family is where the difference between an *edge* and a *state* matters. Polling `game_object` tells you a unit is casting; these events tell you the frame it started, the frame it ended, and — through `cast_guid` — that the two belong to the same cast.

This handler set keeps one entry per enemy caster and logs how a cast ended. It uses the same `guid_of` helper as the aura example above.

```lua
local casting = {}   -- [unit_guid] = { spell_id, cast_guid, started_at, interruptible }

function handlers.UNIT_SPELLCAST_START(args)
    local unit_token, cast_guid, spell_id = args[1], args[2], args[3]

    -- Filter FIRST. This fires for every nameplate in the zone, not just your target.
    if unit_token == "player" or unit_token == "pet" then
        return
    end

    local guid = guid_of(unit_token)
    if not guid then
        return                       -- token the object manager cannot resolve right now
    end

    casting[guid] = {
        spell_id = spell_id,
        cast_guid = cast_guid,
        started_at = core.game_time(),
    }
end

-- Channels carry no cast GUID: args[2] is a hole and spell_id is still at args[3].
function handlers.UNIT_SPELLCAST_CHANNEL_START(args)
    local unit_token, spell_id = args[1], args[3]

    local guid = guid_of(unit_token)
    if guid then
        casting[guid] = {
            spell_id = spell_id,
            cast_guid = nil,         -- key channels by unit + spell_id instead
            started_at = core.game_time(),
        }
    end
end

-- STOP ends the cast whatever happened to it, so it is the cleanup, not the verdict.
local function clear_cast(args)
    local guid = guid_of(args[1])
    if guid then
        casting[guid] = nil
    end
end

handlers.UNIT_SPELLCAST_STOP = clear_cast
handlers.UNIT_SPELLCAST_CHANNEL_STOP = clear_cast

-- SUCCEEDED is the one that means the spell went off.
function handlers.UNIT_SPELLCAST_SUCCEEDED(args)
    local guid = guid_of(args[1])
    local entry = guid and casting[guid]

    -- Same cast, or a later instant that arrived mid-cast? cast_guid tells them apart.
    -- Both halves have to be a real GUID: a channel entry holds nil, and nil == nil
    -- would call any GUID-less SUCCEEDED a match for it.
    if entry and args[2] ~= nil and entry.cast_guid == args[2] then
        core.log(("%s landed %d"):format(guid, entry.spell_id or 0))
    end
end

-- INTERRUPTED means the cast ended early. It does NOT mean somebody kicked it: moving and
-- cancelling produce the same event. Use the combat log SPELL_INTERRUPT for attribution.
function handlers.UNIT_SPELLCAST_INTERRUPTED(args)
    local guid = guid_of(args[1])
    local entry = guid and casting[guid]

    if entry then
        core.log(("%s stopped casting %d after %dms"):format(
            guid, entry.spell_id or 0, core.game_time() - entry.started_at))
        casting[guid] = nil
    end
end

-- The interrupt flag is its own event and carries only the unit, so it can only ever update
-- a cast you are already holding.
function handlers.UNIT_SPELLCAST_INTERRUPTIBLE(args)
    local guid = guid_of(args[1])
    if guid and casting[guid] then
        casting[guid].interruptible = true
    end
end

function handlers.UNIT_SPELLCAST_NOT_INTERRUPTIBLE(args)
    local guid = guid_of(args[1])
    if guid and casting[guid] then
        casting[guid].interruptible = false
    end
end
```

Two things this deliberately does not do. It does not prune `casting` — a unit that despawns mid-cast never sends `STOP`, so a real plugin needs the same periodic sweep the aura example uses. And it does not decide whether to kick from these events: `is_active_spell_interruptable()` on the [`game_object`](/dev/api/game-object) answers that at the moment you actually want to act, which is not the moment the flag changed.

---

## Simple example — no‑argument events (for contrast)

Many events carry **no arguments at all** — the event name *is* the whole message. For these the `args` array is empty and you simply react to the fact that the event fired. Combat start/stop is the classic pair:

```lua
function handlers.PLAYER_REGEN_DISABLED()  -- entered combat (args is empty)
    core.log("Combat started")
end

function handlers.PLAYER_REGEN_ENABLED()   -- left combat (args is empty)
    core.log("Combat ended")
end

function handlers.PLAYER_STARTED_MOVING()  -- args is empty
    core.log("Started moving")
end
```

Contrast this with the combat‑log handler above: same registration, same callback — but here the `args` table is empty and there is nothing to unpack. That is the whole spectrum of the API, from a 14+‑field firehose down to a bare notification.

---

## Complete plugin

Putting the dispatch pattern and a few handlers together into a runnable plugin:

```lua
--------------------------------------------------------------------------------
-- Game events demo
--------------------------------------------------------------------------------

local handlers = {}

-- Simple, no-arg events -------------------------------------------------------
function handlers.PLAYER_REGEN_DISABLED()
    core.log("[events] entered combat")
end

function handlers.PLAYER_REGEN_ENABLED()
    core.log("[events] left combat")
end

-- Fixed-arg event -------------------------------------------------------------
function handlers.ENCOUNTER_START(args)
    core.log(("[events] pull: %s (%d players)"):format(args[2] or "?", args[4] or 0))
end

-- Many-arg event --------------------------------------------------------------
function handlers.COMBAT_LOG_EVENT_UNFILTERED(args)
    if args[2] == "SPELL_INTERRUPT" then
        core.log(("[events] %s interrupted %s"):format(args[5] or "?", args[9] or "?"))
    end
end

core.register_on_game_event_callback(function(event_name, args)
    local handler = handlers[event_name]
    if handler then
        handler(args)
    end
end)

core.log("[events] demo loaded")
```

A ready‑to‑run copy of this lives in the `playground_events` example plugin.