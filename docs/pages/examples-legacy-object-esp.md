# Object ESP Example

> Source: <https://docs.project-sylvanas.net/examples/legacy/object-esp>

This example demonstrates how to create an ESP (Extra Sensory Perception) system for game objects using the Project Sylvanas API. We'll build a plugin that tracks and displays Ancient Mana objects for Legion Remix, but the concepts apply to any object type.

![Object ESP Example](/assets/images/object-esp-63a00c9501e9a8278292c2f59c1be665.png)

*The plugin displays the names of Ancient Mana objects (Shards, Chunks, and Crystals) in the game world, making them easier to locate.*

## What You'll Learn

- How to validate the local player before plugin initialization
- Best practices for defining constants instead of using magic numbers
- Efficient object filtering using lookup tables
- Performance optimization through caching
- Proper iteration techniques for large datasets
- Drawing text on objects
- Using labels for loop control flow

## Plugin Structure

### header.lua

The header file initializes the plugin and validates the game state:

```lua
local plugin = {}

plugin.name = "Object ESP"
plugin.version = "1.01"
plugin.author = "Voltz"
plugin.load = true

local local_player = core.object_manager:get_local_player()

if not local_player or not local_player:is_valid() then
    plugin.load = false
    return plugin
end

return plugin
```

> [!TIP]
> Always validate the local player in your header file. Setting `plugin.load = false` prevents the plugin from loading when conditions aren't met, avoiding errors during loading screens or invalid game states.

### main.lua

The main file contains our ESP logic:

```lua
--[[
    This plugin walks you through line by line how we can create object ESP with the Project Sylvanas API
    In this example we will be creating ESP for Ancient Mana for Legion Remix,
    however, you can add whatever object IDs you wish in the table below.

    What you will learn:
        - Best practices such as nilness checks defining constants instead of using magic numbers or other static values
        - Why you should prefer traditional for loop over ipairs or pairs when working with large tables
        - How to draw basic text ESP on an object's position
        - How to leverage caching to improve performance
        - How to properly loop through the object list
        - How to use use labels in order to continue in loops to the next iteration

    Author: Voltz
]]

local object_ids = --Define Object IDs we want to track and draw
{
    --We set the object ID as the key and value to true so we do not need to iterate over the table
    --Instead we can directly check if we want to draw the object by using the object ID as the key
    --Examples:
    --object_ids[252408] returns true -> we should cache the object for drawing
    --object_ids[123456] returns false -> we should not cache the object for drawing
    [252408] = true, --Ancient Mana Shard (gives 10 ancient mana)
    [252772] = true, --Ancient Mana Chunk (gives 20 ancient mana)
    [252774] = true, --Ancient Mana Crystal (gives 50 - 100 ancient mana)
}

local color = require("common/color") --Import color module

--Define our drawing constants
local TEXT_COLOR = color.white(200) --Our text color
local TEXT_SIZE = 12                --Our text font size
local TEXT_CENTERED = true          --Should our text be centered?
local TEXT_FONT = 10                --Our font ID
local TEXT_Z_OFFSET = -0.25         --How much to offset the Z position (up and down) by when rendering the object name

--Define our caching contants and variables
local CACHE_UPDATE_RATE_MS = 500    --How frequently the cache should be updated in miliseconds
local last_cache_update_ms = 0      --The last time the cache was updated in miliseconds

---@type game_object[]
local objects_to_draw = {} --A list of relevant objects to draw

--Handle rendering our objects
core.register_on_render_callback(function()
    --Loop through object cache and draw each object, we use a traditional for loop instead of ipairs or pairs to we iterate over our objects efficiently without the overhead of ipairs (slower) or pairs (slowest)
    for i = 1, #objects_to_draw do
        local object = objects_to_draw[i] --Get our object from the cache by its index

        --Make sure the object is valid if not continue to the next object
        if not object or not object.is_valid or not object:is_valid() then
            --Jumps the script to the continue label at the end of the loop to go to the next object
            goto continue
        end

        local name = object:get_name()    --Get the name of the object
        local pos = object:get_position() --Get the position of the object
        local scale = object:get_scale()  --Get the scale of the object

        --Offset the Z position (up and down) downards by the z offset scaled by the object's scale so it is positioned correctly for any object size
        pos.z = pos.z + TEXT_Z_OFFSET * scale

        --Draw the name of the object at it's position
        core.graphics.text_3d(name, pos, TEXT_SIZE, TEXT_COLOR, TEXT_CENTERED, TEXT_FONT)

        --Defines our label where we want continue to be located in our code
        ::continue::
    end
end)

--Update our object cache so we do not iterate over the entire list of objects every game tick and impact our FPS negatively
--NOTE: When using unit manager or izi to access enemies we do not need to do this since they return from cached lists and it is already handled for us
--This is only to teach you concept of caching and why its important
--Alteneratively we can just use the unit_manager:get_cache_object_list which handles caching for us
core.register_on_update_callback(function()
    local current_time_ms = core.game_time()                                 --Get the current game time
    local time_since_last_update_ms = current_time_ms - last_cache_update_ms --Calculate the time since the last update

    if time_since_last_update_ms > CACHE_UPDATE_RATE_MS then                 --Check to see if it's time to update the cache
        local objects = core.object_manager:get_all_objects()                --Get all the game objects

        objects_to_draw = {}                                                 --Reset our object cache

        for i = 1, #objects do                                               --Loop through the objects so we can find the ones we want to draw
            local object = objects[i]                                        --Get the object by its index
            local id = object:get_npc_id()                                   --Get the object's ID

            if object_ids[id] then                                           --Check if the object's ID is in our list of IDs we want to draw
                table.insert(objects_to_draw, object)                        --Insert the object into our cache
            end
        end

        last_cache_update_ms = current_time_ms --Update the last cache update time so we know when to update it again
    end
end)
```

