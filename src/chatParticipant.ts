import * as vscode from 'vscode';

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
            const messages = [
                vscode.LanguageModelChatMessage.User(systemPrompt + request.prompt)
            ];

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
