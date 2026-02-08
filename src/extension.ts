// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import { queryFeedback } from './providerQuery'
import { provideFileContext } from './providerMultiContext';

import { initializeStatusBar } from './statusBar'


// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "antislop" is now active!');
	//let fileListMessages = '';

	// This command holds the funcationality for when user activate the command
	// We can pass editor context as a parameter to the callback function (refer to textEditor)
	const disposable = vscode.commands.registerTextEditorCommand('antislop.annotate', async (textEditor: vscode.TextEditor) => {
		// The code you place here will be executed every time your command is executed
		//await queryFeedback(fileListMessages, textEditor);
	});

	context.subscriptions.push(disposable);

	// ------------------------------- STATUS BAR -------------------------------
	initializeStatusBar(context);
}

// This method is called when your extension is deactivated
export function deactivate() {}
