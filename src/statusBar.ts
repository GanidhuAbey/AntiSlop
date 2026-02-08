import * as vscode from 'vscode';

import { queryFeedback, clearDecorations } from './providerQuery'
import { provideFileContext } from './providerMultiContext';

const redStatusBarColour = `rgb(255, 114, 114)`;
const YellowStatusBarColour = `rgb(249, 255, 85)`;
const greenStatusBarColour = `rgb(54, 255, 108)`;

const redStatusBarCommand = 'antislop.redStatusBar';
const yellowStatusBarCommand = 'antislop.yellowStatusBar';
const greenStatusBarCommand = 'antislop.greenStatusBar';

let redStatusBarItem: vscode.StatusBarItem;
let yellowStatusBarItem: vscode.StatusBarItem;
let greenStatusBarItem: vscode.StatusBarItem;

// Track which button is currently active
export type ActiveButton = 'red' | 'yellow' | 'green' | 'onLoad' | null;
let activeButton: ActiveButton = null;

// Track context of relevant files for currently open file.
let fileListMessages = [''];

// Note: icons can be found at https://microsoft.github.io/vscode-codicons/dist/codicon.html

export function initializeStatusBar(context: vscode.ExtensionContext): void {
	
    // ------------------------ Red Status ------------------------
	context.subscriptions.push(vscode.commands.registerCommand(redStatusBarCommand, () => {
        updateRedStatusBar();
	}));

	redStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 9999);
    redStatusBarItem.command = redStatusBarCommand; // Command to execute when clicked
    redStatusBarItem.text = `$(error) 0`;
    redStatusBarItem.show();

	context.subscriptions.push(redStatusBarItem);

    // ------------------------ Yellow Status ------------------------
	context.subscriptions.push(vscode.commands.registerCommand(yellowStatusBarCommand, () => {
        updateYellowStatusBar();
	}));

	yellowStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 9998);
    yellowStatusBarItem.command = yellowStatusBarCommand; // Command to execute when clicked
    yellowStatusBarItem.text = `$(warning) 0`;
    yellowStatusBarItem.show();

	context.subscriptions.push(yellowStatusBarItem);

    // ------------------------ Green Status ------------------------
	context.subscriptions.push(vscode.commands.registerCommand(greenStatusBarCommand, () => {
        updateGreenStatusBar();
	}));

	greenStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 9997);
    greenStatusBarItem.command = greenStatusBarCommand; // Command to execute when clicked
    greenStatusBarItem.text = `$(thumbsdown) 0`;
    greenStatusBarItem.show();

	context.subscriptions.push(greenStatusBarItem);

    // Run once to populate,
    handleButtonClickOnLoad('onLoad', redStatusBarColour);

    // Register on file switch to trigger file context query.
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(async (editor) =>  {
        // if (editor) {
        //     fileListMessages = await provideFileContext(editor);
        // }
    }))
}

// Run whenever red status icon clicked
function updateRedStatusBar(): void {
    handleButtonClick('red', redStatusBarColour);
}

// Run whenever yellow status icon clicked
function updateYellowStatusBar(): void {
    handleButtonClick('yellow', YellowStatusBarColour);
}

// Run whenever green status icon clicked
function updateGreenStatusBar(): void {
    handleButtonClick('green', greenStatusBarColour);
}

async function handleButtonClickOnLoad(button: ActiveButton, color: string): Promise<void> {
        if (button) {
            fileListMessages = await provideFileContext();
            const counts = await queryFeedback(fileListMessages, color, button);
            updateAllStatusBars(counts.red, counts.yellow, counts.green);
        }
}

// Handle button click logic for toggling and switching
async function handleButtonClick(button: ActiveButton, color: string): Promise<void> {

    if (button && activeButton === button) { // same button is clicked so turn off
        clearDecorations();
        activeButton = null;

    } else {// first time clicking button or different button is clicked
    
        if (activeButton !== null) {
            clearDecorations();
        }
        activeButton = button;
        if (button) {
            fileListMessages = await provideFileContext();
            const counts = await queryFeedback(fileListMessages, color, button);
            updateAllStatusBars(counts.red, counts.yellow, counts.green);
        }

    }
}

function updateAllStatusBars(redCount: number, yellowCount: number, greenCount: number): void {
    redStatusBarItem.text = `$(error) ${redCount}`;
    yellowStatusBarItem.text = `$(warning) ${yellowCount}`;
    greenStatusBarItem.text = `$(thumbsdown) ${greenCount}`;
}
