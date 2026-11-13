# Game Object - Functions

> Source: <https://docs.project-sylvanas.net/dev/api/game-object>

## Overview

The `game_object` class represents entities within the game world. This class provides a comprehensive set of methods to interact with and retrieve information about game objects, such as players, NPCs, items, and more. Almost everything that we are ever going to interact with is a game_object, so this class is one of the most important ones.

## Functions

### Validation and Type Checks 📃

### `is_valid() -> boolean`

Checks if the `game_object` is valid (exists in the game world).

### `get_type() -> number`

Returns the type identifier of the object.

### `get_object_type_string() -> string`

Returns the object type as a human-readable string.

> [!TIP]
> The string form of what `get_type()` returns. Handy for logging and debug overlays, where an object-type name reads better than a raw integer.

> [!WARNING]
> Returns an empty string on every Classic version.

### `get_class() -> number`

Retrieves the class identifier of the object.

> [!TIP]
> You can use the following code to translate from class ID to class name:
>
> ```lua
> ---@type enums
> local enums = require("common/enums")
>
> local function call_this_function_inside_the_on_update_callback()
>     local local_player = core.object_manager.get_local_player()
>     if not local_player then
>         return
>     end
>
>     local class_name = enums.class_id_to_name[local_player:get_class()]
>
>     core.log("This is my current class: " .. class_name)
> end
> ```

### `is_basic_object() -> boolean`

Determines if the object is a basic game object.

### `is_player() -> boolean`

Checks if the object is a player.

### `is_unit() -> boolean`

Checks if the object is a unit (NPC, creature, etc.).

### `is_item() -> boolean`

Checks if the object is an item.

### `is_pet() -> boolean`

Determines if the object is a pet.

### `is_minion() -> boolean`

Determines if the object is a minion (alternative pets, such as summons that are not the main pet).

### `is_boss() -> boolean`

Checks if the object is classified as a boss.

> [!WARNING]
> Blizzard's "is_boss" function is not accurate, since only certain bosses like world bosses have this flag enabled. To check if a mob is a boss more accurately, you should use the function provided in the unit_helper module. Here is a code showing how to properly check if a unit is a boss or not:
>
> ```lua
> ---@type unit_helper
> local unit_helper = require("common/utility/unit_helper")
>
> local function is_boss(target)
>     return unit_helper:is_boss(target)
> end
>
> ```

> [!WARNING]
> Always `false` on Classic Era, TBC Classic, MoP Classic and Titan (China), because those clients have no boss check to ask. It works on Retail and Forever.

### `is_item_bag() -> boolean`

Checks if the object is a bag type item.

### Identification and Attributes 📃

### `get_npc_id() -> number`

Retrieves the NPC ID of the object (if applicable).

> [!WARNING]
> This only works for npcs!

### `get_level() -> number`

Returns the level of the object.

### `get_effective_level() -> number`

Returns the effective level of the game object.

### `get_gold() -> number`

Returns the **local player's** money in copper. Divide by 10000 for gold.

