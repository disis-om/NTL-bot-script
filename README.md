# NTL bot script

Exact folder location:

- [NTL bot script](<C:\Users\Om Rajput\Desktop\slitherport-io\NTL bot script>)

This folder contains only the bot brain extracted from the local NTL mod copy.

Source used:

- `C:\Users\Om Rajput\Desktop\slitherport-io\ntl\main-mt.js`

What is intentionally removed:

- extension popup logic
- chrome API glue
- UI / overlay / drag button / keybind code
- settings panels
- chat / cosmetic / menu logic

What is kept:

- danger detection
- enemy head prediction
- body-segment collision scan
- angular occupancy map
- escape heading selection
- food scoring and targeting
- own-body follow / circling
- boost decision hooks

## Folder structure

- `js-bot-logic/`
  - [ntl_bot_core.js](<C:\Users\Om Rajput\Desktop\slitherport-io\NTL bot script\js-bot-logic\ntl_bot_core.js>)
  - [ORIGIN_MAP.md](<C:\Users\Om Rajput\Desktop\slitherport-io\NTL bot script\js-bot-logic\ORIGIN_MAP.md>)
- `c-bot-port/`
  - [ntl_bot_core.h](<C:\Users\Om Rajput\Desktop\slitherport-io\NTL bot script\c-bot-port\ntl_bot_core.h>)
  - [ntl_bot_core.c](<C:\Users\Om Rajput\Desktop\slitherport-io\NTL bot script\c-bot-port\ntl_bot_core.c>)
  - [example_adapter.c](<C:\Users\Om Rajput\Desktop\slitherport-io\NTL bot script\c-bot-port\example_adapter.c>)

## Bot logic me kya kya hai

### 1. Danger detect karna

Original NTL bot ke bot-brain se ye behavior nikala gaya:

- enemy head ko thoda forward project karna
- body segments ko scan zone me collect karna
- har threat ko angular bins me register karna
- nearest collision threats ko sort karna

Isse bot ko pata chalta hai:

- samne crash risk hai ya nahi
- kis side zyada blocked hai
- kaunsi direction relatively open hai

### 2. Food targeting

Food logic:

- nearby food evaluate karta hai
- angle aur danger bins dekh kar risky food reject karta hai
- `mass^2 / distance` jaisa score use karta hai
- best target choose karta hai

### 3. Own body follow / circle mode

Ye bot ka survival-oriented part hai.

Bot:

- apni body path rebuild karta hai
- nearest path point dhoondta hai
- thoda aage ka path sample karta hai
- tangent aur normal vector nikalta hai
- side offset ke saath follow target banata hai

Isse snake:

- apni body ke around controlled movement karta hai
- tight orbit maintain kar sakta hai
- food mode se body-follow mode me shift kar sakta hai

### 4. Escape heading selection

Angular bins me jo openings milti hain, unme se:

- sabse bada open arc choose hota hai
- warna safest fallback heading li jaati hai

### 5. Boost decisions

Boost useful hota hai jab:

- enemy head immediate threat ho
- occupancy high ho
- escape path ko jaldi clear karna ho

## JS implementation kaise use karna hai

Main file:

- [ntl_bot_core.js](<C:\Users\Om Rajput\Desktop\slitherport-io\NTL bot script\js-bot-logic\ntl_bot_core.js>)

Expected runtime input:

- `self`
  - `id`
  - `x`, `y`
  - `fx`, `fy`
  - `heading`
  - `speed`
  - `mass`
  - `segments`
  - optional `lengthScore`
- `world`
  - `foods`
  - `enemySnakes`
  - optional `center` / `radius`

Call:

```js
import { updateNtlBot } from "./ntl_bot_core.js";

const decision = updateNtlBot(world, self, config);
```

Output:

- `mode`
- `target { x, y }`
- `aimAngle`
- `boost`

## C implementation kaise use karna hai

Main files:

- [ntl_bot_core.h](<C:\Users\Om Rajput\Desktop\slitherport-io\NTL bot script\c-bot-port\ntl_bot_core.h>)
- [ntl_bot_core.c](<C:\Users\Om Rajput\Desktop\slitherport-io\NTL bot script\c-bot-port\ntl_bot_core.c>)

Integration flow:

1. Apne game runtime se self snake fill karo
2. Enemy snakes array fill karo
3. Food list fill karo
4. `ntl_bot_update()` call karo
5. Returned target aur angle ko engine input me map karo

Example starter:

- [example_adapter.c](<C:\Users\Om Rajput\Desktop\slitherport-io\NTL bot script\c-bot-port\example_adapter.c>)

## JS se C me lane ke liye kya samajhna zaroori hai

Direct copy-paste conversion enough nahi hoti, kyunki original NTL bot:

- browser globals use karta tha
- Slither runtime variable layout pe depend karta tha
- minified names use karta tha

C port me clean separation ki gayi:

- runtime structs banaye
- geometry helpers alag kiye
- danger scan aur food scan ko pure functions banaya
- adapter layer ko game-specific rakha

## Original NTL function map

See:

- [ORIGIN_MAP.md](<C:\Users\Om Rajput\Desktop\slitherport-io\NTL bot script\js-bot-logic\ORIGIN_MAP.md>)

## Vlither jaisa C game me implement kaise hoga

Agar `vlither` C me hai, to real integration 2 layers me hoga:

### Layer 1: Adapter

Tumhe vlither se ye data nikalna hoga:

- current player head position
- body segments
- enemy snakes
- enemy headings / speeds
- food positions and mass
- world center / radius

### Layer 2: Control output

Bot decision ko map karo:

- `aimAngle` -> turn packet / steering variable
- `target` -> desired world coordinate
- `boost` -> sprint / accelerate flag

## Important note

Ye folder bot logic extraction aur clean port ke liye hai.

Ye:

- exact extension recreation nahi hai
- UI mod clone nahi hai
- browser injector nahi hai

Ye specifically bot brain isolate karne ke liye banaya gaya hai.
