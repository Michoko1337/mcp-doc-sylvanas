# Auction House Functions

> Source: <https://docs.project-sylvanas.net/dev/api/auction-house>

## Overview

The `core.auction_house` module provides functions for interacting with the World of Warcraft auction house. This includes scanning and replicating auction data, searching for items, managing owned auctions, posting new listings, purchasing items, and querying auction state.

> [!WARNING]
> - **Retail and Forever** use the modern auction house and behave as documented on this page. Wherever a note below says "Retail" or "the Classic versions", Forever follows the Retail side.
> - **Classic Era, TBC Classic and Titan (China)** use the old auction house, which this module adapts to the same functions. There an `auction_id` is the **row number** of the current search (or of your own auctions list), valid only until that list changes, and the modern-only features return fixed values. Each function notes its differences below.
> - **MoP Classic is not verified.** Its game client can run either auction house and picks one itself. This module always uses the old one, so if MoP runs the modern one it does not work.

> [!NOTE]
> Forever works since the core update of 2026-10-06, on the modern implementation: real auction ids, a 0 based replicate index, and real answers from the modern-only functions. Post with `post_commodity` or `post_item`; the old sell-slot flow (`click_auction_sell_button`, `do_post_auction`, `get_auction_sell_item_info`) does nothing there. Its bag and slot arguments follow the same convention as [`core.input`](/dev/api/input). On older cores nothing in this module worked on Forever.

---

## Scanning / Replication Functions

### `core.auction_house.replicate_items`

Syntax

```lua
core.auction_house.replicate_items() -> nil
```

Description

Initiates a full replication of all auction house items. This is a server-side scan that populates the replicate item cache. Use `get_num_replicate_items` to check how many items were returned.

---

### `core.auction_house.get_num_replicate_items`

Syntax

```lua
core.auction_house.get_num_replicate_items() -> integer
```

Returns

- `integer` : The number of items available from the last replication scan.

Description

Returns the number of items returned by the most recent `replicate_items` call.

---

### `core.auction_house.get_replicate_item_info`

Syntax

```lua
core.auction_house.get_replicate_item_info(index: integer) -> table
```

**Parameters**

- `index` : `integer` - The index of the replicated item.

Returns

- `table` : A table with the following fields:

| Field | Type | Description |
| --- | --- | --- |
| `name` | `string` | The name of the auction item. |
| `texture` | `integer` | The texture/icon ID of the item. |
| `count` | `integer` | The stack count of the item. |
| `quality_id` | `integer` | The item quality: `0` Poor, `1` Common, `2` Uncommon, `3` Rare, `4` Epic, `5` Legendary. |
| `usable` | `boolean` | Whether the item is usable by the local player. |
| `level` | `integer` | The item level. |
| `level_type` | `string` | The type of the level value, e.g. `"ilvl"`. |
| `min_bid` | `number` | The minimum bid amount in copper. |
| `min_increment` | `number` | The minimum bid increment in copper. |
| `buyout_price` | `number` | The buyout price in copper. |
| `bid_amount` | `number` | The current highest bid amount in copper. |
| `high_bidder` | `string` | The name of the highest bidder. |
| `owner` | `string` | The name of the auction owner. |
| `sale_status` | `integer` | The sale status of the auction. |
| `item_id` | `integer` | The item ID. |
| `has_all_info` | `boolean` | Whether all item information has been loaded. |

Description

Returns information about a specific item from the replication cache at the given index.

> [!WARNING]
> On Retail the index runs from `0` to `get_num_replicate_items() - 1`. On the Classic versions it runs from `1` to `get_num_replicate_items()`. The same applies to `get_replicate_item_link`, `get_replicate_item_time_left` and the `start` of `batch_get_replicate_items`.

> [!WARNING]
> Check `has_all_info` before trusting the rest of the table. Replication streams in over several frames, and entries that have not fully loaded carry placeholder values.

---

### `core.auction_house.get_replicate_item_link`

Syntax

```lua
core.auction_house.get_replicate_item_link(index: integer) -> string
```

**Parameters**

- `index` : `integer` - The index of the replicated item.

Returns

- `string` : The item link for the replicated item.

Description

Returns the item link string for a specific item from the replication cache.

---

### `core.auction_house.get_replicate_item_time_left`

Syntax

```lua
core.auction_house.get_replicate_item_time_left(index: integer) -> integer
```

**Parameters**

- `index` : `integer` - The index of the replicated item.

Returns

- `integer` : The time-left category for the auction.

Description

Returns the time remaining category for a replicated auction item.

---

### `core.auction_house.batch_get_replicate_items`

Syntax

```lua
core.auction_house.batch_get_replicate_items() -> table
```

