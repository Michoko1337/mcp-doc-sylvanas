# Login Functions

> Source: <https://docs.project-sylvanas.net/dev/api/login>

## Overview

The `core.login` namespace drives the screens before the world: logging in, picking a game account, the realm list, character select, the dialogs those screens show, and reconnecting. It also has the two in-world calls that lead back there, `logout` and `cancel_logout`.

### When it works

- **Only on a glue screen** (login, realm list, character select). In the world every getter answers its empty value ( `""` , `false` , `0` , `{}` or `nil` ) and every action answers `false, "not on a glue screen"` . The exceptions are `logout` and `cancel_logout` , which work **only** in the world.
- **Actions return two values** : `ok` ( *boolean* ) and a message saying what was done, or why not. Log the message when `ok` is `false` ; it is the only explanation you get.
- **Actions press the game's own buttons** , so the screen stays in sync with what you did. The result of a login or a realm connect arrives later, so poll the getters on the next frames instead of reading them on the next line.

> [!WARNING]
> Added in the core update of 2026-10-10. It was written and tested on TBC Classic. It is available on every game version, but the others are not verified yet: where the game is missing a function, the call answers empty or `false` instead of erroring. On older cores `core.login` does not exist.

---

## State Functions

### `core.login.is_glue_screen`

Syntax

```lua
core.login.is_glue_screen() -> boolean
```

Description

`true` while a glue screen (login, realm list, character select) is up, `false` in the world.

---

### `core.login.get_screen`

Syntax

```lua
core.login.get_screen() -> string
```

Description

The current glue screen name as the game reports it, for example `"login"` or `"charselect"`. `""` in the world.

---

### `core.login.is_login_ready`

Syntax

```lua
core.login.is_login_ready() -> boolean
```

Description

`true` when the login screen is ready to accept a login. Wait for this before calling `login`.

---

### `core.login.is_connected`

Syntax

```lua
core.login.is_connected() -> boolean
```

Description

`true` while the game is connected to the login server.

---

### `core.login.get_server_name`

Syntax

```lua
core.login.get_server_name() -> string
```

Description

The server name the game reports, `""` when it has none.

---

### `core.login.is_realm_list_complete`

Syntax

```lua
core.login.is_realm_list_complete() -> boolean
```

Description

`true` once the realm list has finished loading. Read `get_realms` after this.

---

### `core.login.get_selected_character`

Syntax

```lua
core.login.get_selected_character() -> integer
```

Description

The selected row of the character list, 1 based. `0` when nothing is selected.

---

### `core.login.get_last_error`, `get_logon_queue_info`, `get_wait_queue_info`

Syntax

```lua
core.login.get_last_error() -> ...
core.login.get_logon_queue_info() -> ...
core.login.get_wait_queue_info() -> ...
```

Description

The game's own values for the last login error and the two login queues, passed through in the game's order. They are raw on purpose: the shape differs between game versions. Seen on TBC while idle: `get_last_error` returns nothing, `get_logon_queue_info` returns `false, 0, 0`, `get_wait_queue_info` returns `0, 0, false`.

---

## Lists

### `core.login.get_realms`

Syntax

```lua
core.login.get_realms() -> table[]
```

Returns

One table per realm, across every realm list category, empty when no realm list is loaded:

- `address` : `string` - The realm address. Pass it to `connect_to_realm` .
- `name` : `string` - The realm name.
- `num_characters` : `integer` - Your characters on that realm.
- `category` : `string` - The realm list category id.

---

### `core.login.get_characters`

Syntax

```lua
core.login.get_characters() -> table[]
```

Returns

One table per character on character select, empty anywhere else:

- `index` : `integer` - 1 based position in the list. This is what `select_character` takes.
- `id` : `integer` - The game's character id for that row.
- `name` , `race` , `race_file` , `class_name` , `class_file` : `string` - `race_file` and `class_file` are the tokens ( `"NightElf"` , `"ROGUE"` ), the others are localized.
- `class_id` , `level` : `integer`
- `zone` , `guid` , `faction` : `string`
- `is_ghost` , `is_locked` : `boolean`

Only `index` and `id` are guaranteed. When the game fails to read a row, every other field is `nil`.

---

### `core.login.get_dialog`

Syntax

```lua
core.login.get_dialog() -> table | nil
```

