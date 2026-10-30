# Pet Stable Functions

> Source: <https://docs.project-sylvanas.net/dev/api/pet-stable>

## Overview

The `core.pet_stable` namespace reads and manages the hunter stable: which pets are stabled, moving pets in and out, buying slots, and closing the stable window. It covers the classic stables of vanilla, TBC and Wrath, and Forever's one-pet stable.

### Slot numbers

Every function takes the same slot numbers on every game version:

| Slot | Meaning |
| --- | --- |
| `0` | Your active pet |
| `1` to `get_num_slots()` | The stable slots you have bought |

> [!INFO]
> The game itself numbered these differently across versions: from Classic Era 1.15.3 and TBC Anniversary 2.5.5 on, its own index for the active pet is `1`, not `0`, and every stable slot moved up by one. Your plugin never sees that. The same slot number reads and moves the same pet on the private servers, on Classic Era, on TBC Anniversary and on Wrath.

### When it works

- **Only while the stable is open.** The game learns your stable from the stable master, so use these functions between the `PET_STABLE_SHOW` and `PET_STABLE_CLOSED` [game events](/dev/api/events) .
- **Actions only send a request.** `stable_pet` , `unstable_pet` , `move_pet` and `buy_slot` return as soon as the request is sent. The result shows up on the `PET_STABLE_UPDATE` event, so re-read after that, not on the next line.
- **Classic stables only.** MoP and retail have the five-slot stable, which this namespace does not drive: there every function except `close()` answers `0` , `nil` or `false` .

> [!WARNING]
> Forever's stable is the classic one-pet stable behind Retail's newer game functions. Since the core update of 2026-10-06 the core drives it: `get_num_slots`, `get_pet_info`, `move_pet`, `buy_slot`, `get_next_slot_cost` and `get_pet_food_types` work there.
>
> These do not work on Forever, because its client has nothing that means the same:
>
> - `get_selected_slot` and `click_slot` : Forever's stable selection exists only in its interface.
> - `stable_pet` and `unstable_pet` : use `move_pet` .
>
> On older cores every function except `close()` answered `0`, `nil` or `false` on Forever.

To abandon a pet rather than stable it, see [`core.input.abandon_pet`](/dev/api/input). For the pet's training points, see [`core.spell_book.get_pet_training_points`](/dev/api/spellbook).

---

## The `stable_pet_info` table

Returned by `get_pet_info`.

| Field | Type | Description |
| --- | --- | --- |
| `slot` | `integer` | The slot it was read from, `0` for the active pet. |
| `icon` | `integer`, `string` or `nil` | The pet's icon, a file id or a texture path depending on the game version. |
| `name` | `string` | The pet's name. |
| `level` | `integer` | The pet's level. |
| `family` | `string` | The pet family in the game's language, such as `"Wolf"`. |
| `loyalty` | `string` or `nil` | Vanilla and TBC: the loyalty text the stable window shows. |
| `talent` | `string` or `nil` | Wrath: the pet's talent tree, such as `"Ferocity"`. Never set on Forever. |

Only one of `loyalty` and `talent` is ever set.

---

### `core.pet_stable.get_num_slots`

Syntax

```lua
core.pet_stable.get_num_slots() -> integer
```

Returns

- `integer` : How many stable slots you have bought, at most `2` on vanilla and TBC and `4` on Wrath. `0` when the game cannot answer.

Description

The highest stable slot number you can use. Read it while the stable is open.

---

### `core.pet_stable.get_pet_info`

Syntax

```lua
core.pet_stable.get_pet_info(slot: integer) -> stable_pet_info | nil
```

**Parameters**

- `slot` : `integer` - `0` for your active pet, `1` to `get_num_slots()` for a stable slot. A negative slot raises a Lua error.

Returns

- `stable_pet_info` : The pet in that slot.
- `nil` : The slot is empty.

Description

Reads one slot of the stable.

**Example Usage**

```lua
-- List the stable when it opens
core.register_on_game_event_callback(function(event_name)
    if event_name ~= "PET_STABLE_SHOW" then
        return
    end

    for slot = 0, core.pet_stable.get_num_slots() do
        local pet = core.pet_stable.get_pet_info(slot)
        if pet then
            core.log(string.format("slot %d: %s, level %d %s", slot, pet.name, pet.level, pet.family))
        else
            core.log(string.format("slot %d: empty", slot))
        end
    end
end)
```

---

### `core.pet_stable.get_pet_food_types`

Syntax

```lua
core.pet_stable.get_pet_food_types() -> string[]
```

Returns

- `string[]` : What your active pet eats, as the client names it ( `"Meat"` , `"Fish"` , ...). Empty with no pet out.

Description

Unlike the rest of `core.pet_stable`, this works anywhere, not only at the stable master, because it reads your active pet.

---

### `core.pet_stable.get_selected_slot`

Syntax

