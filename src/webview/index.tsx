import { render } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { GraphView } from 'chyp2/gui/components/GraphView';
import { graphFromJson } from 'chyp2/lib/graph';
import {Graph} from 'chyp2/lib/graph';
import Splitpane from 'chyp2/gui/components/Splitpane';

declare function acquireVsCodeApi(): { postMessage: (msg: unknown) => void };
let vscode:{ postMessage: (msg: unknown) => void };
try {
    vscode = acquireVsCodeApi();
    (window as any).vscode = vscode;
} catch (error) {
    vscode = (window as any).vscode;
}

interface DiagramMessage {
    lhs: object;
    rhs?: object;  // only present for equations
}

function App() {
    const [lhs, setLhs] = useState<Graph | null>(null);
    const [rhs, setRhs] = useState<Graph | null>(null);
    useEffect(() => {
        vscode.postMessage({ type: 'ready' });
        const handler = (event: MessageEvent) => {
            const msg:DiagramMessage = event.data;
            setLhs(graphFromJson(JSON.stringify(msg.lhs)));
            if (msg.rhs) {
                setRhs(graphFromJson(JSON.stringify(msg.rhs)));
            } else {
                setRhs(null);
            }
        };
        window.addEventListener('message', handler);
        return () => window.removeEventListener('message', handler);
    }, []);
    
    if (rhs) {
        return (
            <Splitpane orientation="horizontal">
                <GraphView graph={lhs} />
                <GraphView graph={rhs} />
            </Splitpane>
        );
    }

    return <GraphView graph={lhs} />;
}

render(<App />, document.getElementById('root')!);