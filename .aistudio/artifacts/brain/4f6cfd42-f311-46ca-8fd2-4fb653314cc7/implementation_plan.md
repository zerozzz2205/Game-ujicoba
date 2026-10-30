# Vehicle-Relative GTA Driving Physics & Toggleable Chase POV

Upgrade the kei-truck snowplow movement from screen-aligned directional movement to authentic vehicle-relative ("GTA-style") driving physics with speed-dependent steering, braking, and reverse gear, paired with seamless toggling between a rotating behind-the-truck Chase POV and the Isometric village camera.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following design and gameplay decisions incorporate your confirmed preferences from our clarification step:

- **Confirmed Decision 1 — Realistic Speed-Based Car Steering & Reverse Gear**: `W` / `Up` applies forward throttle along the kei-truck's current nose heading, `S` / `Down` brakes when moving forward and shifts into reverse gear once stopped (or moving backward), and `A` / `D` (`Left` / `Right`) steers the front wheels. Turning rate scales naturally with forward/reverse speed and inverts steering yaw when backing up, just like a real vehicle in GTA.
- **Confirmed Decision 2 — Toggleable Camera Modes (`Chase` & `Isometric` + `[C]` Shortcut)**: Players can switch anytime between the **Chase POV** (camera smoothly orbits behind the truck's tail and looks down the road ahead) and **Isometric / Overview** modes via the HUD switcher or pressing `C`.
- **Recommended Default — Starting Camera & Reverse Visuals**: We will set the default camera mode to `Chase` so the POV immediately matches the truck's forward orientation out of the gate (while keeping `Isometric` and `Overview` one click or `C` press away), and add automatic white reverse tail-lights + backup synth beeps when reversing.

## 1. Overview & Core Concept

- **What It Does**: Transforms the kei-truck (`Hokkaido Kuma-Go`) into a true simulated vehicle where acceleration, braking, reverse, and steering operate relative to the truck's own chassis orientation rather than fixed screen axes.
- **Target Audience / Persona**: Players who want tactile, intuitive third-person driving mechanics where steering left (`A`) or right (`D`) turns the truck's front wheels and curves its trajectory naturally.
- **Key Value**: Eliminates directional disorientation when switching camera angles, adds satisfying physical weight (front-wheel visual steering angles, chassis pitch on braking/acceleration, body roll in turns, and reverse gear maneuvers), and makes lining up snow-plowing passes feel like driving a real miniature snowplow.

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Forward Plowing & Speed-Scaled Steering**: Pressing `W` or `ArrowUp` accelerates the truck forward in the direction its V-blade faces. Pressing `A`/`D` (`ArrowLeft`/`ArrowRight`) angles the front tires up to `±32°` and carves a smooth turning arc proportional to current velocity.
  2. **Braking & Reverse Gear Transition**: Pressing `S` or `ArrowDown` while rolling forward engages the brakes with a subtle forward nose-dive pitch. Continuing to hold `S` once velocity crosses zero engages reverse gear, illuminating rear backup lights and steering the tail in the pressed direction (`A`/`D`).
  3. **Instant Camera POV Toggle (`[C]` Key or Bottom Dock)**: Pressing `C` or clicking the camera selector pills in the bottom garage dock smoothly damps the camera between **Chase POV** (locked behind the truck's heading), **Isometric** (classic 45° winter village diorama angle), and **Overview** (wide tactical view).
- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Cozy anime cel-shaded winter village (*YukiPlow: Cozy Winter Express*).
  - *Color Palette & Mood*: Deep twilight slate canvas (`#162038`), warm cream & tangerine kei-truck livery (`#ff7847` / `#fff5e4`), golden lantern accents (`#ffd166`), and glacial blue deep snow drifts (`#93c5fd`).
  - *Typography & Hierarchy*: `Fredoka` display numerals and headers with dark cel-outlines, `Plus Jakarta Sans` UI controls, and `JetBrains Mono` (`tabular-nums`) for speed (`km/h`), gear indicator (`D` / `R` / `N`), combo multiplier, and Yen coins.
- **Interactive Feedback & Motion**:
  - **Front Tire Steering Pivots**: The two front wheels visibly pivot left/right in 3D as the player steers.
  - **Suspension Pitch & Roll**: Accelerating squats the rear suspension slightly; braking dips the front V-blade; sharp turns induce subtle lateral body roll damped back to level.

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Ackermann-Inspired Speed-Scaled Turning Curve**
  - *Chosen Approach*: Yaw rotation rate is computed as `steerAngle * (velocity / wheelBase) * gripFactor`, tapering slightly at top boost speed so the truck never spins uncontrollably, while requiring non-zero forward or reverse motion to change heading.
  - *Why*: Pure tank rotation (spinning in place at `0 km/h`) feels robotic, whereas speed-coupled turning with proper reverse inversion delivers the authentic GTA driving feel you requested.
  - *Alternatives Considered*: Instant tank pivot in place (rejected per your preference for realistic speed-based turning and reverse).
- **Decision 2: Pointer / Touch Drag Adaptation to Vehicle POV**
  - *Chosen Approach*: In addition to `WASD` / Arrow keys, dragging horizontally with the pointer steers the front wheels (`A`/`D` equivalent) while vertical drag controls throttle/brake (`W`/`S` equivalent).
  - *Why*: Ensures mouse and touch players also experience the exact same vehicle-relative GTA steering and reverse behavior.

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram**:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Game Shell & State Store                         │
│   Phase State · Upgrade Levels · Camera Mode (Chase | Isometric | Over) │
└───────────────────┬─────────────────────────────────┬───────────────────┘
                    │                                 │
                    ▼                                 ▼
┌───────────────────────────────────────┐ ┌───────────────────────────────┐
│     Vehicle Kinematics & 3D Loop      │ │    World-Matched Anime HUD    │
│  ┌─────────────────────────────────┐  │ │  ┌─────────────────────────┐  │
│  │ Unified Input Hub               │  │ │  │ Top-Center Telemetry    │  │
│  │  • W/Up: Forward Throttle       │  │ │  │  • Score & Combo Chain  │  │
│  │  • S/Down: Brake -> Reverse     │  │ │  │  • Boost Gauge & Speed  │  │
│  │  • A/D: Front Wheel Steer Angle │  │ │  │  • Gear Readout (D / R) │  │
│  │  • Space: Heater Boost          │  │ │  └─────────────────────────┘  │
│  │  • C Key: Cycle Camera POV      │  │ │  ┌─────────────────────────┐  │
│  └───────────────┬─────────────────┘  │ │  │ Bottom Garage & Cam Bar │  │
│                  ▼                    │ │  │  • [1-4] Live Upgrades  │  │
│  ┌─────────────────────────────────┐  │ │  │  • [C] Camera Toggle:   │  │
│  │ GTA Car Physics Solver          │  │ │  │    Chase | Iso | Over   │  │
│  │  • Signed Forward Velocity      │  │ │  └─────────────────────────┘  │
│  │  • Speed-Scaled Yaw & Slip      │  │ └───────────────────────────────┘
│  │  • Front Wheel Pivot & Body Roll│  │
│  │  • Chase Cam Heading Lock       │  │
│  └─────────────────────────────────┘  │
└───────────────────────────────────────┘
```

- **Data Model & State**:
  - **Vehicle Kinematic State**: Signed longitudinal velocity (`signedSpeed`, positive for forward drive, negative for reverse), front wheel steering angle (`steerAngle` in radians, damped toward input), chassis pitch/roll angles, and active gear (`'D' | 'R' | 'N'`).
  - **Camera Rig State**: `cameraPreset` (`'chase' | 'isometric' | 'overview'`), with exponential damping on camera position and look-at target so switching between `Chase` and `Isometric` glides smoothly without jarring cuts.
- **Interactive Component & State Mapping**:
  - **Keyboard `W/S/A/D` & Arrow Handlers**: Mutate longitudinal throttle/brake and steering angle inside the 60fps simulation step; update the 3D front wheel meshes' Y-rotation and chassis pitch/roll.
  - **Camera Mode Switcher (`[C]` Key & Bottom Dock Pills)**: Cycles `cameraPreset` between `Chase`, `Isometric`, and `Overview` and updates active pill styling in the HUD.
  - **Title & Control Hints**: Updated to highlight `WASD / Arrows Drive & Steer · Space Boost · C Camera POV`.
