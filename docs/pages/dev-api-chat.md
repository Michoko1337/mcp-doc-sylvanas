# Chat and Ignore List

> Source: <https://docs.project-sylvanas.net/dev/api/chat>

## Overview

`core.chat` reads chat lines by their **line id**, mostly to show a line the game hid as "potentially inappropriate". `core.social` reads the ignore list; `core.input.add_ignore` and `core.input.del_ignore` change it. Everything here needs core 2.211 or later and works on every client.

The line id is `args[11]` of every `CHAT_MSG_*` event (`args[12]` is the sender's GUID). For a censored line it is also the number in its link: on Forever a censored whisper arrives with `args[1]` already replaced by text like `Message from Rogue is potentially inappropriate. |Hcensoredmessage:7750|h[Show Message]|h`, and `7750` is the line id. The game only keeps recent lines, so an old id answers `nil` or `false`.

> [!INFO]
> There is no call to report a player or a line. The game marks its report call as not allowed for addons, so a report sent by a script is exactly what it is built to stop, and every report puts the reporting account in front of a GM.

---

### `core.chat.is_line_censored`

Syntax

```lua
core.chat.is_line_censored(line_id: integer) -> boolean | nil
```

Returns

- `boolean` : Whether the game hides this line. `nil` when the client does not know the line.

---

### `core.chat.uncensor_line`

Syntax

```lua
core.chat.uncensor_line(line_id: integer) -> boolean
```

Returns

- `boolean` : `true` when the line is no longer censored (also when it never was).

Description

The same as clicking the line's **Show Message** link: the game's chat window shows the real words too. Read them with `get_line_text`. The `CHAT_MSG_*` event is not sent again.

---

### `core.chat.get_line_text`

Syntax

```lua
core.chat.get_line_text(line_id: integer) -> string | nil
```

Returns

- `string` : The line's real text. For a censored line, call `uncensor_line` first.

---

### `core.chat.get_line_sender`

Syntax

```lua
core.chat.get_line_sender(line_id: integer) -> string | nil, string | nil
```

Returns

- `string` : The sender's name, `nil` when the client does not know the line.
- `string` : The sender's GUID, when the client has it.

---

### `core.input.add_ignore`

Syntax

```lua
core.input.add_ignore(name: string) -> boolean, string
```

**Parameters**

- `name` : `string` - `"Name"` for your realm or `"Name-Realm"` .

Returns

- `boolean` : `true` when the request was sent.
- `string` : Why it was not: `"bad_name"` , `"self"` , `"already"` , `"rejected"` (the client refused, which is how it answers a full list) or `"not_in_this_client"` . Empty when `true` .

Description

The same as `/ignore`. `true` is the request, not the result: the server answers an unknown name with a `CHAT_MSG_SYSTEM` line ("Player not found."), and a real add with `IGNORELIST_UPDATE`.

---

### `core.input.del_ignore`

Syntax

```lua
core.input.del_ignore(name: string) -> boolean
```

Returns

- `boolean` : `false` when the name is not on the list.

---

### `core.social.get_ignores`

Syntax

```lua
core.social.get_ignores() -> table
```

Returns

- `table` : Every name on the ignore list, as the client stores them.

---

### `core.social.is_ignored`

Syntax

```lua
core.social.is_ignored(name: string) -> boolean
```

---

## Example Usage

```lua
-- Read a censored whisper, then ignore whoever sent it
core.register_on_game_event_callback(function(event_name, args)
    if event_name ~= "CHAT_MSG_WHISPER" or not core.chat then
        return
    end

    local line_id = args[11]
    if not line_id or not core.chat.is_line_censored(line_id) then
        return
    end

    core.chat.uncensor_line(line_id)
    local text = core.chat.get_line_text(line_id)
    local sender = core.chat.get_line_sender(line_id)
    core.log("censored whisper from " .. tostring(sender) .. ": " .. tostring(text))

    if sender and not core.social.is_ignored(sender) then
        local ok, why = core.input.add_ignore(sender)
        if not ok then
            core.log("add_ignore: " .. why)
        end
    end
end)
```