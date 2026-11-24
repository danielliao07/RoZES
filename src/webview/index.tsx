import { render } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { graphFromJson } from 'chyp2/lib/graph';
import { elkLayout, type Layout, type Spacing } from '../elkLayout';
import { DiagramView} from '../diagramView';


declare function acquireVsCodeApi(): { postMessage: (msg: unknown) => void };
let vscode:{ postMessage: (msg: unknown) => void };
try {
    vscode = acquireVsCodeApi();
    (window as any).vscode = vscode;
} catch (error) {
    vscode = (window as any).vscode;
}

type DiagramMessage = {
    lhs: object;
    rhs?: object;  // only for equations
    spacing?: Spacing;
}

function App() {
    const [lhs, setLhs] = useState<Layout | null>(null);
    const [rhs, setRhs] = useState<Layout | null>(null);
    const [lhsScale, setLhsScale] = useState(1);
    const [rhsScale, setRhsScale] = useState(1);
    useEffect(() => {
        vscode.postMessage({ type: 'ready' });
        const handler = async (event: MessageEvent) => {
            const msg: DiagramMessage = event.data;
            try {
                setLhs(await elkLayout(graphFromJson(JSON.stringify(msg.lhs)), msg.spacing));
                setLhsScale(1);
                if (msg.rhs) {
                    setRhs(await elkLayout(graphFromJson(JSON.stringify(msg.rhs)), msg.spacing));
                    setRhsScale(1);
                } else {
                    setRhs(null);
                }
            } catch (err) {
                console.error('ELK layout failed', err);
            }
        };
        window.addEventListener('message', handler);
        return () => window.removeEventListener('message', handler);
    }, []);

    const makeWheelHandler = (setScale: (fn: (s: number) => number) => void) =>
        (e: WheelEvent) => {
            if (e.ctrlKey) {  // pinch gesture on trackpad
                e.preventDefault();
                setScale(s => Math.max(0.1, Math.min(5, s - e.deltaY * 0.01)));
            }
        };

    const content = rhs ? (
        <div style={{ display: 'flex', width: '100%', height: '100vh' }}>
            <div style={{ flex: 1, height: '100%', overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', direction: 'rtl' }}
                onWheel={makeWheelHandler(setLhsScale) as any}
            >
                <div style={{ width: '100%', height: '100%', direction: 'ltr', transform: `scale(${lhsScale})`, transformOrigin: 'center center' }}> 
                    <DiagramView layout={lhs} />
                </div>
            </div>
            <div style={{ flexShrink: 0, padding: '0 16px', fontSize: '48px', fontWeight: 'bold', color: 'black', background: 'white', display: 'flex', alignItems: 'center' }}>
                =
            </div>
            <div
                style={{ flex: 1, height: '100%', overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onWheel={makeWheelHandler(setRhsScale) as any}
            >
                <div style={{ width: '100%', height: '100%', transform: `scale(${rhsScale})`, transformOrigin: 'center center' }}>
                    <DiagramView layout={rhs} />
                </div>
            </div>
        </div>
    ) : (
        <div
            style={{ width: '100%', height: '100vh', overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onWheel={makeWheelHandler(setLhsScale) as any}
        >
            <div style={{ width: '100%', height: '100%', transform: `scale(${lhsScale})`, transformOrigin: 'center center' }}>
                <DiagramView layout={lhs} />
            </div>
        </div>
    );

    return <>{content}</>;
}

render(<App />, document.getElementById('root')!);