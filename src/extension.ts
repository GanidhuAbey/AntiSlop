// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import { provideFileContext } from './providerMultiContext';
import { queryFeedback } from './providerQuery';
import { initializeStatusBar } from './statusBar';
import { AnnotationCodeActionProvider } from './codeActionProvider';
import { createChatParticipant, setAnnotationContext } from './chatParticipant';

export function activate(context: vscode.ExtensionContext) {

	console.log('Starting AntiSlop');

	// Register code action provider for all file types
	context.subscriptions.push(
		vscode.languages.registerCodeActionsProvider(
			{ scheme: 'file' },
			new AnnotationCodeActionProvider(),
			{
				providedCodeActionKinds: AnnotationCodeActionProvider.providedCodeActionKinds
			}
		)
	);

	// Register command to open chat with annotation context
	context.subscriptions.push(
		vscode.commands.registerCommand('antislop.askAboutSuggestion', async (annotation) => {
			// Set the context for the chat participant
			setAnnotationContext(annotation);
			
			// Open the chat view and send initial message
			await vscode.commands.executeCommand('workbench.action.chat.open', {
				query: `@antislop Can you explain this suggestion in more detail? Line ${annotation.line}: "${annotation.suggestion}"`
			});
		})
	);

	// Create chat participant
	createChatParticipant(context);

	// Initialize status bar
	initializeStatusBar(context);
}

// This method is called when your extension is deactivated
export function deactivate() {}
