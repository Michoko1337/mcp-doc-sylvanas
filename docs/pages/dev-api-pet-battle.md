# Pet Battle Functions

> Source: <https://docs.project-sylvanas.net/dev/api/pet-battle>

## Overview

The `core.pet_battle` module provides functions for interacting with the WoW pet battle system, including battle state queries, pet management, journal access, and toy usage.

> [!WARNING]
> Every function on this page works on Retail only. On every Classic version, MoP Classic included even though it has pet battles in game, the readers return `false`, `0` or empty values and the actions (abilities, swaps, summons, toys) silently do nothing.

---

## Battle State

### `core.pet_battle.is_in_battle`

Syntax

```lua
core.pet_battle.is_in_battle() -> boolean
```

Returns

- `boolean` : Whether the player is currently in a pet battle.

Description

Returns whether the player is currently engaged in a pet battle. Use this to gate any pet battle logic so it only runs during an active encounter.

---

### `core.pet_battle.is_wild_battle`

Syntax

```lua
core.pet_battle.is_wild_battle() -> boolean
```

Returns

- `boolean` : Whether the current battle is a wild pet battle.

Description

Returns whether the current pet battle is against a wild pet. Wild battles allow trapping, whereas PvP or trainer battles do not.

---

### `core.pet_battle.get_battle_state`

Syntax

```lua
core.pet_battle.get_battle_state() -> integer
```

Returns

- `integer` : The current battle state value.

Description

Returns the current state of the pet battle. Use this to determine what phase the battle is in (e.g., waiting for input, animating, etc.).

---

### `core.pet_battle.get_active_pet`

Syntax

```lua
core.pet_battle.get_active_pet(owner: integer) -> integer
```

**Parameters**

- `owner` : `integer` - The owner index (1 = player, 2 = opponent).

Returns

- `integer` : The active pet index for the specified owner.

Description

Returns the index of the currently active pet for the given owner. Owner 1 is the player and owner 2 is the opponent.

---

### `core.pet_battle.get_num_pets`

Syntax

```lua
core.pet_battle.get_num_pets(owner: integer) -> integer
```

**Parameters**

- `owner` : `integer` - The owner index (1 = player, 2 = opponent).

Returns

- `integer` : The number of pets for the specified owner.

Description

Returns the total number of pets the specified owner has in the current battle.

---

## Pet Stats (In Battle)

### `core.pet_battle.get_name`

Syntax

```lua
core.pet_battle.get_name(owner: integer, index: integer) -> table
```

**Parameters**

- `owner` : `integer` - The owner index (1 = player, 2 = opponent).
- `index` : `integer` - The pet index.

Returns

- `table` : A table with the following fields:

| Field | Type | Description |
| --- | --- | --- |
| `custom_name` | `string` | The player-assigned name. Empty if the pet has none. |
| `species_name` | `string` | The species name. |

Description

Returns the name info of the specified pet in battle.

> [!NOTE]
> `custom_name` is empty for most pets, and always empty for the opponent's. Fall back to `species_name` when it is:
>
> ```lua
> local n = core.pet_battle.get_name(owner, index)
> local display = (n.custom_name ~= "" and n.custom_name) or n.species_name
> ```

---

### `core.pet_battle.get_health`

Syntax

```lua
core.pet_battle.get_health(owner: integer, index: integer) -> integer
```

**Parameters**

- `owner` : `integer` - The owner index (1 = player, 2 = opponent).
- `index` : `integer` - The pet index.

Returns

- `integer` : The current health of the pet.

Description

Returns the current health of the specified pet in battle.

---

### `core.pet_battle.get_max_health`

Syntax

```lua
core.pet_battle.get_max_health(owner: integer, index: integer) -> integer
```

**Parameters**

- `owner` : `integer` - The owner index (1 = player, 2 = opponent).
- `index` : `integer` - The pet index.

Returns

- `integer` : The maximum health of the pet.

Description

Returns the maximum health of the specified pet in battle.

---

### `core.pet_battle.get_speed`

Syntax

```lua
core.pet_battle.get_speed(owner: integer, index: integer) -> integer
```

**Parameters**

- `owner` : `integer` - The owner index (1 = player, 2 = opponent).
- `index` : `integer` - The pet index.

Returns

- `integer` : The speed stat of the pet.

Description

Returns the speed stat of the specified pet in battle. Speed determines turn order.

---

### `core.pet_battle.get_power`

Syntax

