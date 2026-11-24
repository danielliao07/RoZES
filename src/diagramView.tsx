import { SCALE } from 'chyp2/lib/util';
import type { Layout, Pt, Gen } from './elkLayout';

//S-curve between each pair of neighbor points, flat at both ends, this is from chyp2 pathFor function in edgeView
function curvedPath(p: Pt[]): string {
    let d = `M ${p[0].x} ${p[0].y}`;
    for (let i = 1; i < p.length; i++) {
        const a = p[i - 1], b = p[i];
        d += ` C ${0.6 * a.x + 0.4 * b.x} ${a.y} ${0.4 * a.x + 0.6 * b.x} ${b.y} ${b.x} ${b.y}`;
    }
    return d;
}

//A cup or cap is drawn in its own gen space
//A cup has its ends on the right and bulges left, a cap has its ends on the left and bulges right
function arcPath(gen: Gen): string | null {
    if (gen.ports.length !== 2) return null;
    const [p, q] = [...gen.ports].sort((a, b) => a.y - b.y);
    const reach = gen.width * 0.45 * 4 / 3;   // use 0.8 to control how big bump is, 4/3 is because control points in bezier are 3/4 the way from curve
    const dir = gen.shape === 'cup' ? -1 : 1;
    return `M ${p.x} ${p.y} C ${p.x + dir * reach} ${p.y} ${q.x + dir * reach} ${q.y} ${q.x} ${q.y}`;
}

//get the shapes, with circle and triangle premade
function Outline({ gen }: { gen: Gen }) {
    if (gen.shape === 'cup' || gen.shape === 'cap') {
        const d = arcPath(gen);
        return d ? <path d={d} fill="none" stroke={gen.color} stroke-width={0.01 * SCALE} /> : null;
    }
    if (gen.shape === 'circle')
        return <circle cx={gen.x + gen.width / 2} cy={gen.y + gen.height / 2} r={gen.width / 2}
                       fill={gen.color} stroke="black" stroke-width={0.01 * SCALE} />;
    if (gen.shape === 'triangle')
        return <polygon points={`${gen.x},${gen.y} ${gen.x},${gen.y + gen.height} ${gen.x + gen.width},${gen.y + gen.height / 2}`}
                        fill={gen.color} stroke="black" stroke-width={0.01 * SCALE} />;
    return <rect x={gen.x} y={gen.y} width={gen.width} height={gen.height}
                        fill={gen.color} stroke="black" stroke-width={0.01 * SCALE} />;
}

export function DiagramView({layout}: { layout: Layout | null}) {
    if (!layout) return null;
    const m = 0.5 * SCALE;   // margin around the diagram
    const b = layout.bounds;
    return (
        <svg class="graph-svg" width={b.width + 2 * m} height={b.height + 2 * m}
             viewBox={`${b.x - m} ${b.y - m} ${b.width + 2 * m} ${b.height + 2 * m}`}>
            {layout.wires.map(w =>
                <path key={w.id} d={curvedPath(w.points)}
                      fill="none" stroke="black" stroke-width={0.01 * SCALE} />)}
            {layout.gens.map(gen =>
                <g key={gen.id}>
                    <Outline gen={gen} />
                    {gen.text && gen.shape !== 'cup' && gen.shape !== 'cap' ? (
                        <text x={gen.shape === 'triangle' ? gen.x + 0.4 * gen.width : gen.x + gen.width / 2}
                              y={gen.y + gen.height / 2}
                              text-anchor="middle" dominant-baseline="central"
                              font-size={gen.fontSize} font-family="sans-serif">
                            {gen.text}
                        </text>
                    ) : null}
                </g>)}
        </svg>
    );
}