Returns

- `table` : An array of replicated item data.

Description

Returns all replicated items in a single batch call. This is more efficient than iterating with `get_replicate_item_info` for large result sets.

**Example Usage**

```lua
core.auction_house.replicate_items()
local items = core.auction_house.batch_get_replicate_items()
core.log("Total auctions scanned: " .. #items)
```

---

## Search Functions

### `core.auction_house.send_search_query`

Syntax

```lua
core.auction_house.send_search_query(item_id: integer, item_level?: integer, item_suffix?: integer, separate_owner_items?: boolean, sorts?: table) -> nil
```

**Parameters**

- `item_id` : `integer` - The item to search for.
- `item_level` , `item_suffix` : `integer` (optional, default 0) - The exact item key, from `get_browse_result_info` .
- `separate_owner_items` : `boolean` (optional, default `false` ) - List your own auctions separately.
- `sorts` : `table` (optional, core 2.200+) - `{ { sort_order = 0..5, reverse = false }, ... }` , at most 6 entries. `sort_order` is `Enum.AuctionHouseSortOrder` : 0 Price, 1 Name, 2 Level, 3 Bid, 4 Buyout, 5 TimeRemaining (own auctions only).

Description

Searches the auction house for one item. Results arrive with `COMMODITY_SEARCH_RESULTS_UPDATED` or `ITEM_SEARCH_RESULTS_UPDATED`; read them with the commodity or item search result functions below.

Without `sorts`, core 2.200+ sends the sorts the game's own window sends: **no sort** for a commodity, Buyout then Bid for an item. Older cores always sent Price.

> [!WARNING]
> To search the same item again (a watch list), call `send_search_query` once, then `refresh_commodity_search_results` / `refresh_item_search_results` while `has_search_results` is `true`. That is what the game's own window does. Sending a new search every time can stall the auction house: no more results arrive until you switch the AH tab.

> [!WARNING]
> The Classic versions search by the item's name, which this looks up through the game's compatibility layer for old item functions. While the game setting `loadDeprecationFallbacks` is off, nothing is sent. `sorts` is ignored there.

**Example Usage**

```lua
-- cheapest lots first, explicitly
core.auction_house.send_search_query(2589, 0, 0, false, { { sort_order = 0 } })
```

---

### `core.auction_house.send_sell_search_query`

Syntax

```lua
core.auction_house.send_sell_search_query(item_id: integer, item_level?: integer, item_suffix?: integer, separate_owner_items?: boolean, sorts?: table) -> nil
```

Description

Sends a search query for the sell tab, used to check current prices before posting an item. Same arguments and default sorts as `send_search_query`.

> [!WARNING]
> Same search as `send_search_query`; `item_level`, `item_suffix`, `separate_owner_items` and `sorts` are ignored.

---

### `core.auction_house.has_search_results`

Syntax

```lua
core.auction_house.has_search_results(item_id: integer, item_level?: integer, item_suffix?: integer) -> boolean
```

Returns

- `boolean` : Whether the client already holds search results for this item key. `false` on Classic versions.

Description

The check the game's window makes before it repeats a search. Needs core 2.200 or later.

---

### `core.auction_house.refresh_commodity_search_results`

Syntax

```lua
core.auction_house.refresh_commodity_search_results(item_id: integer) -> boolean
```

Returns

- `boolean` : `true` when sent. `false` on Classic versions.

Description

Asks for fresh results of a commodity you already searched, instead of sending a new search. Results arrive like a search's (`COMMODITY_SEARCH_RESULTS_UPDATED`, the same readers). It is throttled like any query, so still check `is_throttled_message_system_ready()`. Needs core 2.200 or later.

**Example Usage**

```lua
local ah = core.auction_house
if ah.is_throttled_message_system_ready() then
    if ah.has_search_results(item_id) then
        ah.refresh_commodity_search_results(item_id)
    else
        ah.send_search_query(item_id)
    end
end
```

---

### `core.auction_house.refresh_item_search_results`

Syntax

```lua
core.auction_house.refresh_item_search_results(item_id: integer, item_level?: integer, item_suffix?: integer) -> boolean
```

Returns

- `boolean` : `true` when sent. `false` on Classic versions.

Description

The item (non-commodity) form of `refresh_commodity_search_results`. Needs core 2.200 or later.

---

### `core.auction_house.get_num_commodity_search_results`

Syntax

```lua
core.auction_house.get_num_commodity_search_results() -> integer
```

Returns

- `integer` : The number of commodity search results.

Description

Returns the number of results from the most recent commodity search.

---

### `core.auction_house.get_commodity_search_result_info`

Syntax

```lua
core.auction_house.get_commodity_search_result_info(index: integer) -> table
```