```lua
core.pet_battle.get_power(owner: integer, index: integer) -> integer
```

**Parameters**

- `owner` : `integer` - The owner index (1 = player, 2 = opponent).
- `index` : `integer` - The pet index.

Returns

- `integer` : The power stat of the pet.

Description

Returns the power stat of the specified pet in battle. Power affects ability damage.

---

### `core.pet_battle.get_level`

Syntax

```lua
core.pet_battle.get_level(owner: integer, index: integer) -> integer
```

**Parameters**

- `owner` : `integer` - The owner index (1 = player, 2 = opponent).
- `index` : `integer` - The pet index.

Returns

- `integer` : The level of the pet.

Description

Returns the level of the specified pet in battle.

---

### `core.pet_battle.get_xp`

Syntax

```lua
core.pet_battle.get_xp(owner: integer, index: integer) -> table
```

**Parameters**

- `owner` : `integer` - The owner index (1 = player, 2 = opponent).
- `index` : `integer` - The pet index.

Returns

- `table` : A table with the following fields:

| Field | Type | Description |
| --- | --- | --- |
| `xp` | `number` | Current XP. |
| `max_xp` | `number` | XP needed for the next level. |

Description

Returns the experience info of the specified pet in battle.

---

### `core.pet_battle.get_pet_species_id`

Syntax

```lua
core.pet_battle.get_pet_species_id(owner: integer, index: integer) -> integer
```

**Parameters**

- `owner` : `integer` - The owner index (1 = player, 2 = opponent).
- `index` : `integer` - The pet index.

Returns

- `integer` : The species ID of the pet.

Description

Returns the species ID of the specified pet in battle. Species IDs uniquely identify the type of pet (e.g., Mechanical Squirrel).

---

### `core.pet_battle.get_pet_type`

Syntax

```lua
core.pet_battle.get_pet_type(owner: integer, index: integer) -> integer
```

**Parameters**

- `owner` : `integer` - The owner index (1 = player, 2 = opponent).
- `index` : `integer` - The pet index.

Returns

- `integer` : The pet type (family) ID.

Description

Returns the type (family) of the specified pet in battle. Pet types include Beast, Mechanical, Undead, etc., and determine type advantages.

---

### `core.pet_battle.get_breed_quality`

Syntax

```lua
core.pet_battle.get_breed_quality(owner: integer, index: integer) -> integer
```

**Parameters**

- `owner` : `integer` - The owner index (1 = player, 2 = opponent).
- `index` : `integer` - The pet index.

Returns

- `integer` : The breed quality of the pet (e.g., 0 = Poor, 1 = Common, 2 = Uncommon, 3 = Rare).

Description

Returns the breed quality of the specified pet in battle. Higher quality pets have better stats.

---

### `core.pet_battle.get_icon`

Syntax

```lua
core.pet_battle.get_icon(owner: integer, index: integer) -> string
```

**Parameters**

- `owner` : `integer` - The owner index (1 = player, 2 = opponent).
- `index` : `integer` - The pet index.

Returns

- `string` : The icon texture path for the pet.

Description

Returns the icon texture path of the specified pet in battle. This can be used for UI rendering.

---

### `core.pet_battle.get_state_value`

Syntax

```lua
core.pet_battle.get_state_value(owner: integer, index: integer, state_id: integer) -> integer
```

**Parameters**

- `owner` : `integer` - The owner index (1 = player, 2 = opponent).
- `index` : `integer` - The pet index.
- `state_id` : `integer` - The state ID to query.

Returns

- `integer` : The value of the specified state.

Description

Returns the value of a specific battle state for the given pet. State IDs correspond to internal battle pet state values (e.g., damage taken modifiers, weather effects, etc.).

---

## Abilities

### `core.pet_battle.get_ability_info`

Syntax

```lua
core.pet_battle.get_ability_info(owner: integer, index: integer, ability_index: integer) -> table
```

**Parameters**

- `owner` : `integer` - The owner index (1 = player, 2 = opponent).
- `index` : `integer` - The pet index.
- `ability_index` : `integer` - The ability slot index.

Returns

- `table` : A table with the following fields:

| Field | Type | Description |
| --- | --- | --- |
| `id` | `number` | The ability ID. |
| `name` | `string` | The ability name. |
| `icon` | `string` | The icon texture path. |
| `max_cooldown` | `number` | Cooldown in turns. |
| `description` | `string` | Raw description text. |
| `num_turns` | `number` | Duration in rounds (usually `1`). |
| `pet_type` | `number` | Pet type, `1` to `10`. |
| `no_strong_weak_hints` | `boolean` | Whether to hide type advantage hints. |

