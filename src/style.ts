export type Shape = 'box' | 'square' | 'circle' | 'triangle' | 'cap' | 'cup';
export type BoxStyle = { shape: Shape; color: string, text: string };
export const FONT_SCALE = 0.3 * 0.6;

type Row = [label: string, inputs: string, outputs: string, newLabel: string, shape: string, color: string];
const TABLE: Row[] = [
    ['Z',     '0',  '2',  '',   'Cup',    'Black'],
    ['Z',     '2',  '0',  '',   'Cap',    'Black'],
    ['X',     '0',  '2',  '',   'Cup',    'Black'],
    ['X',     '2',  '0',  '',   'Cap',    'Black'],
    ['Z(.*)', '.*', '.*', '$1', 'Circle', 'Green'],
    ['X(.*)', '.*', '.*', '$1', 'Circle', 'Red'],
    ['H',     '.*', '.*', '',   'Square',    'Yellow'],
    // test words for the benchmark files, could delete later by changing benchmarks
    ['circle.*',   '.*', '.*', '', 'Circle',   'Green'],
    ['square.*',   '.*', '.*', '', 'Square',   'Red'],
    ['triangle.*', '.*', '.*', '', 'Triangle', 'Blue'],
];

const COLORS: Record<string, string> = {
    Black: '#000000', Green: '#98fb98', Red: '#ff2c2c', Blue: '#4169e1', Cyan: '#ccccff', Yellow: '#e8e337'
};
const SHAPES: Record<string, Shape> = {
    box: 'box', square: 'square', circle: 'circle', triangle: 'triangle', cup: 'cup', cap: 'cap',
};

const whole = (pattern: string) => new RegExp(`^(?:${pattern})$`); //regex syntax
const RULES = TABLE.map(([label, inputs, outputs, newLabel, shape, color]) => ({
    label: whole(label), inputs: whole(inputs), outputs: whole(outputs), newLabel,
    shape: SHAPES[shape.toLowerCase()] ?? 'box' as Shape,
    color: COLORS[color] ?? color,
}));

export function styleFor(label: string, inputs: number, outputs: number): BoxStyle {
    for (const r of RULES) {
        if (r.label.test(label) && r.inputs.test(String(inputs)) && r.outputs.test(String(outputs))) {
            const text = r.newLabel === '' ? label : label.replace(r.label, r.newLabel);
            return { shape: r.shape, color: r.color, text: text.trim() };
        }
    }
    //default is cyan rectangle
    return { shape: 'box', color: '#ccccff', text: label };
}