# Inventory Helper

> Source: <https://docs.project-sylvanas.net/dev/libraries/mini-libs/inventory-helper>

## Overview

The **Inventory Helper** module provides a comprehensive set of utility functions that aims to make your life easier when working with items. Below, we'll explore its functionality.

> [!TIP]
> `core.inventory.get_items_in_bag` is the raw engine call. It is honest about what the game stores and that is exactly the problem: it hands you the client's internal container, not the tidy "bag" you were picturing. This module is the layer that turns one into the other, and it exists because of three specific traps.
>
> **1. Bag `0` is not the backpack.** It returns the player's whole item container: everything worn, then the equipped bags as objects, then the backpack. A plain scan of bags `0` to `4` will tell you the sword in your hand is "in your bags". This module returns backpack items only.
>
> **2. The raw `slot_id` is not a slot you can act on.** `core.input.use_container_item` and its siblings want a slot *within* a bag; the raw value is a position in that larger container. Pass it straight through and you use or destroy a different item, silently. `slot_data.bag_id` and `slot_data.bag_slot` from this module are the pair those functions want.
>
> **3. Where the backpack starts differs per client**, and so does the size call's numbering. The module already knows both.
>
> There is nothing wrong with `core.inventory` when you want a specific bag's raw contents. But if you are about to write your own backpack filter, this module has already written it.

## Importing The Module

As with all other LUA modules developed by us, you will need to **import** the Inventory Helper module into your project. To do so, you can use the following lines:

```lua
---@type inventory_helper
local inventory_helper = require("common/utility/inventory_helper")
```

> [!WARNING]
> To access the module's functions, you **must** use `:` instead of `.`
>
> For example, this code is **not correct**:
>
> ```lua
> ---@type inventory_helper
> local inventory_helper = require("common/utility/inventory_helper")
>
> local function check_if_player(unit)
>     return inventory_helper.get_bank_slots(unit)
> end
> ```
>
> And this would be the **corrected code**:
>
> ```lua
> ---@type inventory_helper
> local inventory_helper = require("common/utility/inventory_helper")
>
> local function check_if_player(unit)
>     return inventory_helper:get_bank_slots(unit)
> end
> ```

---

## Functions

### `get_all_slots() -> table<slot_data>`

Retrieves all item slots available to the player, including both character bags and bank slots.

- **Returns** :
  - `slots` ( `table<slot_data>` ): A table containing slot data for all items.

---

### `get_character_bag_slots() -> table<slot_data>`

Retrieves all item slots from the character's bags, excluding bank slots.

- **Returns** :
  - `slots` ( `table<slot_data>` ): A table containing slot data for items in character bags.

---

### `get_bank_slots() -> table<slot_data>`

Retrieves all item slots from the bank.

- **Returns** :
  - `slots` ( `table<slot_data>` ): A table containing slot data for items in the bank.

---

### `get_current_consumables_list() -> table<consumable_data>`

Retrieves a list of consumables currently in the player's inventory.

- **Returns** :
  - `consumables` ( `table<consumable_data>` ): A table containing data for each consumable item.

---

### `update_consumables_list()`

Updates the internal list of consumables. Call this function whenever the inventory changes to refresh the consumables list.

**Example**:

```lua
---@type inventory_helper
local inventory_helper = require("common/utility/inventory_helper")

-- After picking up new consumables
inventory_helper:update_consumables_list()
```

---

### `debug_print_consumables()`

Prints the current consumables list to the debug log for debugging purposes.

---

## Data Structures

### Slot Data Structure 🎒

The `slot_data` class represents an item slot in the inventory or bank.

#### Fields:

- `item` ( `game_object` ): The item object in this slot. Read its id with `slot.item:get_item_id()` .
- `global_slot` ( `number` ): The raw slot id as the engine reported it. Diagnostic only, see below.
- `bag_id` ( `integer` ): ID of the bag containing the item. **Pass this to the container functions.**
- `bag_slot` ( `integer` ): Slot number within the bag. **Pass this to the container functions.**
- `stack_count` ( `integer` ): Stack count of the item in this slot.

> [!DANGER]
> This is the whole reason the module hands you three numbers instead of one.
>
> `bag_id` and `bag_slot` are ready to pass to `core.input.use_container_item`, `pickup_container_item` and `destroy_container_item`. They all take the same pair, so the same two values always name the same item.
>
> `global_slot` is the raw engine value the item came in on. It is useful for logging and for telling two stacks apart. It is **not** a slot you can act on, and passing it to a container function targets a different item or nothing at all, without an error.
>
> ```lua
> for _, slot in ipairs(inventory_helper:get_character_bag_slots()) do
>     if slot.item:get_item_id() == 6948 then
>         core.input.use_container_item(slot.bag_id, slot.bag_slot)  -- correct
>         -- core.input.use_container_item(0, slot.global_slot)      -- wrong, silently
>     end
> end
> ```

**Example**:

```lua
local slot = all_slots[1]
core.log("Item: " .. slot.item:get_name())
core.log("Stack Count: " .. tostring(slot.stack_count))
```

---

### Consumable Data Structure 🧪

The `consumable_data` class represents a consumable item in the inventory.

#### Fields:

- `is_mana_potion` ( `boolean` ): Whether the item is a mana potion.
- `is_health_potion` ( `boolean` ): Whether the item is a health potion.
- `is_damage_bonus_potion` ( `boolean` ): Whether the item is a damage bonus potion.
- `item` ( `game_object` ): The item object for the consumable.
- `bag_id` ( `integer` ): ID of the bag containing the item.
- `bag_slot` ( `integer` ): Slot number within the bag.
- `stack_count` ( `integer` ): Stack count of the item in this slot.

---

## Examples

### Iterating Over All Inventory Slots

```lua
---@type inventory_helper
local inventory = require("common/utility/inventory_helper")

local function print_all_items()
    local all_slots = inventory:get_all_slots()
    for _, slot in ipairs(all_slots) do
        core.log("Item: " .. slot.item:get_name() .. " in slot: " .. tostring(slot.global_slot))
    end
end

print_all_items()
```