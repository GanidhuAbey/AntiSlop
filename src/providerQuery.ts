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

// Store all decoration types so they can be cleared
let activeDecorations: vscode.TextEditorDecorationType[] = [];

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
}

// Query the LLM on the currently visible section of code
export async function queryFeedback(color: string, activeSeverity: ActiveButton): Promise<{red: number, yellow: number, green: number}> {
	const textEditor = vscode.window.activeTextEditor;
		
	if (!textEditor) {
		vscode.window.showWarningMessage('No active open file found');
		return {red: 0, yellow: 0, green: 0};
	}
	
    // select model (TODO: should let user choose which agent they want.)
    const code = getVisibleCodeWithLineNumbers(textEditor);	// TODO: Will need to change this to context of the whole page with split for token count
    let [model] = await lm.selectChatModels({
    vendor: 'copilot',
    family: 'gpt-4o'
    });

    // provide a pre-prompt for the LLM to guide it's responses
    const ANNOTATION_PROMPT = `You are a code tutor who helps students learn how to write better code. Your job is to evaluate a block of code that the user gives you and then annotate any lines that could be improved with a brief suggestion and the reason why you are making that suggestion. 
    
    For each suggestion, assign a severity level:
    - "red": Critical issues that impact security, incorrect behavior, data loss, edge cases, hidden bugs, undefined behavior or race conditions. Only red if it is one of these options.
    - "yellow": Moderate issues that could be improved but aren't critical such as Efficiency, optimization, poor structure, duplication
    - "green": Minor suggestions or style improvements such as bad variable names, inconsistent code stylings, very large one liners, naming, formatting, code clarity, minor best practices
    
    Be friendly with your suggestions and remember that these are students so they need gentle guidance. Format each suggestion as a single JSON object with a severity field. It is not necessary to wrap your response in triple backticks. Here is an example of what your response should look like:

    { "line": 1, "severity": "red", "suggestion": "I think you should use a for loop instead of a while loop. A for loop is more concise and easier to read." }{ "line": 12, "severity": "yellow", "suggestion": "Consider adding a comment here to explain the logic." }
    `;

    // initialize the pre-prompt and user code as messages to the model
    const messages = [
        LanguageModelChatMessage.User(ANNOTATION_PROMPT),
        LanguageModelChatMessage.User(code)
    ];

    if (model) {
        console.log("sending message to model.");
        // send the message to the chatbot.
        let chatResponse = await model.sendRequest(
            messages, // the message being sent.
            {}, // additional options to control model
            new CancellationTokenSource().token // allows user to send a cancellation request mid query.
        )

        const counts = await parseChatResponse(chatResponse, textEditor, color, activeSeverity);
        return counts;
    }
    return {red: 0, yellow: 0, green: 0};
}

async function parseChatResponse(chatResponse: LanguageModelChatResponse, textEditor: TextEditor, color: string, activeSeverity: ActiveButton): Promise<{red: number, yellow: number, green: number}> {
	// LLM responses come as individual tokens (e.g. word by word). We need to accumulate the response until we reach the
	// end.
	let accumulatedResponse = '';
	let counts = {red: 0, yellow: 0, green: 0};

	// a for loop that awaits on the next fragment of the response.
	for await (const fragment of chatResponse.text) {
		accumulatedResponse += fragment;

		// Under the example given in the pre-prompt, the final character in the response will be '}' so
		// we look for this character.
		if (fragment.includes('}')) {
			try {
				const annotation = JSON.parse(accumulatedResponse); // the response is in json format.

				console.log(accumulatedResponse);

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
					applyDecoration(textEditor, annotation.line, annotation.suggestion, color);
				}

				accumulatedResponse = ''; // reset accumulated fragment for next suggestion.
			} catch (e) {
				// will occure if the response given by the LLM does not match the expected format.
				// in this case we will silently ignore the response.
			}
		}
	}
	return counts;
}

function applyDecoration(textEditor: TextEditor, line: number, suggestion: string, color: string) {
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

function getVisibleCodeWithLineNumbers(textEditor: TextEditor) {
	// textEditor gives a reference to all the code in the viewable editor space.
	//	- I presume this means all the code visible to the user? (is is possible to get access to more files?)

	// visibleRanges provides us the line numbers of the lines of code currently visible in the view for the user
	// however, all code in the current document can simply be accessed through textEditor.document
	// Q: can we access all relevant documents in the codebase (e.g. get user cpp files while ignoring build and ext library files)?
	let currentLine = textEditor.visibleRanges[0].start.line;
	const endLine = textEditor.visibleRanges[0].end.line;
	let code = '';
	while (currentLine <= endLine) {
		code += `${currentLine + 1}: ${textEditor.document.lineAt(currentLine).text} \n`;
		// move to the next line position
		currentLine++;
	}

	return code;
}