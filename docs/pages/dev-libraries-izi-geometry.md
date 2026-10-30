# IZI - Geometry

> Source: <https://docs.project-sylvanas.net/dev/libraries/izi/geometry>

## Overview

The IZI Geometry system provides convenient constructors for vectors and shapes, making positional calculations and area-of-effect targeting straightforward. These functions serve as shortcuts to the underlying geometry modules while providing seamless integration with the IZI SDK.

**Key Features:**

- **Vector Constructors** - Create 2D and 3D vectors easily
- **Shape Definitions** - Define circles, rectangles, and cones
- **Type Checking** - Validate vector types at runtime
- **Full Module Access** - Access the complete geometry API when needed

---

## Vector Constructors

### `izi.vec2`

Syntax

```lua
-- Constructor
izi.vec2(x: number, y: number): vec2

-- Module access
izi.vec2.new(x: number, y: number): vec2
izi.vec2.distance(a: vec2, b: vec2): number
-- ... other vec2 module functions
```

**Parameters**

- `x: number` - The X coordinate
- `y: number` - The Y coordinate

Returns

- [`vec2`](/dev/api/vector-2) - A new 2D vector

Description

Creates a 2D vector. The `izi.vec2` function acts as both a constructor (when called) and provides access to the full [`vec2`](/dev/api/vector-2) module for additional operations.

**Example Usage**

```lua
local izi = require("common/izi_sdk")

-- Create a 2D position
local screen_pos = izi.vec2(100, 200)

-- Access X and Y
print(screen_pos.x, screen_pos.y)  -- 100, 200

-- Use module functions
local pos1 = izi.vec2(0, 0)
local pos2 = izi.vec2(3, 4)
local dist = izi.vec2.distance(pos1, pos2)  -- 5.0

-- Vector arithmetic
local offset = izi.vec2(10, 10)
local new_pos = izi.vec2(screen_pos.x + offset.x, screen_pos.y + offset.y)
```

---

### `izi.vec3`

Syntax

```lua
-- Constructor
izi.vec3(x: number, y: number, z: number): vec3

-- Module access
izi.vec3.new(x: number, y: number, z: number): vec3
izi.vec3.distance(a: vec3, b: vec3): number
-- ... other vec3 module functions
```

**Parameters**

- `x: number` - The X coordinate (East-West)
- `y: number` - The Y coordinate (North-South)
- `z: number` - The Z coordinate (Height)

Returns

- [`vec3`](/dev/api/vector-3) - A new 3D vector

Description

Creates a 3D world position vector. The `izi.vec3` function acts as both a constructor and provides access to the full [`vec3`](/dev/api/vector-3) module.

**Example Usage**

```lua
local izi = require("common/izi_sdk")

-- Create a world position
local world_pos = izi.vec3(1234.5, 5678.9, 90.0)

-- Get player position
local me = izi.me()
local my_pos = me:get_position()

-- Calculate offset position
local forward = izi.vec3(my_pos.x + 10, my_pos.y, my_pos.z)

-- Use module functions
local dist = izi.vec3.distance(my_pos, world_pos)
izi.printf("Distance to target: %.1f yards", dist)
```

---

## Shape Constructors

### `izi.circle`

Syntax

```lua
izi.circle(center: vec3, radius: number): circle
```

**Parameters**

- `center: vec3` - The center point of the circle
- `radius: number` - The radius of the circle in yards

Returns

- `circle` - A circle shape object

Description

Creates a circular area definition. Useful for AoE calculations, ground-targeted abilities, and area checks.

**Example Usage**

```lua
local izi = require("common/izi_sdk")

local me = izi.me()
local my_pos = me:get_position()

-- Define an AoE area around the player
local aoe_zone = izi.circle(my_pos, 8)

-- Check enemies in the circle
local target = izi.target()
if target then
    local target_pos = target:get_position()
    -- Use for AoE targeting calculations
end

-- Define a danger zone
local boss_pos = izi.vec3(100, 200, 50)
local danger_zone = izi.circle(boss_pos, 15)
```