**Parameters**

- `index` : `integer` - The result index.

Returns

- `table` : A table with the following fields:

| Field | Type | Description |
| --- | --- | --- |
| `item_id` | `integer` | The item ID. |
| `quantity` | `integer` | The quantity available in this listing. |
| `unit_price` | `number` | The price per unit in copper. |
| `auction_id` | `integer` | The auction ID. |
| `num_owner_items` | `integer` | The number of items in this listing owned by the local player. |
| `contains_owner_item` | `boolean` | Whether this listing contains items posted by the local player. |
| `contains_account_item` | `boolean` | Whether this listing contains items posted by any character on the account. |

Description

Returns information about a specific commodity search result, including unit price, quantity, and seller details.

> [!TIP]
> Check `contains_owner_item` before buying — otherwise a sniper will happily buy back your own listings. `contains_account_item` extends the same check to your other characters.

---

### `core.auction_house.has_full_commodity_search_results`

Syntax

```lua
core.auction_house.has_full_commodity_search_results() -> boolean
```

Returns

- `boolean` : `true` if all commodity search results have been received.

Description

Checks whether the full set of commodity search results has been received from the server.

> [!WARNING]
> Always `true` on the Classic versions, where results arrive all at once.

---

### `core.auction_house.get_num_item_search_results`

Syntax

```lua
core.auction_house.get_num_item_search_results() -> integer
```

Returns

- `integer` : The number of item search results.

Description

Returns the number of results from the most recent item (non-commodity) search.

---

### `core.auction_house.get_item_search_result_info`

Syntax

```lua
core.auction_house.get_item_search_result_info(index: integer) -> table
```

**Parameters**

- `index` : `integer` - The result index.

Returns

- `table` : A table with the following fields:

| Field | Type | Description |
| --- | --- | --- |
| `item_id` | `integer` | The item ID. |
| `auction_id` | `integer` | The auction ID. |
| `quantity` | `integer` | The quantity in this listing. |
| `bid_amount` | `number` | The current highest bid in copper. |
| `buyout_amount` | `number` | The buyout price in copper. |
| `min_bid` | `number` | The minimum bid in copper. |
| `time_left` | `integer` | The time remaining category: `1` Short, `2` Medium, `3` Long, `4` Very Long. |
| `item_link` | `string` | The item link string for this listing. |
| `contains_owner_item` | `boolean` | Whether this listing was posted by the local player. |
| `contains_account_item` | `boolean` | Whether this listing was posted by any character on the account. |

Description

Returns information about a specific item search result, including buyout price, bid amount, and time remaining.

> [!NOTE]
> A `buyout_amount` of `0` means the auction is bid-only.

---

### `core.auction_house.has_full_item_search_results`

Syntax

```lua
core.auction_house.has_full_item_search_results() -> boolean
```

Returns

- `boolean` : `true` if all item search results have been received.

Description

Checks whether the full set of item search results has been received from the server.

> [!WARNING]
> Always `true` on the Classic versions, where results arrive all at once.

---

## Name Search (Browse) Functions

Search by name, the way the auction house's own search box does. Every result is an **exact item key** (`item_id`, `item_level`, `item_suffix`) that `send_search_query` takes as it is, so you no longer need `get_item_info` to answer first (it answers nothing until the game has loaded the item, which is why a first search often came back with 0 rows). Needs core 2.194 or newer.

> [!WARNING]
> Works where the game has the modern auction house: Forever, Retail and MoP Classic. On Classic Era, TBC Classic, Titan and the private servers, `send_browse_query` returns `false` and there are no results.

### `core.auction_house.send_browse_query`

Syntax

```lua
core.auction_house.send_browse_query(search_text: string, min_level?: integer, max_level?: integer) -> boolean
```

**Parameters**

- `search_text` : `string` - Item name or part of it. Any text is safe to pass.
- `min_level` : `integer` (optional) - Minimum required level. `0` or `nil` for none.
- `max_level` : `integer` (optional) - Maximum required level. `0` or `nil` for none.

Returns

- `boolean` : `true` when the query was sent.

Description

Sends the same query as the search box: no filters, sorted by price then name. The results arrive with the `AUCTION_HOUSE_BROWSE_RESULTS_UPDATED` game event.

---

### `core.auction_house.get_num_browse_results`

Syntax

```lua
core.auction_house.get_num_browse_results() -> integer
```

Returns

- `integer` : Number of results received so far for the last browse.

---

### `core.auction_house.get_browse_result_info`

Syntax

```lua
core.auction_house.get_browse_result_info(index: integer) -> table | nil
```

**Parameters**

- `index` : `integer` - `1` to `get_num_browse_results()` .

