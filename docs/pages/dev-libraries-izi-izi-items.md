# IZI - Item (izi_item)

> Source: <https://docs.project-sylvanas.net/dev/libraries/izi/izi-items>

## Overview

The IZI Item system provides a streamlined object-oriented interface for item management and usage in World of Warcraft. Instead of manually tracking item IDs, cooldowns, and charges, you create item objects that encapsulate all the functionality needed for intelligent item usage.

**Key Features:**

- **Smart Usage** - Automatic validation of cooldowns, charges, usability, and inventory status
- **Flexible Validation** - Fine-grained control over which checks to skip or enforce via usage options
- **Cooldown Management** - Query remaining cooldowns, charges, and item readiness states
- **Inventory Awareness** - Automatic detection of equipped and bag items
- **Charge Tracking** - Monitor item charges with fractional charge support
- **Resource Detection** - Determine if items are equipped or available in bags
- **LOS Validation** - Built-in line-of-sight checks for targeted item usage

Whether you're managing trinkets, consumables, or utility items, the `izi_item` class eliminates boilerplate code and provides a consistent, intuitive interface for all your item usage needs. Create an item object once, then use its methods throughout your code for clean, maintainable item management.

## Creating a new Item

### `izi.item`

Syntax

```lua
-- Single item ID
izi.item(id: integer)
```

**Parameters**

- `id: integer` - A single item ID to create an item object for

Returns

- `izi_item` - A new item object with built-in usage utilities and validation methods

Description

Creates a new item object that encapsulates all the functionality needed for intelligent item usage. The item object provides methods for using items, validation, cooldown checking, charge tracking, and inventory detection.

You provide a single item ID to create the item object. The object will automatically track whether the item is equipped or in your bags and provide appropriate usage methods.

**Example Usage**

```lua
local izi = require("common/izi_sdk")

-- Create an item for a trinket
local trinket = izi.item(178742)  -- Some on use trinket

-- Create an item for a consumable
local health_potion = izi.item(171267)  -- Spiritual Healing Potion

-- Create an item for a utility item
local bandage = izi.item(172059)  -- Heavy Shrouded Cloth Bandage

-- Use the item object
if trinket:use() then
    izi.print("Used trinket!")
end

-- Check if item is ready to use
if health_potion:is_usable() then
    izi.print("Health potion is ready!")
end

-- Get cooldown information
local cd_remaining = trinket:cooldown()
izi.printf("Trinket cooldown: %.1f seconds", cd_remaining)
```

## Methods

Once you've created an `izi_item` object, you can call the following methods to interact with and query the item:

### `id`

Syntax

```lua
item:id(): integer
```

Returns

- `integer` - The item ID

Description

Returns the item ID that this item object represents.

**Example Usage**

```lua
local trinket = izi.item(178742)
izi.printf("Item ID: %d", trinket:id())  -- Output: "Item ID: 178742"
```

---

### `name`

Syntax

```lua
item:name(): string
```

Returns

- `string` - The item name

Description

Returns the name of the item from the game's item database.

**Example Usage**

```lua
local trinket = izi.item(178742)
izi.printf("Item name: %s", trinket:name())  -- Output: "Item name: Bottled Flayedwing Toxin"
```

---

### `object`

Syntax

```lua
item:object(): game_object|nil
```

Returns

- [`game_object|nil`](/dev/api/game-object) - The game object representing the equipped item, or nil if not equipped

Description

Returns the game object for the item if it is currently equipped. Returns nil if the item is not equipped or not found.

**Example Usage**

```lua
local trinket = izi.item(178742)
local obj = trinket:object()
if obj then
    izi.print("Trinket is equipped")
end
```

---

### `equipped_slot`

Syntax

```lua
item:equipped_slot(): integer|nil
```

Returns

- `integer|nil` - The equipment slot number, or nil if not equipped

Description

Returns the equipment slot number where the item is equipped, or nil if the item is not currently equipped.

**Example Usage**

```lua
local trinket = izi.item(178742)
local slot = trinket:equipped_slot()
if slot then
    izi.printf("Trinket equipped in slot: %d", slot)
end
```

---

### `equipped`

Syntax

```lua
item:equipped(): boolean
```

Returns

- `boolean` - True if the item is equipped

Description

Returns true if the item is currently equipped on the player.

**Example Usage**