---

### `izi.rectangle`

Syntax

```lua
izi.rectangle(min: vec3, max: vec3): rectangle
```

**Parameters**

- `min: vec3` - The minimum corner (bottom-left-back)
- `max: vec3` - The maximum corner (top-right-front)

Returns

- `rectangle` - A rectangular area definition

Description

Creates a rectangular/box area definition. Useful for defining zones, checking boundaries, or line-based AoE abilities.

**Example Usage**

```lua
local izi = require("common/izi_sdk")

-- Define a rectangular zone
local min_corner = izi.vec3(100, 200, 45)
local max_corner = izi.vec3(150, 250, 55)
local zone = izi.rectangle(min_corner, max_corner)

-- Define a line AoE (narrow rectangle)
local me = izi.me()
local my_pos = me:get_position()
local target = izi.target()

if target then
    local target_pos = target:get_position()
    -- Create a narrow rectangle from me to target
    local line_min = izi.vec3(
        math.min(my_pos.x, target_pos.x) - 2,
        math.min(my_pos.y, target_pos.y) - 2,
        math.min(my_pos.z, target_pos.z)
    )
    local line_max = izi.vec3(
        math.max(my_pos.x, target_pos.x) + 2,
        math.max(my_pos.y, target_pos.y) + 2,
        math.max(my_pos.z, target_pos.z)
    )
    local line_area = izi.rectangle(line_min, line_max)
end
```

---

### `izi.cone`

Syntax

```lua
izi.cone(origin: vec3, direction: vec3, angle: number, range: number): cone
```

**Parameters**

- `origin: vec3` - The apex/source point of the cone
- `direction: vec3` - The direction vector the cone faces
- `angle: number` - The half-angle of the cone in degrees
- `range: number` - The length/range of the cone

Returns

- `cone` - A cone shape object

Description

Creates a cone-shaped area definition. Perfect for abilities like Dragon's Breath, Cone of Cold, or Breath of Fire.

**Example Usage**

```lua
local izi = require("common/izi_sdk")

local me = izi.me()
local my_pos = me:get_position()
local facing = me:get_facing()

-- Create a cone in front of the player
-- facing is typically a radian angle, convert to direction vector
local dir_x = math.cos(facing)
local dir_y = math.sin(facing)
local direction = izi.vec3(dir_x, dir_y, 0)

-- 45 degree half-angle, 12 yard range
local breath_cone = izi.cone(my_pos, direction, 45, 12)

-- Count enemies in cone (conceptual - actual implementation varies)
local enemies_in_cone = 0
for _, enemy in ipairs(izi.enemies(15)) do
    -- Check if enemy is within the cone
    local enemy_pos = enemy:get_position()
    -- ... cone containment check
end
```

---

## Type Validation

### `izi.is_vec2`

Syntax

```lua
izi.is_vec2(v: any): boolean
```

**Parameters**

- `v: any` - The value to check

Returns

- `boolean` - True if the value is a vec2

Description

Checks if a value is a 2D vector. Useful for parameter validation or type-dependent logic.

**Example Usage**

```lua
local izi = require("common/izi_sdk")

local pos2d = izi.vec2(100, 200)
local pos3d = izi.vec3(100, 200, 50)

print(izi.is_vec2(pos2d))  -- true
print(izi.is_vec2(pos3d))  -- false
print(izi.is_vec2("test")) -- false
```

---

### `izi.is_vec3`

Syntax

```lua
izi.is_vec3(v: any): boolean
```

**Parameters**

- `v: any` - The value to check

Returns

- `boolean` - True if the value is a vec3

Description

Checks if a value is a 3D vector.

**Example Usage**

