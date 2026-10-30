# Input Functions and Spell Queue

> Source: <https://docs.project-sylvanas.net/dev/api/input>

### Overview 📃

In this module we introduce one of the most (if not the most) important features for scripting: a way to manage input from code. For now, this only includes spell casting. However, stay tuned to the changelogs, since other input methods like movement are planned to be supported in the near future.

## The Way Raw Input Functions Work

Similar to what we previously discussed in the [buffs](/dev/api/buffs) page, the raw input functions that the game provides to us have some disadvantages. In this case, they are not FPS-related, but rather usability and safety related. These functions basically send a paquet to the game's server that mimics a legit spell cast or movement. Therefore, spamming raw inputs from code may be dangerous since you might be sending many more requests per seconds than any human would be able to send. So far, this is not a problem for us, but it's something to take into account for the future, as Blizzard anticheat evolves. The real problem is usability 💥: 1 - Compatibility between plugins: If your scripts spam input requests, you will make everything else useless. For example, other modules like "Core Interrupt" might want to cast a spell to interrupt an important enemy cast. This usually has more priority than the normal damage rotation, but since you are flooding the server with your requests, the interruptor spell cast request won't have a chance to be sent. 2 - User Experience: If your script spam input requests you make the user unable to cast their own spells manually. As you could imagine, there might me certain situations in which the users have to cast certain spells on their own, so blocking this could be very frustrating them. To fix this, we handle everything in our LUA Spell Queue Module, which will be explained in detail below.

> [!WARNING]
> You can still use raw input functions, but at your own risk. We advise you to read thoroughly the previous explanation and check if you really really need to use the raw functions. If you have any question, contact us and we will guide you through without any problem - Better safe than sorry. ❤️

> [!NOTE]
> For some items that don't have global cooldown, the raw "Use Item" functions are perfectly fine, just make sure to add checks before the cast so you don't spam when the item isn't ready.

## Raw Input Functions 📃

### Cast Target Spell 💣

`core.input.cast_target_spell(spell_id: integer, target: game_object) -> boolean`

- Cast a spell directly at a target.
- Parameters:
  - `spell_id` : The ID of your chosen spell
  - `target` : The [game_object](/dev/api/game-object) that you want to cast the spell to
- Returns: `true` if the spell was cast, `false` if it fizzled

> [!NOTE]
> This function JUST sends a cast request to the server. It doesn't check if the enemy is close enough, if you are facing it, if the spell is ready, etc. Therefore, you must apply all these checks before casting. To do so, we created a LUA Spell Helper module that will make the job very easy. Check [spell book](/dev/api/spellbook).

We advise you to check the Spell Book module before jumping into input code. This is the proper way you should be casting spells:

```lua
---@type spell_helper
local spell_helper = require("common/utility/spell_helper")

---@type plugin_helper
local plugin_helper = require("common/utility/plugin_helper")

local last_cast_time = 0.0
core.register_on_update_callback(function()
    -- if we remove this check, you will see in the console that more than 1 cast request is issued.
    -- To avoid this and only send one (this is good practice behaviour), we add a minimum delay of 0.25 seconds
    -- for this function to be ran again.
    local current_time = core.game_time()
    if current_time - last_cast_time < 0.50 then
        return false
    end

    local local_player = core.object_manager.get_local_player()
    if not local_player then
        return
    end

    -- since this is just a test, we will just get the hud target
    local hud_target = local_player:get_target()
    -- only cast the fireball when there is a target selected
    if not hud_target then
        return
    end

    -- avoid spamming cast request while already casting
    -- NOTE: in your scripts, you might want to do the same for channels.

    -- approach 1: take into account network latency

    -- local network = plugin_helper:get_latency()
    -- local cast_end_time = local_player:get_active_spell_cast_end_time()
    -- local cast_delta = math.max(cast_end_time - current_time, 0.0)
    -- if cast_delta > (network * 1000) then
    --     return
    -- end

    -- approach 2: more simple, works well in most cases.
    local cast_end_time = local_player:get_active_spell_cast_end_time()
    if current_time <= cast_end_time then
        return
    end

    local fireball_id = 133

    -- check first if the spell is castable, so we avoid sending useless packets (the script will be stuck permanently trying to cast a spell that can't be casted)
    local can_cast_fireball = spell_helper:is_spell_castable(fireball_id, local_player, hud_target, false, false)
    if not can_cast_fireball then
        return
    end

    local spell_cast = core.input.cast_target_spell(fireball_id, hud_target)
    if spell_cast then
        core.log("Fireball Cast!")
        last_cast_time = current_time
    end
end)
```

This example might be an overkill, specially if you are a beginner and are learning. Feel free to play with the code and go step by step. However, if you want to produce good quality products, consider adding at least all the steps specified in the previous example to your casts.

### Cast Position Spell 💣

`core.input.cast_position_spell(spell_id: integer, position: vec3) -> boolean`

- Cast a spell at a specific location in the world.
- Parameters:
  - `spell_id` : Your spell's ID
  - `position` : The XYZ coordinates for your spell. See [vec3](/dev/api/vector-3)
- Returns: `true` if cast successfully, `false` if not

> [!NOTE]
> This function is only used for spells that don't require a target game_object, but instead require a target [position](/dev/api/vector-3). This is usually the case for some AOE spells like Blizzard or Flamestrike.

Let's cast a Flamestrike:

```lua
---@type spell_helper
local spell_helper = require("common/utility/spell_helper")

---@type plugin_helper
local plugin_helper = require("common/utility/plugin_helper")

local last_cast_time = 0.0
core.register_on_update_callback(function()
    -- if we remove this check, you will see in the console that more than 1 cast request is issued.
    -- To avoid this and only send one (this is good practice behaviour), we add a minimum delay of 0.25 seconds
    -- for this function to be ran again.
    local current_time = core.game_time()
    if current_time - last_cast_time < 0.50 then
        return false
    end

    local local_player = core.object_manager.get_local_player()
    if not local_player then
        return
    end

    -- since this is just a test, we will just get the hud target
    local hud_target = local_player:get_target()
    -- only cast the fireball when there is a target selected
    if not hud_target then
        return
    end

    -- avoid spamming cast request while already casting
    -- NOTE: in your scripts, you might want to do the same for channels.

    -- approach 1: take into account network latency

    -- local network = plugin_helper:get_latency()
    -- local cast_end_time = local_player:get_active_spell_cast_end_time()
    -- local cast_delta = math.max(cast_end_time - current_time, 0.0)
    -- if cast_delta > (network * 1000) then
    --     return
    -- end

    -- approach 2: more simple, works well in most cases.
    local cast_end_time = local_player:get_active_spell_cast_end_time()
    if current_time <= cast_end_time then
        return
    end

    local flamestrike_id = 2120

    -- check first if the spell is castable, so we avoid sending useless packets (the script will be stuck permanently trying to cast a spell that can't be casted)
    local can_cast_fireball = spell_helper:is_spell_castable(flamestrike_id, local_player, hud_target, false, false)
    if not can_cast_fireball then
        return
    end

    local position_to_cast = hud_target:get_position()
    local spell_cast = core.input.cast_position_spell(flamestrike_id, position_to_cast)
    if spell_cast then
        core.log("Flamestrike Cast On Target Position!")
        last_cast_time = current_time
    end
end)
```

> [!TIP]
> As you can see, in the previous example we are casting the spell to the target's position, without any further checks. For AOE spells, you would ideally want to cast on the position that would hit the most enemies, which is usually not the same as your main target's position. To do this, you should use some sort of algorithm to determine which is the actual best point to cast, according to your spell's characteristics. To do this, we have developed the "Spell Prediction" module. See [Spell Prediction Module](/dev/libraries/modules/spell-prediction)