```lua
local trinket = izi.item(178742)
if trinket:equipped() then
    izi.print("Trinket is equipped")
end
```

---

### `count`

Syntax

```lua
item:count(): integer
```

Returns

- `integer` - The number of items in inventory

Description

Returns the total count of this item in the player's inventory (bags).

**Example Usage**

```lua
local health_potion = izi.item(171267)
izi.printf("Health potions: %d", health_potion:count())
```

---

### `in_inventory`

Syntax

```lua
item:in_inventory(): boolean
```

Returns

- `boolean` - True if the item is in inventory

Description

Returns true if the item is present in the player's inventory (bags).

**Example Usage**

```lua
local health_potion = izi.item(171267)
if health_potion:in_inventory() then
    izi.print("Health potion available in bags")
end
```

---

### `is_usable`

Syntax

```lua
item:is_usable(): boolean
```

Returns

- `boolean` - True if the item is usable

Description

Returns true if the item can be used right now, considering factors like cooldown, equipped status, and player state.

**Example Usage**

```lua
local trinket = izi.item(178742)
if trinket:is_usable() then
    izi.print("Trinket is ready to use")
end
```

---

### `cooldown_remains`

Aliases

- `cooldown`

Syntax

```lua
item:cooldown_remains(): number
item:cooldown(): number
```

Returns

- `number` - Time in seconds remaining on cooldown

Description

Returns the remaining cooldown time in seconds. Returns 0 if the item is not on cooldown.

**Example Usage**

```lua
local trinket = izi.item(178742)
local cd = trinket:cooldown_remains()
if cd > 0 then
    izi.printf("Trinket ready in %.1f seconds", cd)
else
    izi.print("Trinket is ready!")
end
```

---

### `cooldown_up`

Syntax

```lua
item:cooldown_up(): boolean
```

Returns

- `boolean` - True if the item is ready (not on cooldown)

Description

Returns true if the item is not on cooldown and can be used (cooldown-wise).

**Example Usage**

```lua
local trinket = izi.item(178742)
if trinket:cooldown_up() then
    izi.print("Trinket is ready!")
end
```

---

### `has_range`

Syntax

```lua
item:has_range(): boolean
```

Returns

- `boolean` - True if the item has a range requirement

Description

Returns true if the item has a range requirement for usage (i.e., it can be used on targets at a distance).

**Example Usage**

```lua
local item = izi.item(12345)
if item:has_range() then
    izi.print("This item can be used at range")
end
```

---

### `is_in_range`

Syntax

```lua
item:is_in_range(target?: game_object): boolean
```

**Parameters**

- [`target?: game_object`](/dev/api/game-object) - Optional target unit (defaults to current target if not provided)

Returns

- `boolean` - True if the target is in range

Description

Returns true if the specified target (or current target) is within range for using the item. If the item has no range requirement, always returns true.

**Example Usage**

```lua
local trinket = izi.item(178742)
local target = izi.target()
if trinket:is_in_range(target) then
    izi.print("Target is in range for trinket")
end
```

---

### `use_self`

Syntax

```lua
item:use_self(message?: string, fast?: boolean): boolean
```

**Parameters**

- `message?: string` - Optional message to display in the queue
- `fast?: boolean` - Optional flag for fast usage mode (off GCD) (default: false)

Returns

- `boolean` - True if the item was successfully queued to use

Description

Uses the item on the player. This is a basic usage method without extensive validation gates.

**Example Usage**

```lua
local health_potion = izi.item(171267)

-- Use potion on self
if health_potion:use_self() then
    izi.print("Used health potion!")
end

-- Use with custom message
if health_potion:use_self("Emergency healing") then
    izi.print("Used health potion")
end
```

---

### `use_on`

Syntax

```lua
item:use_on(target?: game_object, message?: string, fast?: boolean): boolean
```

**Parameters**

- [`target?: game_object`](/dev/api/game-object) - Optional target unit (defaults to current target if not provided)
- `message?: string` - Optional message to display in the queue
- `fast?: boolean` - Optional flag for fast usage mode (off GCD) (default: false)

Returns

- `boolean` - True if the item was successfully queued to use

Description

Uses the item on a target. This is a basic usage method without extensive validation gates.

**Example Usage**

