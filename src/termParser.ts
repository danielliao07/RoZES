import {Graph} from "chyp2/lib/graph";

interface GenNode {
    type: "gen";
    data: string;
    insize: number[];
    outsize: number[];
}

interface ComposeNode {
    type: "compose";
    left: JsonTerm;
    right: JsonTerm;
}

interface StackNode {
    type: "stack";
    top: JsonTerm;
    bottom: JsonTerm;
}

interface SwapNode {
    type: "swap";
    top: number[];
    bottom: number[];
}

interface StructNode {
    type: "struct";
    data: SwapNode;
}

type JsonTerm =
    | GenNode
    | ComposeNode
    | StackNode
    | StructNode
    | SwapNode;

//Construct the permutation corresponding to swapping top wires with bottom wires.

function swapPerm(top: number[], bottom: number[]): number[] {
    const m = top.length;
    const n = bottom.length;

    return [
        ...Array.from({ length: m }, (_, i) => n + i),
        ...Array.from({ length: n }, (_, i) => i),
    ];
}

export function graphFromJsonRobust(node: JsonTerm): Graph {
    switch (node.type) {

        case "gen":
            return Graph.gen(
                node.data,
                node.insize.length,
                node.outsize.length
            );

        case "compose":
            return graphFromJsonRobust(node.left)
                .compose(graphFromJsonRobust(node.right));

        case "stack":
            return graphFromJsonRobust(node.top)
                .tensor(graphFromJsonRobust(node.bottom));

        case "struct":
            return graphFromJsonRobust(node.data);

        case "swap":
            return Graph.perm(
                swapPerm(node.top, node.bottom)
            );

        default:
            throw new Error(`Unknown type`);
    }
}