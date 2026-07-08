import { Graph } from 'chyp2/lib/graph';
import { GraphView } from 'chyp2/gui/components/GraphView';
import { h } from 'preact';
import render from 'preact-render-to-string';

// Converts a chyp2 Graph into a standalone SVG string
export function graphToSvgString(graph: Graph): string {
    const element = h(GraphView, { graph });
    const fullMarkup = render(element);

    const match = fullMarkup.match(/<svg[\s\S]*<\/svg>/);
    let svgString = match ? match[0] : fullMarkup;

    svgString = svgString.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    return svgString;
}

export function graphToJson(g: Graph): object {
    const vertices: Record<string, object> = {};
    const edges: Record<string, object> = {};
    
    for (const [id, vd] of g.vdata) {
        vertices[String(id)] = { x: vd.x, y: vd.y, value: vd.value };
    }
    
    for (const [id, ed] of g.edata) {
        edges[String(id)] = { 
            s: ed.s.map(String), 
            t: ed.t.map(String), 
            value: ed.value, 
            x: ed.x, 
            y: ed.y 
        };
    }
    
    return {
        vertices,
        edges,
        inputs: g.inputs().map(String),
        outputs: g.outputs().map(String)
    };
}