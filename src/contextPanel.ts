import * as vscode from 'vscode';
import { setProjectContext, getProjectContext } from './projectContext';

export class ContextPanel {
    public static currentPanel: ContextPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;

        // Set the webview's initial html content
        this._panel.webview.html = this._getHtmlForWebview(this._panel.webview);

        // Listen for when the panel is disposed
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(
            message => {
                switch (message.type) {
                    case 'saveContext':
                        setProjectContext(message.context);
                        //console.log("CONTEXT SAVED");
                        vscode.window.showInformationMessage('Project requirements saved!');
                        return;
                    case 'loadContext':
                        //console.log("CONTEXT LOADED");
                        this._panel.webview.postMessage({
                            type: 'contextLoaded',
                            context: getProjectContext()
                        });
                        return;
                }
            },
            null,
            this._disposables
        );
    }

    public static createOrShow(extensionUri: vscode.Uri) {
        // If we already have a panel, show it
        if (ContextPanel.currentPanel) {
            ContextPanel.currentPanel._panel.reveal(vscode.ViewColumn.Beside);
            return;
        }

        // Otherwise, create a new panel
        const panel = vscode.window.createWebviewPanel(
            'antislopContext',
            'AntiSlop Project Requirements',
            vscode.ViewColumn.Beside,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        ContextPanel.currentPanel = new ContextPanel(panel, extensionUri);
    }

    public dispose() {
        ContextPanel.currentPanel = undefined;

        // Clean up our resources
        this._panel.dispose();

        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Project Requirements</title>
    <style>
        body {
            padding: 20px;
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
        }
        h1 {
            font-size: 1.5em;
            margin-bottom: 10px;
        }
        .description {
            margin-bottom: 20px;
            color: var(--vscode-descriptionForeground);
        }
        textarea {
            width: 100%;
            min-height: 300px;
            padding: 10px;
            font-family: var(--vscode-editor-font-family);
            font-size: var(--vscode-editor-font-size);
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
            resize: vertical;
        }
        textarea:focus {
            outline: 1px solid var(--vscode-focusBorder);
        }
        .button-container {
            margin-top: 15px;
            display: flex;
            gap: 10px;
        }
        button {
            padding: 8px 16px;
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        .secondary {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }
        .secondary:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
        }
    </style>
</head>
<body>
    <h1>Project Requirements</h1>
    <p class="description">
        Describe your project requirements, goals, and any important context. 
        This information will be used by AntiSlop to provide a better tutoring experience.
    </p>
    
    <textarea id="contextInput"></textarea>
    
    <div class="button-container">
        <button id="saveBtn">Save Requirements</button>
        <button id="clearBtn" class="secondary">Clear</button>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        const textarea = document.getElementById('contextInput');
        const saveBtn = document.getElementById('saveBtn');
        const clearBtn = document.getElementById('clearBtn');

        // Load existing context on startup
        window.addEventListener('load', () => {
            vscode.postMessage({ type: 'loadContext' });
        });

        // Receive messages from extension
        window.addEventListener('message', event => {
            const message = event.data;
            if (message.type === 'contextLoaded') {
                textarea.value = message.context;
            }
        });

        saveBtn.addEventListener('click', () => {
            vscode.postMessage({
                type: 'saveContext',
                context: textarea.value
            });
        });

        clearBtn.addEventListener('click', () => {
            textarea.value = '';
            vscode.postMessage({
                type: 'saveContext',
                context: ''
            });
        });
    </script>
</body>
</html>`;
    }
}
