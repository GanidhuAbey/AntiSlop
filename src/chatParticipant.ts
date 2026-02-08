import * as vscode from 'vscode';

import { getCodeInActiveFileWithLineNumbers } from './utils';
import { fileListMessages } from './statusBar';
import { activeFileMessages } from './providerQuery';

interface AnnotationData {
    line: number;
    suggestion: string;
    severity: string;
    color: string;
}

let currentAnnotationContext: AnnotationData | null = null;

export function setAnnotationContext(annotation: AnnotationData) {
    currentAnnotationContext = annotation;
}

export function createChatParticipant(context: vscode.ExtensionContext) {
    const participant = vscode.chat.createChatParticipant('antislop.chatParticipant', async (
        request: vscode.ChatRequest,
        chatContext: vscode.ChatContext,
        response: vscode.ChatResponseStream,
        token: vscode.CancellationToken
    ) => {
        // If we have annotation context, prepend it to the conversation
        let systemPrompt = '';
        if (currentAnnotationContext) {
            systemPrompt = `You are helping a student understand a code suggestion. 

Context:
- Line ${currentAnnotationContext.line}
- Severity: ${currentAnnotationContext.severity}
- Original suggestion: "${currentAnnotationContext.suggestion}"

To help you better understand the users code base when assisting them, The user will send a JSON object of files relevant to the one they are working on with the contents of the file. The JSON object will be in the structure:

{ fileName1 : [“content of fileName1 as string“], fileName2 : [ “content of fileName2 as string”] }

Afterwards, the user will provide a file that was being evaluated with line numbers.

The student is asking follow-up questions about this suggestion. Be helpful, patient, and educational in your responses.
`;
        }

        try {
            const models = await vscode.lm.selectChatModels({
                vendor: 'copilot',
                family: 'gpt-4o'
            });

            if (models.length === 0) {
                response.markdown('No language model available. Please ensure GitHub Copilot is enabled.');
                return;
            }

            const model = models[0];
            let messages = [
                vscode.LanguageModelChatMessage.User(systemPrompt + request.prompt)
                //vscode.LanguageModelChatMessage.User(systemPrompt + request.prompt)
            ];
            
            fileListMessages.forEach(item => {
                messages.push(vscode.LanguageModelChatMessage.User(item));
            })

            activeFileMessages.forEach(item=> {
                messages.push(vscode.LanguageModelChatMessage.User(item));
            })

            messages.push(vscode.LanguageModelChatMessage.User(request.prompt));

            console.log(messages);

            const chatResponse = await model.sendRequest(messages, {}, token);

            for await (const fragment of chatResponse.text) {
                response.markdown(fragment);
            }

        } catch (error) {
            response.markdown(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    });

    // Use your own PNG icon (place icon.png in the root of your extension folder)
    participant.iconPath = vscode.Uri.joinPath(context.extensionUri, 'icon.png');

    context.subscriptions.push(participant);
}
