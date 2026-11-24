# RoZES README

Robust ZX-Calculus Extension for String-diagrams (RoZES) is a VSCode extension designed to robustly render the ZX-calculus graphically as string diagrams. The visualization is achieved via [chyp2](https://github.com/akissinger/chyp2.git), [TensorRocq](https://github.com/inQWIRE/TensorRocq), and [VyZX](https://github.com/inQWIRE/VyZX). Presently, RoZES renders diagrams by parsing JSON messages sent via VSRocq and triggered with **Ltac2** or with a tactic such as **zxsviz** in a Rocq file. Diagrams are laid out with [ELK](https://eclipse.dev/elk/) via [elkjs](https://github.com/kieler/elkjs).

## Features

RoZES runs live while stepping through Rocq proofs: the **String Diagram** panel displays the current diagram state as equations with an '=' sign between them. The user can scroll up and down on either side of the diagram, as well as zoom in and out using pinch-to-zoom. There is full support for rendering symmetric monoidal diagrams.

| Setting | Default | Functionality |
|---|---|---|
| `rozes.layout.columnGap` | 100 | Horizontal gap between columns of boxes (pixels) |
| `rozes.layout.boxGap` | 40 | Vertical gap between boxes in the same column (pixels) |
| `rozes.layout.wireClearance` | 25 | Clearance between wires and boxes (pixels) |

The diagram live updates when you change a setting.

## Requirements

### VSCode Extensions
[VSRocq](https://marketplace.visualstudio.com/items?itemName=rocq-prover.vsrocq) can be installed easily through the instructions on its page.

### Rocq Setup
For now, this extension requires a `coq-8.20` opam switch with the following packages:

1. **TensorRocq** (`sized-graphs` branch):
```bash
   opam switch create coq-8.20 ocaml-base-compiler.4.14.2
   eval $(opam env --switch=coq-8.20)
   opam install coq.8.20.0
   opam pin add rocq-tensors git+https://github.com/inQWIRE/TensorRocq.git#sized-graphs
```

2. **VyZX** and dependencies:
```bash
   opam repo add coq-released https://coq.inria.fr/opam/released
   opam update
   opam install coq-quantumlib
   opam pin -y coq-sqir https://github.com/inQWIRE/SQIR.git
   opam pin -y coq-voqc https://github.com/inQWIRE/SQIR.git
   opam pin -y coq-vyzx https://github.com/inQWIRE/VyZX.git
```

3. **TensorRocqEx** is the examples package with the `zxsviz` tactic:
```bash
   opam pin add rocq-tensors-examples git+https://github.com/inQWIRE/TensorRocq.git#sized-graphs
   opam install rocq-tensors-examples
```


## Known Issues

For now, cups and caps are drawn only for Z and X spiders with 0 inputs and 2 outputs, or 2 inputs and 0 outputs. There may also be inapt text sizing for nodes with large numbers of ports.

## Release Notes

### 0.0.3

Support for the Hadamard generator is added as a yellow square labelled 'H'.

### 0.0.2

Diagrams are now laid out with ELK and drawn by a simple custom SVG rendering, improving readability. Z and X spiders are drawn as circles, with cups and caps as arcs, and the layout spacing can be changed in the settings. See the changelog for details.

### 0.0.1

Initial release


## Related Projects

-[SQIR](https://github.com/inQWIRE/SQIR), small quantum intermediate representation

## Acknowledgements

RoZES includes these libraries:

- [elkjs](https://github.com/kieler/elkjs), a JavaScript build of the Eclipse Layout Kernel, licensed EPL-2.0
- [chyp2](https://github.com/akissinger/chyp2), licensed Apache-2.0
- [Preact](https://preactjs.com/), licensed MIT

## License

MIT