### Use Item 🎭

We have three item usage functions, each with its own purpose:

1- Item Self-Cast `core.input.use_item(item_id: integer) -> boolean`

- This function is used for items that don't require a target or a target position.

2- Item Targeted-Cast `core.input.use_item_target(item_id: integer, target: game_object) -> boolean`

- This function is used for items that require a target or a target position.

3- Item Position-Cast `core.input.use_item_position(item_id: integer, position: vec3) -> boolean`

- Use an item at a specific location. (Note: This feature is still in development)

> [!TIP]
> Most items don't have a global cooldown, so these raw functions are usually fine, as we discussed earlier. However, for items that apply GCD, consider using the spell_queue.

The code for casting items is pretty similar to the code for casting spells. You just have to be careful with the way you check if the item is ready, since it's different from checking if a spell is ready. Below, a simple example on how to cast a health potion:

```lua
---@type unit_helper
local unit_helper = require("common/utility/unit_helper")

local last_cast_time = 0.0
core.register_on_update_callback(function()
    -- if we remove this check, you will see in the console that more than 1 cast request is issued.
    -- To avoid this and only send one (this is good practice behaviour), we add a minimum delay of 0.25 seconds
    -- for this function to be ran again.
    local current_time = core.game_time()
    if current_time - last_cast_time < 5.0 then
        return false
    end

    local local_player = core.object_manager.get_local_player()
    if not local_player then
        return
    end

    local cast_end_time = local_player:get_active_spell_cast_end_time()
    if current_time <= cast_end_time then
        return
    end

    -- the potion for this example is the "Greater Healing Potion"
    local potion_id = 1710
    local item_cooldown = local_player:get_item_cooldown(potion_id)
    local can_cast_potion = item_cooldown <= 0.0
    if not can_cast_potion then
        return false
    end

    -- we add this check so the potion is not attempted to be cast while full HP, since the game won't allow it.
    if unit_helper:get_health_percentage(local_player) >= 1.0 then
        return false
    end

    local spell_cast = core.input.use_item(potion_id)
    if spell_cast then
        core.log("Potion cast!")
        last_cast_time = current_time
    end
end)
```

### Use Container Item 🎒

`core.input.use_container_item(container_id: integer, slot_id: integer)`

- Use an item directly from a bag container by its bag index and slot index.
- Parameters:
  - `container_id` : The bag id. `0` is the backpack, `1` to `4` are the equipped bags.
  - `slot_id` : The slot within that bag, as `inventory_helper` reports it. See the box below.

> [!NOTE]
> Unlike `use_item` which takes an item ID, this function addresses the item by its physical bag and slot position. This is useful when you need to interact with items that share the same ID but occupy different slots, or when working with container-specific operations.

> [!WARNING]
> There is no separate equip function and there does not need to be one: `use_container_item` on a weapon or a piece of armour equips it, exactly like right clicking it in the bag UI.
>
> On a **bind-on-equip** item it will not complete, and it will not error either. See Bind confirmations below.

---

## Bag Items 🎒

Everything in this section takes the same `(container_id, slot_id)` pair as `use_container_item`, so the same arguments always name the same item.

> [!DANGER]
> Get the pair from `common/utility/inventory_helper.lua`, which is the module that owns the question:
>
> ```lua
> local inventory_helper = require("common/utility/inventory_helper")
>
> for _, slot_data in ipairs(inventory_helper:get_character_bag_slots()) do
>     -- slot_data.bag_id and slot_data.bag_slot are ready to pass to any function below
> end
> ```
>
> Do **not** pass a raw `slot_id` from `core.inventory.get_items_in_bag` straight through. That value is one short of what these functions want, so you will use or destroy the item in the **next slot**, silently, while the item you meant is still sitting there looking like the call failed. The backpack needs a second remap on top of that, because its internal container also holds your equipped gear and the bag objects themselves. `inventory_helper` handles both.

### `destroy_container_item(container_id, slot_id)`

Destroys a bag item outright. Before this existed, selling to a vendor was the only way anything left the bags, so full bags with no vendor in reach was a dead end.

Parameters:

- **`container_id`** ( *integer* ) - The bag id. `0` is the backpack, `1` to `4` are the equipped bags.
- **`slot_id`** ( *integer* ) - The slot within that bag, as `inventory_helper` reports it.

Returns: *boolean* - `true` only when the item was picked up **and** deleted.

> [!DANGER]
> The item is gone. There is no confirmation step, nothing to undo, and no dialog anywhere in the path. Blizzard's "type DELETE to confirm" box belongs to the default bag UI, raised by that UI's own click handler, and its accept button calls the same engine function this does. Going straight to the engine skips the UI, so there is no popup to accept.

Internally this runs clear cursor, pick up, delete as **one** call, which is why you should prefer it over driving the three pieces yourself. The delete step destroys whatever the cursor holds and does not name its target, so anything that reaches the cursor between the steps gets destroyed instead of the item you asked for. It refuses, leaving the bags untouched, if the cursor cannot be emptied first or if the pick-up did not land.

**Example Usage**

```lua
local inventory_helper = require("common/utility/inventory_helper")

local GREY_JUNK = { [6265] = true }  -- item ids you are happy to lose

for _, slot_data in ipairs(inventory_helper:get_character_bag_slots()) do
    local item = slot_data.item
    if item and item:is_valid() and GREY_JUNK[item:get_item_id()] then
        if core.input.destroy_container_item(slot_data.bag_id, slot_data.bag_slot) then
            core.log("destroyed " .. item:get_name())
        end

        -- One per pass. The slot list is now stale: destroying an item invalidates every
        -- entry after it, so rebuild it on the next tick instead of continuing the loop.
        break
    end
end
```

---

### `equip_container_item(container_id, slot_id, inventory_slot)`

Equips a bag item into a slot **you** name.

Parameters:

- **`container_id`** ( *integer* ) - The bag id. `0` is the backpack, `1` to `4` are the equipped bags.
- **`slot_id`** ( *integer* ) - The slot within that bag, as `inventory_helper` reports it.
- **`inventory_slot`** ( *integer* ) - The game's own inventory slot number. `1` to `19` is gear on every game version: `12` is the second ring, `14` the second trinket, `17` the off hand. For a bag slot, ask [`core.inventory.get_bag_inventory_slot`](/dev/api/core#coreinventoryget_bag_inventory_slot) , because bag slot numbers differ between game versions. A slot the current game version does not have raises an error before anything is picked up.

Returns: *boolean* - `true` only when the item left the cursor for the slot.

> [!TIP]
> `use_container_item` takes no destination, so the **client** chooses, and the client will never choose the second ring (`12`), the second trinket (`14`) or the off hand (`17`). It fills the first empty of a pair and then keeps overwriting that one. A second quiver or bag fails outright with "You can only equip one quiver". This is the only call that can name those slots.

> [!WARNING]
> - **The pick-up was refused** (locked slot, item in transit). Bags untouched, cursor empty. Nothing to clean up.
> - **The placement was refused** (wrong slot for this item, the one-quiver rule). **The item is left on the cursor.** Clear it with `core.input.clear_cursor()` .
> - **The item is bind-on-equip and the engine is waiting.** Also still on the cursor. `core.game_ui.get_pending_equip_slot()` reports the slot within a frame or two, and `core.input.equip_pending_item(slot)` releases it. **Do not clear the cursor here** , that cancels the equip.
>
> The cursor is deliberately not cleared for you on failure, because doing so would cancel a pending bind-on-equip, and that is the one case that is not a failure at all.

Internally this runs clear cursor, pick up, place as **one** call, for the same reason `destroy_container_item` does: the place step acts on whatever the cursor holds and does not name its source, so anything that reaches the cursor between the steps gets equipped instead.