```lua
local trinket = izi.item(178742)
local target = izi.target()

-- Use on target
if trinket:use_on(target) then
    izi.print("Used trinket on target!")
end

-- Use with custom message
if trinket:use_on(target, "Trinket on boss") then
    izi.print("Used trinket")
end
```

---

### `use_at_position`

Syntax

```lua
item:use_at_position(position: vec3, message?: string, fast?: boolean): boolean
```

**Parameters**

- `position: vec3` - The position to use the item at
- `message?: string` - Optional message to display in the queue
- `fast?: boolean` - Optional flag for fast usage mode (off GCD) (default: false)

Returns

- `boolean` - True if the item was successfully queued to use

Description

Uses the item at a specific ground position. This is a basic usage method without extensive validation gates.

**Example Usage**

```lua
local item = izi.item(12345)
local pos = vec3(100, 100, 0)

-- Use at position
if item:use_at_position(pos) then
    izi.print("Used item at position!")
end

-- Use with custom message
if item:use_at_position(pos, "Item placement") then
    izi.print("Used item")
end
```

---

### `use_self_safe`

Syntax

```lua
item:use_self_safe(message?: string, opts?: item_use_opts): boolean
```

**Parameters**

- `message?: string` - Optional message to display in the queue
- `opts?: item_use_opts` - Optional usage options with full safety checks

Returns

- `boolean` - True if the item was successfully queued to use

Description

Safe usage method that uses the item on the player with full validation gates including usability, cooldown, movement state, and other checks. This is the recommended method for production use.

**Example Usage**

```lua
local health_potion = izi.item(171267)

-- Safe use on self with full validation
if health_potion:use_self_safe() then
    izi.print("Safely used health potion!")
end

-- Safe use with custom message and skip some checks
if health_potion:use_self_safe("Emergency heal", {
    skip_moving = true,
    skip_casting = true
}) then
    izi.print("Used health potion (skipped movement/casting checks)")
end
```

---

### `use_on_safe`

Syntax

```lua
item:use_on_safe(target?: game_object, message?: string, opts?: item_use_opts): boolean
```

**Parameters**

- [`target?: game_object`](/dev/api/game-object) - Optional target unit (defaults to current target if not provided)
- `message?: string` - Optional message to display in the queue
- `opts?: item_use_opts` - Optional usage options with full safety checks

Returns

- `boolean` - True if the item was successfully queued to use

Description

Safe usage method that uses the item on a target with full validation gates including usability, cooldown, range, and other checks. This is the recommended method for production use.

**Example Usage**

```lua
local trinket = izi.item(178742)
local target = izi.target()

-- Safe use on target with full validation
if trinket:use_on_safe(target) then
    izi.print("Safely used trinket on target!")
end

-- Safe use with custom message and skip some checks
if trinket:use_on_safe(target, "Trinket on boss", {
    skip_range = true,
    skip_gcd = true
}) then
    izi.print("Used trinket (skipped range/GCD checks)")
end

-- Use with LOS check enabled
if trinket:use_on_safe(target, nil, {
    check_los = true
}) then
    izi.print("Used trinket with LOS validation")
end
```

---

### `use_at_position_safe`

Syntax

```lua
item:use_at_position_safe(target?: game_object, position: vec3, message?: string, opts?: item_use_opts): boolean
```

**Parameters**

- [`target?: game_object`](/dev/api/game-object) - Optional context target for validation
- `position: vec3` - The position to use the item at
- `message?: string` - Optional message to display in the queue
- `opts?: item_use_opts` - Optional usage options with full safety checks

Returns

- `boolean` - True if the item was successfully queued to use

Description

Safe usage method that uses the item at a position with full validation gates including usability, cooldown, range to position, and other checks. This is the recommended method for production use with ground-targeted items.

**Example Usage**

```lua
local item = izi.item(12345)
local target = izi.target()
local pos = vec3(100, 100, 0)

-- Safe use at position with full validation
if item:use_at_position_safe(target, pos) then
    izi.print("Safely used item at position!")
end

-- Safe use with custom message and options
if item:use_at_position_safe(target, pos, "Item placement", {
    check_los = true,
    skip_moving = true
}) then
    izi.print("Used item at position with LOS check")
end
```

---

## Potion Helpers

The IZI SDK provides convenience functions for quickly finding and using the best available health and mana potions. These functions automatically scan your inventory and select the most effective potion based on your character level and available items.