```lua
core.pet_stable.get_selected_slot() -> integer | nil
```

Returns

- `integer` : The slot the stable window has selected, `0` for the active pet.
- `nil` : Nothing is selected.

Description

The slot highlighted in the stable window, the one its model and details show. Not on Forever, where the selection exists only in the interface.

---

### `core.pet_stable.click_slot`

Syntax

```lua
core.pet_stable.click_slot(slot: integer) -> boolean
```

**Parameters**

- `slot` : `integer` - `0` for your active pet, `1` to `get_num_slots()` for a stable slot. A negative slot raises a Lua error.

Returns

- `boolean` : The game's own answer, `true` when the click changed something.

Description

Does what a click on that slot does in the stable window: it selects the slot. If a stable pet is already held on the mouse cursor, the click drops it into that slot instead. To move pets, use `move_pet`, which handles the cursor for you. Not on Forever, where the selection exists only in the interface.

---

### `core.pet_stable.move_pet`

Syntax

```lua
core.pet_stable.move_pet(from_slot: integer, to_slot: integer) -> boolean
```

**Parameters**

- `from_slot` : `integer` - The slot to take the pet from, `0` for your active pet.
- `to_slot` : `integer` - The slot to put it in, `0` for your active pet.

A negative slot raises a Lua error.

Returns

- `boolean` : `true` when the game accepted the move. `false` , with nothing changed, when the mouse cursor already held something, when `from_slot` is empty, or when the game refused the move.

Description

The one call that stables, unstables and swaps on **every** classic version, because it is the same drag and drop the stable window performs:

- `move_pet(0, 1)` puts your active pet into stable slot 1.
- `move_pet(1, 0)` takes the pet in stable slot 1 out as your active pet.
- An occupied target swaps the two pets.

It never leaves a pet stuck on your mouse cursor: a refused move is put back where it came from.

> [!NOTE]
> On Forever the game does not report whether it took the move, so `true` there means the swap was requested. `PET_STABLE_UPDATE` is the confirmation.

**Example Usage**

```lua
-- Swap the active pet with the pet in stable slot 1, then report once the stable updates
local waiting = false

core.register_on_game_event_callback(function(event_name)
    if event_name == "PET_STABLE_SHOW" then
        waiting = core.pet_stable.move_pet(0, 1)
    elseif event_name == "PET_STABLE_UPDATE" and waiting then
        waiting = false
        local pet = core.pet_stable.get_pet_info(0)
        core.log("active pet is now " .. (pet and pet.name or "none"))
    end
end)
```

---

### `core.pet_stable.stable_pet`

Syntax

```lua
core.pet_stable.stable_pet() -> boolean
```

Returns

- `boolean` : `true` when the request was sent.

Description

Puts your active pet into a free stable slot; the game picks which.

> [!WARNING]
> This game function only exists on the versions that kept the old stable numbering, which include the private servers (TBC 2.5.3, vanilla 1.14). Classic Era 1.15.4+ and TBC Anniversary 2.5.6 do not have it, and there it answers `false`. It does not work on Forever either. `move_pet(0, slot)` does the same job everywhere.

---

### `core.pet_stable.unstable_pet`

Syntax

```lua
core.pet_stable.unstable_pet(slot: integer) -> boolean
```

**Parameters**

- `slot` : `integer` - The stable slot, `1` to `get_num_slots()` . A slot below `1` raises a Lua error, because slot `0` is already your active pet.

Returns

- `boolean` : `true` when the request was sent.

Description

Takes the pet in a stable slot out as your active pet. Same availability as `stable_pet`; `move_pet(slot, 0)` is the form that works everywhere.

---

### `core.pet_stable.get_next_slot_cost`

Syntax

```lua
core.pet_stable.get_next_slot_cost() -> integer
```

Returns

- `integer` : The price of the next stable slot, in copper. `0` when the game cannot answer.

Description

What `buy_slot` will spend. Compare it with [`core.inventory.get_gold`](/dev/api/core) first; both are in copper.

---

### `core.pet_stable.buy_slot`

Syntax

```lua
core.pet_stable.buy_slot() -> boolean
```

Returns

- `boolean` : `true` when the request was sent.

Description

Buys the next stable slot.

> [!DANGER]
> The stable window normally asks before buying, but that question is only the default interface calling this same function. Here there is no question: `get_next_slot_cost()` copper is spent.

**Example Usage**

```lua
-- Buy a slot only when the character can afford it
local cost = core.pet_stable.get_next_slot_cost()
if cost > 0 and core.inventory.get_gold() >= cost then
    core.pet_stable.buy_slot()
end
```

---

### `core.pet_stable.close`

Syntax

```lua
core.pet_stable.close() -> boolean
```

Returns

- `boolean` : `true` when the game's close call was reached. With no stable open it does nothing and still answers `true` .

Description

Closes the stable window, exactly as its own close button does. This one works on every game version, MoP and retail included.