**Example Usage**

```lua
local inventory_helper = require("common/utility/inventory_helper")

local SECOND_RING = 12

for _, slot_data in ipairs(inventory_helper:get_character_bag_slots()) do
    local item = slot_data.item
    if item and item:get_item_id() == my_upgrade_id then
        local equipped = core.input.equip_container_item(
            slot_data.bag_id, slot_data.bag_slot, SECOND_RING)

        if not equipped then
            -- bind-on-equip? answer the prompt next frame instead of clearing
            local pending = core.game_ui.get_pending_equip_slot()
            if pending then
                core.input.equip_pending_item(pending)
            else
                core.input.clear_cursor()
            end
        end
        break
    end
end
```

### `pickup_container_item(container_id, slot_id)`

Puts a bag item on the mouse cursor. This is what "selecting an item" means to the client: the delete call does not name a target, it destroys whatever the cursor is holding.

Returns: *boolean* - `true` when the client's pick-up call was reached, which is **not** the same as the cursor now holding the item. The client refuses locked slots and items in transit without erroring. Confirm with `core.game_ui.has_cursor_item()`.

---

### `delete_cursor_item()`

Destroys whatever item is on the mouse cursor.

Returns: *boolean* - `true` when an item was on the cursor and was destroyed, `false` when the cursor was empty.

> [!WARNING]
> This does not name a target, so it destroys whatever is there, including something the player picked up by hand a frame ago. `destroy_container_item` is the safe form and should be your default; reach for this pair only when you loaded the cursor yourself and know why.

---

### `clear_cursor()`

Releases whatever is on the mouse cursor.

Returns: *boolean* - `true` when the cursor is empty afterwards.

---

### `apply_container_item_to_inventory_slot(container_id, slot_id, inventory_slot)`

Applies a bag item to an **equipped** item: rogue poisons, sharpening stones, weapon oils, fishing lures, enchant scrolls. Same `(container_id, slot_id)` pair as `use_container_item`. Needs core 2.120 or newer.

These items do not apply on use. Using one makes the game wait for an item target, and the player then clicks the weapon. This call does both halves. `use_item_target` cannot: it takes a unit, and an item is not one.

Parameters:

- **`container_id`** ( *integer* ) - The bag id: 0 = backpack, 1 to 4 = the equipped bags.
- **`slot_id`** ( *integer* ) - The slot within that bag, as `inventory_helper` reports it.
- **`inventory_slot`** ( *integer* ) - The equipped item to apply to, 1 to 19: **16** main hand, **17** off hand (18 ranged on Classic). Anything else raises an error.

Returns: *boolean* - `true` when the item asked for a target and the click on the slot was delivered. That is **not** the same as the enchant landing. The answer arrives as an event:

| Event | Meaning | What to do |
| --- | --- | --- |
| `REPLACE_ENCHANT` | The item already has a different temporary enchant | `core.input.replace_enchant()` |
| `BIND_ENCHANT` | The item is not soulbound yet | `core.input.bind_enchant()` |
| `UI_ERROR_MESSAGE` | Refused (wrong item type, wrong slot, ...) | `core.input.stop_spell_target()` |
| none | The cast went through (the poison or stone cast time still applies) | nothing |

`false` means the cursor could not be emptied, a merchant window is open, or the item did not ask for a target, which means it was **used** normally.

> [!WARNING]
> With one of those open, using a bag item sells or moves it instead. The merchant case is refused for you; the others are not.

> [!INFO]
> On Retail, rogue poisons are spells, not items. There this call is for stones, oils, lures and enchant scrolls.

**Example Usage**

```lua
local inventory_helper = require("common/utility/inventory_helper")

local MAIN_HAND, OFF_HAND = 16, 17

local function apply_to(item_id, inventory_slot)
    for _, slot_data in ipairs(inventory_helper:get_character_bag_slots()) do
        local item = slot_data.item
        if item and item:get_item_id() == item_id then
            return core.input.apply_container_item_to_inventory_slot(
                slot_data.bag_id, slot_data.bag_slot, inventory_slot)
        end
    end
    return false
end

core.register_on_game_event_callback(function(event_name, args)
    if event_name == "REPLACE_ENCHANT" then
        core.input.replace_enchant()   -- args[1] the old enchant, args[2] the new one
    elseif event_name == "BIND_ENCHANT" then
        core.input.bind_enchant()
    end
end)

apply_to(my_poison_id, MAIN_HAND)
```

---

## Bind Confirmations ✅

These actions are not accepted or rejected by the client, they are **withheld**. The engine holds the action, fires an event saying so, and waits. Nothing times it out. Blizzard's default UI turns each event into a popup whose accept button calls the function below, which is the only reason these look like UI concerns rather than engine state.

| Event | `args` | The one call that releases it |
| --- | --- | --- |
| `AUTOEQUIP_BIND_CONFIRM` | `inventory_slot` | `core.input.equip_pending_item(inventory_slot)` |
| `EQUIP_BIND_CONFIRM` | `inventory_slot` | `core.input.equip_pending_item(inventory_slot)` |
| `CONFIRM_BINDER` | `binder_name` | `core.input.confirm_binder()` |
| `LOOT_BIND_CONFIRM` | `loot_slot` | `core.input.confirm_loot_slot(loot_slot - 1)` |
| `REPLACE_ENCHANT` | `existing`, `new` | `core.input.replace_enchant()` |
| `BIND_ENCHANT` | none | `core.input.bind_enchant()` |

All of them are delivered through [`core.register_on_game_event_callback`](/dev/api/events). The two `*_ENCHANT` rows need core 2.120 or newer.

### `equip_pending_item(inventory_slot)`

Answers the pending bind-on-equip prompt with yes, completing the equip.

Parameters:

- **`inventory_slot`** ( *integer* ) - The pending equipment slot (an `INVSLOT_*` id).

Returns: *boolean* - `true` when the client's confirm call was reached.

> [!INFO]
> `use_container_item` on a bind-on-equip item does not equip it and does not fail. The engine withholds the equip, fires `AUTOEQUIP_BIND_CONFIRM` (auto-equip from the bags) or `EQUIP_BIND_CONFIRM` (a named destination slot) carrying the inventory slot, and waits for this call. A plugin watching only its own bags sees nothing but "the item did not move", which reads exactly like a refused equip, and the usual reaction is to discard the upgrade for good. `core.game_ui.get_pending_equip_slot()` is the read that tells the two apart.

Take the slot from `core.game_ui.get_pending_equip_slot()` rather than from your own idea of where the item belongs: the engine is holding one specific slot and that is the one it will accept. A successful call clears the latch. Calling it with nothing pending is a harmless no-op.

**Example Usage**

```lua
-- Answer immediately from the event, which is what a real plugin does.
core.register_on_game_event_callback(function(event_name, args)
    if event_name == "AUTOEQUIP_BIND_CONFIRM" or event_name == "EQUIP_BIND_CONFIRM" then
        core.input.equip_pending_item(args[1])
    end
end)

-- Or decide later, anywhere, because the core latches the slot for you.
core.register_on_update_callback(function()
    local slot = core.game_ui.get_pending_equip_slot()
    if slot and i_still_want_this_upgrade() then
        core.input.equip_pending_item(slot)
    end
end)
```

---

### `cancel_pending_equip(inventory_slot)`

Refuses the pending bind-on-equip prompt, leaving the item unbound and unequipped. A successful call clears `core.game_ui.get_pending_equip_slot()`.

Returns: *boolean*

---

### `confirm_binder()`

Accepts an innkeeper's "make this your home" prompt, the one raised by `CONFIRM_BINDER` after using the bind gossip option. The event's `args[1]` is the innkeeper's name.

Returns: *boolean*

