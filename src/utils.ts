import {
    TextEditor,
    LanguageModelChatResponse,
    window,
    Range,
    Position,
    workspace,
    Uri
} from 'vscode'


const CHARACTER_LIMIT = 10000; // limit characters to ensure that we don't hit token limit of any model.

async function getFileContents(uri: Uri): Promise<string> {
  const doc = await workspace.openTextDocument(uri);
  return doc.getText();
}

export function splitTextContent(text: string): string[] {
    let result = [];
    let prev_i = 0;
    for (let i = 0; i < text.length; i += CHARACTER_LIMIT) {
        // split text into CHARACTER_LIMIT size chunks (or less for the last chunk)
        let size = (text.length - i) > CHARACTER_LIMIT ? CHARACTER_LIMIT : (text.length - i);
        result.push(text.slice(i, i + size));
        prev_i = i;
    }

    if (prev_i < text.length) {
        result.push(text.slice(prev_i));
    }

    return result;
}

export async function getCodeInFiles(textEditor: TextEditor, files: string[]): Promise<string[][]> {
    const workspaceFolder = workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
    throw new Error("No workspace folder open");
    }

    let codes = [];
    for (const file of files) {
        try {
            const uri = Uri.joinPath(
                workspaceFolder.uri,
                file
            )
            let text = await getFileContents(uri);
            //let split_text = splitTextContent(text, file);

            codes.push([file, text]);
        } catch(e) {
            console.log("DID NOT PROCESS FILE: " + file);
        }
    }

    // create prompt
    return codes;

}

export function getVisibleCodeWithLineNumbers(textEditor: TextEditor) {
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

export function getCodeInActiveFileWithLineNumbers(textEditor: TextEditor): string[] {
    let endLine = textEditor.document.lineCount;
    let currentLine = 0;

    let code = [''];
    let i = 0;
    let character_count = 0;
    while (currentLine < endLine) {
        character_count += textEditor.document.lineAt(currentLine).text.length;
		code[i] += `${currentLine + 1}: ${textEditor.document.lineAt(currentLine).text} \n`;
		// move to the next line position
		currentLine++;

        if (character_count >= CHARACTER_LIMIT) {
            code.push('');
            i++;
        }
        
    }

    return code;
}

export async function parseChatResponse(chatResponse: LanguageModelChatResponse, textEditor: TextEditor): Promise<any[]> {//Promise<{red: number, yellow: number, green: number}> {
    // LLM responses come as individual tokens (e.g. word by word). We need to accumulate the response until we reach the
    // end.
    let accumulatedResponse = '';

    let responses = [];

    // a for loop that awaits on the next fragment of the response.
    for await (const fragment of chatResponse.text) {
        accumulatedResponse += fragment;

        // Under the example given in the pre-prompt, the final character in the response will be '}' so
        // we look for this character.
        if (fragment.includes('}')) {
            try {
                const annotation = JSON.parse(accumulatedResponse); // the response is in json format.

                console.log(accumulatedResponse);

                responses.push(annotation);

                accumulatedResponse = ''; // reset accumulated fragment for next suggestion.
            } catch (e) {
                // will occure if the response given by the LLM does not match the expected format.
                // in this case we will silently ignore the response.
            }
        }
    }

    return responses;
}