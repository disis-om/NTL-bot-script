# NTL bot origin map

This folder is the bot-only extraction from:

- `C:\Users\Om Rajput\Desktop\slitherport-io\ntl\main-mt.js`

Important original blocks:

- `dA` = geometry / aiming / collision helpers
- `tf` = bot controller

Original NTL function to extracted meaning:

| Original | Meaning |
|---|---|
| `tf.go()` | main bot tick / decision loop |
| `tf.Ye()` | scan nearby threats |
| `tf.ve()` | immediate collision avoidance |
| `tf.ne()` | occupancy-based escape decision |
| `tf.Vf()` | food targeting |
| `tf.Zf()` | per-food scoring |
| `tf.Re()` | rebuild own body path |
| `tf.Ae()` | nearest point on own body path |
| `tf.ee()` | own-body follow / circling |
| `tf.he()` | choose open escape heading |
| `tf.ye()` | steer away from a threat |
| `tf.je()` | write obstacle into angular bins |
| `tf.Te()` | decide turn side for circle mode |
| `dA.Yf()` | squared distance |
| `dA.Nf()` | circle-circle collision / merge point |
| `dA.Sf()` | point-in-polygon |
| `dA.Ef()` | polygon bounds |
| `dA.Rf()` | convex hull |
| `dA.U()` | write aim vector |
| `dA.Y()` | convert world target to relative aim |

Notes:

- The cleaned JS file is not a byte-for-byte dump.
- It is a bot-only rewrite that keeps the same behavior classes:
  - danger scan
  - food scoring
  - own-body circling
  - escape heading selection
- Browser/UI logic was intentionally removed.