## Code Breakdown

### 1. Object ID Lookup Table

```lua
local object_ids = {
    [252408] = true, --Ancient Mana Shard
    [252772] = true, --Ancient Mana Chunk
    [252774] = true, --Ancient Mana Crystal
}
```

Using a lookup table instead of an array allows O(1) constant-time lookups instead of O(n) linear searches. When checking if an object ID should be tracked, `object_ids[id]` is much faster than iterating through an array.

### 2. Constants for Drawing Configuration

```lua
local TEXT_COLOR = color.white(200)
local TEXT_SIZE = 12
local TEXT_CENTERED = true
local TEXT_FONT = 10
local TEXT_Z_OFFSET = -0.25
```

Defining constants at the top makes the code maintainable and avoids "magic numbers" scattered throughout your code. This follows the best practice of separating configuration from logic.

### 3. Caching System

The caching system updates at a fixed interval (500ms by default) instead of every game tick:

```lua
local CACHE_UPDATE_RATE_MS = 500
local last_cache_update_ms = 0
local objects_to_draw = {}
```

This dramatically improves performance by reducing how often we query all game objects and filter them.

**Why Caching Matters:**

- In a render callback at 60 FPS, without caching, you'd query all objects 60 times per second
- With 500ms caching, you only query 2 times per second
- This is a **30x performance improvement** while objects rarely change that quickly

> [!NOTE]
> This example manually implements caching to teach you the concept. In practice, `unit_manager` methods like `get_cache_object_list()` handle this automatically. Understanding manual caching helps you appreciate what the helper libraries do for you and enables you to implement custom caching when needed for special cases.

### 4. Render Callback

```lua
core.register_on_render_callback(function()
    for i = 1, #objects_to_draw do
        local object = objects_to_draw[i]

        if not object or not object.is_valid or not object:is_valid() then
            goto continue
        end

        local name = object:get_name()
        local pos = object:get_position()
        local scale = object:get_scale()

        pos.z = pos.z + TEXT_Z_OFFSET * scale

        core.graphics.text_3d(name, pos, TEXT_SIZE, TEXT_COLOR, TEXT_CENTERED, TEXT_FONT)

        ::continue::
    end
end)
```

**Key Points:**

