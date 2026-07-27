# RoZES README

Robust ZX-Calculus Extension for String-diagrams (RoZES) is a VSCode extension designed to robustly render the ZX-calculus graphically as string diagrams. The visualization is achieved via [chyp2](https://github.com/akissinger/chyp2.git), [TensorRocq](https://github.com/inQWIRE/TensorRocq), and [VyZX](https://github.com/inQWIRE/VyZX). Presently, RoZES renders diagrams by parsing JSON messages sent via VSRocq and triggered with **Ltac2** or with a tactic such as **zxsviz** in a Rocq file.

## Features

RoZES runs live while stepping through Rocq proofs: the **String Diagram** panel displays the current diagram state as equations with an '=' sign between them. The user can scroll up and down on either side of the diagram, as well as zoom in and out using pinch-to-zoom. There is full support for rendering symmetric monoidal diagrams.

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

In the future, support for non-symmetric monoidal diagrams (e.g., cups and caps) will be added, and chyp2 layout elements will be polished and made more user-friendly (some diagrams are very tall).

## Release Notes

### 0.0.1

Initial release


## Related Projects

-[SQIR](https://github.com/inQWIRE/SQIR), small quantum intermediate representation

## License

MIT

