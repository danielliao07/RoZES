import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { Graph } from 'chyp2/lib/graph';
import { graphToSvgString, graphToJson } from './chypRender';
import { graphFromJsonRobust } from './termParser';

let diagramPanel: vscode.WebviewPanel | undefined;

export async function activate(context: vscode.ExtensionContext) {
    console.log('string-diagrams activating');
    vscode.window.showInformationMessage('string-diagrams activated');

    // Get the VSRocq fork
    const vsrocq = vscode.extensions.getExtension('rocq-prover.vsrocq');
    
    if (!vsrocq) {
        vscode.window.showErrorMessage('VSRocq extension not found. Please install it.');
        return;
    }

    // Activate it (or get it if already active)
    const api = await vsrocq.activate();

    vscode.window.showInformationMessage('string-diagrams connected to VSRocq!');

    // Listen for proof state changes
    context.subscriptions.push(
        api.onProofStateChanged((pv: any) => {
            if (!pv.proof || pv.proof.goals.length === 0) {
                // hide the panel when pv.proof is null, should be when outside proof
                if (diagramPanel) {
                    diagramPanel.dispose();
                }
                return;
            }
            const goalText = stringOfPpString(pv.proof.goals[0].goal);
            console.log(goalText); // prints goal text

            //just hedge everything
            if (!pv.messages || pv.messages.length === 0 || !pv.messages[0]) {
                return;
            }
            const messageText = stringOfPpString(pv.messages[0][1]);
            console.log(messageText);

            // TEMPORARY: hardcoded graph 
            //const f = Graph.gen('f', 2, 3);
            //const g = Graph.gen('g', 3, 1);
            //const h = Graph.gen('h', 1, 4);
            //const testGraph = f.compose(g).compose(h);

            

            if (!messageText.trim().startsWith("{")) {
                if (messageText) {
                    vscode.window.showErrorMessage('Unrecognized message text');
                };
                return;
            }

            const json = JSON.parse(messageText);

            if (json.type !== "diagram") {
                return;
            }

            const graph = graphFromJsonRobust(json.data);
            renderDiagram(context, graph);
        })
    );
}

//Get pp data nicely
export const stringOfPpString = (pp: any): string => {
    switch (pp[0]) {
        case "Ppcmd_empty":
            return "";
        case "Ppcmd_string":
            return pp[1];
        case "Ppcmd_glue":
            return pp[1].map((p:any) => stringOfPpString(p)).join("");
        case "Ppcmd_box":
            return stringOfPpString(pp[2]);
        case "Ppcmd_tag":
            return stringOfPpString(pp[2]);
        case "Ppcmd_print_break":
            return " ".repeat(pp[1]);
        case "Ppcmd_force_newline":
            return "\n";
        case "Ppcmd_comment":
            return pp[1].join(" ");
        default:
            return "";
    }
};


function renderDiagram(context: vscode.ExtensionContext, graph: Graph) {
    const graphData = graphToJson(graph);
    showDiagram(context, graphData);
}

let loadingGraphData: object | null = null;

function showDiagram(context: vscode.ExtensionContext, graphData: object) {
    loadingGraphData = graphData;
    if (!diagramPanel) {
        diagramPanel = vscode.window.createWebviewPanel(
            'stringDiagram',
            'String Diagram',
            vscode.ViewColumn.Two,
            { enableScripts: true,
            localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'dist')]
             }
        );

        diagramPanel.onDidDispose(() => {
            diagramPanel = undefined;
        });

        //load webview
        const webviewJsUri = diagramPanel.webview.asWebviewUri(
        vscode.Uri.joinPath(context.extensionUri, 'dist', 'webview.js')
    );

    diagramPanel.webview.html = `
        <!DOCTYPE html>
        <html>
        <head>
        <meta charset="UTF-8">
        <style>
            body { margin: 0; padding: 0; background: #ac5e2d; }
            .graph-panel { width: 100%; height: 100%; background: white; }
        </style>
        </head>
        <body>
            <div id="root"></div>
            <script src="${webviewJsUri}"></script>
        </body>
        </html>
    `;


    // Wait for webview to signal it's ready, then send the graph
        diagramPanel.webview.onDidReceiveMessage(msg => {
            console.log('received message from webview:', msg);
            if (msg.type === 'ready' && loadingGraphData) {
                console.log('webview ready');
                diagramPanel!.webview.postMessage(loadingGraphData);
                console.log(graphData);
                console.log(loadingGraphData);
            }
        });
    } else {

    diagramPanel.webview.postMessage(graphData);

    }
}

function showError(context: vscode.ExtensionContext, message: string) {
    if (!diagramPanel) {
        diagramPanel = vscode.window.createWebviewPanel(
            'stringDiagram',
            'String Diagram',
            vscode.ViewColumn.Two,
            {
                enableScripts: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(context.extensionUri, 'dist')
                ]
            }
        );

        diagramPanel.onDidDispose(() => {
            diagramPanel = undefined;
        });
    }

    diagramPanel.webview.html = `
        <!DOCTYPE html>
        <html>
        <body>
            <h2>Not a recognized string diagram</h2>
            <p>${message}</p>
        </body>
        </html>
    `;
}

export function deactivate() {}