# IZI - Queue

> Source: <https://docs.project-sylvanas.net/dev/libraries/izi/queue>

## Overview

The IZI Queue system provides functions for detecting and interacting with dungeon finder, raid finder, and PvP queue popups. This enables automation of queue acceptance, custom queue tracking, and anti-AFK behaviors.

**Key Features:**

- **Popup Detection** - Detect when any queue pops (PvE or PvP)
- **Detailed Information** - Access timing, queue type, and expiration data
- **Accept/Decline Control** - Programmatically accept or decline queues
- **Custom Providers** - Hook in custom PvP queue tracking

> [!WARNING]
> The dungeon finder and battleground calls these functions use do nothing on Classic Era, Titan (China) and the private-server clients (Vanilla 1.14 / TBC 2.5.3). There a PvE popup is never detected, and a PvP accept or decline still returns `true` without doing anything.

---

## Functions

### `izi.queue_popup_info`

Syntax

```lua
izi.queue_popup_info(): boolean, queue_popup_info
```

Returns

- `has_popup: boolean` - Whether a queue popup is currently active
- `info:` [`queue_popup_info`](/dev/libraries/izi/types#queue_popup_info) - Detailed information about the popup

Description

Returns comprehensive information about the current queue popup, including its type, timing, and queue-specific metadata.

**Example Usage**

```lua
local izi = require("common/izi_sdk")

local has_popup, info = izi.queue_popup_info()

if has_popup then
    izi.printf("Queue type: %s", info.kind)
    izi.printf("Popup age: %.1f seconds", info.age_sec)
    
    if info.expire_sec then
        izi.printf("Expires in: %.1f seconds", info.expire_sec)
    end
    
    if info.kind == "pve" and info.pve then
        izi.printf("Is proposal: %s", info.pve.proposal and "yes" or "no")
    end
    
    if info.kind == "pvp" and info.pvp then
        izi.printf("PvP slots: %d", #info.pvp.slots)
    end
end
```

---

### `izi.queue_has_popup`

Syntax

```lua
izi.queue_has_popup(): boolean
```

Returns

- `boolean` - True if any queue popup is currently active

Description

Simple boolean check for whether a queue popup is present. Use this for quick conditional checks when you don't need the detailed information.

**Example Usage**

```lua
local izi = require("common/izi_sdk")

if izi.queue_has_popup() then
    izi.print("Queue is ready!")
end
```

---

### `izi.queue_accept`

Syntax

```lua
izi.queue_accept(kind?: queue_kind, idx?: integer): boolean
```

**Parameters**

- `kind?:` [`queue_kind`](/dev/libraries/izi/types#queue_kind) - Optional queue type filter ( `"pve"` or `"pvp"` ). If not specified, accepts any queue.
- `idx?: integer` - Optional queue slot index for multiple queues

Returns

- `boolean` - True if the queue was successfully accepted

Description

Accepts a queue popup. You can optionally filter by queue type and specify which queue slot to accept if multiple are available.

**Example Usage**

```lua
local izi = require("common/izi_sdk")

-- Accept any queue
if izi.queue_has_popup() then
    if izi.queue_accept() then
        izi.print("Queue accepted!")
    end
end

-- Accept only PvP queues
local has_popup, info = izi.queue_popup_info()
if has_popup and info.kind == "pvp" then
    izi.queue_accept("pvp")
end

-- Accept only PvE queues
if has_popup and info.kind == "pve" then
    izi.queue_accept("pve")
end
```

---

### `izi.queue_decline`

Syntax

```lua
izi.queue_decline(kind?: queue_kind, idx?: integer): boolean
```

**Parameters**

- `kind?:` [`queue_kind`](/dev/libraries/izi/types#queue_kind) - Optional queue type filter ( `"pve"` or `"pvp"` ). If not specified, declines any queue.
- `idx?: integer` - Optional queue slot index for multiple queues

Returns

- `boolean` - True if the queue was successfully declined

Description

Declines a queue popup. You can optionally filter by queue type and specify which queue slot to decline.

**Example Usage**

```lua
local izi = require("common/izi_sdk")

-- Decline any queue
if izi.queue_has_popup() then
    izi.queue_decline()
end

-- Decline only PvE queues (maybe you're AFK farming)
local has_popup, info = izi.queue_popup_info()
if has_popup and info.kind == "pve" then
    izi.queue_decline("pve")
end
```

---

### `izi.set_pvp_queue_provider`

Syntax

```lua
izi.set_pvp_queue_provider(fn: function): nil
```

**Parameters**

- `fn: function` - Provider function that returns PvP queue slot data

**Provider Function Signature**

```lua
function(): queue_pvp_slot[]|nil
```

Description

Registers a custom provider function for PvP queue slot data. This allows integration with custom queue tracking systems or addons.

**Example Usage**

```lua
local izi = require("common/izi_sdk")

-- Custom PvP queue provider
izi.set_pvp_queue_provider(function()
    -- Return custom queue data
    return {
        {
            idx = 1,
            status = "ready",
            is_call = false,
            expires_at_ms = izi.now_ms() + 60000
        }
    }
end)
```

---

## Types

For detailed type definitions, see the [Types](/dev/libraries/izi/types) page.

### Quick Reference

```lua
-- queue_kind
"none" | "pve" | "pvp"

-- queue_popup_info
{
    kind: queue_kind,
    since_sec: number,
    since_ms: integer,
    age_sec: number,
    age_ms: integer,
    expire_sec: number|nil,
    expire_ms: integer|nil,
    pve: queue_pve_meta|nil,
    pvp: queue_pvp_meta|nil
}

-- queue_pve_meta
{
    proposal: boolean
}

-- queue_pvp_slot
{
    idx: integer,
    status: any,
    is_call: boolean|nil,
    expires_at_ms: integer|nil
}

-- queue_pvp_meta
{
    slots: queue_pvp_slot[]
}
```

---

## Complete Example

This example demonstrates a queue helper plugin that auto-focuses the game window when queues pop and includes anti-AFK functionality.

```lua
local izi = require("common/izi_sdk")

-- Configuration
local config = {
    track_pvp = true,
    track_pve = true,
    anti_afk = true,
    focus_interval = 10.0,  -- seconds between focus attempts
    afk_timeout = 60.0,     -- seconds before anti-AFK nudge
}

-- State
local last_focus_time = 0
local last_move_time = izi.now()
local nudge_active = false
local nudge_start = 0
local NUDGE_DURATION = 0.05  -- seconds

local function on_update()
    local me = izi.me()
    if not me or not me:is_valid() then return end
    
    local now = izi.now()
    
    -- Track movement for anti-AFK
    if me:is_moving() then
        last_move_time = now
    end
    
    -- Check for queue popup
    local has_popup, info = izi.queue_popup_info()
    
    if has_popup then
        -- Check if we should focus the window
        local should_focus = false
        
        if info.kind == "pvp" and config.track_pvp then
            should_focus = true
        elseif info.kind == "pve" and config.track_pve then
            should_focus = true
        end
        
        if should_focus and (now - last_focus_time) >= config.focus_interval then
            if core.set_window_foremost then
                core.set_window_foremost()
                izi.printf("Queue popup! (%s)", info.kind)
            end
            last_focus_time = now
        end
    end
    
    -- Anti-AFK logic
    if config.anti_afk then
        -- End active nudge
        if nudge_active and (now - nudge_start) >= NUDGE_DURATION then
            nudge_active = false
            if core.input and core.input.move_forward_stop then
                core.input.move_forward_stop()
            end
        end
        
        -- Start new nudge if AFK too long
        if not nudge_active and (now - last_move_time) >= config.afk_timeout then
            if core.input and core.input.move_forward_start then
                core.input.move_forward_start()
                nudge_active = true
                nudge_start = now
                last_move_time = now
                izi.print("Anti-AFK nudge")
            end
        end
    end
end

-- Auto-accept queues
local function auto_accept()
    local has_popup, info = izi.queue_popup_info()
    
    if not has_popup then return end
    
    -- Wait a moment before accepting (to be safe)
    if info.age_sec < 1.0 then return end
    
    if info.kind == "pvp" and config.track_pvp then
        if izi.queue_accept("pvp") then
            izi.print("Auto-accepted PvP queue!")
        end
    elseif info.kind == "pve" and config.track_pve then
        if izi.queue_accept("pve") then
            izi.print("Auto-accepted PvE queue!")
        end
    end
end

-- Register callbacks
core.register_on_update_callback(on_update)
core.register_on_update_callback(auto_accept)
```