Returns

| Field | Type | Description |
| --- | --- | --- |
| `item_id` | `integer` | Item key: item id |
| `item_level` | `integer` | Item key: exact item level |
| `item_suffix` | `integer` | Item key: suffix |
| `battle_pet_species_id` | `integer` | Item key: battle pet species, `0` for items |
| `total_quantity` | `integer` | Units listed across every auction of this key |
| `min_price` | `number` | Lowest buyout, in copper |
| `contains_owner_item` | `boolean` | One of the listings is yours |

`nil` when the index is out of range.

---

### `core.auction_house.has_full_browse_results`

Syntax

```lua
core.auction_house.has_full_browse_results() -> boolean
```

Returns

- `boolean` : `false` while the server still has more results for the last browse.

---

### `core.auction_house.request_more_browse_results`

Syntax

```lua
core.auction_house.request_more_browse_results() -> boolean
```

Returns

- `boolean` : `true` when the call was reached.

Description

Asks for the next page of the last browse. It arrives with the `AUCTION_HOUSE_BROWSE_RESULTS_ADDED` game event; read it again with `get_browse_result_info`.

---

### `core.auction_house.get_detailed_item_level`

Syntax

```lua
core.auction_house.get_detailed_item_level(item_link: string) -> integer | nil
```

**Parameters**

- `item_link` : `string` - An item link, for example from `get_replicate_item_link` .

Returns

- `integer` : The exact effective item level of that item.
- `nil` : The game cannot read the link.

Description

Reads the item level from the link itself (upgrades and bonuses included), so it works even when the item is not loaded yet. Use it as `item_level` in `send_search_query`. Works on every game version.

**Example Usage**

```lua
-- Find an item by name, then search its exact key
core.auction_house.send_browse_query("Copper Ore")

core.register_on_game_event_callback(function(event_name)
    if event_name ~= "AUCTION_HOUSE_BROWSE_RESULTS_UPDATED" then return end
    for i = 1, core.auction_house.get_num_browse_results() do
        local r = core.auction_house.get_browse_result_info(i)
        if r then
            core.log(r.item_id .. " ilvl " .. r.item_level .. " min " .. r.min_price)
            core.auction_house.send_search_query(r.item_id, r.item_level, r.item_suffix)
            break
        end
    end
end)
```

---

## Owned Auction Functions

### `core.auction_house.query_owned_auctions`

Syntax

```lua
core.auction_house.query_owned_auctions() -> nil
```

Description

Queries the server for a list of all auctions owned by the player.

> [!WARNING]
> Does nothing on the Classic versions: your auctions are readable whenever the auction house is open.

---

### `core.auction_house.get_num_owned_auctions`

Syntax

```lua
core.auction_house.get_num_owned_auctions() -> integer
```

Returns

- `integer` : The number of owned auctions.

Description

Returns the number of auctions currently owned by the player.

---

### `core.auction_house.get_owned_auction_info`

Syntax

```lua
core.auction_house.get_owned_auction_info(index: integer) -> table
```

**Parameters**

- `index` : `integer` - The index of the owned auction.

Returns

- `table` : A table with the following fields:

| Field | Type | Description |
| --- | --- | --- |
| `auction_id` | `integer` | The auction ID. |
| `item_id` | `integer` | The item ID. |
| `item_link` | `string` | The item link string. |
| `status` | `integer` | The auction status. |
| `quantity` | `integer` | The quantity listed. |
| `time_left` | `integer` | The time remaining category. |
| `bid_amount` | `number` | The current highest bid in copper. |
| `buyout_amount` | `number` | The buyout price in copper. |
| `bidder` | `string` | The name of the current highest bidder. |

Description

Returns information about a specific owned auction, including item details, current bid, buyout, and time remaining.

**Example Usage**

```lua
core.auction_house.query_owned_auctions()
local num = core.auction_house.get_num_owned_auctions()
for i = 1, num do
    local info = core.auction_house.get_owned_auction_info(i)
    core.log(string.format("Auction %d: %s", i, tostring(info)))
end
```

---

## Posting Functions

### `core.auction_house.post_commodity`

Syntax

```lua
core.auction_house.post_commodity(bag: integer, slot: integer, duration: integer, quantity: integer, unit_price: integer) -> boolean
```

**Parameters**

- `bag` : `integer` - The bag index containing the item.
- `slot` : `integer` - The slot index within the bag.
- `duration` : `integer` - The auction duration (1 = 12h, 2 = 24h, 3 = 48h).
- `quantity` : `integer` - The number of items to post.
- `unit_price` : `integer` - The price per unit in copper.

Description

Posts a commodity (stackable) item to the auction house at the specified unit price.