Description

Returns detailed information about a specific ability on a pet in battle, identified by slot index.

---

### `core.pet_battle.get_ability_info_by_id`

Syntax

```lua
core.pet_battle.get_ability_info_by_id(ability_id: integer) -> table
```

**Parameters**

- `ability_id` : `integer` - The ability ID to look up.

Returns

- `table` : The same fields as `get_ability_info` — `id` , `name` , `icon` , `max_cooldown` , `description` , `num_turns` , `pet_type` and `no_strong_weak_hints` .

Description

Returns detailed information about a pet battle ability by its unique ID. This does not require an active battle.

---

### `core.pet_battle.get_ability_state`

Syntax

```lua
core.pet_battle.get_ability_state(owner: integer, index: integer, action_index: integer) -> table
```

**Parameters**

- `owner` : `integer` - The owner index (1 = player, 2 = opponent).
- `index` : `integer` - The pet index.
- `action_index` : `integer` - The action slot index.

Returns

- `table` : A table with the following fields:

| Field | Type | Description |
| --- | --- | --- |
| `is_usable` | `boolean` | Whether the ability can be used right now. |
| `current_cooldown` | `number` | Turns remaining on cooldown. |
| `current_lockdown` | `number` | Turns remaining on lockdown. |

Description

Returns the current state of a pet's ability in battle. Use this to check whether an ability is available, on cooldown, or otherwise unusable.

> [!NOTE]
> Cooldown and lockdown are different things: cooldown is the ability's own recharge after use, lockdown is an external effect silencing the slot. `is_usable` already accounts for both, so check it first and read the two counters only when you need to explain why a slot is unavailable.

---

### `core.pet_battle.get_num_auras`

Syntax

```lua
core.pet_battle.get_num_auras(owner: integer, index: integer) -> integer
```

**Parameters**

- `owner` : `integer` - The owner index (1 = player, 2 = opponent).
- `index` : `integer` - The pet index.

Returns

- `integer` : The number of active auras on the pet.

Description

Returns the number of active auras (buffs/debuffs) on the specified pet in battle.

---

### `core.pet_battle.get_aura_info`

Syntax

```lua
core.pet_battle.get_aura_info(owner: integer, index: integer, aura_index: integer) -> table
```

**Parameters**

- `owner` : `integer` - The owner index (1 = player, 2 = opponent).
- `index` : `integer` - The pet index.
- `aura_index` : `integer` - The aura index.

Returns

- `table` : A table with the following fields:

| Field | Type | Description |
| --- | --- | --- |
| `aura_id` | `number` | Ability ID of the aura. |
| `instance_id` | `number` | Unique aura instance identifier. |
| `turns_remaining` | `number` | Turns left. |
| `is_buff` | `boolean` | `true` if the aura is displayed to the user. |

Description

Returns detailed information about a specific aura on a pet in battle.

> [!NOTE]
> `aura_id` is shared by every instance of the same aura; use `instance_id` when you need to track one specific application across turns.

---

## Battle Actions

### `core.pet_battle.can_active_pet_swap_out`

Syntax

```lua
core.pet_battle.can_active_pet_swap_out() -> boolean
```

Returns

- `boolean` : Whether the active pet can be swapped out.

Description

Returns whether the player's currently active pet can be swapped out. Some abilities or effects may prevent swapping.

---

### `core.pet_battle.can_pet_swap_in`

Syntax

```lua
core.pet_battle.can_pet_swap_in(pet_index: integer) -> boolean
```

**Parameters**

- `pet_index` : `integer` - The pet index to check.

Returns

- `boolean` : Whether the specified pet can be swapped in.

Description

Returns whether a specific pet can be swapped into the active slot. Dead pets or pets affected by certain debuffs cannot be swapped in.

---

### `core.pet_battle.is_trap_available`

Syntax

```lua
core.pet_battle.is_trap_available() -> boolean
```

Returns

- `boolean` : Whether the trap can be used.

Description

Returns whether the pet trap is currently available. Traps are only usable in wild battles when the opponent's pet is below a health threshold.

---

### `core.pet_battle.is_skip_available`

Syntax

```lua
core.pet_battle.is_skip_available() -> boolean
```

Returns

- `boolean` : Whether the skip turn action is available.

Description

Returns whether the player can skip their current turn.

---

### `core.pet_battle.use_ability`

