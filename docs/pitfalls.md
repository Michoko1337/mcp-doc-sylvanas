# Pitfalls & golden rules

> **Community notes** curated by the maintainers of `mcp-sylvanas`, verified
> against the official docs on **2026-10-30**. They are *not* part of the
> official corpus (`docs/pages/`): they record contradictions between
> official pages, wrong official examples, and API shapes that are easy to
> get wrong. Each of them can cost an hour of debugging.

## Golden rules

1. **`core.menu` is not an API — it is 3 layers.** `core.menu` (simple),
   `core.menu.elements` (advanced), `_G.menu` (recommended). Check the menu
   page before writing any menu code.
2. **Actions almost always return `(ok, message)`.** The message is the only
   explanation when something fails — never ignore it.
3. **`cast_safe` handles everything**: immunities, GCD, cooldown, cost,
   channeling. Call `core.spell_book.cast_safe` instead of reimplementing
   those checks.
4. **`power_type.COMBOPOINTS` is 14 on private servers, 4 elsewhere.** Always
   go through the enum, never hardcode the number.
5. **The time family is in milliseconds**: `core.game_time()`,
   `core.delta_time()`, `get_active_spell_cast_end_time()`. Only
   `core.time()` is in seconds. Beware: the official throttle example
   (`< 0.25`) is wrong — on a milliseconds clock it means 0.25 *ms*.
6. **An API may only exist on some clients.** `is_important_spell` is
   *Retail only* and returns `nil` elsewhere; `cancel_buff` did nothing on
   Forever before the core update of 2026-10-06. Check the availability
   notes (`sylvanas_availability`) before depending on an API.

## Verified gotchas in the official docs

### `get_local_player()` — dot or colon?

| Form | Where |
|---|---|
| `core.object_manager.get_local_player()` | almost every page |
| `core.object_manager:get_local_player()` | the `celestial-unholy-dk` example |

The colon form is almost certainly a typo in that isolated example. Use the
**dot**, the majority form everywhere else.

### The specialization id — module function or unit method?

| Form | Where |
|---|---|
| `core.spell_book.get_specialization_id()` | developer docs |
| `local_player:get_specialization_id()` | the `celestial-unholy-dk` example |

Both appear. The unit method is the one used by the most recent reference
example.

### Comparing specializations — the right way

```lua
local spec_id = enums.class_spec_id

local player_spec_id = local_player:get_specialization_id()

local is_valid_spec = player_spec_id
    == spec_id.get_spec_id_from_enum(spec_id.spec_enum.UNHOLY_DEATHKNIGHT)
```

`get_spec_id_from_enum(...)` is the **official** conversion: it takes the
readable enum and returns the raw comparable id. Far more robust than a
magic number, and it survives talent reordering.

### `cooldown()` vs `cooldown_remains()`

Both exist on `izi_spell` and both return the remaining time. The reference
rotation uses `cooldown_remains()` for threshold comparisons. If in doubt,
test which one exists on your build.

### `check_los` defaults to `true` — it is an opt-OUT

`check_los` lives in `unit_cast_opts` and is **inherited** by
`pos_cast_opts` (it is not specific to positional casts). It defaults to
`true`: only the literal `false` disables it. Omitting the field, passing
`nil` or passing `true` **keeps** the line-of-sight check.

### `is_spell_learned` vs `is_learned` — the pages disagree

| Form | Where |
|---|---|
| `core.spell_book.is_spell_learned(spell_id)` | the spell book page (documented function) |
| `core.spell_book.is_learned(spell_id)` | the spell helper page (troubleshooting examples) |

The spell book page documents `is_spell_learned` only, and says it is more
reliable than `has_spell` for checking talents — yet the spell helper page
calls `core.spell_book.is_learned` in its own diagnosis examples. Treat
`is_spell_learned` as the documented entry point, and test `is_learned` on
your build before relying on it.

### `core.game_time()` is milliseconds; `core.time()` is seconds

Three concordant clues on the site: the `/dev/api/core` page says
*"The time in milliseconds since the game started"*, `izi.now_game_time_ms()`
exposes the same clock under a name that says so, and the official examples
compare `core.game_time()` against `get_active_spell_cast_end_time()` and
against `network * 1000`. `core.time()` is in **seconds** since injection.

### The official examples get units wrong — twice

```lua
-- core.spell_book.get_spell_cooldown_information: the site's own example
local remaining = (cd_info.start_time + cd_info.duration) - core.game_time()
core.log("Cooldown remaining: " .. string.format("%.1f", remaining / 1000) .. "s")
```

`duration` is in **seconds**, `core.game_time()` in **milliseconds**: the
result is off by a factor of 1000. And on the `/dev/api/input` page, the
throttle `if current_time - last_cast_time < 0.25 then` is commented
"0.25 seconds" — on a milliseconds clock that means **0.25 ms**. A plugin
that copies the official throttle has, in practice, **no throttle**.

Corrected forms:

```lua
-- throttle
if core.game_time() - last_cast_time < 250 then return false end  -- 250 ms
-- remaining cooldown
local remaining_s = cd_info.duration - (core.game_time() - cd_info.start_time) / 1000
```

### `nil` is not `false`

`core.spell_book.is_important_spell(spell_id)` is *Retail only* and returns
**`nil`**, not `false`, on every Classic client. A guard written
`if x == false then` slips through; `if not x then` catches it.

The same pattern appears for
`core.spell_book.get_assisted_spell_id` (returns `0` everywhere except
Retail) and, on private-server clients only, for
`core.spell_book.get_base_spell_id` (returns the input `spell_id` back —
a **silent failure**; every Blizzard build resolves it since core 2.134).

## Warnings

- **Test both forms** when the docs contradict themselves: `get_objects()` /
  `get_all_objects()`, `cooldown()` / `cooldown_remains()`.
- **`movement:process()` on every tick**, otherwise nothing moves.
- **Milliseconds in `buff_manager`, seconds in `debuff_remains_sec`.** Two
  modules, two conventions.
- **The time family is in ms**: `core.game_time()`, `core.delta_time()`,
  `get_active_spell_cast_end_time()`. Only `core.time()` is in seconds.
- **`check_los` is `true` by default**: an opt-out, not an opt-in.
- **`nil` is not `false`**: read the availability note before writing a
  `== false` guard.
- **Isolate thresholds in the menu** — that is the reference-rotation
  pattern, and it keeps the rotation testable.
- **Short-circuit expensive calls** with a `cooldown_up()` check when the
  prediction only matters while the spell is available.
