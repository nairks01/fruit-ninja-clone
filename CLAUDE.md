# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Playing the Game

No build step required. Simply open `index.html` in a web browser to play the game. The game runs entirely client-side in vanilla JavaScript with no dependencies.

## Architecture Overview

The game is built as a single-page canvas-based application using an entity-component pattern:

- **Canvas rendering**: 800×600 canvas with 2D context used for all graphics
- **Entity classes**: `Fruit`, `Particle`, and `Slash` classes manage game objects with `update()` and `draw()` methods
- **Entity arrays**: `fruits[]`, `particles[]`, and `slashes[]` store active game objects
- **Game loop**: `requestAnimationFrame` continuously calls `update()` then `draw()` at 60fps

### Core Game Mechanics

**Fruit spawning & physics**: Fruits spawn from the bottom with random velocities and gravity. Each fruit rotates as it falls. `Fruit.update()` handles position, velocity, and bounds checking; `Fruit.draw()` renders as circles.

**Slicing system**: Mouse drag creates a line segment checked against each fruit's position. `isPointNearLine()` performs distance-from-point-to-line-segment geometry to detect intersections. Sliced fruits trigger particle effects and scoring.

**Particle system**: Explosion effects and visual feedback use `Particle` objects with gravity that spawn in radial patterns. Particles fade over ~30-50 frames and are removed from the array when `life` reaches 0.

**Game state**: Global variables track `score`, `combo` (consecutive hits), `misses` (out of 3 lives), and `gameRunning` flag. Combo resets when a fruit falls off-screen unsliced.

### File Structure

- `index.html`: Canvas element, score/combo/lives display, game over modal with restart button
- `style.css`: Gradient backgrounds, modal styling, combo animations (pulse, pop, burst)
- `game.js`: All game logic—entity classes, physics, input handling, game loop, state management

## Extending the Game

**Adding fruit types**: Add to `fruitTypes[]` array with `{ name, color, radius }` properties.

**Tweaking difficulty**: Adjust `spawnRate` (starts at 60, decreases by 2 per frame) and `maxMisses` (currently 3) to change pacing.

**Physics tuning**: Gravity (`vy += 0.3` in Fruit.update), friction, and fruit launch angles are in `spawnFruit()` and the Fruit class.

**Visual effects**: Particles are configured in `sliceFruit()` and `createExplosion()` with angle, speed, and duration. Combo feedback animations are in `style.css` and triggered by `showComboDisplay()`.

## Git Workflow

Three iterations have been completed:
1. **Initial commit**: Core gameplay mechanics (spawning, slicing, scoring)
2. **Second commit**: 3-life system with combo reset on missed fruits
3. **Final commit**: Combo animations, visual feedback, special effects

Future changes should follow this pattern: implement feature, test in browser, commit with a clear message describing the change.
