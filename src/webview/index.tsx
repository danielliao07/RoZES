import { h, render } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { GraphView } from 'chyp2/gui/components/GraphView';
import { graphFromJson } from 'chyp2/lib/graph';
import {Graph} from 'chyp2/lib/graph';

declare function acquireVsCodeApi(): { postMessage: (msg: unknown) => void };
const vscode = acquireVsCodeApi();

function App() {
    const [graph, setGraph] = useState<Graph | null>(null);

    useEffect(() => {
        vscode.postMessage({ type: 'ready' });
        window.addEventListener('message', event => {
            console.log('webview received graph data:', event.data);
            console.log('webview mounted');
            const g = graphFromJson(JSON.stringify(event.data));
            setGraph(g);
        });
    }, []);
    
    return <GraphView graph={graph} />;
}

render(<App />, document.getElementById('root')!);