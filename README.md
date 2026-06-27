<div align="center">

# 🐍 NTL Bot Script
*The Extracted Bot Brain from the NTL Mod*

![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![C](https://img.shields.io/badge/C-00599C?style=for-the-badge&logo=c&logoColor=white)
![Logic](https://img.shields.io/badge/Bot_Logic-Isolated-2ea44f?style=for-the-badge)

</div>

> **Note:** This folder contains only the extracted bot brain from the NTL mod.

## 📂 Source Used
- `NTL\main-mt.js`

---

## 🧠 What This Bot Logic Script Contains

This script isolates the core bot logic from the original NTL bot brain. It includes:

*   🚨 **Danger detection**
*   🎯 **Enemy head prediction**
*   💥 **Body-segment collision scanning**
*   📐 **Angular occupancy mapping**
*   🏃 **Escape heading selection**
*   🍎 **Food scoring and targeting**
*   🔄 **Own-body following / circling behavior**
*   🚀 **Boost decision hooks**

---

## ⚙️ What Is Inside the Bot Logic

### 1. Danger Detection
The following behavior was extracted from the original NTL bot brain:
*   Projecting enemy heads slightly forward
*   Collecting body segments inside the scan zone
*   Registering each threat into angular bins
*   Sorting the nearest collision threats

**This helps the bot understand:**
*   Whether there is a crash risk ahead
*   Which side is more blocked
*   Which direction is relatively open and safer

### 2. Food Targeting
The food logic works by:
*   Evaluating nearby food
*   Checking angle and danger bins before targeting food
*   Rejecting risky food paths
*   Using a score similar to:

```math
\text{Score} = \frac{\text{mass}^2}{\text{distance}}
```
*The bot then selects the best available food target based on safety and value.*

### 3. Own-Body Follow / Circle Mode
This is the survival-focused part of the bot. The bot:
*   Rebuilds its own body path
*   Finds the nearest path point
*   Samples a point slightly ahead on the body path
*   Calculates tangent and normal vectors
*   Creates a follow target using a side offset

**This allows the snake to:**
*   Move in a controlled way around its own body
*   Maintain a tight orbit
*   Shift from food targeting mode into body-follow mode when needed

### 4. Escape Heading Selection
The bot checks the openings found inside the angular bins. It then:
*   Chooses the largest open arc when possible
*   Falls back to the safest available heading when no clear opening exists

*This gives the bot a reliable escape direction during dangerous situations.*

### 5. Boost Decisions
Boosting becomes useful when:
*   An enemy head is an immediate threat
*   The surrounding occupancy is high
*   The escape path needs to be cleared quickly

> [!NOTE]  
> Boost is not treated as a constant action. It is used as a tactical escape or survival tool.

---

## 💻 JavaScript Implementation

**Main File:** `ntl_bot_core.js`

### Expected Runtime Input

**`self`**
```json
{
  "id": "...",
  "x": 0.0,
  "y": 0.0,
  "fx": 0.0,
  "fy": 0.0,
  "heading": 0.0,
  "speed": 0.0,
  "mass": 0.0,
  "segments": [],
  "lengthScore": 0.0
}
```

**`world`**
```json
{
  "foods": [],
  "enemySnakes": [],
  "center": {},
  "radius": 0.0
}
```

### Usage
```javascript
import { updateNtlBot } from "./ntl_bot_core.js";

const decision = updateNtlBot(world, self, config);
```

### Output
```json
{
  "mode": "...",
  "target": { "x": 0.0, "y": 0.0 },
  "aimAngle": 0.0,
  "boost": false
}
```

---

## 🛠️ Implementation in C

**Main Files:**
*   `ntl_bot_core.h`
*   `ntl_bot_core.c`

### Integration Flow
1. Fill the `self` snake data from your game runtime
2. Fill the `enemy snakes` array
3. Fill the `food` list
4. Call `ntl_bot_update()`
5. Map the returned target and angle back into the game engine input

**Example Starter:** `example_adapter.c`

---

## ⚠️ What You Need to Understand Before Porting JS to C

> [!WARNING]  
> A direct copy-paste conversion is not enough.

The original NTL bot depended on:
*   Browser globals
*   Slither runtime variables
*   Minified variable names
*   The original mod environment

**For the C port, the logic has been cleaned and separated properly:**
*   Runtime structs were created
*   Geometry helpers were isolated
*   Danger scanning was converted into pure functions
*   Food scanning was converted into pure functions
*   The adapter layer was kept game-specific

*This makes the bot logic easier to test, port, and integrate into other runtimes (like C).*

### Original NTL Function Map
See: `ORIGIN_MAP.md`

---

## 🎮 How This Would Be Implemented in a C Game Like Vlither

If vlither is written in C, real integration would happen in two layers.

### Layer 1: Adapter Layer
You need to extract the following data from vlither:
*   Current player head position
*   Player body segments
*   Enemy snakes
*   Enemy headings and speeds
*   Food positions and mass
*   World center and radius

*The adapter layer is responsible for converting game-specific data into the clean bot input format.*

### Layer 2: Control Output Layer
The bot decision must be mapped back into the game engine. Use the returned values like this:
*   `aimAngle` ➔ turn packet / steering variable
*   `target` ➔ desired world coordinate
*   `boost` ➔ sprint / acceleration flag

*This keeps the bot brain separate from the actual game controls.*

---

> [!IMPORTANT]  
> ### Important Note
> This folder is meant for bot logic extraction and clean porting. 
> 
> **It is not:**
> *   An exact recreation of the original extension
> *   A UI mod clone
> *   A browser injector
> *   A full NTL replacement
> 
> This project specifically focuses on isolating the bot brain and making it easier to understand, port, and integrate.

<br>

<div align="center">

# 🤖 C Port Integration Guide for Agents
*The definitive guide for integrating the NTL Bot Core into C-based runtimes.*

![C](https://img.shields.io/badge/C-00599C?style=for-the-badge&logo=c&logoColor=white)
![AI Agent](https://img.shields.io/badge/AI_Agent-Ready-8A2BE2?style=for-the-badge&logo=openai&logoColor=white)
![Integration](https://img.shields.io/badge/Integration-Pipeline-2ea44f?style=for-the-badge)

</div>

---

## 🚨 The Most Crucial Detail

Simply having the C files is never enough. For a functional C integration, the developer or AI agent **must** execute the following:

- Map the target game's runtime data into the bot's structs.
- Call the bot function on every single tick/frame/update.
- Convert the bot's decision into the game's native steering, turning, and boost mechanics.
- Handle compilation issues, include paths, and engine-specific architectural differences.

---

## 📂 Essential Files to Analyze

Before doing anything, the agent must read and understand these core files:

- `c-bot-port\ntl_bot_core.h`
- `c-bot-port\ntl_bot_core.c`
- `c-bot-port\example_adapter.c`
- `js-bot-logic\ntl_bot_core.js`
- `js-bot-logic\ORIGIN_MAP.md`

---

## ⚙️ Execution Pipeline: How to Actually Run the C Port

### 1. Build the Adapter Layer
You must extract the following values from the target C game:
- Player head position, heading, speed, and mass / length score
- Player body segments
- Enemy snakes array (headings & speeds)
- Food list
- World center & radius

*Map all of this data into `NtlSnakeView`, `NtlFoodView`, and `NtlWorldView`.*

### 2. Wire the Bot Tick
Inside every game update loop, follow this sequence:
1. Extract a runtime snapshot.
2. Initialize `ntl_bot_default_config()` (or use a custom config).
3. Call `ntl_bot_update()`.
4. Map the returned `NtlBotDecision` back into the engine controls.

### 3. Translate the Output
The `NtlBotDecision` struct must be mapped as follows:
- `aim_angle` ➔ Left/right turning logic or direct steering target.
- `target.x`, `target.y` ➔ World-space navigation target.
- `boost` ➔ Sprint / accelerate / turbo toggle flag.
- `mode` ➔ Reference for debugging or behavior switching.

### 4. Handle Engine-Specific Quirks
Be prepared to patch the following engine-specific discrepancies:
- Coordinate system alignment.
- Angle conventions (Radians vs Degrees, offset logic).
- Speed unit synchronization.
- Body segment layout adaptations.
- Compilation flags and math library linking (`-lm`).

---

## 📋 Agent Prompt (Copy & Paste)

> [!TIP]
> If you are using an AI Agent (like Trae, Cursor, or Claude), copy and paste this exact prompt to get perfect results.

```text
I have an extracted NTL bot core that already exists in both JavaScript and C. I do NOT want a new game, server, UI, or extension clone. I only want the bot logic integrated into my existing C codebase.

Please read these files first:
- C:\Users\Om Rajput\Desktop\slitherport-io\NTL bot script\c-bot-port\ntl_bot_core.h
- C:\Users\Om Rajput\Desktop\slitherport-io\NTL bot script\c-bot-port\ntl_bot_core.c
- C:\Users\Om Rajput\Desktop\slitherport-io\NTL bot script\c-bot-port\example_adapter.c
- C:\Users\Om Rajput\Desktop\slitherport-io\NTL bot script\js-bot-logic\ntl_bot_core.js
- C:\Users\Om Rajput\Desktop\slitherport-io\NTL bot script\js-bot-logic\ORIGIN_MAP.md

Then inspect my target C project and do the following:

1. Find the game loop / bot tick / update loop.
2. Find the structs or variables that represent:
   - player head position
   - player heading
   - player speed
   - player mass or length
   - player body segments
   - enemy snakes
   - enemy body segments
   - food items
   - world center and radius
3. Create an adapter layer that converts my engine data into:
   - NtlSnakeView
   - NtlFoodView
   - NtlWorldView
4. Call ntl_bot_update() every update tick.
5. Convert NtlBotDecision back into my engine controls:
   - aim_angle -> steering / turn input
   - target -> world target if needed
   - boost -> acceleration flag
6. Keep the bot brain logic intact as much as possible. Only change the C core if required for compilation or engine compatibility.
7. If compile errors happen, fix them in a minimal way and explain each fix.
8. If some engine data is missing, identify exactly what is missing and where it should come from.

Important constraints:
- Do not build a new game.
- Do not build a new server.
- Do not add unrelated UI.
- Focus only on integrating the NTL bot logic into the existing C project.
- Reuse ntl_bot_core.h and ntl_bot_core.c instead of rewriting the bot from scratch.

Deliverables I want from you:
- adapter source/header files
- the exact engine files you changed
- the integration points you used
- any compile commands or build changes needed
- a short explanation of how the bot now works inside the C project
```

### 🎯 Targeting a 'Vlither' Style Project?
If the target game is heavily inspired by Slither (like `vlither`), append this line to the bottom of the prompt above:

```text
This target project is a Slither-like C game. Please preserve its existing movement and packet/input flow, and fit the bot into the current runtime rather than replacing the control architecture.
```

---

## 🛠️ Expected Agent Deliverables
A highly capable agent will typically execute the following:
*   Inspect the existing runtime architecture.
*   Generate the necessary adapter files.
*   Identify the exact integration point for the bot tick.
*   Resolve compilation errors seamlessly.
*   Map the steering outputs accurately.
*   Provide a comprehensive list of all modified files.

---

## 🧪 Manual Compilation Test
> [!WARNING]  
> This is strictly for basic sample testing, not for the final engine integration.

```bash
gcc example_adapter.c ntl_bot_core.c -lm -o ntl_bot_demo
```
*(This command will work similarly in Windows MinGW provided `gcc` is available in your PATH).*

---

> [!IMPORTANT]  
> ### 💡 The Bottom Line
> The true challenge of a C port isn't "rewriting the bot logic"—it's **building the correct adapter** to fit seamlessly into the existing engine. This guide is explicitly designed to point AI agents in that exact right direction.

<br>

<div align="right">
  <b>— OM RAJPUT</b>
</div>
<div align="right">
  <b>Full-Stack Developer</b>
</div>

