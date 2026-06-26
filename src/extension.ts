import * as vscode from 'vscode';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

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

    if (!api?.onProofStateChanged) {
        vscode.window.showErrorMessage('VSRocq API not available. Make sure you are using the modified fork.');
        return;
    }

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
            const messageText = stringOfPpString(pv.messages[0][1]);
            console.log(messageText);
            renderDiagram(context);
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


function renderDiagram(context: vscode.ExtensionContext) {
    const scriptPath = path.join(context.extensionPath, 'src', 'TensorRocqParsing.ipynb');
    const svgPath = path.join(context.extensionPath, 'src', 'test', 'testdiagram.svg');
    const python = spawn('python', [scriptPath]);

    python.stdout.on('data', (data) => {
        console.log('Python output:', data.toString());
    });

    python.stderr.on('data', (data) => {
        console.error('Python error:', data.toString());
    });

    python.on('close', (code) => {
        console.log('Python process exited with code:', code);
        if (code === 0) {
            showDiagram(context,svgPath);
        }
    });
}



function showDiagram(context: vscode.ExtensionContext, svgPath: string) {
    if (!diagramPanel) {
        diagramPanel = vscode.window.createWebviewPanel(
            'stringDiagram',
            'String Diagram',
            vscode.ViewColumn.Two,
            { enableScripts: true }
        );

        diagramPanel.onDidDispose(() => {
            diagramPanel = undefined;
        });
    }

    // Read the SVG file and display it
    const svgContent = fs.readFileSync(svgPath, 'utf8');
    diagramPanel.webview.html = `
        <!DOCTYPE html>
        <html>
        <body style="background: white; padding: 20px;">
            ${svgContent}
        </body>
        </html>
    `;
}

export function deactivate() {}