### `izi.best_health_potion_id`

Syntax

```lua
izi.best_health_potion_id(): integer|nil
```

Returns

- `integer|nil` - The item ID of the best available health potion, or nil if none available

Description

Scans your inventory and returns the item ID of the most effective health potion available for your character level. Returns nil if no health potions are found in your bags.

**Example Usage**

```lua
local izi = require("common/izi_sdk")

local potion_id = izi.best_health_potion_id()
if potion_id then
    izi.printf("Best health potion: %d", potion_id)
    local potion = izi.item(potion_id)
    -- Use the potion when needed
else
    izi.print("No health potions available!")
end
```

---

### `izi.best_mana_potion_id`

Syntax

```lua
izi.best_mana_potion_id(): integer|nil
```

Returns

- `integer|nil` - The item ID of the best available mana potion, or nil if none available

Description

Scans your inventory and returns the item ID of the most effective mana potion available for your character level. Returns nil if no mana potions are found in your bags.

**Example Usage**

```lua
local izi = require("common/izi_sdk")

local potion_id = izi.best_mana_potion_id()
if potion_id then
    izi.printf("Best mana potion: %d", potion_id)
    local potion = izi.item(potion_id)
    -- Use the potion when needed
else
    izi.print("No mana potions available!")
end
```

---

### `izi.use_best_health_potion_safe`

Syntax

```lua
izi.use_best_health_potion_safe(health_threshold?: number): boolean
```

**Parameters**

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `health_threshold` | `number` | `35` | Health percentage threshold to trigger potion use |

Returns

- `boolean` - True if a health potion was successfully used

Description

Automatically finds and uses the best available health potion when the player's health drops below the specified threshold. Includes all safety checks (cooldown, usability, etc.).

**Example Usage**

```lua
local izi = require("common/izi_sdk")

-- Use default threshold (35% health)
if izi.use_best_health_potion_safe() then
    izi.print("Used health potion!")
end

-- Use custom threshold (50% health)
if izi.use_best_health_potion_safe(50) then
    izi.print("Used health potion at 50% HP!")
end

-- In a rotation/defensive check
local function check_defensives()
    local player = izi.get_player()
    if player:get_health_percent() < 40 then
        izi.use_best_health_potion_safe(40)
    end
end
```

---

### `izi.use_best_mana_potion_safe`

Syntax

```lua
izi.use_best_mana_potion_safe(mana_threshold?: number): boolean
```

**Parameters**

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `mana_threshold` | `number` | `20` | Mana percentage threshold to trigger potion use |

Returns

- `boolean` - True if a mana potion was successfully used

Description

Automatically finds and uses the best available mana potion when the player's mana drops below the specified threshold. Includes all safety checks (cooldown, usability, etc.).

**Example Usage**

```lua
local izi = require("common/izi_sdk")

-- Use default threshold (20% mana)
if izi.use_best_mana_potion_safe() then
    izi.print("Used mana potion!")
end

-- Use custom threshold (30% mana)
if izi.use_best_mana_potion_safe(30) then
    izi.print("Used mana potion at 30% mana!")
end

-- Combined resource management
local function manage_resources()
    local player = izi.get_player()
    
    -- Check health first (more critical)
    if player:get_health_percent() < 35 then
        if izi.use_best_health_potion_safe() then
            return true
        end
    end
    
    -- Then check mana
    if player:get_power_percent() < 20 then
        if izi.use_best_mana_potion_safe() then
            return true
        end
    end
    
    return false
end
```

---

## Types

### `item_use_opts`

**Fields**

- `skip_usable?: boolean` - Skip item usable validation
- `skip_cooldown?: boolean` - Skip cooldown validation
- `skip_range?: boolean` - Skip range validation
- `skip_moving?: boolean` - Skip moving validation
- `skip_mount?: boolean` - Skip mount validation
- `skip_casting?: boolean` - Skip casting state validation
- `skip_channeling?: boolean` - Skip channeling state validation
- `skip_gcd?: boolean` - Skip global cooldown validation
- `check_los?: boolean` - Line of sight gate, **default `true`** . Pass `false` to skip the check

Description

Options for customizing item usage validation. These flags allow you to bypass specific validation checks when determining if an item can be used. Use these flags to fine-tune item usage behavior and skip unnecessary checks for specific use cases.