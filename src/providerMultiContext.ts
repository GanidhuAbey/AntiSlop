// Based on the presently open file, query LLM to find other relevant files from what's already
// open. Pass relevant information to model as context before querying for file feedback.
import * as vscode from 'vscode';

export async function provideFileContext(editor: vscode.TextEditor): Promise<vscode.LanguageModelChat> {
    let [model] = await vscode.lm.selectChatModels({
        vendor: 'copilot',
        family: 'gpt-4o'
        });

    return model;
}