# Verifying PS users (session JWT) 🔐

> Source: <https://docs.project-sylvanas.net/dev/guides/session-jwt>

Your plugin can get a token, signed by the PS server, that proves which PS user is running the current session. Send it to your own server and verify it there with the public key below. You don't need any API access to PS.

## Getting the token (Lua)

```lua
local token = core.get_session_jwt_token()  -- string, or nil
```

- Returns `nil` when the current session has no token. Treat that user as unverified.
- The token is issued once, when the session starts. It stays the same for the whole session, including plugin reloads.

Send it to your server, for example as a bearer token:

```lua
local token = core.get_session_jwt_token()
if token then
    core.http_post("https://your-server.example/api/ps-verify",
        { ["Authorization"] = "Bearer " .. token },
        "",
        function(status, content_type, body, headers)
            -- on a network failure, status is the curl error code and content_type is "error"
            if status == 200 then
                -- your server accepted the token
            end
        end)
end
```

## Public key

Key id (`kid`) `1`, algorithm **ES256** (ECDSA P-256 with SHA-256):

```text
-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEIp2GRY5XKc8KJII2Pb0EVLJjjnjM1N9F0I5MqOvN
HlAaKP041256VgvL2rtmocp/JiR/DR4YEOLk8q9lDpbrUQ==
-----END PUBLIC KEY-----
```

## Token format

A standard JWT (compact JWS: `header.payload.signature`, base64url). It is ASCII and about 210 characters long.

```js
// header
{"alg": "ES256", "typ": "JWT", "kid": "1"}

// payload
{"uid": 123, "sid": 456789, "product": 0, "iat": 1791150445}
```

| Claim | Type | Meaning |
| --- | --- | --- |
| `uid` | int | PS user id |
| `sid` | int | Session id, unique per session |
| `product` | int | Product the session belongs to: `0` WoW, `1` Overwatch, `2` League |
| `iat` | int | Session start time, unix seconds (UTC) |

The token has no `exp`. You decide how old a token you accept (see step 5 below).

## Verifying (on your server)

1. **Only accept `alg` = `ES256`.** Never accept `none` or `HS256` . Pin the algorithm in your library call (the examples below do).
2. **Look up the public key by `kid`.** Reject unknown `kid` values.
3. **Verify the signature.**
4. **Check `product`** is the product your plugin is for.
5. **Apply your own age limit to `iat`.** `iat` is when the session started, not when the plugin asked for the token, and sessions can run for many hours. Either allow an age that covers a long session, or verify once when the plugin starts and then issue your own short-lived session.
6. Optionally use `sid` to track or limit concurrent sessions per user.

The token is a bearer proof: anyone who has the string can present it. Don't log it or show it anywhere public.

### Python (PyJWT)

```python
# pip install "PyJWT[crypto]"
import time
import jwt

PS_PUBLIC_KEYS = {
    "1": """-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEIp2GRY5XKc8KJII2Pb0EVLJjjnjM1N9F0I5MqOvN
HlAaKP041256VgvL2rtmocp/JiR/DR4YEOLk8q9lDpbrUQ==
-----END PUBLIC KEY-----""",
}
PRODUCT_WOW = 0
MAX_AGE_S = 24 * 60 * 60


def verify_ps_token(token: str) -> dict:
    kid = jwt.get_unverified_header(token).get("kid")
    if kid not in PS_PUBLIC_KEYS:
        raise jwt.InvalidTokenError("unknown kid")
    claims = jwt.decode(token, PS_PUBLIC_KEYS[kid], algorithms=["ES256"],
                        options={"require": ["iat"]})
    if claims.get("product") != PRODUCT_WOW:
        raise jwt.InvalidTokenError("wrong product")
    if time.time() - claims["iat"] > MAX_AGE_S:
        raise jwt.InvalidTokenError("token too old")
    return claims  # claims["uid"], claims["sid"]
```

### Node.js (jose)

```js
// npm install jose
import { jwtVerify, importSPKI, decodeProtectedHeader } from "jose";

const PS_PUBLIC_KEYS = {
  "1": `-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEIp2GRY5XKc8KJII2Pb0EVLJjjnjM1N9F0I5MqOvN
HlAaKP041256VgvL2rtmocp/JiR/DR4YEOLk8q9lDpbrUQ==
-----END PUBLIC KEY-----`,
};
const PRODUCT_WOW = 0;
const MAX_AGE = "24h";

export async function verifyPsToken(token) {
  const { kid } = decodeProtectedHeader(token);
  if (!Object.hasOwn(PS_PUBLIC_KEYS, kid)) throw new Error("unknown kid");
  const key = await importSPKI(PS_PUBLIC_KEYS[kid], "ES256");
  const { payload } = await jwtVerify(token, key, { algorithms: ["ES256"], maxTokenAge: MAX_AGE });
  if (payload.product !== PRODUCT_WOW) throw new Error("wrong product");
  return payload; // payload.uid, payload.sid
}
```

### Other languages

Any JWT library with ES256 support works. If you verify by hand instead:

- The signed data is the ASCII text `header.payload` (everything before the second `.` ).
- The hash is SHA-256.
- The signature is the raw 64-byte `r || s` (32 + 32 bytes, big-endian) used by JWS, not DER. Many crypto APIs expect DER and need it converted first.

## Key rotation

A new signing key gets a new `kid`, and we'll send you its public key ahead of the switch. Add it to your key map next to the old one. Both stay valid until the old key is retired.