On Retail and Forever the return value is the game's "needs confirmation" flag, **not** "posted". `false` is the normal answer: the post went through. `true` means the game wants a confirmation (it also fires `AUCTION_HOUSE_POST_WARNING`) and nothing is listed until you call `confirm_post_commodity` with the same arguments. Watch `AUCTION_HOUSE_AUCTION_CREATED` for success and `AUCTION_HOUSE_POST_ERROR` for a rejected post.

> [!WARNING]
> On the Classic versions `quantity` is ignored: the whole stack in that slot is posted as one auction, with bid and buyout both set to stack size times `unit_price`. `true` there only means the calls ran, not that the auction was posted.

`bag` and `slot` are the same pair `pickup_container_item` takes, from `inventory_helper`, and they carry the same classic vs retail shift difference described there.

---

### `core.auction_house.post_item`

Syntax

```lua
core.auction_house.post_item(bag: integer, slot: integer, duration: integer, quantity: integer, bid: integer|nil, buyout: integer) -> boolean
```

**Parameters**

- `bag` : `integer` - The bag index containing the item.
- `slot` : `integer` - The slot index within the bag.
- `duration` : `integer` - The auction duration (1 = 12h, 2 = 24h, 3 = 48h).
- `quantity` : `integer` - The number of items to post (1 for gear).
- `bid` : `integer | nil` - The starting bid in copper. `nil` or `0` for a buyout-only auction. Must be lower than `buyout` .
- `buyout` : `integer` - The buyout price in copper.

**Returns**

- `boolean` - `true` when the game wants a confirmation (see below). `false` is a normal post.

Description

Posts a non-commodity (equipment, unique) item to the auction house with a bid and buyout price.

The return value is the game's "needs confirmation" flag, **not** "posted". `false` means the post went through with no confirmation needed. `true` means the game wants a confirmation (it also fires `AUCTION_HOUSE_POST_WARNING`) and nothing is listed until you call `confirm_post_item` with the same arguments. Watch `AUCTION_HOUSE_AUCTION_CREATED` for success and `AUCTION_HOUSE_POST_ERROR` for a rejected post.

> [!WARNING]
> The game refuses an auction whose buyout is equal to or lower than its bid, so `bid == buyout` lists nothing. For a buyout-only auction pass `nil` or `0` as `bid`. Since the core update of 2026-10-10 a price of `0` is sent to the game as "no price", the same way the game's own sell window does it; older cores sent `0` and required the `bid` argument.

> [!WARNING]
> On the other Classic versions this posts **nothing** and still returns `true`. Use `pickup_container_item`, `click_auction_sell_button` and `do_post_auction` there. That old flow does not work on Forever, which has no legacy sell slot.

```lua
-- Buyout-only gear post, 24 hours
local needs_confirm = core.auction_house.post_item(bag, slot, 2, 1, nil, 50000)
if needs_confirm then
    core.auction_house.confirm_post_item(bag, slot, 2, 1, nil, 50000)
end
```

`bag` and `slot` are the same pair `pickup_container_item` takes, from `inventory_helper`, and they carry the same classic vs retail shift difference described there.

---

### `core.auction_house.confirm_post_commodity`

Syntax

```lua
core.auction_house.confirm_post_commodity(bag: integer, slot: integer, duration: integer, quantity: integer, unit_price: integer) -> nil
```

**Parameters**

Same as `post_commodity`. Pass the exact arguments you posted with.

Description

Confirms a commodity post that `post_commodity` answered `true` for (the `AUCTION_HOUSE_POST_WARNING` case). Retail and Forever only; it does nothing on the other Classic versions, which have no confirmation step. Added in the core update of 2026-10-10; on older cores it does not exist.

---

### `core.auction_house.confirm_post_item`

Syntax

```lua
core.auction_house.confirm_post_item(bag: integer, slot: integer, duration: integer, quantity: integer, bid: integer|nil, buyout: integer) -> nil
```

**Parameters**

Same as `post_item`. Pass the exact arguments you posted with.

Description

Confirms an item post that `post_item` answered `true` for (the `AUCTION_HOUSE_POST_WARNING` case). Retail and Forever only; it does nothing on the other Classic versions, which have no confirmation step. Added in the core update of 2026-10-10; on older cores it does not exist.

---

### `core.auction_house.pickup_container_item`

Syntax

```lua
core.auction_house.pickup_container_item(bag: integer, slot: integer) -> nil
```

**Parameters**

- `bag` : `integer` - The bag id. `0` is the backpack, `1` to `4` are the equipped bags.
- `slot` : `integer` - The slot within that bag, as `inventory_helper` reports it.

Description

