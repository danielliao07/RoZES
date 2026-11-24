# Change Log

All notable changes to RoZES will be documented in this file.


## [0.0.2] - 2026-11-23

### Changed
- Layout is now computed with [ELK](https://eclipse.dev/elk/) (through [elkjs](https://github.com/kieler/elkjs)), and diagrams are drawn by a small custom SVG view. chyp2 is now only used to build the graph from the JSON message sent by Rocq.
- Labels are scaled down to fit inside their boxes.
- Scrolling bar moved to be less obstructive to UI.

### Added
- Z and X spiders are drawn as green and red circles, with the phase as the label.
- A Z or X with 0 inputs and 2 outputs, or 2 inputs and 0 outputs, is drawn as a cup or a cap (an arc joining its two wire ends). See `src/style.ts` for drawing rules.
- Shapes and colors are chosen by a rules table (`src/style.ts`) that matches on a generator's label and its number of inputs and outputs. It also supports squares and triangles. Support added for shapes, including triangles, squares, and circles, and various colors.
- VSCode settings `rozes.layout.columnGap`, `rozes.layout.boxGap` and `rozes.layout.wireClearance` control the spacing, and the diagram live updates upon changes. Go to `File -> Preferences -> Settings`, then search for `rozes`. These three options should appear.

### Removed
- Placeholder "Hello World" command.

## [0.0.1] - 2026-07-29

### Initial Release
- Live string diagram rendering from Rocq proofs via VSRocq
- Equation view with LHS and RHS side by side
- ZX-calculus diagram support via VyZX and TensorRocq
- Symmetric monoidal diagram support via TensorRocq
- Scroll to navigate, pinch/Ctrl+scroll to zoom
- Convex layout via chyp2
