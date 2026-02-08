import * as vscode from 'vscode';
import { annotationMap } from './providerQuery';

export class AnnotationCodeActionProvider implements vscode.CodeActionProvider {
    public static readonly providedCodeActionKinds = [
        vscode.CodeActionKind.QuickFix
    ];

    provideCodeActions(
        document: vscode.TextDocument,
        range: vscode.Range,
        context: vscode.CodeActionContext,
        token: vscode.CancellationToken
    ): vscode.CodeAction[] | undefined {
        const lineNumber = range.start.line + 1; // Convert to 1-based
        const annotation = annotationMap.get(lineNumber);

        if (!annotation) {
            return undefined;
        }

        const action = new vscode.CodeAction(
            'Ask about this suggestion',
            vscode.CodeActionKind.QuickFix
        );

        action.command = {
            command: 'antislop.askAboutSuggestion',
            title: 'Ask about this suggestion',
            arguments: [annotation]
        };

        return [action];
    }
}