Picks up an item from a container slot, placing it on the cursor for auction house operations.

Take the pair from `common/utility/inventory_helper.lua`, the same way you would for [`core.input.destroy_container_item`](/dev/api/input):

```lua
local inventory_helper = require("common/utility/inventory_helper")

for _, slot_data in ipairs(inventory_helper:get_character_bag_slots()) do
    core.auction_house.pickup_container_item(slot_data.bag_id, slot_data.bag_slot)
end
```

> [!WARNING]
> The classic builds spend a `-1` on this value before it reaches the client and the retail builds pass it through. That is deliberate, not an oversight. The classic path was provably wrong before it was fixed, because it called the two spellings of one client API with two different slots, and only one of those can be right. The retail path has no equivalent proof either way and ships working, so it was left alone rather than changed on a guess.
>
> If you are chasing an off-by-one in an auction plugin, this is the first thing to check, and `post_commodity` and `post_item` below carry the same split.

---

### `core.auction_house.click_auction_sell_button`

Syntax

```lua
core.auction_house.click_auction_sell_button() -> nil
```

Description

Clicks the sell button in the auction house sell frame, placing the cursor item into the sell slot.

> [!WARNING]
> Does nothing on Retail and Forever, and is not verified on MoP Classic. The same applies to `do_post_auction` (returns `false`) and `get_auction_sell_item_info` (returns `""`).

---

### `core.auction_house.do_post_auction`

Syntax

```lua
core.auction_house.do_post_auction() -> nil
```

Description

Confirms and posts the auction that has been set up in the sell frame.

> [!WARNING]
> Returns `false` on Retail and Forever, and is not verified on MoP Classic. On Retail use `post_commodity` or `post_item`.

---

### `core.auction_house.get_auction_sell_item_info`

Syntax

```lua
core.auction_house.get_auction_sell_item_info() -> table
```

Returns

- `table` : A table containing information about the item currently in the sell slot.

Description

Returns details about the item currently placed in the auction house sell slot.

> [!WARNING]
> Returns `""` on Retail and Forever, and is not verified on MoP Classic.

---

### `core.auction_house.get_cursor_item_name`

Syntax

```lua
core.auction_house.get_cursor_item_name() -> string
```

Returns

- `string` : The name of the item currently on the cursor.

Description

Returns the name of the item currently held on the cursor, useful for verifying the correct item before posting.

---

## Purchasing Functions

### `core.auction_house.place_bid`

Syntax

```lua
core.auction_house.place_bid(auction_id: integer, bid_amount: integer) -> nil
```

**Parameters**

- `auction_id` : `integer` - The auction ID to bid on.
- `bid_amount` : `integer` - The bid amount in copper.

Description

Places a bid on a specific auction. The bid amount must meet or exceed the minimum bid.

> [!WARNING]
> `auction_id` is the row number from the current search results, not a real auction id.

---

### `core.auction_house.start_commodities_purchase`

Syntax

```lua
core.auction_house.start_commodities_purchase(item_id: integer, quantity: integer) -> nil
```

**Parameters**

- `item_id` : `integer` - The item ID to purchase.
- `quantity` : `integer` - The number of items to purchase.

Description

Initiates a commodity purchase. The server will calculate the total cost based on the cheapest available listings. Call `confirm_commodities_purchase` to finalize.

> [!WARNING]
> There is no quote step on the Classic versions: this call already buys, paying buyout for whole matching stacks from the current search until `quantity` is reached, so it can buy more than asked. `confirm_commodities_purchase` and `cancel_commodities_purchase` do nothing there.

---

### `core.auction_house.confirm_commodities_purchase`

Syntax

```lua
core.auction_house.confirm_commodities_purchase() -> nil
```

Description

Confirms a commodity purchase that was initiated with `start_commodities_purchase`.

---

### `core.auction_house.cancel_commodities_purchase`

Syntax

```lua
core.auction_house.cancel_commodities_purchase() -> nil
```

Description

Cancels a pending commodity purchase.

**Example Usage**

```lua
-- Purchase 200 of an herb (item ID 168586)
core.auction_house.start_commodities_purchase(168586, 200)

-- After verifying the price is acceptable
core.auction_house.confirm_commodities_purchase()

-- Or cancel if the price is too high
-- core.auction_house.cancel_commodities_purchase()
```

---

## Management Functions

### `core.auction_house.cancel_auction`

Syntax

```lua
core.auction_house.cancel_auction(auction_id: integer) -> nil
```

**Parameters**

- `auction_id` : `integer` - The auction ID to cancel.

Description

Cancels an owned auction. The item will be returned via mail.

> [!WARNING]
> `owned_auction_id` is the row number in your own auctions list, not a real auction id.