```lua
local izi = require("common/izi_sdk")

local pos = izi.vec3(100, 200, 50)
local screen = izi.vec2(400, 300)

print(izi.is_vec3(pos))     -- true
print(izi.is_vec3(screen))  -- false
```

---

### `izi.is_vector`

Syntax

```lua
izi.is_vector(v: any): boolean
```

**Parameters**

- `v: any` - The value to check

Returns

- `boolean` - True if the value is either a vec2 or vec3

Description

Checks if a value is any type of vector (2D or 3D).

**Example Usage**

```lua
local izi = require("common/izi_sdk")

local function process_position(pos)
    if not izi.is_vector(pos) then
        error("Expected a vector!")
    end
    
    if izi.is_vec3(pos) then
        -- Handle 3D position
    else
        -- Handle 2D position
    end
end
```

---

## Related APIs

The geometry constructors provide convenient access to the underlying modules:

- **vec2 Module** : See [Vector 2](/dev/api/vector-2) for the complete 2D vector API
- **vec3 Module** : See [Vector 3](/dev/api/vector-3) for the complete 3D vector API
- **Geometry Module** : See [Geometry](/dev/api/geometry) for advanced shape operations

---

## Complete Example

```lua
local izi = require("common/izi_sdk")

-- AoE targeting helper
local function find_best_aoe_position(spell_radius, enemies)
    local me = izi.me()
    local my_pos = me:get_position()
    
    local best_pos = nil
    local best_count = 0
    
    -- Check each enemy as a potential center
    for _, enemy in ipairs(enemies) do
        local enemy_pos = enemy:get_position()
        local aoe = izi.circle(enemy_pos, spell_radius)
        
        -- Count enemies that would be hit
        local count = 0
        for _, other in ipairs(enemies) do
            local other_pos = other:get_position()
            local dist = izi.vec3.distance(enemy_pos, other_pos)
            if dist <= spell_radius then
                count = count + 1
            end
        end
        
        if count > best_count then
            best_count = count
            best_pos = enemy_pos
        end
    end
    
    return best_pos, best_count
end

-- Cone ability targeting
local function count_targets_in_cone(origin, direction, half_angle, range, units)
    local count = 0
    local cos_threshold = math.cos(math.rad(half_angle))
    
    for _, unit in ipairs(units) do
        local unit_pos = unit:get_position()
        
        -- Vector from origin to unit
        local to_unit = izi.vec3(
            unit_pos.x - origin.x,
            unit_pos.y - origin.y,
            unit_pos.z - origin.z
        )
        
        -- Distance check
        local dist = math.sqrt(to_unit.x^2 + to_unit.y^2 + to_unit.z^2)
        if dist <= range then
            -- Normalize
            to_unit.x = to_unit.x / dist
            to_unit.y = to_unit.y / dist
            to_unit.z = to_unit.z / dist
            
            -- Dot product for angle check
            local dot = direction.x * to_unit.x + direction.y * to_unit.y + direction.z * to_unit.z
            if dot >= cos_threshold then
                count = count + 1
            end
        end
    end
    
    return count
end

-- Usage
local function rotation_aoe()
    local enemies = izi.enemies(15)
    if #enemies < 3 then return end
    
    -- Find best Blizzard position
    local best_pos, hit_count = find_best_aoe_position(8, enemies)
    
    if best_pos and hit_count >= 3 then
        local blizzard = izi.spell(190356)
        blizzard:cast_position(best_pos, "Blizzard", {
            min_hits = 3
        })
    end
    
    -- Check Cone of Cold
    local me = izi.me()
    local my_pos = me:get_position()
    local facing = me:get_facing()
    local direction = izi.vec3(math.cos(facing), math.sin(facing), 0)
    
    local cone_hits = count_targets_in_cone(my_pos, direction, 45, 12, enemies)
    if cone_hits >= 3 then
        local cone_of_cold = izi.spell(120)
        cone_of_cold:cast_safe()
    end
end
```