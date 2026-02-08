import {
	LanguageModelChatResponse,
    LanguageModelChatMessage,
    CancellationTokenSource,
	TextEditor,
    Range,
	Position,
	window,
    lm,
} from 'vscode';

// Query the LLM on the currently visible section of code
export async function queryFeedback(textEditor: TextEditor) {
    // select model (TODO: should let user choose which agent they want.)
    const code = getVisibleCodeWithLineNumbers(textEditor);	
    let [model] = await lm.selectChatModels({
    vendor: 'copilot',
    family: 'gpt-4o'
    });

    // provide a pre-prompt for the LLM to guide it's responses
    const ANNOTATION_PROMPT = `You are a code tutor who helps students learn how to write better code. Your job is to evaluate a block of code that the user gives you and then annotate any lines that could be improved with a brief suggestion and the reason why you are making that suggestion. Only make suggestions when you feel the severity is enough that it will impact the readability and maintainability of the code. Be friendly with your suggestions and remember that these are students so they need gentle guidance. Format each suggestion as a single JSON object. It is not necessary to wrap your response in triple backticks. Here is an example of what your response should look like:

    { "line": 1, "suggestion": "I think you should use a for loop instead of a while loop. A for loop is more concise and easier to read." }{ "line": 12, "suggestion": "I think you should use a for loop instead of a while loop. A for loop is more concise and easier to read." }
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

        await parseChatResponse(chatResponse, textEditor);
    }
}

async function parseChatResponse(chatResponse: LanguageModelChatResponse, textEditor: TextEditor) {
	// LLM responses come as individual tokens (e.g. word by word). We need to accumulate the response until we reach the
	// end.
	let accumulatedResponse = '';

	// a for loop that awaits on the next fragment of the response.
	for await (const fragment of chatResponse.text) {
		accumulatedResponse += fragment;

		// Under the example given in the pre-prompt, the final character in the response will be '}' so
		// we look for this character.
		if (fragment.includes('}')) {
			try {
				const annotation = JSON.parse(accumulatedResponse); // the response is in json format.

				console.log(accumulatedResponse);

				// decorate the text editor with suggestion at line number.
				applyDecoration(textEditor, annotation.line, annotation.suggestion);

				accumulatedResponse = ''; // reset accumulated fragment for next suggestion.
			} catch (e) {
				// will occure if the response given by the LLM does not match the expected format.
				// in this case we will silently ignore the response.
			}
		}
	}
}

function applyDecoration(textEditor: TextEditor, line: number, suggestion: string) {
	const squigglyDecoration = window.createTextEditorDecorationType({
		textDecoration: 'underline wavy', // Creates the squiggly line
		color: 'yellow',     // Color of the squiggly
	});

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