---

### `core.auction_house.can_cancel_auction`

Syntax

```lua
core.auction_house.can_cancel_auction(auction_id: integer) -> boolean
```

**Parameters**

- `auction_id` : `integer` - The auction ID to check.

Returns

- `boolean` : `true` if the auction can be cancelled.

Description

Checks whether a specific owned auction can be cancelled. An auction may not be cancellable if it has a pending bid or is in a cooldown state.

> [!WARNING]
> Always `true` on the Classic versions.

---

### `core.auction_house.calculate_commodity_deposit`

Syntax

```lua
core.auction_house.calculate_commodity_deposit(item_id: integer, duration: integer, quantity: integer) -> integer
```

**Parameters**

- `item_id` : `integer` - The item ID.
- `duration` : `integer` - The auction duration (1 = 12h, 2 = 24h, 3 = 48h).
- `quantity` : `integer` - The quantity to post.

Returns

- `integer` : The deposit cost in copper.

Description

Calculates the deposit cost for posting a commodity auction. The deposit is refunded when the item sells.

> [!WARNING]
> Always `0` on the Classic versions.

---

### `core.auction_house.get_cancel_cost`

Syntax

```lua
core.auction_house.get_cancel_cost(auction_id: integer) -> integer
```

**Parameters**

- `auction_id` : `integer` - The auction ID.

Returns

- `integer` : The cancellation cost in copper.

Description

Returns the cost in copper to cancel a specific auction.

> [!WARNING]
> Always `0` on the Classic versions.

---

## State Functions

### `core.auction_house.is_throttled_message_system_ready`

Syntax

```lua
core.auction_house.is_throttled_message_system_ready() -> boolean
```

Returns

- `boolean` : `true` if the throttled message system is ready to accept new requests.

Description

Checks whether the auction house throttle system is ready. The auction house rate-limits requests, so check this before sending queries to avoid failed requests.

> [!NOTE]
> The Classic versions ask the old auction house. Retail and Forever ask the modern one (Forever since the core update of 2026-10-06; on older cores it was always `true` there).

---

### `core.auction_house.is_auction_house_shown`

Syntax

```lua
core.auction_house.is_auction_house_shown() -> boolean
```

Returns

- `boolean` : `true` if the auction house frame is currently open.

Description

Checks whether the auction house UI is currently displayed.

> [!WARNING]
> The Classic versions check the old auction house window, so this is `false` on MoP Classic whenever the game opened the modern auction house instead. Retail and Forever check the modern window (Forever since the core update of 2026-10-06; it was always `false` there before).

---

### `core.auction_house.close_auction_house`

Syntax

```lua
core.auction_house.close_auction_house() -> nil
```

Description

Closes the auction house frame.

---

### `core.auction_house.get_quote_duration_remaining`

Syntax

```lua
core.auction_house.get_quote_duration_remaining() -> integer
```

Returns

- `integer` : The remaining time in seconds for the current price quote.

Description

Returns how many seconds remain on the current commodity price quote. Price quotes expire after a short window, requiring a new purchase initiation.

> [!WARNING]
> Always `0` on the Classic versions, which have no price quotes.

---

### `core.auction_house.get_item_commodity_status`

Syntax

```lua
core.auction_house.get_item_commodity_status(item_id: integer) -> integer
```

**Parameters**

- `item_id` : `integer` - The item ID to check.

Returns

- `integer` : The commodity status of the item.

Description

Returns whether an item is classified as a commodity (stackable, fungible) or a unique item on the auction house. This determines which posting and purchasing functions to use.

> [!WARNING]
> Always `0` on the Classic versions, which have no commodities.

---

## Item Info Functions

### `core.auction_house.get_item_info`

Syntax

```lua
core.auction_house.get_item_info(item_id: integer) -> table
```

**Parameters**

- `item_id` : `integer` - The item ID.

Returns

- `table` : A table with the following fields:

| Field | Type | Description |
| --- | --- | --- |
| `name` | `string` | The item name. |
| `item_link` | `string` | The item link string. |
| `quality` | `integer` | The item quality. |
| `item_level` | `integer` | The item level. |
| `min_level` | `integer` | The minimum required player level. |
| `item_type` | `string` | The item type category. |
| `item_sub_type` | `string` | The item sub-type category. |
| `stack_count` | `integer` | The maximum stack count. |
| `equip_loc` | `string` | The equip location slot. |
| `texture` | `integer` | The texture/icon ID. |
| `sell_price` | `integer` | The vendor sell price in copper. |
| `bind_type` | `integer` | The bind type: `0` None, `1` BoP, `2` BoE, `3` BoU. |

Description

Returns information about an item relevant to auction house operations.

