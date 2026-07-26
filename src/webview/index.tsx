import { render } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { GraphPanels, GraphView } from 'chyp2/gui/components/GraphView';
import { graphFromJson } from 'chyp2/lib/graph';
import {Graph} from 'chyp2/lib/graph';
//import Splitpane from 'chyp2/gui/components/Splitpane';
import { convexLayout } from 'chyp2/lib/layout';

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
    const [lhsScale, setLhsScale] = useState(1);
    const [rhsScale, setRhsScale] = useState(1);
    useEffect(() => {
        vscode.postMessage({ type: 'ready' });
        const handler = (event: MessageEvent) => {
            const msg:DiagramMessage = event.data;
            const lhsGraph = graphFromJson(JSON.stringify(msg.lhs));
            convexLayout(lhsGraph, true);
            setLhs(lhsGraph);
            setLhsScale(1);
            
            if (msg.rhs) {
                const rhsGraph = graphFromJson(JSON.stringify(msg.rhs));
                convexLayout(rhsGraph, true);
                setRhs(rhsGraph);
                setRhsScale(1);
            } else {
                setRhs(null);
            }
        };
        window.addEventListener('message', handler);
        return () => window.removeEventListener('message', handler);
    }, []);
    
    /*if (rhs) {
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
    */
   const makeWheelHandler = (setScale: (fn: (s: number) => number) => void) => 
        (e: WheelEvent) => {
            if (e.ctrlKey) {  // pinch gesture on trackpad
                e.preventDefault();
                setScale(s => Math.max(0.1, Math.min(5, s - e.deltaY * 0.01)));
            }
            // normal scroll falls through to overflow: auto
        };

   const content = rhs ? (
    <div style={{ display: 'flex', width: '100%', height: '100vh' }}>
        <div 
            style={{ flex: 1, height: '100%', overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onWheel={makeWheelHandler(setLhsScale) as any}
        >
            <div style={{ transform: `scale(${lhsScale})`, transformOrigin: 'center center' }}>
                <GraphView graph={lhs} />
            </div>
        </div>
        <div style={{ flexShrink: 0, padding: '0 16px', fontSize: '48px', fontWeight: 'bold', color: 'black', background: 'white', display: 'flex', alignItems: 'center' }}>
            =
        </div>
        <div 
            style={{ flex: 1, height: '100%', overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onWheel={makeWheelHandler(setRhsScale) as any}
        >
            <div style={{ transform: `scale(${rhsScale})`, transformOrigin: 'center center' }}>
                <GraphView graph={rhs} />
            </div>
        </div>
    </div>
    ) : (
        <div 
            style={{ width: '100%', height: '100vh', overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onWheel={makeWheelHandler(setLhsScale) as any}
        >
            <div style={{ transform: `scale(${lhsScale})`, transformOrigin: 'center center' }}>
                <GraphView graph={lhs} />
            </div>
        </div>
    );

    return <>{content}</>;

}

render(<App />, document.getElementById('root')!);