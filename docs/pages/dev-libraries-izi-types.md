# IZI - Types

> Source: <https://docs.project-sylvanas.net/dev/libraries/izi/types>

## Overview

This page documents all the type definitions used throughout the IZI SDK. Understanding these types is essential for effectively using the SDK's spell casting, item usage, and utility functions.

---

## Cast Options

### `cast_opts`

Base options for spell casting validation. These options control which checks are performed before casting.

Type Definition

```lua
{
    skip_charges?: boolean,      -- Skip charge availability check
    skip_learned?: boolean,      -- Skip "spell learned" check
    skip_usable?: boolean,       -- Skip resource/usability check
    skip_back?: boolean,         -- Skip backstab requirement check
    skip_moving?: boolean,       -- Skip "must be stationary" check
    skip_mount?: boolean,        -- Skip mounted state check
    skip_casting?: boolean,      -- Skip "currently casting" check
    skip_channeling?: boolean,   -- Skip "currently channeling" check
    skip_immune_check?: boolean, -- Skip target immunity validation entirely
    damage_type?: integer        -- Override damage type for immunity check
}
```

Field Details

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `skip_charges` | `boolean` | `false` | When true, skips checking if the spell has charges available |
| `skip_learned` | `boolean` | `false` | When true, skips checking if the spell is learned |
| `skip_usable` | `boolean` | `false` | When true, skips resource cost and usability checks |
| `skip_back` | `boolean` | `false` | When true, skips "must be behind target" requirement (e.g., Backstab) |
| `skip_moving` | `boolean` | `false` | When true, allows casting spells that normally require standing still |
| `skip_mount` | `boolean` | `false` | When true, allows casting while mounted |
| `skip_casting` | `boolean` | `false` | When true, allows queueing casts during an existing cast |
| `skip_channeling` | `boolean` | `false` | When true, allows casting during a channel |
| `skip_immune_check` | `boolean` | `false` | When true, bypasses target immunity validation entirely |
| `damage_type` | `integer` | `nil` | Override damage type for immunity check (use [`enums.damage_type_flags`](/dev/api/enums#damage_type_flags)) |

Immunity Check Behavior

The immunity check works as follows:

- **Always blocks** if target is immune to ALL damage (Divine Shield, Ice Block)
- **Auto-detects damage type** from spell school for obvious cases:
  - Pure Physical school → checks physical immunity
  - Pure magical (Fire/Nature/Frost/Shadow/Arcane) → checks magic immunity
  - Holy or mixed schools → no auto-detection (ambiguous)
- **Developer can override** with `damage_type` field
- **Use `skip_immune_check = true`** to bypass entirely

**Example Usage**

```lua
local fireball = izi.spell(133)

-- Cast with default checks
fireball:cast_safe(target)

-- Cast while moving (for instant spells or with special buffs)
fireball:cast_safe(target, "Fireball", { skip_moving = true })

-- Force physical damage type check
fireball:cast_safe(target, "Fireball", { damage_type = izi.enums.damage_type_flags.PHYSICAL })
```

---

### `unit_cast_opts`

Extended options for unit-targeted spell casts. Inherits all fields from `cast_opts`.

Type Definition

```lua
{
    -- Inherited from cast_opts
    skip_charges?: boolean,
    skip_learned?: boolean,
    skip_usable?: boolean,
    skip_back?: boolean,
    skip_moving?: boolean,
    skip_mount?: boolean,
    skip_casting?: boolean,
    skip_channeling?: boolean,
    skip_immune_check?: boolean,
    damage_type?: integer,
    
    -- Unit-specific options
    skip_facing?: boolean,        -- Skip facing requirement check
    skip_range?: boolean,         -- Skip range check
    skip_gcd?: boolean,           -- Skip GCD check
    check_los?: boolean,          -- Line of sight gate (default true)
    cache_time_override?: number  -- Override prediction cache time
}
```

Additional Fields

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `skip_facing` | `boolean` | `false` | When true, skips checking if you're facing the target |
| `skip_range` | `boolean` | `false` | When true, skips checking if target is in range |
| `skip_gcd` | `boolean` | `false` | When true, allows casting during global cooldown |
| `check_los` | `boolean` | `true` | Line of sight gate. Set it to `false` to cast at a target the trace refuses; see below |
| `cache_time_override` | `number` | `0.15` | Override prediction cache time in seconds (default 150ms) |

> [!INFO]
> Line of sight **is** checked unless you explicitly pass `check_los = false`. Only the literal `false` disables it: omitting the field, passing `nil`, or passing `true` all keep the check.
>
> It applies to unit casts and position casts alike, and turns off both traces, `spell_helper`'s and izi's own. Use it for a target the trace cannot reach honestly, such as an NPC hovering above the floor where the line clips geometry the game itself does not count.
>
> It is **not** a range or facing bypass and it will not make an impossible cast land. The game still refuses a cast it considers out of sight; you are only stopping the SDK from filtering the attempt out before it is queued.
>
> ```lua
> -- Temple of Sethraliss, healing the NPC hovering above the floor
> heal:cast_safe(hovering_npc, "Sethraliss heal", { check_los = false })
> ```

**Example Usage**

```lua
local flash_heal = izi.spell(2061)

-- Cast with GCD skip for emergency heals
flash_heal:cast_safe(target, "Emergency Heal", {
    skip_gcd = true,
    skip_facing = true  -- Heals don't require facing
})
```

---

### `pos_cast_opts`

Extended options for position-targeted (ground) spell casts. Inherits all fields from `unit_cast_opts`.

Type Definition

```lua
{
    -- Inherited from unit_cast_opts
    skip_charges?: boolean,
    skip_learned?: boolean,
    skip_usable?: boolean,
    skip_back?: boolean,
    skip_moving?: boolean,
    skip_mount?: boolean,
    skip_casting?: boolean,
    skip_channeling?: boolean,
    skip_immune_check?: boolean,
    damage_type?: integer,
    skip_facing?: boolean,
    skip_range?: boolean,
    skip_gcd?: boolean,
    check_los?: boolean,
    cache_time_override?: number,
    
    -- Position-specific options
    use_prediction?: boolean,        -- Use position prediction (default true)
    prediction_type?: string|number, -- "AUTO"|"ACCURACY"|"MOST_HITS"|number
    geometry?: string|number,        -- "CIRCLE"|"LINE"|number
    aoe_radius?: number,             -- Override AoE radius
    min_hits?: integer,              -- Minimum targets required (default 1)
    source_position?: vec3,          -- Custom origin for prediction
    cast_time?: number,              -- Override cast time in milliseconds
    projectile_speed?: number,       -- Override projectile speed; 0 = instant
    is_heal?: boolean,               -- Target allies instead of enemies
    use_intersection?: boolean,      -- Use intersection position
    max_range?: number               -- Maximum cast range override
}
```

Position-Specific Fields

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `use_prediction` | `boolean` | `true` | When true, uses movement prediction for optimal positioning |
| `prediction_type` | `string\|number` | `"AUTO"` | Prediction algorithm: `"AUTO"`, `"ACCURACY"`, `"MOST_HITS"`, or numeric |
| `geometry` | `string\|number` | `"CIRCLE"` | AoE shape: `"CIRCLE"`, `"LINE"`, or numeric |
| `aoe_radius` | `number` | `nil` | Override the spell's default AoE radius |
| `min_hits` | `integer` | `1` | Minimum number of targets required to cast |
| `source_position` | `vec3` | `nil` | Custom origin point for prediction calculations |
| `cast_time` | `number` | `nil` | Override cast time in milliseconds (skips SDK lookup) |
| `projectile_speed` | `number` | `nil` | Override projectile speed in game units/sec; 0 = instant |
| `is_heal` | `boolean` | `false` | When true, prediction targets allies instead of enemies |
| `use_intersection` | `boolean` | `false` | When true, uses intersection position for accuracy mode |
| `max_range` | `number` | `nil` | Override maximum cast range |

**Example Usage**

```lua
local blizzard = izi.spell(190356)

-- Cast with prediction for maximum hits
blizzard:cast_safe(target, "Blizzard", {
    use_prediction = true,
    prediction_type = "MOST_HITS",
    min_hits = 3,
    aoe_radius = 8
})

-- Cast healing rain on allies
local healing_rain = izi.spell(73920)
healing_rain:cast_safe(friendly_target, "Healing Rain", {
    is_heal = true,
    min_hits = 3
})
```

---

## Item Options

### `item_use_opts`

Options for item usage validation.

Type Definition

```lua
{
    skip_usable?: boolean,     -- Skip usability check
    skip_cooldown?: boolean,   -- Skip cooldown check
    skip_range?: boolean,      -- Skip range check
    skip_moving?: boolean,     -- Skip movement check
    skip_mount?: boolean,      -- Skip mounted check
    skip_casting?: boolean,    -- Skip casting check
    skip_channeling?: boolean, -- Skip channeling check
    skip_gcd?: boolean,        -- Skip GCD check
    check_los?: boolean        -- Line of sight gate (default true)
}
```

Field Details

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `skip_usable` | `boolean` | `false` | Skip checking if item is usable |
| `skip_cooldown` | `boolean` | `false` | Skip checking if item is on cooldown |
| `skip_range` | `boolean` | `false` | Skip checking if target is in range |
| `skip_moving` | `boolean` | `false` | Skip checking if you need to stand still |
| `skip_mount` | `boolean` | `false` | Skip checking if you're mounted |
| `skip_casting` | `boolean` | `false` | Skip checking if you're casting |
| `skip_channeling` | `boolean` | `false` | Skip checking if you're channeling |
| `skip_gcd` | `boolean` | `false` | Skip GCD check |
| `check_los` | `boolean` | `true` | Line of sight gate. Set it to `false` to skip the check |

**Example Usage**

```lua
local trinket = izi.item(178742)

-- Use trinket during GCD
trinket:use_self_safe("Trinket", {
    skip_gcd = true
})

-- Use healthstone even while casting
izi.use_best_health_potion_safe({
    skip_casting = true,
    skip_channeling = true
})
```

---

## Defensive Filters

### `defensive_filters`

Filters for controlling automatic defensive spell usage.

Type Definition

```lua
{
    block_time?: number,                           -- Seconds to block further defensives
    health_percentage_threshold_raw?: number,      -- Cast if current HP% <= this
    health_percentage_threshold_incoming?: number, -- Cast if predicted HP% <= this
    physical_damage_percentage_threshold?: number, -- Min physical damage % required
    magical_damage_percentage_threshold?: number   -- Min magical damage % required
}
```

Field Details

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `block_time` | `number` | `1.0` | Seconds to prevent additional defensives after cast |
| `health_percentage_threshold_raw` | `number` | `50` | Cast if current health % ≤ this value |
| `health_percentage_threshold_incoming` | `number` | `40` | Cast if forecasted health % ≤ this value |
| `physical_damage_percentage_threshold` | `number` | `0` | Minimum physical damage % to trigger (0 = ignore) |
| `magical_damage_percentage_threshold` | `number` | `0` | Minimum magical damage % to trigger (0 = ignore) |

**Example Usage**

```lua
local divine_shield = izi.spell(642)

local filters = {
    block_time = 8.0,                        -- Don't cast another defensive for 8s
    health_percentage_threshold_raw = 30,    -- Cast if HP <= 30%
    health_percentage_threshold_incoming = 20 -- Or if predicted HP <= 20%
}

divine_shield:cast_defensive(me, filters, "Emergency Bubble")
```

---

## Cast Metadata

### `izi_cast_meta`

Metadata returned from cast operations with details about the cast attempt.

Type Definition

```lua
{
    cast_position?: vec3,      -- Position for skillshots
    hit_time?: number,         -- Cast time + projectile travel time
    predicted?: boolean,       -- True if position came from prediction
    hits?: integer,            -- Predicted number of targets hit
    prediction_meta?: table,   -- Raw prediction data
    target?: game_object,      -- Target for targeted casts
    unit?: game_object,        -- Candidate unit for *_target_if helpers
    rank_index?: integer,      -- Index in ranked target list
    attempted?: integer,       -- Number of candidates attempted
    reason?: string,           -- Failure reason code
    err?: string               -- Lower-level error message
}
```

**Example Usage**

```lua
local fireball = izi.spell(133)
local success, meta = fireball:cast_safe(target, "Fireball")

if success then
    if meta.predicted then
        izi.printf("Cast at predicted position, expecting %.2fs travel", meta.hit_time)
    end
else
    izi.printf("Cast failed: %s", meta.reason or "unknown")
end
```

---

## Queue Types

### `queue_kind`

Union type for queue popup types.

Type Definition

```lua
"none" | "pve" | "pvp"
```

| Value | Description |
| --- | --- |
| `"none"` | No active queue |
| `"pve"` | PvE queue (dungeons, raids, etc.) |
| `"pvp"` | PvP queue (battlegrounds, arenas, etc.) |

---

### `queue_popup_info`

Comprehensive information about a queue popup.

Type Definition

```lua
{
    kind: queue_kind,         -- "none" | "pve" | "pvp"
    since_sec: number,        -- Time since popup appeared (seconds)
    since_ms: integer,        -- Time since popup appeared (milliseconds)
    age_sec: number,          -- Age of popup in seconds
    age_ms: integer,          -- Age of popup in milliseconds
    expire_sec: number|nil,   -- Seconds until expiration
    expire_ms: integer|nil,   -- Milliseconds until expiration
    pve: queue_pve_meta|nil,  -- PvE-specific data
    pvp: queue_pvp_meta|nil   -- PvP-specific data
}
```

---

### `queue_pve_meta`

PvE queue metadata.

```lua
{
    proposal: boolean  -- Whether this is a proposal (ready check)
}
```

---

### `queue_pvp_slot`

PvP queue slot information.

```lua
{
    idx: integer,           -- Queue slot index
    status: any,            -- Current status
    is_call: boolean|nil,   -- Is this a Mercenary call
    expires_at_ms: integer|nil  -- Expiration timestamp
}
```

---

### `queue_pvp_meta`

PvP queue metadata.

```lua
{
    slots: queue_pvp_slot[]  -- Array of queue slots
}
```

---

## Purge Types

### `PurgeEntry`

Information about a single purgeable buff.

```lua
{
    buff_id: integer,      -- Buff spell ID
    buff_name: string,     -- Buff display name
    priority: integer,     -- Purge priority (higher = more important)
    min_remaining: number  -- Minimum remaining duration in seconds
}
```

---

### `PurgeScanResult`

Result from scanning a target for purgeable buffs.

```lua
{
    is_purgeable: boolean,        -- Has purgeable buffs
    table: PurgeEntry[],          -- List of purge candidates
    current_remaining_ms: integer, -- Shortest remaining duration
    expire_time: number           -- Engine time when shortest expires
}
```

**Example Usage**

```lua
local result = target:is_purgable(250)

if result.is_purgeable then
    for _, entry in ipairs(result.table) do
        izi.printf("Can purge: %s (priority %d)", entry.buff_name, entry.priority)
    end
end
```

---

## Type Aliases

### Bitmask Aliases

These are integer types used for bitmask operations:

| Alias | Description |
| --- | --- |
| `CCFlagMask` | Bitmask of CC flags (see [`cc_flags`](/dev/api/enums#cc_flags)) |
| `DMGTypeMask` | Bitmask of damage type flags (see [`damage_type_flags`](/dev/api/enums#damage_type_flags)) |
| `SourceMask` | Bitmask of effect source filters |
| `Milliseconds` | Time value in milliseconds |

### Predicate Types

| Alias | Signature | Description |
| --- | --- | --- |
| `unit_predicate` | `fun(u: game_object): boolean` | Filter function for units |
| `target_filter` | `fun(u: game_object): number\|nil` | Scoring function for target selection |
| `adv_condition` | `boolean\|fun(u: game_object): boolean` | Advanced condition (static or dynamic) |

---

## Sort Mode

### `sort_mode`

Union type for target selection sorting.

```lua
"max" | "min"
```

| Value | Description |
| --- | --- |
| `"max"` | Select target with highest score |
| `"min"` | Select target with lowest score |

**Example Usage**

```lua
-- Get lowest health enemy (for execute)
local target = izi.pick_enemy(40, false, function(u)
    return u:get_health_percentage()
end, "min")

-- Get highest health enemy (for pressure)
local tank = izi.pick_enemy(40, false, function(u)
    return u:get_health_percentage()
end, "max")
```