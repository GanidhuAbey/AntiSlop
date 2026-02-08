import * as vscode from 'vscode';

import {
	LanguageModelChatResponse,
    LanguageModelChatMessage,
    LanguageModelChat,
    CancellationTokenSource,
	TextEditor,
    Range,
	Position,
	window,
    lm,
} from 'vscode';

import type { ActiveButton } from './statusBar';
import { getCodeInActiveFileWithLineNumbers, getVisibleCodeWithLineNumbers, parseChatResponse, splitTextContent } from './utils';
import { getProjectContext, hasProjectContext, projectContext } from './projectContext';

import { ANNOTATION_PROMPT } from './prompts';

export let activeFileMessages = [''];

// Store all decoration types so they can be cleared
let activeDecorations: vscode.TextEditorDecorationType[] = [];

// Store annotation data for each decorated line
interface AnnotationData {
	line: number;
	suggestion: string;
	severity: string;
	color: string;
}
export let annotationMap: Map<number, AnnotationData> = new Map();

// Clear all active decorations
export function clearDecorations() {
	const textEditor = vscode.window.activeTextEditor;
	if (textEditor) {
		activeDecorations.forEach(decoration => {
			textEditor.setDecorations(decoration, []);
			decoration.dispose();
		});
	}
	activeDecorations = [];
	annotationMap.clear();
}
// Query the LLM on the currently visible section of code
export async function queryFeedback(fileListMessages: string[], color: string, activeSeverity: ActiveButton): Promise<{red: number, yellow: number, green: number}> {
	const textEditor = vscode.window.activeTextEditor;

	// console.log(`THIS IS THE CURRENT CONTEXT: ${projectContext}`);

	if (!textEditor) {
		vscode.window.showWarningMessage('No active open file found');
		return {red: 0, yellow: 0, green: 0};
	}

    // select model (TODO: should let user choose which agent they want.)
    activeFileMessages = getCodeInActiveFileWithLineNumbers(textEditor);	
    let [model] = await lm.selectChatModels({
    vendor: 'copilot',
    family: 'gpt-4o'
    });

    //console.log("querying feedback from LLM");
    //console.log(model);

    // provide a pre-prompt for the LLM to guide it's responses
    const projectContextPrompt = '{ "projectRequirements" : "' + projectContext + '"}';
    const projectContextMessages = splitTextContent(projectContextPrompt);

    // initialize the pre-prompt and user code as messages to the model
    let messages = [
        LanguageModelChatMessage.User(ANNOTATION_PROMPT)
    ];

    projectContextMessages.forEach(item => {
        messages.push(LanguageModelChatMessage.User(item));
    })

    fileListMessages.forEach(item => {
        messages.push(LanguageModelChatMessage.User(item))
    })

    activeFileMessages.forEach(item => {
        messages.push(LanguageModelChatMessage.User(item));
    })

    console.log(messages);
    //        LanguageModelChatMessage.User(code)

    if (model) {
        //console.log("sending message to model.");
        // send the message to the chatbot.
        let chatResponse = await model.sendRequest(
            messages, // the message being sent.
            {}, // additional options to control model
            new CancellationTokenSource().token // allows user to send a cancellation request mid query.
        )

        const responses = await parseChatResponse(chatResponse, textEditor);
        const counts = categorizeResponses(responses, textEditor, color, activeSeverity);
        return counts;
    }
    return {red: 0, yellow: 0, green: 0};
}

function categorizeResponses(responses: any[], textEditor: TextEditor, color: string, activeSeverity: ActiveButton): {red: number, yellow: number, green: number} {
    let counts = {red: 0, yellow: 0, green: 0};

    responses.forEach(annotation => {
        // Count annotations by severity
        if (annotation.severity === 'red') {
            counts.red++;
        } else if (annotation.severity === 'yellow') {
            counts.yellow++;
        } else if (annotation.severity === 'green') {
            counts.green++;
        }

        // Only decorate if this annotation matches the active severity
        if (annotation.severity === 'onLoad' ){
            // do nothing
        } else if (annotation.severity === activeSeverity) {
            applyDecoration(textEditor, annotation.line, annotation.suggestion, color, annotation.severity);
        }
    })

    return counts;
}

function applyDecoration(textEditor: TextEditor, line: number, suggestion: string, color: string, severity: string) {
	// Store annotation data for code actions
	annotationMap.set(line, { line, suggestion, severity, color });
	
	const squigglyDecoration = window.createTextEditorDecorationType({
		textDecoration: `underline wavy ${color}`
	});

	// Store decoration so it can be cleared later
	activeDecorations.push(squigglyDecoration);

	// append suggestion, when user howers of decoration, they get full suggestion.
	const lineLength = textEditor.document.lineAt(line - 1).text.length;
	const startLine = textEditor.document.lineAt(line - 1).firstNonWhitespaceCharacterIndex;
	const range = new Range(
		new Position(line - 1, startLine),
		new Position(line - 1, lineLength)
	);

	// when user hovers over the decoration, give full suggestion
	const decoration = { range: range, hoverMessage: suggestion };

	window.activeTextEditor?.setDecorations(squigglyDecoration, [decoration]);
}