Works on every client. On Retail and Forever the core answers the prompt the way their own popup does.

> [!NOTE]
> Before the core update of 2026-10-06 this always returned `false` and did nothing on Retail and Forever, whose clients confirm the innkeeper prompt through a different function.

---

### `confirm_loot_slot(loot_slot)`

Accepts a bind-on-pickup loot prompt, the one raised by `LOOT_BIND_CONFIRM` when you loot a BoP item in a group.

Parameters:

- **`loot_slot`** ( *integer* ) - The **0 based** loot slot index.

Returns: *boolean*

> [!WARNING]
> `loot_slot` is **0 based**, matching `core.input.loot_item` and every `core.game_ui.get_loot_*` reader. WoW's own `LOOT_BIND_CONFIRM` event reports the **1 based** slot, so forwarding `args[1]` straight from the event confirms the slot after the one that asked. Subtract one first.
>
> ```lua
> core.register_on_game_event_callback(function(event_name, args)
>     if event_name == "LOOT_BIND_CONFIRM" then
>         core.input.confirm_loot_slot(args[1] - 1)
>     end
> end)
> ```

---

### `replace_enchant()`

Accepts the "replace the current enchant?" prompt, the one raised by `REPLACE_ENCHANT` when `apply_container_item_to_inventory_slot` targets an item that already has a different temporary enchant. `args[1]` is the existing enchant, `args[2]` the new one. Works on every client (core 2.120+).

Returns: *boolean* - `true` when the client's confirm call was reached.

---

### `bind_enchant()`

Accepts the "this will bind the item to you" prompt, the one raised by `BIND_ENCHANT` (no args) when an enchant or weapon buff is applied to an item that is not soulbound yet. Answering binds the item. Works on every client (core 2.120+).

Returns: *boolean* - `true` when the client's confirm call was reached.

---

### Emotes 💃

### `do_emote(token, target?)`

Performs an emote, the same as typing `/salute`, `/kneel`, `/sit` and so on. Works on every game version. Needs core 2.130 or newer.

Parameters:

- **`token`** ( *string* ) - The game's emote token, case-insensitive: `"SALUTE"` , `"KNEEL"` , `"SIT"` , `"DANCE"` , `"WAVE"` , `"BOW"` , ... (about 200, see EmoteToken on warcraft.wiki.gg). Only letters, digits and `_` are accepted.
- **`target`** ( *game_object* , optional) - Who the emote is aimed at. Leave it out to use the game's default: your current target, or nobody.

Returns: *boolean* - `true` when the game accepted the emote, `false` for an unknown or refused token. (Core 2.130 to 2.133 returned the opposite; fixed in 2.134.)

> [!INFO]
> The server accepts about one emote every 0.25 seconds. Calls faster than that are dropped.

**Example Usage**

```lua
core.input.do_emote("SALUTE", core.object_manager.get_local_player():get_target())
core.input.do_emote("KNEEL")
core.input.do_emote("sit")
```

---

### Vendor Interaction 🏪

### `buy_item(index, quantity)`

Purchases an item from the currently open vendor window.

Parameters:

- **`index`** ( *integer* ) — The vendor item index (1-based).
- **`quantity`** ( *integer* ) — The number of items to purchase.

Returns: *nil*

**Example Usage**

```lua
-- Buy 5 of the first vendor item
core.input.buy_item(1, 5)
```

---

### `repair_all_items(use_guild_bank)`

Repairs all equipped items at a repair-capable vendor.

Parameters:

- **`use_guild_bank`** ( *boolean* ) — `true` to use guild bank funds for the repair; `false` to use personal gold.

Returns: *nil*

**Example Usage**

```lua
-- Repair all items using personal gold
core.input.repair_all_items(false)

-- Repair using guild bank funds
core.input.repair_all_items(true)
```

---

### `close_merchant()`

Closes the merchant window, exactly as its own close button does. Use it at the end of a vendor run so the window does not stay open under whatever your plugin does next. The trainer and the flight map have the same call: [`core.quests.close_trainer`](/dev/api/quests) and [`core.taxi.close`](/dev/api/core).

Returns: *boolean* - `true` when the client's close call was reached. It is **not** an "is a vendor open" check: with no merchant open it does nothing and still answers `true`.

To know when the window is open, listen for `MERCHANT_SHOW` and `MERCHANT_CLOSED` with [`core.register_on_game_event_callback`](/dev/api/events). `MERCHANT_CLOSED` can arrive twice for one visit, so handle it idempotently.

**Example Usage**

```lua
-- Repair at every merchant that can, then leave
core.register_on_game_event_callback(function(event_name)
    if event_name ~= "MERCHANT_SHOW" then
        return
    end

    if core.inventory.can_merchant_repair() then
        core.input.repair_all_items(false)
    end

    core.input.close_merchant()
end)
```

---

### Set Target 🎯

`core.input.set_target(unit: game_object) -> boolean`

- Set your current target.
- Returns: `true` if targeting was successful, `false` if not

Example:

```lua
local local_player = core.object_manager.get_local_player()
if local_player then
    local player_position = local_player:get_position()
    local nearby_enemies = unit_helper:get_enemy_list_around(player_position, 30)

    for _, unit in ipairs(nearby_enemies) do
        local success = core.input.set_target(unit)
        if success then
            core.log("New target acquired! 🎯")
            break
        else
            core.log("Targeting failed. They're quick! 💨")
        end
    end
end
```

### Set and Get Focus 🔍

- `core.input.set_focus(unit: game_object) -> boolean` : Set your focus target
- `core.input.get_focus() -> game_object | nil` : Retrieve your current focus

> [!WARNING]
> On Classic Era and on the private-server clients (Vanilla 1.14 / TBC 2.5.3), `set_focus` always returns `false` and `get_focus` always returns `nil`. Track the unit yourself there.

Checking your focus:

```lua
local current_focus = core.input.get_focus()
if current_focus then
    core.log("Current focus: " .. current_focus:get_name() .. " 🔍")
else
    core.log("No focus set currently")
end
```

## Spell Queue Module: Advanced Spell Management 🧠

As discussed earlier, spell_queue module offers sophisticated spell management with priority queuing. It's the go-to tool for complex spell rotations and efficient casting, and what you should be using in most cases.

## The Way The Spell Queue Module Works

Basically, this module just implements a

