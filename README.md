

```markdown
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

* Rebuilds its own body path
* Finds the nearest path point
* Samples a point slightly ahead on the body path
* Calculates tangent and normal vectors
* Creates a follow target using a side offset

**This allows the snake to:**

* Move in a controlled way around its own body
* Maintain a tight orbit
* Shift from food targeting mode into body-follow mode when needed

### 4. Escape Heading Selection

The bot checks the openings found inside the angular bins. It then:

* Chooses the largest open arc when possible
* Falls back to the safest available heading when no clear opening exists

*This gives the bot a reliable escape direction during dangerous situations.*

### 5. Boost Decisions

Boosting becomes useful when:

* An enemy head is an immediate threat
* The surrounding occupancy is high
* The escape path needs to be cleared quickly

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

* `ntl_bot_core.h`
* `ntl_bot_core.c`

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

* Browser globals
* Slither runtime variables
* Minified variable names
* The original mod environment

**For the C port, the logic has been cleaned and separated properly:**

* Runtime structs were created
* Geometry helpers were isolated
* Danger scanning was converted into pure functions
* Food scanning was converted into pure functions
* The adapter layer was kept game-specific

*This makes the bot logic easier to test, port, and integrate into other runtimes (like C).*

### Original NTL Function Map

See: `ORIGIN_MAP.md`

---

## 🎮 How This Would Be Implemented in a C Game Like Vlither

If vlither is written in C, real integration would happen in two layers.

### Layer 1: Adapter Layer

You need to extract the following data from vlither:

* Current player head position
* Player body segments
* Enemy snakes
* Enemy headings and speeds
* Food positions and mass
* World center and radius

*The adapter layer is responsible for converting game-specific data into the clean bot input format.*

### Layer 2: Control Output Layer

The bot decision must be mapped back into the game engine. Use the returned values like this:

* `aimAngle` ➔ turn packet / steering variable
* `target` ➔ desired world coordinate
* `boost` ➔ sprint / acceleration flag

*This keeps the bot brain separate from the actual game controls.*

---

> [!IMPORTANT]
> ### Important Note
> 
> 
> This folder is meant for bot logic extraction and clean porting.
> **It is not:**
> * An exact recreation of the original extension
> * A UI mod clone
> * A browser injector
> * A full NTL replacement
> 
> 
> This project specifically focuses on isolating the bot brain and making it easier to understand, port, and integrate.