Syntax

```lua
core.pet_battle.use_ability(action_index: integer) -> nil
```

**Parameters**

- `action_index` : `integer` - The ability slot index to use.

Returns

- `nil`

Description

Uses the specified ability on the player's active pet. The action index corresponds to the ability slot (typically 1-3).

---

### `core.pet_battle.change_pet`

Syntax

```lua
core.pet_battle.change_pet(pet_index: integer) -> nil
```

**Parameters**

- `pet_index` : `integer` - The pet index to swap to.

Returns

- `nil`

Description

Swaps the active pet to the specified pet index. Check `can_active_pet_swap_out` and `can_pet_swap_in` before calling.

---

### `core.pet_battle.forfeit_game`

Syntax

```lua
core.pet_battle.forfeit_game() -> nil
```

Returns

- `nil`

Description

Forfeits the current pet battle. The player loses the battle immediately.

---

### `core.pet_battle.skip_turn`

Syntax

```lua
core.pet_battle.skip_turn() -> nil
```

Returns

- `nil`

Description

Skips the player's current turn. The opponent will still take their turn normally.

---

### `core.pet_battle.use_trap`

Syntax

```lua
core.pet_battle.use_trap() -> nil
```

Returns

- `nil`

Description

Attempts to trap the opponent's active pet. Only works in wild battles when the trap is available (opponent pet health is low enough).

---

## Pet Journal

### `core.pet_battle.get_num_pets_journal`

Syntax

```lua
core.pet_battle.get_num_pets_journal() -> table
```

Returns

- `table` : A table with the following fields:

| Field | Type | Description |
| --- | --- | --- |
| `num_pets` | `number` | Total pets available in the game. |
| `num_owned` | `number` | Pets currently owned by the player. |

Description

Returns the pet journal counts. `num_pets` is the size of the whole journal listing; `num_owned` is how many of those the player has actually collected.

**Example Usage**

```lua
local counts = core.pet_battle.get_num_pets_journal()
core.log(string.format("Collected %d / %d pets", counts.num_owned, counts.num_pets))
```

---

### `core.pet_battle.get_pet_info_by_index`

Syntax

```lua
core.pet_battle.get_pet_info_by_index(index: integer) -> table
```

**Parameters**

- `index` : `integer` - The journal index of the pet.

Returns

- `table` : A table with the following fields:

| Field | Type | Description |
| --- | --- | --- |
| `pet_id` | `string` | Pet GUID. |
| `species_id` | `number` | BattlePetSpeciesID. |
| `owned` | `boolean` | Whether the player owns this pet. |
| `custom_name` | `string` | Player-assigned name (empty if none). |
| `level` | `number` | Pet level. |
| `favorite` | `boolean` | Marked as favorite. |
| `is_revoked` | `boolean` | Whether the pet is revoked. |
| `species_name` | `string` | Species name. |
| `icon` | `number` | Icon FileDataID. |
| `pet_type` | `number` | Pet type, `1` to `10`. |
| `companion_id` | `number` | NPC ID. |
| `tooltip` | `string` | Source/location text. |
| `description` | `string` | Flavor text. |
| `is_wild` | `boolean` | Capturable in the wild. |
| `can_battle` | `boolean` | Can participate in battles. |
| `is_tradeable` | `boolean` | Can be traded/caged. |
| `is_unique` | `boolean` | Limited to one. |
| `obtainable` | `boolean` | Currently obtainable. |

Description

Returns detailed information about a pet in the journal by its index position.

> [!NOTE]
> The journal listing includes pets the player does not own. Check `owned` before treating an entry as part of the collection.

---

### `core.pet_battle.get_pet_info_by_pet_id`

Syntax

```lua
core.pet_battle.get_pet_info_by_pet_id(pet_id: string) -> table
```

**Parameters**

- `pet_id` : `string` - The unique pet GUID.

Returns

- `table` : A table with the following fields:

| Field | Type | Description |
| --- | --- | --- |
| `species_id` | `number` | BattlePetSpeciesID. |
| `custom_name` | `string` | Player-assigned name (empty if none). |
| `level` | `number` | Pet level. |
| `xp` | `number` | Current XP. |
| `max_xp` | `number` | XP needed for the next level. |
| `display_id` | `number` | Creature display ID. |
| `is_favorite` | `boolean` | Marked as favorite. |
| `name` | `string` | Species name. |
| `icon` | `number` | Icon FileDataID. |
| `pet_type` | `number` | Pet type, `1` to `10`. |
| `creature_id` | `number` | NPC ID. |
| `source_text` | `string` | Source/location text. |
| `description` | `string` | Flavor text. |
| `is_wild` | `boolean` | Capturable in the wild. |
| `can_battle` | `boolean` | Can participate in battles. |
| `is_tradeable` | `boolean` | Can be traded/caged. |
| `is_unique` | `boolean` | Limited to one. |
| `obtainable` | `boolean` | Currently obtainable. |