> [!WARNING]
> On the Classic versions this and `get_item_icon_name` go through the game's compatibility layer for old item functions, so they are empty while the game setting `loadDeprecationFallbacks` is off. Retail and Forever ask the game directly (Forever since the core update of 2026-10-06). [`core.quests.get_item_info`](/dev/api/quests) has no such limit.

---

### `core.auction_house.get_item_icon_name`

Syntax

```lua
core.auction_house.get_item_icon_name(item_id: integer) -> string
```

**Parameters**

- `item_id` : `integer` - The item ID.

Returns

- `string` : The icon texture name for the item.

Description

Returns the icon texture name associated with an item, useful for displaying item icons in custom UI elements.

> [!NOTE]
> Retail and Forever ask the game directly. Since core 2.135 the Classic versions do too, without Blizzard's "deprecation fallbacks" setting. TBC 2.5.6 answers the icon's file id as a string (for example `"135610"`), not a name: compare it with [`core.game_ui.get_file_id_from_path`](/dev/api/game-ui#coregame_uiget_file_id_from_path).

---

### `core.auction_house.get_item_tooltip`

Syntax

```lua
core.auction_house.get_item_tooltip(item_id: integer) -> table
```

**Parameters**

- `item_id` : `integer` - The item ID.

Returns

- `table` : An array of tooltip lines. Each line has the following fields:

| Field | Type | Description |
| --- | --- | --- |
| `left` | `string` | The left-side text of the tooltip line. |
| `right` | `string` | The right-side text of the tooltip line. |
| `r` | `number` | The red color component, `0` to `1`. |
| `g` | `number` | The green color component, `0` to `1`. |
| `b` | `number` | The blue color component, `0` to `1`. |

Description

Returns the tooltip information for an item, including all text lines that would appear in the in-game tooltip.

> [!WARNING]
> Always returns an empty table on the Classic versions.

> [!NOTE]
> The color components are `0`-to-`1` floats, while [color](/dev/api/color) takes `0`-to-`255` values. Multiply by 255 before building a color:
>
> ```lua
> for _, line in ipairs(core.auction_house.get_item_tooltip(item_id)) do
>     local col = color.new(line.r * 255, line.g * 255, line.b * 255, 255)
>     window:add_text_on_dynamic_pos(col, line.left)
> end
> ```

---

## Complete Examples

### Example: Auction House Price Scanner

```lua
local function scan_commodity_prices(item_id)
    if not core.auction_house.is_auction_house_shown() then
        core.log("Auction house is not open")
        return
    end

    if not core.auction_house.is_throttled_message_system_ready() then
        core.log("Auction house throttled, try again later")
        return
    end

    core.auction_house.send_search_query()

    -- After results arrive
    local num_results = core.auction_house.get_num_commodity_search_results()
    if num_results == 0 then
        core.log("No listings found")
        return
    end

    local cheapest = core.auction_house.get_commodity_search_result_info(1)
    core.log(string.format("Cheapest listing: %s copper/unit", tostring(cheapest)))
end
```

### Example: Cancel Undercut Auctions

```lua
local function cancel_all_owned_auctions()
    core.auction_house.query_owned_auctions()

    local num = core.auction_house.get_num_owned_auctions()
    local cancelled = 0

    for i = 1, num do
        local info = core.auction_house.get_owned_auction_info(i)
        if core.auction_house.can_cancel_auction(info.auction_id) then
            local cost = core.auction_house.get_cancel_cost(info.auction_id)
            local gold = math.floor(cost / 10000)
            core.log(string.format("Cancelling auction %d (cancel cost: %dg)", info.auction_id, gold))
            core.auction_house.cancel_auction(info.auction_id)
            cancelled = cancelled + 1
        end
    end

    core.log(string.format("Cancelled %d/%d auctions", cancelled, num))
end
```

### Example: Post Commodity Items

```lua
local function post_commodity(bag, slot, quantity, unit_price_copper)
    if not core.auction_house.is_auction_house_shown() then
        core.log("Open the auction house first")
        return
    end

    -- Calculate deposit for a 24-hour auction
    local deposit = core.auction_house.calculate_commodity_deposit(0, 2, quantity)
    local deposit_gold = math.floor(deposit / 10000)
    core.log(string.format("Deposit cost: %dg", deposit_gold))

    -- Post the commodity (duration 2 = 24 hours); true means the game wants a confirmation
    if core.auction_house.post_commodity(bag, slot, 2, quantity, unit_price_copper) then
        core.auction_house.confirm_post_commodity(bag, slot, 2, quantity, unit_price_copper)
    end
    core.log(string.format("Posted %d items at %d copper each", quantity, unit_price_copper))
end
```