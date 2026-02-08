// Based on the presently open file, query LLM to find other relevant files from what's already
// open. Pass relevant information to model as context before querying for file feedback.
import * as vscode from 'vscode';
import * as fs from 'fs';

import { getCodeInActiveFileWithLineNumbers, parseChatResponse, getCodeInFiles, splitTextContent } from './utils';


// The file list should have the file name as the first element in the list.
function convertFileListToPrompt(fileDataList: string[][]) {
    let fileDataPrompt = '{ \n';
    for (const fileData of fileDataList)  {
        // print file name
        fileDataPrompt += fileData[0] + ':' + '[' + '\n';

        fileDataPrompt += '"' + fileData[1] + '"' + "\n";

        fileDataPrompt += '],\n'
    }
    fileDataPrompt += '\n}';

    return fileDataPrompt;
}

export async function provideFileContext(editor: vscode.TextEditor): Promise<string[]> {

    let [model] = await vscode.lm.selectChatModels({
        vendor: 'copilot',
        family: 'gpt-4o'
        });

    // get current file context
    const code = getCodeInActiveFileWithLineNumbers(editor);
    //console.log(code);

    // create prompt
    const FILE_QUERY_PROMPT = `You are a code tutor who helps students learn how to write better code. Your first job is to evaluate a file that the user gives you and then determine all the relevant files you need to better understand the code given, the provided code may be split into chunks, consider all of the messages following this to be referring to the file the user gave you until you see the message “END OF CODE”. Afterwards a list of files will be sent, please select additional files from this list that you believe is necessary to understand the file the user has given you. Try to minimize the number of files that you need and only select files from the list of file paths provided. Format the required files as a single JSON object save the file using the exact path given in the message. It is not necessary to wrap your response in triple backticks. It is okay to send an empty array if none of the paths are absolutely necessary. Here is an example of what your response should look like:


   { paths: [“src/extension.ts”, "src/provideAuthority.ts”, “file_transfer.ts”] }`;

//     const FILE_PROCESS_PROMPT = `Based on your previous responses, here are the requested files formatted into a JSON object of the following structure:

// { fileName1 : [“content of fileName1 as string“], fileName2 : [ “content of fileName2 as string”] }


// The provided JSON object will be broken up into a series of messages. Use this information as context when the user queries for feedback on their current file.


// Respond in the following JSON format to confirm that data was received correctly, it is not necessary to wrap your response in triple backticks:


// {“status”: “OK”, “message”: “”}
// {“status”: “ERROR”, “message”: “Additional information on error”}`;


    let messages = [vscode.LanguageModelChatMessage.User(FILE_QUERY_PROMPT)];
    code.forEach(item => {
        messages.push(vscode.LanguageModelChatMessage.User(item));
    });

    // push end of code line
    messages.push(vscode.LanguageModelChatMessage.User(`END OF CODE`));
    
    // get all active files in workspace
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];

    // TODO: move the workspace querying code to the activation function, so that it runs
    // in the background while the user isn't even using the extension.
    const files = await vscode.workspace.findFiles(
        "**/*",          // include pattern
    );

    const fileNames = files.map(uri =>
        vscode.workspace.asRelativePath(uri, false)
    );

    let fileNamesPrompt = 'filepaths: [\n'
    fileNames.forEach(item => {
        // ignore current file
        if (item !== editor.document.fileName) {
            fileNamesPrompt += '"' + item + '"' + ',' + '\n';
        }
    });

    console.log(fileNamesPrompt);

    messages.push(vscode.LanguageModelChatMessage.User(fileNamesPrompt));    

    //console.log(data);

    let fileListMessages: string[] = [];

    if (model) {
        //console.log("sending message to model.");
        // send the message to the chatbot.
        let chatResponse = await model.sendRequest(
            messages, // the message being sent.
            {}, // additional options to control model
            new vscode.CancellationTokenSource().token // allows user to send a cancellation request mid query.
        )

        let response = await parseChatResponse(chatResponse, editor);

        // responses.forEach(annotation => {
        //     applyDecoration(textEditor, annotation.line, annotation.suggestion);
        // })

        console.log(response);

        // parse responses
        let files = response[0].paths; // should only be one response.

        console.log(files);

        let fileDataList = await getCodeInFiles(editor, files);
        let fileListPrompt = convertFileListToPrompt(fileDataList);
        
        fileListMessages = splitTextContent(fileListPrompt);

        //let fileListContext = [vscode.LanguageModelChatMessage.User(FILE_LIST_PROMPT)];
        // fileListMessages.forEach(item => {
        //     fileListContext.push(vscode.LanguageModelChatMessage.User(item));
        // });
    }

    return fileListMessages;
}

async function test(chatResponse: vscode.LanguageModelChatResponse, textEditor: vscode.TextEditor) {
    // LLM responses come as individual tokens (e.g. word by word). We need to accumulate the response until we reach the
    // end.
    let accumulatedResponse = '';

    let responses = [];

    // a for loop that awaits on the next fragment of the response.
    for await (const fragment of chatResponse.text) {
        accumulatedResponse += fragment;

        console.log(accumulatedResponse);

        // Under the example given in the pre-prompt, the final character in the response will be '}' so
        // we look for this character.
        if (fragment.includes('}')) {
            try {
                console.log(accumulatedResponse);
                const annotation = JSON.parse(accumulatedResponse); // the response is in json format.

                //console.log(accumulatedResponse);

                // decorate the text editor with suggestion at line number.
                //applyDecoration(textEditor, annotation.line, annotation.suggestion);
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