Returns

- `nil` when no dialog is shown.
- Otherwise a table: `frame` ( *string* , the dialog frame name), `which` ( *string* , the dialog type, for example `"OKAY"` ), `text` ( *string* ) and `buttons` ( *string[]* , the visible button labels in order). Click one with `press_dialog_button` .

---

### `core.login.get_game_accounts`

Syntax

```lua
core.login.get_game_accounts() -> string[]
```

Description

The WoW game account names on the Battle.net account. Filled after `login` when the account has more than one; the game then waits for `select_game_account`.

---

## Actions

Every action returns `ok: boolean, message: string`.

### `core.login.login`

Syntax

```lua
core.login.login(account: string, password: string) -> boolean, string
```

Description

Fills the login screen's account and password boxes and presses Login. The password box is cleared again afterwards. `ok` means the login was started, not that it succeeded: watch `get_screen`, `get_game_accounts` and `get_dialog` on the next frames.

---

### `core.login.select_game_account`

Syntax

```lua
core.login.select_game_account(name?: string) -> boolean, string
```

Description

Picks a game account from `get_game_accounts`. No name, or `""`, picks the first.

---

### `core.login.connect_to_realm`

Syntax

```lua
core.login.connect_to_realm(name_or_address?: string | number) -> boolean, string
```

Description

Connects to a realm by name or by the `address` from `get_realms`. With no argument it picks the first realm you have characters on, otherwise the first realm.

---

### `core.login.open_realm_list`

Syntax

```lua
core.login.open_realm_list() -> boolean, string
```

Description

Opens the realm list from character select (the Change Realm button).

---

### `core.login.select_character`

Syntax

```lua
core.login.select_character(index_or_name?: integer | string) -> boolean, string
```

Description

Selects a character by its 1 based `index` from `get_characters`, or by name. With no argument it selects the first character.

---

### `core.login.enter_world`

Syntax

```lua
core.login.enter_world() -> boolean, string
```

Description

Enters the world with the selected character.

---

### `core.login.press_dialog_button`

Syntax

```lua
core.login.press_dialog_button(label?: string) -> boolean, string
```

Description

Clicks the first visible button on the shown dialog whose label **contains** `label`, ignoring case. With no label it clicks the first visible button.

---

### `core.login.reconnect`

Syntax

```lua
core.login.reconnect() -> boolean, string
```

Description

Reconnects after a disconnect. Check `core.login.is_reconnect_possible()` first; it returns `boolean`.

---

### `core.login.clear_reconnect`

Syntax

```lua
core.login.clear_reconnect() -> boolean, string
```

Description

Presses the reconnect panel's other button (the one next to **Reconnect**, "Switch Accounts" or "Log Out" depending on the client): the client forgets the reconnect and shows the email and password boxes again, so you can sign in with a different login. Needs core 2.210 or later.

Login screen only, and only while `core.login.is_reconnect_possible()` is `true`; otherwise it returns `false` and a message saying why. `true` means the client no longer offers a reconnect.

**Example Usage**

```lua
-- Sign in with another account instead of reconnecting the last one
if core.login.is_reconnect_possible() then
    local ok, message = core.login.clear_reconnect()
    if not ok then
        core.log("clear_reconnect: " .. message)
    end
end
```

---

### `core.login.disconnect`

Syntax

```lua
core.login.disconnect() -> boolean, string
```

Description

Disconnects from the server and goes back to the login screen. Glue screens only.

---

### `core.login.logout`

Syntax

```lua
core.login.logout() -> boolean, string
```

Description

**In the world only.** Logs out to character select: instantly in a rest area, otherwise after the game's 20 second countdown.

---

### `core.login.cancel_logout`

Syntax

```lua
core.login.cancel_logout() -> boolean, string
```

Description

**In the world only.** Cancels a running logout countdown.

---

## Example: Character Select To World

```lua
-- Selects a character by name and enters the world, once character select is up.
local function enter_with(character_name)
    if core.login.get_screen() ~= "charselect" then
        return
    end

    local ok, message = core.login.select_character(character_name)
    if not ok then
        core.log("select_character failed: " .. message)
        return
    end

    ok, message = core.login.enter_world()
    if not ok then
        core.log("enter_world failed: " .. message)
    end
end
```