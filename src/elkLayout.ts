import ELK from 'elkjs/lib/elk.bundled.js';
import { Graph } from 'chyp2/lib/graph';
import { SCALE } from 'chyp2/lib/util';
import { styleFor, type Shape, FONT_SCALE } from './style';

//spacing settings in pixels, note direction RIGHT: columns are layers, will add orientation later
export type Spacing = {
    betweenLayers: number;   // horizontal gap between columns
    nodeNode: number;        // vertical gap between generators in a column
    edgeNode: number;        // clearance between wires and generators, can update in VSCode settings
}
export const DEFAULT_SPACING: Spacing = { betweenLayers: 100, nodeNode: 40, edgeNode: 25 };

export type Pt = { x: number; y: number };
//Gen is the invisible rectangular space where the objects are drawn over, in box case it's just exactly that rectangle
export type Gen = { id: number; x: number; y: number; width: number; height: number; label: string;
                       shape: Shape; color: string; text: string; ports: Pt[]; fontSize : number };
export type Wire = { id: number; points: Pt[] };
export type Layout = { gens: Gen[]; wires: Wire[]; bounds: { x: number; y: number; width: number; height: number } };

// Width of a label in pixels, uses browser html canvas
let ctx: CanvasRenderingContext2D | null = null;
function textWidth(label: string): number {
    const fontSize = FONT_SCALE * SCALE; //scale by box dim, also change font-size in diagramView
    if (typeof document === 'undefined') {return label.length * 0.55 * fontSize;}
    ctx ??= document.createElement('canvas').getContext('2d')!;
    ctx.font = `${fontSize}px sans-serif`;
    return ctx.measureText(label).width;
}

// The x coordinate of a Gen's edge at height y, on its left or right side, need this for aligning shapes in Gen space
function edgeX(b: Gen, y: number, side: 'left' | 'right'): number {
    const dy = Math.min(Math.abs(y - (b.y + b.height / 2)), b.height / 2);
    if (b.shape === 'circle') {
        const r = b.width / 2;
        const half = Math.sqrt(Math.max(0, r * r - dy * dy));
        const cx = b.x + r;
        return side === 'right' ? cx + half : cx - half;
    }
    if (b.shape === 'triangle' && side === 'right') {return b.x + b.width * (1 - dy / (b.height / 2));}
    return side === 'left' ? b.x : b.x + b.width;   // rectangles, squares, cups, caps, and the triangle's flat side
}

/**
 * Lay a chyp2 graph out with ELK and return what is needed to draw it:
 * every Gen with its position and size, and every wire as ELK's route, starting points and bend points
 * positions are in pixels, y pointing down, same pixel scale params chyp2 draws at
 */