Only the local player has a purse the client knows about, so this answers `0` on a target, a party member or an NPC rather than guessing, and `0` also means "there is no local player yet", which is the answer at character select. It is the same value as [`core.inventory.get_gold`](/dev/api/core#coreinventoryget_gold).

Copper passes 2^31 at 214,748 gold, so treat the return as a Lua number rather than a 32-bit integer. It is exact well past the money cap.

This is a call into the game client, not a memory read. It is cheap, but cache it rather than polling it every frame.

> [!NOTE]
> This page used to document a `get_money()` method next to this one. There has never been such a method on any build, so every call to it returned `nil`. Use `get_gold()`.

### `get_faction_id() -> number`

Gets the faction ID the object belongs to.

### `get_target_marker_index() -> number`

Retrieves the target marker (raid icon) index:

- `0` : No Icon
- `1` : Yellow 4-point Star
- `2` : Orange Circle
- `3` : Purple Diamond
- `4` : Green Triangle
- `5` : White Crescent Moon
- `6` : Blue Square
- `7` : Red "X" Cross
- `8` : White Skull

### `set_target_marker_index(index) -> nil`

Sets the target marker (raid icon) on the game object.

- `index` : `integer` - The marker index (0-8, same values as `get_target_marker_index` ).

### `get_race_id() -> integer`

Returns the race ID of the game object.

### `get_classification() -> number`

Gets the classification of the object:

- `-1` : Unknown
- `0` : Normal
- `1` : Elite
- `2` : Rare Elite
- `3` : World Boss
- `4` : Rare
- `5` : Trivial
- `6` : Minus

#### `get_group_role() -> number`

Retrieves the group role of the object:

- `-1` : Unknown / None
- `0` : Tank
- `1` : Healer
- `2` : Damage Dealer

> [!WARNING]
> It is the role from the group's role check or the group finder. `-1` is the correct answer when the game has no role for the unit: when you are solo, or in a group where nobody picked roles. The game does not know a role then, and the core does not guess one. For a guess from class and spec, use izi's `is_tank`, `is_healer` and `is_dps`.

> [!NOTE]
> Before the core update of 2026-10-06 this always returned `-1` on Classic Era, TBC Classic, Forever and the private-server clients. It now works on every version.

#### `get_name() -> string`

Returns the name of the object.

### `get_surname() -> string`

Returns the unit's surname, the second part of a WoW Forever character name. Empty string when the unit has none (NPCs, players without one).

> [!INFO]
> Needs core 2.174 or later. Every other game version returns `""`.

### `get_guid() -> string`

Returns the unit's globally-unique GUID string (e.g. `"Player-970-0002FD41"`, `"Creature-0-..."`). Pair it with [`core.object_manager.get_object_from_guid`](/dev/api/object-manager) to resolve a stored GUID back into a live game object.

### `get_attack_speed() -> number`

Returns the main-hand auto-attack swing speed, in seconds. Uses the game's own `UnitAttackSpeed`, on every game version since core 2.128.

### `get_unit_phase() -> number`

Returns the phase ID of the game object.

### Status and State Checks 📃

### `get_specialization_id() -> integer`

Returns the spec_id if the game_object is a player.

> [!WARNING]
> On the private-server clients (Vanilla 1.14 / TBC 2.5.3) only your own character answers. Every other unit returns `-1`.

### `get_creature_type() -> integer`

Returns the type of the creature.

### `is_dead() -> boolean`

Checks if the object is dead.

### `is_ghost() -> boolean`

Returns true when the game object is a ghost (not dead but not alive either).

### `is_feign_death() -> boolean`

Checks if the object is feigning death. Useful for hunters — a feigning unit appears dead but is not actually dead.

> [!NOTE]
> Yourself, and friendly group members. The game does not report feign death for anyone else, enemies included, so it is `false` for them. Since core 2.128 your own feign death also works when you are solo.

### `is_visible() -> boolean`

Checks if the object is visible or not. Also might be useful to check if an object is alive / useful or it's removed from the game (for example, a trap expiring).

### `is_mounted() -> boolean`

Determines if the object is mounted.

### `is_outdoors() -> boolean`

Checks if the object is outdoors.

### `is_indoors() -> boolean`

Checks if the object is indoors.

### `is_quest_unit() -> boolean`

Returns whether the object is a quest unit: a unit related to one of your active quests, the ones the game marks with a quest icon on their nameplate.

> [!WARNING]
> Forever answers since the core update of 2026-10-10; older cores answered `false` there even for a mob of an active 0/8 kill quest. Classic Era, TBC, Wrath and MoP have no such check in their game client and always answer `false`.

### `is_tap_denied() -> number`

Returns whether the NPC is tap denied (grey healthbar).

### `is_in_combat() -> boolean`

Checks if the object is currently in combat.

### `is_moving() -> boolean`

Determines if the object is moving.

### `is_dashing() -> boolean`

Checks if the object is dashing.

### `is_flying() -> boolean`

Checks if the object is currently flying (flying mount or flight form). Uses the game's own `IsFlying`, on every game version since core 2.128.

> [!NOTE]
> Before core 2.127 this always returned `false` on Titan CN.

### `is_falling() -> boolean`

Returns whether the unit is falling, including the airborne part of a jump. Uses the game's own `IsFalling`, so it works on every game version. Returns `false` for anything that is not a unit. Needs core 2.127 or newer.

### `is_swimming() -> boolean`

Returns whether the unit is swimming. Uses the game's own `IsSwimming`, on every game version. Needs core 2.135 or newer.

### `is_submerged() -> boolean`

Returns whether the unit is fully under water. Uses the game's own `IsSubmerged`. Needs core 2.135 or newer.

### `is_on_taxi() -> boolean`

Returns whether the unit is on a flight path (taxi). Uses the game's own `UnitOnTaxi`, for any unit, on every game version including the private servers. Returns `false` for anything that is not a unit. Needs core 2.186 or newer.

Together with `is_flying` it tells a taxi from a flying mount, also where `get_movement_flags` returns `nil`.

### `is_rooted() -> boolean | nil`

Returns whether the unit is rooted, for **any** unit, not just you. Needs core 2.135 or newer.

> [!WARNING]
> It returns `nil`, not `false`, when the game's movement data cannot be read: for anything that is not a unit, and on game versions where this is not mapped yet. Today it works on TBC Classic, Forever and Retail only. Check for `nil` before treating it as "not rooted".

### `get_movement_flags() -> integer | nil`

The unit's raw movement flags, or `nil` when they cannot be read (same versions as `is_rooted`). Bits: `0x400` rooted, `0x800` falling, `0x100000` swimming, `0x1000000` flying. Needs core 2.135 or newer.

> [!NOTE]
> Always `nil` there for now. Use `is_flying`, `is_swimming`, `is_falling` and `is_on_taxi`, which ask the game itself.

### `is_auto_attacking() -> boolean`

Returns whether the game object currently has auto attack toggled on.

### `is_casting_spell() -> boolean`

Checks if the object is casting a spell.

### `is_channelling_spell() -> boolean`

Determines if the object is channeling a spell.

### `is_active_spell_interruptable() -> boolean`

Checks if the currently casting spell can be interrupted.

> [!WARNING]
> On the private-server clients (Vanilla 1.14 / TBC 2.5.3) this is always `true`, including for casts that cannot be interrupted.

### `is_glow() -> boolean`

Checks if the object is glowing.

### `set_glow(state: boolean)`

Sets the glowing state of the object.

> [!WARNING]
> On every Classic version `set_glow` does nothing and `is_glow` always returns `false`.

### Combat and Threat 📃

### `can_attack(other: game_object) -> boolean`

Determines if the object can attack another object.

### `is_enemy_with(other: game_object) -> boolean`

Checks if the object is an enemy of another object.

### `is_friend_with(other: game_object) -> boolean`

Checks if the object is friendly with another object.

### `get_threat_situation(obj: game_object) -> threat_table`

Retrieves the threat status relative to another object.

**`threat_table` Properties:**

- `is_tanking` : `true` when `status` is `2` or `3` , meaning the enemy is attacking this unit.
- `status` : Threat status. `0` : not tanking, lower threat than the tank. `1` : not tanking, but higher threat (about to pull aggro). `2` : tanking, but someone else has more threat. `3` : securely tanking.
- `threat_percent` : Threat percentage ( `0` to `100` ).

All of them are `0` / `false` when the unit has no threat on that enemy at all.

> [!NOTE]
> Before the core update of 2026-10-06, on the Classic versions (Classic Era, TBC, MoP, Titan, Forever and the private-server clients) `status` was always `0` and `is_tanking` was unreliable; only `threat_percent` was right. Retail was correct.

### `get_unit_damage() -> unit_damage_data`

Returns the unit's melee damage, the same numbers as the character sheet. Exact for your own character, the game's estimate for other units. Works on every game version. Added in the core update of 2026-10-11.

**`unit_damage_data` Properties:**

- `min_damage` , `max_damage` : ( *number* ) Main hand damage range.
- `offhand_min_damage` , `offhand_max_damage` : ( *number* ) Off hand damage range, `0` without an off-hand weapon.
- `pos_buff` , `neg_buff` : ( *integer* ) Positive and negative damage modifiers.
- `percent` : ( *number* ) Damage percentage modifier, `1` = 100%.

### `get_attack_power() -> attack_power_data`

Returns the unit's melee attack power. Works on every game version. Added in the core update of 2026-10-11.

**`attack_power_data` Properties:**

- `base` : ( *integer* ) Base attack power.
- `pos_buff` : ( *integer* ) Positive modifiers.
- `neg_buff` : ( *integer* ) Negative modifiers, already negative.
- `effective` : ( *integer* ) `base + pos_buff + neg_buff` , never below `0` . The number the character sheet shows.

```lua
local me = core.object_manager.get_local_player()
local ap = me:get_attack_power()
local dmg = me:get_unit_damage()
core.log(string.format("AP %d, hits for %.0f - %.0f", ap.effective, dmg.min_damage, dmg.max_damage))
```

### `is_pvp_flagged() -> boolean`

Returns whether the unit is flagged for PvP, the same flag the game shows on its unit frames. Works on every game version, `false` for anything that is not a unit. Added in the core update of 2026-10-16.

```lua
local target = core.object_manager.get_local_player():get_target()
if target and target:is_pvp_flagged() then
    core.log("target is pvp flagged")
end
```

### `get_unit_ranged_damage() -> unit_ranged_damage_data`

Returns the unit's ranged damage information.

**`unit_ranged_damage_data` Properties:**

- `speed` : ( *number* ) Ranged attack speed.
- `min_damage` : ( *number* ) Minimum ranged damage.
- `max_damage` : ( *number* ) Maximum ranged damage.
- `pos_buff` : ( *integer* ) Positive buff modifier count.
- `neg_buff` : ( *integer* ) Negative buff modifier count.
- `percent` : ( *number* ) Damage percentage modifier.

### `get_nameplate() -> nameplate_info|nil`

Returns this unit's nameplate visibility and on-screen rectangle, or `nil` when the unit has no nameplate frame (out of range, nameplates disabled, or the `C_NamePlate` API is unavailable on older clients).

The rectangle uses a **bottom-left origin** and is measured in scaled screen pixels, matching the values returned by the WoW nameplate frame.

**`nameplate_info` Properties:**

- `is_shown` : ( *boolean* ) Whether the nameplate frame is currently shown on screen.
- `left` : ( *number* ) The x coordinate of the nameplate's bottom-left corner, in scaled screen pixels.
- `bottom` : ( *number* ) The y coordinate of the nameplate's bottom-left corner, in scaled screen pixels.
- `width` : ( *number* ) The nameplate width in scaled screen pixels.
- `height` : ( *number* ) The nameplate height in scaled screen pixels.

```lua
local plate = target:get_nameplate()
if plate and plate.is_shown then
    core.log(string.format("Nameplate at (%.0f, %.0f) size %.0fx%.0f",
        plate.left, plate.bottom, plate.width, plate.height))
end
```

### `set_nameplate_visible(visible: boolean) -> boolean`

Shows or hides the game's own nameplate visual for this unit. Only the default plate's look is hidden: the plate keeps its position, so `get_nameplate` keeps answering and you can draw your own plate in its place.

- Returns `true` when the unit had a nameplate and it was changed, `false` when it has none (out of range, nameplates turned off, or a plate the game keeps locked, such as friendly plates inside instances on retail).
- **The hide does not stick forever.** When the unit leaves nameplate range and comes back, the game hands it a fresh plate that is visible again. Re-apply it on the `NAME_PLATE_UNIT_ADDED` event.
- Added in the core update of 2026-10-10; on older cores the method does not exist.

```lua
-- Hide the default plate of your target
local target = core.object_manager.get_local_player():get_target()
if target and not target:set_nameplate_visible(false) then
    core.log("target has no nameplate right now")
end
```

### Position and Movement 📃

### `get_position() -> vec3`

Gets the current position of the object. See [vec3](/dev/api/vector-3)

### `get_rotation() -> number`

Retrieves the rotation angle of the object.

### `get_direction() -> vec3`

Gets the directional vector the object is facing. See [vec3](/dev/api/vector-3)

### `get_movement_direction() -> vec3`

Gets the directional vector of the object's movement manager. This may differ from `get_direction()` when the object is moving in a direction it is not facing (e.g., strafing or backpedaling).

### `get_movement_speed() -> number`

Returns the current movement speed.

### `get_movement_speed_max() -> number`

Retrieves the maximum possible movement speed.

### `get_swim_speed_max() -> number`

Gets the maximum swim speed.

### `get_flight_speed_max() -> number`

Returns the maximum flight speed.

### `get_glide_speed() -> number`

Returns the current glide speed of the object.

> [!WARNING]
> Works on Retail and Forever. Always `0` on Classic Era, TBC Classic, MoP Classic and Titan (China), whose clients have no gliding.

### `get_bounding_radius() -> number`

Retrieves the bounding radius of the object.

### `get_combat_reach() -> number`

Returns the combat reach of the unit.

### `get_melee_reach(target) -> number`

Returns the melee reach between this unit and `target`, in yards. It is the game's own melee range:

```text
max(5, my_combat_reach + its_combat_reach + 4/3)
```

from both units' CombatReach fields (the value `get_bounding_radius` returns). The target is in melee range when the centre-to-centre distance is below it. Units only. Needs core 2.186 or newer.

```lua
local me = core.object_manager.get_local_player()
local in_melee = me:get_position():dist_to(target:get_position()) < me:get_melee_reach(target)
```

> [!TIP]
> `core.spell_book.is_spell_in_range` answered "in range" for melee spells at 5.2 and 9.9 yards on TBC, where the server refused past 5.0.

### `get_height() -> number`

Returns the height of the object.

### `get_scale() -> number`

Gets the scale factor of the object.

### Model Attachments 📎

### `get_attachment_name_position() -> vec3`

Returns the world position of the unit's **name attachment point** — the anchor above the model where the name/nameplate text sits (roughly the top of the head). Handy for drawing text, icons, or widgets above a unit. Returns a zero vector when the model is not loaded. See [vec3](/dev/api/vector-3)

### `get_attachment_position(attachment_id: integer) -> vec3`

Returns the world position of a specific model attachment point, identified by its numeric `attachment_id` (e.g. hands, chest, base, overhead). Returns a zero vector when the model is not loaded or does not have the requested attachment. See [vec3](/dev/api/vector-3)

Parameters:

- **`attachment_id`** ( *integer* ) — The model attachment point ID to query.

### Health and Power 📃

### `get_health() -> number`

Retrieves the current health value.

### `get_max_health() -> number`

Gets the maximum health value.

### `get_max_health_modifier() -> number`

Returns any modifiers affecting max health.

### `get_power(power_type: number) -> number`

Gets the current power for a specified power type.

Refer to [Power Types](https://wowpedia.fandom.com/wiki/Enum.PowerType).

> [!TIP]
> Use the enums power types to check all the possible values. For example:
>
> ```lua
>
>     ---@type enums
> local enums = require("common/enums")
>
> local function print_player_fury()
>     local local_player = core.object_manager.get_local_player()
>     if not local_player then
>         return
>     end
>
>     local local_player_power = local_player:get_power(enums.power_type.FURY)
>     core.log("Local Player Current Fury: " .. tostring(local_player_power))
> end
>
> ```

### `get_max_power(power_type: number) -> number`

Retrieves the maximum power for a specified power type. Same like the previous function , only that this one returns the maximum possible power that the character can have, instead of the current one.

### `get_xp() -> integer`

Returns the local player's current experience points, the game's `UnitXP("player")`. It is the same number [`core.character.get_xp()`](/dev/api/core#corecharacterget_xp) returns.

`0` for every other object, because the game never tells you another unit's XP, and `0` at the level cap. Since the core update of 2026-10-06 the value is asked from the game on every client instead of read from memory.

### `get_max_xp() -> integer`

Returns the XP the local player's current level needs, the game's `UnitXPMax("player")`. It is the same number [`core.character.get_xp_max()`](/dev/api/core#corecharacterget_xp_max) returns. `0` for every other object.

### `get_total_shield() -> number`

Returns the total absorb shield applied to the game_object.

> [!WARNING]
> Always `0` on every Classic version.

### `get_total_heal_absorbs() -> number`

Returns the total amount of healing that is being absorbed on this game object (i.e., healing that cannot land until the absorb is removed).

### `get_incoming_heals() -> number`

Returns the total amount of incoming heals to the game object from all sources.

### `get_incoming_heals_from(source: game_object) -> number`

Returns the amount of incoming heals to the game object specifically from the specified source.

Parameters:

- **`source`** ( *game_object* ) — The source object providing the heal.

### `get_armor() -> armor_data`

Returns the game object's armor as a **table of four integers**, not a single number. This page described it as `-> number` from the day the binding shipped until 2026-08-11, so anything written against that description was doing arithmetic on a table.

**`armor_data` Properties:**

- `base` : Armor before buffs and debuffs.
- `effective_armor` : The armor actually applied to damage taken. This is the one mitigation math wants.
- `armor` : The client's displayed armor value.
- `bonus_armor` : The bonus armor value. See the version note below, it is not the same number on every game version.

```lua
local armor = target:get_armor()
core.log("effective armor: " .. tostring(armor.effective_armor))
```

> [!NOTE]
> All four fields are always present. The binding zero-initializes them and only overwrites what the client answered, so a unit it could not resolve reads as four zeros rather than `nil`. Treat an `effective_armor` of `0` on a live unit as "not answered", not as "no armor".

> [!WARNING]
> On Retail, `bonus_armor` is the client's bonus armor value, and a debuff's reduction shows up only in `effective_armor`. On every Classic version it is the positive buff amount **minus** the negative buff amount, so it already includes debuffs and can be negative.

### `game_object:get_state_flags`

Syntax

```lua
object:get_state_flags() -> integer
```

Returns

- `integer` : The current state flags bitfield for the game object.

Description

Returns the raw state flags bitfield exposed by the game object. It is not the NPC's role: for "is this a vendor, a flight master, a banker" use `get_npc_flags`.

> [!WARNING]
> Always `0` on every Classic version.

**Example Usage**

```lua
local flags = object:get_state_flags()
core.log("State flags: " .. flags)
```

### `game_object:get_npc_flags`

Syntax

```lua
object:get_npc_flags() -> integer
object:get_npc_flags2() -> integer
```

Returns

- `integer` : The NPC's service flags, as the raw bits the game holds for that unit. `0` for anything that is not a unit.

Description

Tells you what an NPC offers **before** you talk to it: vendor, trainer, flight master, banker, mailbox and so on. It is the same value the game uses for the cursor and the interact icon. Test a bit with `bit.band`.

| Service | Bit | Service | Bit |
| --- | --- | --- | --- |
| Gossip | `0x1` | Innkeeper | `0x10000` |
| Quest giver | `0x2` | Banker | `0x20000` |
| Trainer | `0x10` | Petitioner | `0x40000` |
| Class trainer | `0x20` | Tabard designer | `0x80000` |
| Profession trainer | `0x40` | Battlemaster | `0x100000` |
| Vendor | `0x80` | Auctioneer | `0x200000` |
| Ammo vendor | `0x100` | Stable master | `0x400000` |
| Food vendor | `0x200` | Guild banker | `0x800000` |
| Poison vendor | `0x400` | Spell click | `0x1000000` |
| Reagent vendor | `0x800` | Mailbox | `0x4000000` |
| Repair | `0x1000` | Transmogrifier | `0x10000000` |
| Flight master | `0x2000` | Void storage | `0x20000000` |
| Spirit healer | `0x4000` | Wild battle pet | `0x40000000` |
| Spirit guide | `0x8000` | Black market | `0x80000000` |

`get_npc_flags2()` is a second word used by newer services: item upgrade `0x1`, garrison architect `0x2`, shipment crafter `0x20`, garrison missions `0x40`, black market `0x80`. It is `0` on most NPCs.

**Example Usage**

```lua
local FLIGHT_MASTER = 0x2000
local VENDOR        = 0x80

for _, unit in ipairs(core.object_manager.get_all_objects()) do
    if unit:is_unit() then
        local flags = unit:get_npc_flags()
        if bit.band(flags, FLIGHT_MASTER) ~= 0 then
            core.log("flight master: " .. unit:get_name())
        elseif bit.band(flags, VENDOR) ~= 0 then
            core.log("vendor: " .. unit:get_name())
        end
    end
end
```

### `get_spell_haste() -> number`

Returns the current spell haste percentage of the game object. A value of `8` means 8% haste.

Uses the game's own `UnitSpellHaste`, on every game version since core 2.128.

> [!NOTE]
> Before core 2.128 this was always `0` on the private-server clients (Vanilla 1.14 / TBC 2.5.3).

### Casting and Spells 📃

### `get_active_spell_id() -> number`

Retrieves the spell ID of the spell currently being cast.

### `get_active_spell_cast_start_time() -> number`

Gets the start time of the active spell cast.

### `get_active_spell_cast_end_time() -> number`

Retrieves the end time of the active spell cast.

### `get_active_spell_target() -> game_object`

Gets the target of the spell currently being cast.

### `get_active_channel_spell_id() -> number`

Retrieves the spell ID of the spell currently being channeled.

### `get_active_channel_cast_start_time() -> number`

Gets the start time of the active channel spell.

### `get_active_channel_cast_end_time() -> number`

Retrieves the end time of the active channel spell.

### `get_combo_points_target() -> game_object`

Returns the game object that currently holds the combo points generated by this game object. Useful for rogue and druid scripts to determine which target your combo points are applied to.

> [!WARNING]
> Works on TBC Classic, MoP Classic, Forever and the TBC 2.5.3 private-server client. Always `nil` on Retail, Classic Era, Titan (China) and the Vanilla 1.14 private-server client.

### Empower Spells 📃

> [!WARNING]
> Empower spells exist only on Retail. On every Classic version `get_empower_stage_duration` returns `0`, and `get_empower_current_stage` and `get_empower_max_stage` return a meaningless number, so do not call them there.

### `get_empower_current_stage() -> number`

Returns the current empower stage of the spell being cast by the game object. Returns `-1` if the object is not currently casting an empower spell.

### `get_empower_max_stage() -> number`

Returns the maximum empower stage of the spell being cast.

### `get_empower_stage_duration(index: number) -> number`

Returns the duration (in seconds) of a specific empower stage for the currently cast empower spell.

Parameters:

- **`index`** ( *number* ) — The stage index to query.

Returns: *number* — The duration in seconds for that empower stage.

### Relationships 📃

### `get_owner() -> game_object`

Returns the owner of the object (if any).

### `get_pet() -> game_object`

Retrieves the pet of the object (if any).

### `get_target() -> game_object`

Gets the current target of the object.

### `get_creator_object() -> game_object`

Retrieves the game object that created the current object (e.g., a player creating a totem or a pet).

### `is_party_member() -> boolean`

Checks if the object is a party member.

### Auras and Effects 📃

### `get_auras() -> table<buff>`

Retrieves all auras affecting the object.

### `get_buffs() -> table<buff>`

Gets all buffs applied to the object. See [buffs](/dev/api/buffs)

### `get_debuffs() -> table<buff>`

Retrieves all debuffs applied to the object. see [debuffs](/dev/api/buffs)

**`buff` Properties:**

- `buff_name` : Name of the buff.
- `buff_id` : Unique identifier.
- `count` : Stack count.
- `expire_time` : When the buff expires.
- `duration` : Total duration.
- `type` : Type identifier.
- `caster` : The object that applied the buff.
- `impl` : Opaque native handle for the aura. Do not interpret it or do arithmetic on it.
- `buff_index` : The aura's slot on the unit. Reused as soon as an aura fades, so it identifies the aura only within the tick that read it.
- `points` : Variable values from aura data (e.g. absorb remaining for shields).

> [!WARNING]
> On the private-server clients (Vanilla 1.14 / TBC 2.5.3), `points` is always an empty table, and an aura that never expires reports an `expire_time` five seconds in the future instead of `0`. This applies to `get_auras`, `get_buffs` and `get_debuffs`.

> [!CAUTION]
> This table is not read-only. It is also the argument type of [`core.input.cancel_buff`](/dev/api/input), and the core reads `impl` and `buff_index` back off it as integers. A table you build by hand from the other fields therefore errors inside `cancel_buff`.
>
> Pass back the same table `get_buffs()` handed you, and do not hold one across ticks: `impl` refers to an aura that may already be gone.

### `get_buff_data(spec) -> buff_manager_data|nil`

Returns resolved buff data for the given aura spec (cached). Spec can be a buff_db or number[].

### `get_debuff_data(spec) -> buff_manager_data|nil`

Returns resolved debuff data for the given aura spec (cached). Spec can be a buff_db or number[].

### `get_aura_data(spec) -> buff_manager_data|nil`

Returns resolved aura data for the given aura spec (cached). Spec can be a buff_db or number[].

### `get_loss_of_control_info() -> loss_of_control_info`

Provides information on any loss of control effects.

**`loss_of_control_info` Properties:**

- `valid` : Whether the info is valid.
- `spell_id` : Associated spell ID.
- `start_time` : Effect start time.
- `end_time` : Effect end time.
- `duration` : Total duration.
- `type` : Type of control loss.
- `lockout_school` : The school flag that is locked out.

### Items and Inventory 📃

### `get_item_cooldown(item_id: integer) -> number`

Retrieves the cooldown for a specific item.

### `has_item(item_id: integer) -> boolean`

Checks if the object possesses a specific item.

### `get_item_id() -> integer`

Gets the item id from an item gameobject

### `get_equipped_items() -> table of item_slot_info`

> [!NOTE]
> The item_slot info is a table with 2 members:
>
> - .object (game_object) -> the item itself
> - .slot_id (integer) -> the id of the slot
>
> There is no `.item_id`. Read the id off the object with `row.object:get_item_id()`.
>
> Check the [Wiki](https://warcraft.wiki.gg/wiki/InventorySlotID) for more info.

> [!WARNING]
> The list is trimmed with a single cut-off that was chosen for the retail slot layout, and nothing adjusts it per game version. On the private-server clients the worn block ends much earlier, so the tail of the list runs past the bags and into the backpack:
>
> | Client | Worn gear | Equipped bags | Backpack | What you get back |
> | --- | --- | --- | --- | --- |
> | Retail | `1` to `30` | `31` to `35` | from `36` | worn gear plus the bag objects |
> | Private servers (Vanilla 1.14 / TBC 2.5.3) | `1` to `19` | `20` to `23` | from `24` | worn gear, the bag objects, **and up to twelve backpack items** |
>
> On every version, filter by `slot_id` yourself if you need real equipment. Worn gear is `slot_id` `1` to `19` and nothing above it:
>
> ```lua
> for _, row in ipairs(unit:get_equipped_items()) do
>     if row.slot_id <= 19 then
>         -- genuinely equipped
>     end
> end
> ```
>
> Do not use the list length as a count of equipped items.

> [!TIP]
> Also, check our [Inventory Helper](/dev/libraries/mini-libs/inventory-helper) which provides the most important and required functionality in regards to inventory.

### `get_item_at_inventory_slot(integer) -> item_slot_info`

The item_slot_info of the item with at the given slot.

> [!WARNING]
> `1` is the head and `19` is the tabard. Passing `0` is not the first slot: it underflows and comes back with `.object == nil`, which is indistinguishable from an empty slot, so a `for slot = 0, 18` loop looks like it works while silently never reading the tabard. Use `for slot = 1, 19`.
>
> | Slot |  | Slot |  | Slot |  |
> | --- | --- | --- | --- | --- | --- |
> | `1` | head | `8` | feet | `15` | back |
> | `2` | neck | `9` | wrist | `16` | main hand |
> | `3` | shoulder | `10` | hands | `17` | off hand |
> | `4` | shirt | `11` | finger 1 | `18` | ranged |
> | `5` | chest | `12` | finger 2 | `19` | tabard |
> | `6` | waist | `13` | trinket 1 |  |  |
> | `7` | legs | `14` | trinket 2 |  |  |
>
> Above `19` it keeps reading the same container. On the private-server clients (Vanilla 1.14 / TBC 2.5.3), `20` to `23` are the equipped bags and `24` and up is the backpack.
>
> The call always returns a table. An empty or out-of-range slot gives you a row whose `.object` is `nil`, so test the field rather than the return value.

### `get_item_stack_count() -> integer`

The stack count of the item.

### Item Enchant Info 🔮

### `item_has_enchant() -> boolean`

Returns whether the item game object has an enchant applied.

### `item_enchant_id() -> integer`

Returns the enchant ID of the item.

### `item_enchant_expiration() -> number`

Returns the time **remaining** on the item's temporary enchant, in **milliseconds**. `0` when there is no temporary enchant or it has run out.

A fresh 30-minute Rockbiter Weapon reads about `1798324`. Divide by 1000 for seconds. This is the same unit WoW's own `GetWeaponEnchantInfo` uses for its expiration values.

> [!TIP]
> This page used to say "expiration time (in seconds)". It is neither an expiration timestamp nor seconds: it is the remaining time in milliseconds.

### `item_enchant_charges() -> integer`

Returns the number of remaining charges of the enchant on the item.

### Loot and Interaction 🧹

### `can_be_looted() -> boolean`

Returns whether the game object can be looted.

### `has_loot() -> boolean`

Returns whether the game object contains loot.

### `can_be_used() -> boolean`

Returns whether the game object can be used (e.g., quest objects, chests).

### `can_be_skinned() -> boolean`

Returns whether the game object can be skinned.

> [!WARNING]
> On every Classic version this returns the same as `has_skin`: it only checks that the corpse is skinnable, not that you are allowed to loot it. Only Retail checks both.

### `has_skin() -> boolean`

Returns whether the object has skin to harvest.

### `does_bobber_have_fish() -> boolean`

Checks if the player's fishing bobber has caught a fish.