Description

Returns detailed information about a pet in the journal by its unique GUID.

> [!NOTE]
> The field names differ slightly from `get_pet_info_by_index` — this one uses `name`, `is_favorite`, `creature_id` and `source_text` where the index version uses `species_name`, `favorite`, `companion_id` and `tooltip`. It also carries the per-pet `xp` / `max_xp`, which the index version does not.

---

### `core.pet_battle.get_pet_info_by_species_id`

Syntax

```lua
core.pet_battle.get_pet_info_by_species_id(species_id: integer) -> table
```

**Parameters**

- `species_id` : `integer` - The species ID to look up.

Returns

- `table` : A table with the following fields:

| Field | Type | Description |
| --- | --- | --- |
| `species_name` | `string` | Species name. |
| `species_icon` | `number` | Icon FileDataID. |
| `pet_type` | `number` | Pet type, `1` to `10`. |
| `companion_id` | `number` | NPC ID. |
| `tooltip_source` | `string` | Source/location text. |
| `tooltip_description` | `string` | Flavor text. |
| `is_wild` | `boolean` | Capturable in the wild. |
| `can_battle` | `boolean` | Can participate in battles. |
| `is_tradeable` | `boolean` | Can be traded/caged. |
| `is_unique` | `boolean` | Limited to one. |
| `obtainable` | `boolean` | Currently obtainable. |
| `creature_display_id` | `number` | Creature display ID. |

Description

Returns detailed information about a pet in the journal by its species ID. If the player owns multiple pets of the same species, returns the first match.

> [!NOTE]
> This is species-level data, so there are no per-pet fields here — no level, XP, custom name or GUID.

---

### `core.pet_battle.get_pet_stats`

Syntax

```lua
core.pet_battle.get_pet_stats(pet_id: string) -> table
```

**Parameters**

- `pet_id` : `string` - The unique pet GUID.

Returns

- `table` : A table with the following fields:

| Field | Type | Description |
| --- | --- | --- |
| `health` | `number` | Current HP. `0` or negative means the pet is dead. |
| `max_health` | `number` | Maximum HP. |
| `power` | `number` | Power stat. |
| `speed` | `number` | Speed stat. |
| `rarity` | `number` | Quality: `1` Poor, `2` Common, `3` Uncommon, `4` Rare, `5` Epic, `6` Legendary. |

Description

Returns the stats of a pet from the journal by its GUID.

---

### `core.pet_battle.get_pet_load_out_info`

Syntax

```lua
core.pet_battle.get_pet_load_out_info(slot_index: integer) -> table
```

**Parameters**

- `slot_index` : `integer` - The loadout slot index (1-3).

Returns

- `table` : A table with the following fields:

| Field | Type | Description |
| --- | --- | --- |
| `pet_guid` | `string` | GUID of the pet in this slot. |
| `ability1` | `number` | Ability ID for slot 1. |
| `ability2` | `number` | Ability ID for slot 2. |
| `ability3` | `number` | Ability ID for slot 3. |
| `locked` | `boolean` | Whether the slot is locked or unavailable. |

Description

Returns information about the pet currently assigned to a loadout slot. Loadout slots determine which pets are used when entering a pet battle.

> [!NOTE]
> `locked` is `true` for slots the player has not unlocked yet. Check it before assuming `pet_guid` is meaningful.

---

### `core.pet_battle.set_pet_load_out_info`

Syntax

```lua
core.pet_battle.set_pet_load_out_info(slot_index: integer, pet_id: string) -> nil
```

**Parameters**

- `slot_index` : `integer` - The loadout slot index (1-3).
- `pet_id` : `string` - The unique pet GUID to assign to the slot.

Returns

- `nil`

Description

Assigns a pet to a loadout slot by its GUID. This changes which pet will be used in the specified slot for future battles.

---

### `core.pet_battle.get_pet_ability_list`

Syntax

```lua
core.pet_battle.get_pet_ability_list(species_id: integer) -> table
```

**Parameters**

