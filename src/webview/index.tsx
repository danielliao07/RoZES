import { h, render } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { GraphView } from 'chyp2/gui/components/GraphView';
import { graphFromJson } from 'chyp2/lib/graph';
import {Graph} from 'chyp2/lib/graph';

declare function acquireVsCodeApi(): { postMessage: (msg: unknown) => void };
let vscode:{ postMessage: (msg: unknown) => void };
try {
    vscode = acquireVsCodeApi();
    (window as any).vscode = vscode;
} catch (error) {
    vscode = (window as any).vscode;
}

function App() {
    const [graph, setGraph] = useState<Graph | null>(null);
    useEffect(() => {
        vscode.postMessage({ type: 'ready' });
        const handler = (event: MessageEvent) => {
            const g = graphFromJson(JSON.stringify(event.data));
            setGraph(g);
        };
        window.addEventListener('message', handler);
        return () => window.removeEventListener('message', handler);
    }, []);
    
    return <GraphView graph={graph} />;
}

render(<App />, document.getElementById('root')!);