export async function elkLayout(g: Graph, spacing: Spacing = DEFAULT_SPACING): Promise<Layout> {
    const prod = new Map<number, string>();   // wire -> the port that produces it
    const cons = new Map<number, string>();   // wire -> the port that consumes it, have to do this because elk doesnt store order of ports on the shape
    const children: any[] = [];

    // The diagram's inputs and outputs in order, Gens labelled as b1, b2, etc
    const boundary = (id: string, i: number, side: 'EAST' | 'WEST', layer: 'FIRST_SEPARATE' | 'LAST_SEPARATE') => ({
        id, width: 4, height: 4, x: 0, y: i * 40,
        layoutOptions: {
            'org.eclipse.elk.portConstraints': 'FIXED_SIDE',
            'org.eclipse.elk.layered.layering.layerConstraint': layer,
            'org.eclipse.elk.position': `(0, ${i * 40})`,
        },
        ports: [{ id: id + '.p', width: 1, height: 1, layoutOptions: { 'org.eclipse.elk.port.side': side } }],
    });
    g.inputs().forEach((v, i) => { children.push(boundary(`IN${i}`, i, 'EAST', 'FIRST_SEPARATE')); prod.set(v, `IN${i}.p`); });
    g.outputs().forEach((v, i) => { children.push(boundary(`OUT${i}`, i, 'WEST', 'LAST_SEPARATE')); cons.set(v, `OUT${i}.p`); });

    // Every Gen is a node sized to its text width, every input/output of a Gen is a port, in fixed order, as elk requires
    for (const e of g.edges()) {
        const d = g.edgeData(e);
        const ports: any[] = [];
        d.t.forEach((v, k) => {   // outputs: east side, top to bottom
            ports.push({ id: `b${e}.o${k}`, width: 1, height: 1,
                layoutOptions: { 'org.eclipse.elk.port.side': 'EAST', 'org.eclipse.elk.port.index': String(k) } });
            if (prod.has(v)) {throw new Error(`wire ${v} has more than one producer`);}
            prod.set(v, `b${e}.o${k}`);
        });
        d.s.forEach((v, j) => {   // inputs: west side, elk numbers that side bottom to top
            ports.push({ id: `b${e}.i${j}`, width: 1, height: 1,
                layoutOptions: { 'org.eclipse.elk.port.side': 'WEST', 'org.eclipse.elk.port.index': String(d.t.length + d.s.length - 1 - j) } });
            if (cons.has(v)) {throw new Error(`wire ${v} has more than one consumer`);}
            cons.set(v, `b${e}.i${j}`);
        });
        const style = styleFor(d.value, d.s.length, d.t.length);
        const w0 = Math.max(0.8 * SCALE, textWidth(style.text) + 0.3 * SCALE);
        const h0 = (d.boxSize() - 0.2) * SCALE;
        let width = w0, height = h0;
        if (style.shape === 'cup' || style.shape === 'cap') {
            width = 0.6 * SCALE; height = 1.2 * SCALE;
        } else if (style.shape === 'square') {
            width = height = Math.max(w0, h0);
        } else if (style.shape === 'box') {
            height = h0 * 0.65;
            width = w0 * 0.65;
        } else if (style.shape === 'circle') {
            width = height = Math.max(0.6 * SCALE, textWidth(style.text) + 0.1 * SCALE, 0.3 * SCALE * Math.max(d.s.length, d.t.length));
        }
        children.push({ id: `b${e}`, width, height,
            layoutOptions: { 'org.eclipse.elk.portConstraints': 'FIXED_ORDER' }, ports });
    }

    // Every wire is an edge from the port that produces it to the port that consumes it
    const edges = [...g.vertices()].filter(v => prod.has(v) && cons.has(v))
        .map(v => ({ id: `w${v}`, sources: [prod.get(v)!], targets: [cons.get(v)!] }));

    const result: any = await new (ELK as any)().layout({ //elk settings
        id: 'root',
        layoutOptions: {
            'org.eclipse.elk.algorithm': 'layered',
            'org.eclipse.elk.direction': 'RIGHT',
            'org.eclipse.elk.edgeRouting': 'POLYLINE',
            'org.eclipse.elk.separateConnectedComponents': 'false',
            'org.eclipse.elk.layered.crossingMinimization.semiInteractive': 'true',   // keeps the diagram's input/output order
            'org.eclipse.elk.spacing.nodeNode': String(spacing.nodeNode),
            'org.eclipse.elk.layered.spacing.nodeNodeBetweenLayers': String(spacing.betweenLayers),
            'org.eclipse.elk.spacing.edgeNode':  String(spacing.edgeNode),
            'org.eclipse.elk.layered.nodePlacement.bk.fixedAlignment': 'BALANCED' //doesnt guarantee centering because it takes the averaging of all alignments
        },
        children, edges,
    });

    //store elks gen outputs with textwidth, dimensions, and stores elks wire outputs with start, end, and bend points to pass to renderer
        const gens: Gen[] = result.children.filter((n: any) => n.id.startsWith('b')).map((n: any) => {
            const id = Number(n.id.slice(1));
            const d = g.edgeData(id);
            const style = styleFor(d.value, d.s.length, d.t.length);
            const base = FONT_SCALE * SCALE;
            const room = style.shape === 'circle' ? 0.85 * n.width       //the text sits across the circle's middle, where it is widest
                : style.shape === 'triangle' ? 0.55 * n.width     //the text sits in the wide left part
                : n.width - 0.10 * SCALE;                          //padding on each side
            const fontSize = Math.min(base, base * room / Math.max(1, textWidth(style.text)), 0.5 * n.height);
            return { id, x: n.x, y: n.y, width: n.width, height: n.height, label: d.value,
                    shape: style.shape, color: style.color, text: style.text, ports: [] as Pt[], fontSize };
        });
    const genById = new Map(gens.map(b => [b.id, b]));
    //The gen that a port id like "b12.o0" belongs to, undefined for diagram's own inputs and outputs.
    const genOfPort = (port: string) => port.startsWith('b') ? genById.get(Number(port.slice(1).split('.')[0])) : undefined;
    const wires: Wire[] = result.edges.map((w: any) => {
        const s = w.sections[0];
        const points: Pt[] = [{ ...s.startPoint }, ...(s.bendPoints ?? []), { ...s.endPoint }];
        const last = points.length - 1;
        const from = genOfPort(w.sources[0]), to = genOfPort(w.targets[0]);
        if (from) {
            points[0].x = edgeX(from, points[0].y, 'right');
            if (from.shape === 'cup') {from.ports.push(points[0]);}   // a cup's arc joins its two wire ends, rendered in diagramView, same for cap
        }
        if (to) {
            points[last].x = edgeX(to, points[last].y, 'left');
            if (to.shape === 'cap') {to.ports.push(points[last]);}    
        }
        return { id: Number(w.id.slice(1)), points };
    });
    const xs = [...gens.flatMap(b => [b.x, b.x + b.width]), ...wires.flatMap(w => w.points.map(p => p.x))];
    const ys = [...gens.flatMap(b => [b.y, b.y + b.height]), ...wires.flatMap(w => w.points.map(p => p.y))];
    const x = Math.min(...xs), y = Math.min(...ys);
    return { gens, wires, bounds: { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y } };
}