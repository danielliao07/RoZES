import * as fs from 'fs';
import { h } from 'preact';
import render from 'preact-render-to-string';
import { graphFromJsonRobust } from '../termParser';
import { elkLayout } from '../elkLayout';
import { DiagramView } from '../diagramView';

async function main() {
    let html = '<!doctype html><meta charset="utf-8"><body style="font-family:sans-serif">';
    for (const f of fs.readdirSync('benchmarks').filter(f => f.endsWith('.json') && f !== 'baseline.json').sort()) {
        let text = fs.readFileSync('benchmarks/' + f, 'utf8');
        text = text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1);   // allows pasted Rocq output around the JSON
        const json = JSON.parse(text);
        const terms: any[] = json.type === 'equation' ? json.data : [json.data];
        html += `<h3>${f}</h3><div style="display:flex;align-items:center;gap:24px;overflow:auto;zoom:0.6">`;
        for (let i = 0; i < terms.length; i++) {
            const layout = await elkLayout(graphFromJsonRobust(terms[i]));
            html += (i > 0 ? '<span style="font-size:48px">=</span>' : '') + render(h(DiagramView, { layout }));
        }
        html += '</div>';
    }
    fs.writeFileSync('dist/preview.html', html);
    console.log('wrote dist/preview.html');
}
main();
