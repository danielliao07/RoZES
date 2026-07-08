import { Graph } from 'chyp2/lib/graph';
import { GraphView } from 'chyp2/gui/components/GraphView';
import {h} from 'preact';
import render from 'preact-render-to-string';
import * as fs from 'fs';


const f = Graph.gen('f', 2, 3);
const g = Graph.gen('g', 3, 1);
const h2 = Graph.gen('h2', 1, 4);
const fgh = f.compose(g).compose(h2);

const elementToVisualize = h(GraphView, { graph: fgh });
const fullMarkup = render(elementToVisualize);
let match = fullMarkup.match(/<svg[\s\S]*<\/svg>/);
let svgString = match ? match[0] : fullMarkup;

svgString = svgString.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');



fs.writeFileSync('src/test/testdiagramchyp2.svg', svgString);
console.log('wrote testdiagramchyp2.svg');