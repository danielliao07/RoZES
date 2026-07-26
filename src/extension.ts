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
    // Get VSRocq
    const vsrocq = vscode.extensions.getExtension('rocq-prover.vsrocq');
    
    if (!vsrocq) {
        vscode.window.showErrorMessage('VSRocq extension not found. Please install it.');
        return;
    }

    // Activate it (or get it if already active)
    const api = await vsrocq.activate();

    //Just for testing
    console.log(Object.keys(api));

    vscode.window.showInformationMessage('string-diagrams connected to VSRocq!');

    // Listen for proof state changes
    context.subscriptions.push(
        api.onProofStateChanged((pv: any) => {
            if (!pv.proof) {
                // hide the panel when pv.proof is null, should be when outside proof
                if (diagramPanel) {
                    diagramPanel.dispose();
                }
                return;
            }
            //const goalText = stringOfPpString(pv.proof.goals[0].goal);
            //console.log(goalText); // prints goal text

            //just hedge everything
            if (!pv.messages || pv.messages.length === 0 || !pv.messages[0]) {
                return;
            }
            const messageText = stringOfPpString(pv.messages[0][1]);
            console.log(messageText);


            const rawText = messageText.trim();
            const jsonStr = rawText.startsWith("RENDER PRO:") 
                ? rawText.slice("RENDER PRO:".length).trim()
                : rawText;

            if (!jsonStr.startsWith("{")) {
                if (messageText) {
                    vscode.window.showErrorMessage('Unrecognized message text');
                };
                return;
            }

            const json = JSON.parse(jsonStr);

            if (json.type !== "diagram" && json.type !== "equation") {
                return;
            }

            if (json.type === "equation") {
                const lhs = graphToJson(graphFromJsonRobust(json.data[0]));
                const rhs = graphToJson(graphFromJsonRobust(json.data[1]));
                showDiagram(context, { lhs, rhs });
            } else {
                const graph = graphToJson(graphFromJsonRobust(json.data));
                showDiagram(context, { lhs: graph });
            }
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


let loadingGraphData: {lhs: object, rhs?: object} | null = null;

function showDiagram(context: vscode.ExtensionContext, graphData: {lhs:object, rhs?:object}) {
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
            body { margin: 0; padding: 0; height: 100%; background: #ffffff; } #root {height: 100%;}
            .graph-panel {
                width: 100%;
                height: 100%;
                background: white;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .graph-svg {
                width: 100%; !important
                height: 100%; !important
                max-height: 100vh;
            }
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