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
            <div style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center' }}>
            <div style={{ flex: 1, height: '100%' }}>
                <GraphView graph={lhs} />
            </div>
            <div style={{ 
                flexShrink: 0, 
                padding: '0 16px', 
                fontSize: '48px', 
                fontWeight: 'bold',
                color: 'black',
                background: 'white'
            }}>
                =
            </div>
            <div style={{ flex: 1, height: '100%' }}>
                <GraphView graph={rhs} />
            </div>
        </div>
        );
    }

    return <GraphView graph={lhs} />;
}

render(<App />, document.getElementById('root')!);