- Uses traditional `for i = 1, #table` loop for maximum performance (see [Object Manager](/dev/api/object-manager) )
- Validates objects with `is_valid()` before accessing properties (see [Game Object Functions](/dev/api/game-object#is_valid---boolean) )
- Uses `goto continue` label to skip invalid objects efficiently
- Adjusts Z position based on object scale for proper text placement
- Calls [`core.graphics.text_3d()`](/dev/api/graphics#render-3d-text-) to draw the ESP text

### 5. Cache Update Logic

```lua
core.register_on_update_callback(function()
    local current_time_ms = core.game_time()
    local time_since_last_update_ms = current_time_ms - last_cache_update_ms

    if time_since_last_update_ms > CACHE_UPDATE_RATE_MS then
        local objects = core.object_manager:get_all_objects()
        objects_to_draw = {}

        for i = 1, #objects do
            local object = objects[i]
            local id = object:get_npc_id()

            if object_ids[id] then
                table.insert(objects_to_draw, object)
            end
        end

        last_cache_update_ms = current_time_ms
    end
end)
```

**Cache Update Flow:**

1. Get current game time using [`core.game_time()`](/dev/api/core#coregame_time)
2. Calculate time elapsed since last update
3. Only update if enough time has passed
4. Fetch all objects with [`core.object_manager:get_all_objects()`](/dev/api/object-manager#all-objects)
5. Filter objects by ID using our lookup table
6. Store filtered objects in cache
7. Update the last update timestamp

## Performance Optimizations

### Traditional For Loops vs ipairs/pairs

```lua
-- Fast (recommended)
for i = 1, #objects do
    local object = objects[i]
end

-- Slower
for i, object in ipairs(objects) do
end

-- Slowest
for i, object in pairs(objects) do
end
```

Traditional numeric for loops are the fastest iteration method in Lua. Use them for performance-critical code.

### Lookup Tables vs Arrays

```lua
-- Fast: O(1) lookup
if object_ids[id] then
    -- found
end

-- Slow: O(n) lookup
for i = 1, #object_ids_array do
    if object_ids_array[i] == id then
        -- found
    end
end
```

### Loop Control with Labels

```lua
for i = 1, #objects do
    if not valid_check then
        goto continue  -- Skip to next iteration
    end

    -- Process object

    ::continue::  -- Label definition
end
```

Labels provide an efficient way to skip iterations without nested if statements.

## Customization

### Adding More Object Types

Simply add more object IDs to the lookup table:

```lua
local object_ids = {
    [252408] = true, --Ancient Mana Shard
    [252772] = true, --Ancient Mana Chunk
    [252774] = true, --Ancient Mana Crystal
    [123456] = true, --Your custom object
    [789012] = true, --Another custom object
}
```

### Changing Appearance

Modify the constants at the top:

```lua
local TEXT_COLOR = color.cyan(255)  -- Change color
local TEXT_SIZE = 16                -- Larger text
local TEXT_Z_OFFSET = 1.0           -- Higher position
```

See the [Color API](/dev/api/color) for available colors.

### Adjusting Cache Rate

For more frequent cache updates, reduce the cache update interval:

```lua
local CACHE_UPDATE_RATE_MS = 250  -- Update 4 times per second
```

For better performance and less frequent cache updates, increase the cache update interval:

```lua
local CACHE_UPDATE_RATE_MS = 1000  -- Update once per second
```

## Related Documentation

- [Object Manager API](/dev/api/object-manager) - Learn about object retrieval
- [Game Object Functions](/dev/api/game-object) - Available object methods
- [Graphics API](/dev/api/graphics) - Drawing functions
- [Color API](/dev/api/color) - Color creation
- [Core API](/dev/api/core) - Callbacks and game time

## Tips

> [!TIP]
> If you're tracking many objects, consider increasing `CACHE_UPDATE_RATE_MS` to reduce CPU usage. Most objects don't move or spawn frequently enough to need sub-second updates.

> [!WARNING]
> Always check `object:is_valid()` before accessing object properties. Objects can become invalid when they're removed from the game world (despawned, looted, etc.).

> [!INFO]
> In practice, you should use `unit_manager:get_cache_object_list()` which automatically handles caching for you. This example implements manual caching to teach you how caching works under the hood and demonstrate the performance principles that the helper libraries use internally.

## Conclusion

This Object ESP example demonstrates essential techniques for working with game objects efficiently in the Project Sylvanas API. By implementing manual caching and optimization patterns, you've learned the fundamental principles that power the higher-level helper libraries.

**Key Takeaways:**

- **Lookup Tables** - Use key-value tables for O(1) constant-time lookups instead of O(n) linear searches
- **Caching Strategy** - Update object lists at fixed intervals (500ms) instead of every frame for 30x+ performance gains
- **Traditional For Loops** - Use `for i = 1, #table` instead of `ipairs()` or `pairs()` for maximum performance when iterating over large tables
- **Constants** - Define configuration values at the top to avoid magic numbers and improve maintainability
- **Label Control Flow** - Use `goto continue` labels for clean loop control without nested if statements
- **Validation** - Always check `object:is_valid()` before accessing properties to prevent errors

---

I hope you enjoyed this example and found it helpful! Feel free to adapt and expand upon this code for your own projects.

— Voltz