- `species_id` : `integer` - The species ID to look up abilities for.

Returns

- `table` : A table with the following fields:

| Field | Type | Description |
| --- | --- | --- |
| `ability_ids` | `number[]` | Array of ability IDs available to the species. |
| `level_thresholds` | `number[]` | Parallel array of level requirements for each ability. |

Description

Returns all available abilities for a given pet species. Each species has up to 6 abilities (2 choices per slot).

> [!NOTE]
> The two arrays are parallel: `level_thresholds[i]` is the level at which `ability_ids[i]` unlocks.
>
> ```lua
> local list = core.pet_battle.get_pet_ability_list(species_id)
> for i, ability_id in ipairs(list.ability_ids) do
>     if pet_level >= list.level_thresholds[i] then
>         -- this ability is unlocked
>     end
> end
> ```

---

### `core.pet_battle.get_pet_ability_info`

Syntax

```lua
core.pet_battle.get_pet_ability_info(ability_id: integer) -> table
```

**Parameters**

- `ability_id` : `integer` - The ability ID to look up.

Returns

- `table` : Ability details including name, description, type, and cooldown.

Description

Returns detailed information about a pet ability from the journal by its ID. This can be used outside of battle for team planning.

---

### `core.pet_battle.set_ability`

Syntax

```lua
core.pet_battle.set_ability(slot_index: integer, spell_index: integer, pet_spell_id: integer) -> nil
```

**Parameters**

- `slot_index` : `integer` - The loadout slot index (1-3).
- `spell_index` : `integer` - The ability slot on the pet (1-3).
- `pet_spell_id` : `integer` - The pet spell ID to assign.

Returns

- `nil`

Description

Sets a specific ability for a pet in a loadout slot. Each pet has 3 ability slots, and each slot can choose between 2 abilities (unlocked at different levels).

---

### `core.pet_battle.summon_pet_by_guid`

Syntax

```lua
core.pet_battle.summon_pet_by_guid(pet_id: string) -> nil
```

**Parameters**

- `pet_id` : `string` - The unique pet GUID to summon.

Returns

- `nil`

Description

Summons a pet as a companion by its GUID. This is the non-combat companion pet that follows the player around.

---

## Toys

### `core.pet_battle.player_has_toy`

Syntax

```lua
core.pet_battle.player_has_toy(item_id: integer) -> boolean
```

**Parameters**

- `item_id` : `integer` - The item ID of the toy.

Returns

- `boolean` : Whether the player has the toy in their collection.

Description

Returns whether the player has a specific toy in their toy box collection.

---

### `core.pet_battle.use_toy`

Syntax

```lua
core.pet_battle.use_toy(item_id: integer) -> nil
```

**Parameters**

- `item_id` : `integer` - The item ID of the toy to use.

Returns

- `nil`

Description

Uses a toy from the player's toy box by its item ID. The toy must be owned and off cooldown.

---

## Complete Example

### Basic Pet Battle Automation Loop

```lua
local function run_pet_battle()
    if not core.pet_battle.is_in_battle() then
        return
    end

    local my_active = core.pet_battle.get_active_pet(1)
    local enemy_active = core.pet_battle.get_active_pet(2)

    local my_health = core.pet_battle.get_health(1, my_active)
    local my_max_health = core.pet_battle.get_max_health(1, my_active)
    local enemy_health = core.pet_battle.get_health(2, enemy_active)

    -- Try to trap if it's a wild battle and trap is available
    if core.pet_battle.is_wild_battle() and core.pet_battle.is_trap_available() then
        core.pet_battle.use_trap()
        return
    end

    -- Swap pet if current pet is low on health
    if my_health < my_max_health * 0.2 and core.pet_battle.can_active_pet_swap_out() then
        local num_pets = core.pet_battle.get_num_pets(1)
        for i = 1, num_pets do
            if i ~= my_active and core.pet_battle.can_pet_swap_in(i) then
                local swap_health = core.pet_battle.get_health(1, i)
                if swap_health > 0 then
                    core.pet_battle.change_pet(i)
                    return
                end
            end
        end
    end

    -- Use first available ability
    for ability_idx = 1, 3 do
        local state = core.pet_battle.get_ability_state(1, my_active, ability_idx)
        if state == 0 then -- available
            core.pet_battle.use_ability(ability_idx)
            return
        end
    end

    -- Skip turn if nothing else is available
    if core.pet_battle.is_skip_available() then
        core.pet_battle.skip_turn()
    end
end
```