[priority queue](https://en.wikipedia.org/wiki/Priority_queue)

for spell casts. When you send a spell cast request, it's added into the queue with a priority value that's passed by parameter. The queue is sorted every frame according to the priority values of the elements inside the said data structure. This way, we can make sure that the most important spells are casted before the less important ones, and we also secure compatibility between plugins, as any plugin can send a cast request at any given time.

### Importing the Module

```lua
---@type spell_queue
local spell_queue = require("common/modules/spell_queue")
```

> [!WARNING]
> Remember to use the colon (:) when calling spell_queue methods!

### Queue Spell with Target 🎯

`spell_queue:queue_spell_target(spell_id: number, target: game_object, priority: number, message?: string)`

- Queue a targeted spell with priority.
- `priority` : Higher numbers = higher priority (1 is default, 9 is highest)
- `message` : Optional logging message

Queueing a Fireball:

```lua
---@type spell_helper
local spell_helper = require("common/utility/spell_helper")

---@type plugin_helper
local plugin_helper = require("common/utility/plugin_helper")

---@type spell_queue
local spell_queue = require("common/modules/spell_queue")

local last_cast_time = 0.0
core.register_on_update_callback(function()
    -- if we remove this check, you will see in the console that more than 1 cast request is issued.
    -- To avoid this and only send one (this is good practice behaviour), we add a minimum delay of 0.25 seconds
    -- for this function to be ran again.
    local current_time = core.game_time()
    if current_time - last_cast_time < 0.50 then
        return false
    end

    local local_player = core.object_manager.get_local_player()
    if not local_player then
        return
    end

    -- since this is just a test, we will just get the hud target
    local hud_target = local_player:get_target()
    -- only cast the fireball when there is a target selected
    if not hud_target then
        return
    end

    -- avoid spamming cast request while already casting
    -- NOTE: in your scripts, you might want to do the same for channels.

    -- approach 1: take into account network latency

    -- local network = plugin_helper:get_latency()
    -- local cast_end_time = local_player:get_active_spell_cast_end_time()
    -- local cast_delta = math.max(cast_end_time - current_time, 0.0)
    -- if cast_delta > (network * 1000) then
    --     return
    -- end

    -- approach 2: more simple, works well in most cases.
    local cast_end_time = local_player:get_active_spell_cast_end_time()
    if current_time <= cast_end_time then
        return
    end

    local fireball_id = 133

    -- check first if the spell is castable, so we avoid sending useless packets (the script will be stuck permanently trying to cast a spell that can't be casted)
    local can_cast_fireball = spell_helper:is_spell_castable(fireball_id, local_player, hud_target, false, false)
    if not can_cast_fireball then
        return
    end

    spell_queue:queue_spell_target(fireball_id, hud_target, 1, "Trying to cast fireball!")
    last_cast_time = current_time
end)
```

As you can see, the code is pretty much the same as the code that we would use for raw functions, the only thing that changes is the way we are attempting to cast the spell.

### Queue Fast Spell with Target 🎯

`spell_queue:queue_spell_target_fast(spell_id: number, target: game_object, priority: number, message?: string)` The code would be exactly the same as the previous example, you just need to replace the queue spell function call.

### Queue Spell with Position 🎯

`spell_queue:queue_spell_position(spell_id: number, position: vec3, priority: number, message?: string)`

- Queue a position-based spell.

As you can imagine, the code to cast Flamestrike using spell queue is pretty much the same as the code we used to cast Flamestrike with raw spells, the only thing that changes is the way we are issuing the actual cast. So, maybe it's more interesting to use the [spell prediction](/dev/libraries/modules/spell-prediction) for a smart Blizzard cast for this example:

```lua
local local_player = core.object_manager.get_local_player()
if local_player then
    local hud_target = local_player:get_target()
    if hud_target then
        local blizzard_id = 10
        local player_position = local_player:get_position()
        local prediction_spell_data = spell_prediction:new_spell_data(
            blizzard_id,                                    -- spell_id
            30,                                             -- range
            6,                                              -- radius
            0.2,                                            -- cast_time
            0.0,                                            -- projectile_speed
            spell_prediction.prediction_type.MOST_HITS,     -- prediction_type
            spell_prediction.geometry_type.CIRCLE,          -- geometry_type
            player_position                                 -- source_position
        )

        local prediction_result = spell_prediction:get_cast_position(hud_target, prediction_spell_data)
        if prediction_result and prediction_result.amount_of_hits > 0 then
            spell_queue:queue_spell_position(blizzard_id, prediction_result.cast_position, 1, "Queueing Blizzard at optimal position")
        end
    end
end
```

This code:

1. Sets up a Blizzard spell with prediction data
2. Uses `MOST_HITS` prediction type to maximize the spell's impact
3. Queues the Blizzard at the optimal position if targets are predicted to be hit

![](https://downloads.project-sylvanas.net/1726863254744-docs_input_prediction_most_hits.png)

> [!NOTE]
> As you can see, we call `prediction_type.MOST_HITS` to fire Death and Decay on the Priest. Instead of casting on the center, it strategically places the spell slightly to the left to hit extra dummies aswell.

> [!TIP]
> Test with the `prediction_type.ACCURACY` values for pinpointing situations where the cast should be avoided

### Queue Fast Spell with Position 🎯

`spell_queue:queue_spell_position_fast(spell_id: number, position: vec3, priority: number, message?: string)`

- Queue a position-based spell that ignores the global cooldown.

The code would be exactly the same as the previous example, you just need to replace the queue spell function call

## Best Practices 🧙‍♂️💡

1- Embrace the Spell Queue

2- Remember the priority scale (1-9). Use it to create sophisticated casting logic.

> [!WARNING]
> Be cautious with priority levels! While `1` is the default, higher priorities should be applied only when absolutely necessary.

`1` is the default priority, intended for the majority of spells in the standard rotation. Developers should strive to keep spells at priority `1` unless a clear, specific reason justifies using a higher priority. This preserves rotation efficiency and prevents disruption.

Higher priorities are intended for spells that require urgent action outside the rotation. **For example, interrupts use priority `7`** to ensure they execute immediately when conditions demand it, as timing is crucial for effective interruption. Core utility spells, such as racials, dispels, or spell reflections, are typically set between **`4` to `6`**. They preempt the rotation without overshadowing interrupts, allowing critical utilities to occur in time-sensitive situations.

Finally, **priority `9`** is exclusively reserved for **manual player actions**, ensuring that the player's chosen spell overrides any automated rotation or interrupt, with no delay.

In short, unless there is a compelling plan, **stick with priority `1`** for your spells. Use `2` only if you have a strong plan.

3- Fast Track Important Spells Use `_fast` versions for critical, non-GCD spells.

4- Leave Breadcrumbs Use the `message` parameter in spell_queue for easier debugging.

5- Learn to Use The Prediction Module The `spell_prediction` module is powerful and easy to use library to evolve your logics.

Remember, mastering these tools takes practice. Experiment with different combinations and priorities to find what works best for your scripting needs.

## More Raw Input Functions

### Keyboard and Input State 🎹

### `is_key_pressed(key)`

Checks if the specified key is currently being pressed.

Parameters:

- **`key`** ( *integer* ) — The virtual key code to check. See [Virtual Key Codes](https://learn.microsoft.com/en-us/windows/win32/inputdev/virtual-key-codes) .

Returns: *boolean* — `true` if the key is currently pressed; otherwise, `false`.

---

### `is_input_bit_active(bit_flag)`

Checks if a specific input bit flag is currently active.

Parameters:

- **`bit_flag`** ( *number* ) — The input bit flag to check.

Returns: *boolean* — `true` if the input bit is active; otherwise, `false`.

---

### Movement Controls 🎮

### `move_up_start()`

Starts moving the player upwards (used in flying scenarios).

Returns: *nil*

---

### `move_up_stop()`

Stops the upward movement.

Returns: *nil*

---

### `move_down_start()`

Starts moving the player downwards (used in flying or swimming scenarios).

Returns: *nil*

---

### `move_down_stop()`

Stops the downward movement.

Returns: *nil*

---

### `jump()`

Makes the player jump. This is also the **ascend start** while flying or gliding: it is the game's `JumpOrAscendStart` action, which jumps on the ground and climbs in the air. That is why there is no `ascend_start()`; pair `jump()` with `ascend_stop()` to end a climb.

Returns: *nil*

---

### Flight and Glide Controls 🪽

These drive the game's own ascend and descend actions, unlike `move_up_start()` and `move_down_start()` above, which toggle raw movement input bits. Prefer this pair for flying and gliding, and the `move_up` / `move_down` pair when you specifically want the raw input flag.

### `ascend_stop()`

Stops an ascent started by `jump()`. There is deliberately no `ascend_start()`: `jump()` is the start of a climb, because the game uses one action for both.

Returns: *nil*

---

### `descend_start()`

Starts descending while flying or gliding. This is the game's `SitStandOrDescendStart` action, so **on the ground it sits or stands the character** instead of descending. Check that the player is airborne first if an accidental sit would matter. Pair it with `descend_stop()`.

Returns: *nil*

---

### `descend_stop()`

Stops a descent started by `descend_start()`.

Returns: *nil*

**Example Usage**

```lua
-- Climb for half a second, then level off.
-- The stop call has to happen on a later frame, so hold the deadline in state
-- rather than trying to sleep inside the callback.
local climb_until = nil

local function start_climb()
    core.input.jump()
    climb_until = core.time() + 0.5
end

core.register_on_update_callback(function()
    if climb_until and core.time() >= climb_until then
        core.input.ascend_stop()
        climb_until = nil
    end
end)
```

---

### Expanded Movement Controls 🎮

### `move_forward_start()`

Starts moving the player forward.

### `move_forward_stop()`

Stops forward movement.

### `move_backward_start()`

Starts moving the player backward.

### `move_backward_stop()`

Stops backward movement.

### `turn_right_start()`

Starts turning the player to the right.

### `turn_right_stop()`

Stops turning to the right.

### `turn_left_start()`

Starts turning the player to the left.

### `turn_left_stop()`

Stops turning to the left.

### `strafe_right_start()`

Starts strafing the player to the right.

### `strafe_right_stop()`

Stops strafing to the right.

### `strafe_left_start()`

Starts strafing the player to the left.

### `strafe_left_stop()`

Stops strafing to the left.

---

### Facing and Movement Lock 🧭

### `look_at(point)`

Faces the local player towards a world position.

Parameters:

- **`point`** ( *vec3* ) — The world position to face towards.

Returns: *nil*

---

### `look_at_3d(point)`

Faces the local player towards a world position, including vertical pitch adjustment.

Parameters:

- **`point`** ( *vec3* ) — The world position to face towards (includes vertical component).

Returns: *nil*

> [!NOTE]
> Unlike `look_at` which only adjusts horizontal facing, `look_at_3d` also adjusts the vertical pitch angle to look up or down at the target position.

---

### `set_pitch(radians)`

Sets the player's vertical look angle (pitch).

Parameters:

- **`radians`** ( *number* ) — The pitch angle in radians.

Returns: *nil*

---

### `enable_movement()`

Re-enables player movement after it has been disabled.

Returns: *nil*

---

### `disable_movement(is_lock)`

Disables player movement. Useful for preventing movement during automated cast sequences.

Parameters:

- **`is_lock`** ( *boolean* ) — Whether to lock the movement state.

Returns: *nil*

> [!WARNING]
> Always make sure to call `enable_movement()` after you are done. Failing to re-enable movement will leave the player stuck!

---

### Spell Cancellation 🚫

### `cancel_spells()`

Cancels any spells currently being cast by the local player.

Returns: *nil*

---

### `stop_spell_target()`

Stops the current spell targeting mode (e.g., cancels a pending skillshot cursor).

Returns: *nil*

---

### `cancel_buff(buff_otr)`

Cancels (right-click removes) a specific buff from the local player.

Parameters:

- **`buff_otr`** ( *buff* ) — The buff object to cancel.

It must be a table [`get_buffs()`](/dev/api/game-object) returned, not one you built.

Returns: *nil*

> [!CAUTION]
> The core reads `impl` and `buff_index` back off the table as integers, on top of the fields the [buff docs](/dev/api/buffs) list first. A hand-assembled table is missing them and errors here.

Works on every client.

> [!NOTE]
> Before the core update of 2026-10-06 this silently did nothing on Forever, and on Classic Era, TBC Classic and MoP Classic whenever the game's deprecated-API fallback was switched off: the buff stayed up and nothing reported it.

---

### Mounting and Dismounting 🐎

### `mount(mount_index)`

Mounts a specific mount by its index.

Parameters:

- **`mount_index`** ( *integer* ) — The index of the mount to use.

Returns: *nil*

---

### `dismount()`

Dismounts the player from their mount.

Returns: *nil*

---

### Resurrection and Spirit Release 🎭

### `release_spirit()`

Releases the player's spirit after death.

Returns: *nil*

---

### `resurrect_corpse()`

Sends the player back to their corpse for resurrection.

Returns: *nil*

---

### Combat 🗡️

### `stop_attack()`

Stops all ongoing player attacks.

Returns: *nil*

---

### Pet Control Functions 🐾

### `pet_move(target)`

Commands the pet to move to the specified game object.

Parameters:

- **`target`** ( *game_object* ) — The game object to move the pet towards.

### `pet_move_position(position)`

Moves the pet to a specified world position.

Parameters:

- **`position`** ( *vec3* ) — The world position to move the pet to.

### `pet_attack(target)`

Commands the pet to attack the target.

Parameters:

- **`target`** ( *game_object* ) — The target to attack.

### `pet_cast_target_spell(spell_id, target)`

Commands the pet to cast a spell on a target.

Parameters:

- **`spell_id`** ( *integer* ) — The ID of the spell to cast.
- **`target`** ( *game_object* ) — The target to cast the spell on.

### `pet_cast_position_spell(spell_id, position)`

Commands the pet to cast a spell at a specific position.

Parameters:

- **`spell_id`** ( *integer* ) — The ID of the spell to cast.
- **`position`** ( *vec3* ) — The position to cast the spell at.

### `set_pet_passive()`

Sets the pet to passive mode.

### `set_pet_defensive()`

Sets the pet to defensive mode.

### `set_pet_aggressive()`

Sets the pet to aggressive mode.

### `set_pet_assist()`

Sets the pet to assist mode.

### `set_pet_wait()`

Commands the pet to wait at its current position.

### `set_pet_follow()`

Commands the pet to follow the player.

### `abandon_pet()`

Abandons your active hunter pet, the same thing as "Abandon Pet" in the pet frame's menu. Useful when a hunter wants a new pet but the stable is full. To park a pet instead of losing it, use the [Pet Stable](/dev/api/pet-stable).

Returns: *boolean* - `true` when the abandon request was sent. `false`, with nothing done, when the game says your pet cannot be abandoned: you have no pet, or it is a pet such as a warlock demon.

> [!DANGER]
> The pet is gone for good. The game's own menu asks "are you sure?" first, but that popup is only the default interface calling this same function, so there is no dialog here to catch a mistake.

Works on every client. On Retail and Forever the core makes the same call their own Abandon Pet popup makes. Before the core update of 2026-10-06 it always answered `false` on those two.

**Example Usage**

```lua
if core.input.abandon_pet() then
    core.log("Abandon request sent")
else
    core.log("No pet that can be abandoned")
end
```

---

### Loot and Object Interaction 🧹

### `loot_object(target, is_auto_loot)`

Loots the specified game object.

**Units and corpses only.** The native path rejects anything that is not a unit and returns `false` straight away, so a fishing bobber, chest, herb node or ore node cannot be looted through this. Use `use_object` for those.

`is_auto_loot` defaults to `true`, which empties the whole window in one call. Pass `false` to open the loot window and leave the contents alone, then pick individual slots (see the selective looting recipe below).

The flag is **sticky**: the core writes the game's auto-loot state from it and never restores it, so it stays where the last call left it. If you mix selective looting with ordinary farming, pass it explicitly every time rather than relying on the default.

Parameters:

- **`target`** ( *game_object* ) — The unit or corpse to loot.
- **`is_auto_loot`** ( *boolean, optional* ) — Take everything immediately. Defaults to `true` .

Returns: *boolean* — `true` when the native loot request was accepted.

---

### `loot_item(index)`

Loots a single slot from the currently open loot window.

**Slots are 0-based**, running `0` to `core.game_ui.get_loot_item_count() - 1`. Passing an index greater than or equal to the current count raises a Lua error rather than failing quietly.

Parameters:

- **`index`** ( *integer* ) — The 0-based slot index in the loot window.

Returns: *nil*

---

### Selective looting 🎣

To take only some items, open the window without auto-loot, then enumerate the slots. The window is **not populated on the frame that opens it**, so read the count on a later frame.

```lua
-- 1. open the window. Units and corpses:
core.input.loot_object(corpse, false)
-- ...or world objects (bobber, chest, herb, ore, mailbox):
core.input.use_object(node)

-- 2. on a LATER frame, enumerate. Slots are 0-based.
local count = core.game_ui.get_loot_item_count()
for i = 0, count - 1 do
    if core.game_ui.get_loot_is_gold(i) or core.game_ui.get_loot_item_id(i) == 12345 then
        core.input.loot_item(i)
    end
end

core.input.close_loot()
```

The shared helper `common/utility/fish_helper.lua` already wraps this loop with `loot_items_whitelist`, `loot_items_excluding_blacklist`, `loot_gold_only` and `loot_with_filter`, and despite the name the loot half works on any open loot window.

See also [`core.game_ui.get_loot_item_count`](/dev/api/game-ui), which exposes the slot count, item id, item name and gold flag.

---

### `close_loot()`

Closes the currently open loot window.

Returns: *nil*

---

### `skin_object(target)`

Skins a specified game object (e.g., a dead beast for leather).

Parameters:

- **`target`** ( *game_object* ) — The game object to skin.

Returns: *boolean* — `true` when the native skinning request was accepted.

---

### `use_object(target)`

Uses a specified game object (e.g., a fishing bobber, chest, herb or ore node, quest object, door, mailbox).

This is the entry point for **world objects rather than units**. `loot_object` refuses all of them because they are not units, so in a gathering or fishing loop this is the call that opens the loot window.

Parameters:

- **`target`** ( *game_object* ) — The game object to use.

Returns: *boolean* — `true` when the native use request was accepted.

---

### `interact_with_object(target)`

Interacts with a specified game object, for example talking to an NPC.

The return value only reports that the request was **dispatched**, not that the interaction happened: the core discards the native interaction result and answers `true` whenever the target and the local player are both valid. Do not write success handling against it.

It also does not cover everything `use_object` does. A mailbox needs `use_object`.

Parameters:

- **`target`** ( *game_object* ) — The game object to interact with.

Returns: *boolean* — `true` when the request was dispatched to the game.

---

### Battleground and Dungeon Finder ⚔️

> [!WARNING]
> On Classic Era, Titan (China) and the private-server clients (Vanilla 1.14 / TBC 2.5.3), `accept_battlefield_port`, `join_battlefield`, `select_dungeon`, `join_dungeon`, `accept_dungeon_proposal` and `clear_dungeon_selections` do nothing, and `has_dungeon_proposal` always returns `false`. They work on Retail, Forever and MoP Classic. `leave_battlefield` and `leave_party` work everywhere.
>
> TBC Classic has battlegrounds but no Dungeon Finder: the two battleground calls work there, the dungeon calls do nothing, and `has_dungeon_proposal` stays `false`.

### `accept_battlefield_port(index, is_accept)`

Accepts or declines a battlefield (battleground) port invitation.

Parameters:

- **`index`** ( *number* ) — The battlefield port index.
- **`is_accept`** ( *boolean* ) — `true` to accept, `false` to decline.

Returns: *nil*

---

### `join_battlefield(battlefield_id, role_flags)`

Queues the player for a specific battlefield.

Parameters:

- **`battlefield_id`** ( *number* ) — The ID of the battlefield to join.
- **`role_flags`** ( *number* ) — The role flags for the queue (e.g., tank, healer, damage).

Returns: *nil*

---

### `leave_battlefield()`

Leaves the current battlefield.

Returns: *nil*

---

### `leave_party()`

Leaves the current party or group.

Returns: *nil*

---

### `select_dungeon(category_id, dungeon_id)`

Selects a dungeon in the dungeon finder interface.

Parameters:

- **`category_id`** ( *number* ) — The category ID of the dungeon type.
- **`dungeon_id`** ( *number* ) — The ID of the specific dungeon.

Returns: *nil*

---

### `join_dungeon(category_id, role_flags)`

Queues the player for the selected dungeon(s).

Parameters:

- **`category_id`** ( *number* ) — The category ID of the dungeon type.
- **`role_flags`** ( *number* ) — The role flags for the queue.

Returns: *nil*

---

### `has_dungeon_proposal()`

Checks if there is a pending dungeon proposal (ready check / group found popup).

Returns: *boolean* - `true` while a Dungeon Finder "group found" popup is waiting for your answer.

---

### `accept_dungeon_proposal(is_accept)`

Accepts or declines a pending dungeon proposal.

Parameters:

- **`is_accept`** ( *boolean* ) — `true` to accept, `false` to decline.

Returns: *nil*

---

### `has_role_check()`

Checks if the "Confirm your role" popup (LFG role check) is waiting for your answer. It shows when the group leader queues the group for a dungeon, a premade group or a battleground.

Returns:

- *boolean* `pending` : `true` while the popup waits for your answer.
- *boolean* `is_battleground` : `true` when the role check is for a battleground queue.

> [!INFO]
> Always `false` on TBC, Classic Era and the private-server clients: they have no role check.

---

### `accept_role_check(is_accept, tank?, healer?, dps?)`

Answers the "Confirm your role" popup, like clicking Accept or Decline.

Parameters:

- **`is_accept`** ( *boolean* ): `true` to accept, `false` to decline.
- **`tank`** , **`healer`** , **`dps`** ( *boolean, optional* ): the roles to accept with. Give any of them to change your roles first: exactly the ones set to `true` are used, a missing one counts as `false` . Give none to accept with the roles already ticked.

Returns:

- *boolean* `ok`
- *string* `message` : `""` on success, otherwise why not: `"no role check in progress"` , `"no role selected"` , `"role not available for this class"` , `"role locked for this queue"` , `"the client refused the answer"` , `"no role check on this client"` .

A role your class cannot play, or one that is locked for this queue, is refused, not silently dropped. For a battleground role check the roles are saved as your PvP roles, otherwise as your dungeon roles.

```lua
local pending = core.input.has_role_check()
if pending then
    -- accept as healer only
    local ok, why = core.input.accept_role_check(true, false, true, false)
    if not ok then
        core.log("role check: " .. why)
    end
end
```

> [!INFO]
> On TBC, Classic Era and the private-server clients it returns `false, "no role check on this client"`.

---

### `clear_dungeon_selections(index)`

Clears dungeon selections in the dungeon finder interface.

Parameters:

- **`index`** ( *integer* ) — The index of the selection to clear.

Returns: *nil*

---

### Pet Autocast 🐾

### `core.input.enable_pet_autocast`

Syntax

```lua
core.input.enable_pet_autocast(spell_id: integer) -> nil
```

**Parameters**

- `spell_id` : `integer` - The ID of the pet spell to enable autocast for.

Description

Enables pet autocast for the specified spell.

**Example Usage**

```lua
core.input.enable_pet_autocast(89751)
```

---

### `core.input.disable_pet_autocast`

Syntax

```lua
core.input.disable_pet_autocast(spell_id: integer) -> nil
```

**Parameters**

- `spell_id` : `integer` - The ID of the pet spell to disable autocast for.

Description

Disables pet autocast for the specified spell.

**Example Usage**

```lua
core.input.disable_pet_autocast(89751)
```

---

### Misc Input Functions 🔧

### `core.input.quick_cat`

Syntax

```lua
core.input.quick_cat() -> nil
```

Description

Performs a quick interact/click action.

**Example Usage**

```lua
core.input.quick_cat()
```

---

### Leaving the world and the game

| Function | Does | Returns |
| --- | --- | --- |
| `core.input.logout()` | starts the **timed** logout | the call was reached |
| `core.input.cancel_logout()` | aborts that countdown | the call was reached |
| `core.input.quit_game()` | closes the client immediately | the call was reached |

`logout()` is the countdown, not the exit: 20 seconds in the open world, instant in an inn or a city, and the client cancels it itself on damage or movement. `true` means the countdown started. Watch `PLAYER_LEAVING_WORLD` for the real transition.

`cancel_logout()` exists because that countdown is cancellable state rather than a fired action. A reaction that decides to log out and then sees the reason disappear needs a way back, and without this the only way to stop it is to move — usually the exact thing such a reaction is trying to avoid.

> [!DANGER]
> It prefers `ForceQuit`, so the server treats it as a disconnect: anything the client had not sent yet is lost and your character lingers in the world for the usual timeout. Use `logout()` unless leaving *immediately* is the point.

```lua
if threat_detected then
    core.input.logout()
elseif logging_out and not threat_detected then
    core.input.cancel_logout()
end
```

---

### `core.input.send_chat_message(message, chat_type, target)`

Sends a chat message. The read side already arrives on [`CHAT_MSG_*` game events](/dev/api/events), so this is the half that lets a plugin answer rather than only listen.

Parameters:

- **`message`** ( *string* ) - The text. **No escaping needed and none is applied** — quotes, apostrophes and newlines are all safe, and nothing is stripped or rejected.
- **`chat_type`** ( *string* ) - WoW's own type: `"SAY"` , `"YELL"` , `"EMOTE"` , `"PARTY"` , `"RAID"` , `"RAID_WARNING"` , `"INSTANCE_CHAT"` , `"GUILD"` , `"OFFICER"` , `"WHISPER"` , `"CHANNEL"` , `"BATTLEGROUND"` . An unknown type is rejected by the client.
- **`target`** ( *string | integer* , optional) - Player name for `"WHISPER"` , channel index for `"CHANNEL"` . Omit for every other type.

Returns: *boolean* - the call was reached.

> [!WARNING]
> `SendChatMessage` answers nothing, so a message over the client's 255-byte cap, a muted account or a channel you are not in all return `true` and simply do not show up.

A whisper target keeps its realm, so `args[4]` from `CHAT_MSG_WHISPER` can be handed straight back as `target`.

**Example Usage**

```lua
core.register_on_game_event_callback(function(event_name, args)
    if event_name == "CHAT_MSG_WHISPER" then
        core.input.send_chat_message("afk, will reply later", "WHISPER", args[2])
    end
end)

core.input.send_chat_message("pulling now", "PARTY")
```

---

### `core.input.cancel_shapeshift_form()`

Leaves the current shapeshift form: druid forms, Ghost Wolf, Shadowform. The client's own call for this, so you do not need to find the right aura for `cancel_buff` first.

Returns: *boolean* - the call was reached (also in caster form, where it does nothing).

---

### `core.input.get_pitch()`

Your current pitch in radians, the read side of `set_pitch` and `look_at_3d`. Matters while swimming or flying.

Returns: *number | nil* - radians, or `nil` on a client that cannot report it.

---

### `core.input.pickup_spell(spell_id)`

Puts a spell on the cursor, as dragging it from the spellbook does. Use with `place_action`, and `clear_cursor` to back out.

Returns: *boolean* - the call was reached.

---

### `core.input.place_action(slot)`

Drops the cursor's content into action slot `1` to `120`, or picks the slot up when the cursor is empty. Refused in combat. Check the result with `core.game_ui.get_action_info(slot)`.

Returns: *boolean* - the call was reached.

```lua
core.input.pickup_spell(133) -- Fireball
core.input.place_action(1)
```

---

### `core.input.use_soulstone()`

Self-resurrects from the death prompt when a soulstone or Reincarnation is offered. Not the same as `release_spirit` / `resurrect_corpse` (your corpse run) or `answer_resurrect` (another player's spell).

Returns: *boolean* - the call was reached.

> [!NOTE]
> Before core 2.134 this did nothing on every current game version (it called a function the game no longer has). It now uses the same call as the death popup's button.

---

### `core.input.clear_target`

Drops the current target.

Returns: *boolean* - `true` when the client had `ClearTarget` and it was called.

> [!NOTE]
> `core.input.set_target(nil)` does **not** clear the target. That binding takes a `game_object` and throws `core.game_object expected, got nil`. Use this instead.

```lua
core.input.clear_target()
```

---

### `core.input.roll_on_loot(roll_id, roll_type)`

Answers a group-loot roll.

Parameters:

- **`roll_id`** ( *integer* ) - The id from the `START_LOOT_ROLL` [game event](/dev/api/events) . **Not** a loot slot and **not** a bag slot.
- **`roll_type`** ( *integer* ) - `0` pass, `1` need, `2` greed, `3` disenchant.

Returns: *boolean* - the call was reached.

A roll expires on its own timer, so an unanswered roll is a pass by default. Nothing here tells you whether you won; that arrives as a `CHAT_MSG_SYSTEM` line.

```lua
core.register_on_game_event_callback(function(event_name, args)
    if event_name == "START_LOOT_ROLL" then
        core.input.roll_on_loot(args[1], 2) -- greed
    end
end)
```

---

### Answering the prompts the engine withholds

These are not notifications. The engine **holds the action and waits**, the same way the bind confirmations do, so an automated session that ignores them stops dead. Each returns "the client had the function and it was called", never "the thing happened" — confirm from the matching event.

| Function | Answers | Confirm with |
| --- | --- | --- |
| `core.input.answer_group_invite(accept)` | `PARTY_INVITE_REQUEST` | `GROUP_ROSTER_UPDATE` |
| `core.input.answer_guild_invite(accept)` | `GUILD_INVITE_REQUEST` | - |
| `core.input.answer_duel(accept)` | `DUEL_REQUESTED` | `DUEL_FINISHED` |
| `core.input.answer_resurrect(accept)` | `RESURRECT_REQUEST` | `PLAYER_ALIVE` |
| `core.input.accept_xp_loss()` | `CONFIRM_XP_LOSS` (spirit healer) | `PLAYER_ALIVE` |
| `core.input.confirm_ready_check(is_ready)` | `READY_CHECK` | - |

Each takes a single boolean (except `accept_xp_loss`, which has no decline — refusing is simply not calling it) and returns a boolean.

> [!DANGER]
> - `answer_group_invite(false)` used to **leave your current group** on Retail, Forever and Classic instead of declining the invite. It now declines, like the popup's Decline button.
> - `accept_xp_loss()` did nothing on every current game version (Titan included). It now accepts the spirit healer the way the game's own popup does.

> [!WARNING]
> `answer_duel(false)` during a duel already in progress **forfeits** it: accepting is `AcceptDuel` but refusing is `CancelDuel`, and that is the same call.
>
> Not answering a `READY_CHECK` is not neutral — the client reports you as **not ready** when it times out, so your session reads to the group as a declining member.
>
> `answer_resurrect` and `release_spirit` / `resurrect_corpse` are different things. `answer_resurrect` answers another **player's** resurrect spell; the other two handle your own corpse.

```lua
core.register_on_game_event_callback(function(event_name, args)
    if event_name == "PARTY_INVITE_REQUEST" then
        core.input.answer_group_invite(false)       -- decline everything
    elseif event_name == "DUEL_REQUESTED" then
        core.input.answer_duel(false)
    elseif event_name == "RESURRECT_REQUEST" then
        core.input.answer_resurrect(true)
    elseif event_name == "READY_CHECK" then
        core.input.confirm_ready_check(true)
    end
end)
```

---

### `core.input.clear_afk`

Syntax

```lua
core.input.clear_afk() -> nil
```

Description

Clears the AFK status of the local player.

**Example Usage**

```lua
core.input.clear_afk()
```