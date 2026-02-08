# AntiSlop

A Visual Studio Code extension that teaches developers to think critically about their code, rather than just fixing it.

---

## About the Project — AntiSlop

### Inspiration

Learning to program is fundamentally about **trying, failing, and reasoning through problems**. However, with large language models becoming a default tool for students and developers, we noticed a troubling pattern—including in our own work. When faced with a bug, we would ask an LLM, scan through a few suggested solutions, copy the one that looked best, and move on. While this felt efficient, it often created an illusion of understanding. The critical thinking that leads to real learning was being quietly outsourced.

Research supports this concern. Studies have shown that while AI tools can improve short-term productivity, heavy reliance on them can negatively impact long-term learning—especially debugging and problem-solving skills. This gap between *speed* and *understanding* is what inspired **AntiSlop**.

---

### What We Built

**AntiSlop** is a Visual Studio Code extension designed from the ground up with **learning-first principles**. Instead of generating solutions or code, AntiSlop guides developers toward better understanding.

The extension analyzes a user's code and categorizes issues by severity:
- **Red** — High severity issues (security risks, incorrect behavior, hidden bugs)
- **Yellow** — Medium severity issues (inefficiencies, poor structure, scalability concerns)
- **Green** — Low severity issues (naming, style, and best practices)

Issues are surfaced directly in the editor and can be explored interactively. When a developer wants more help, AntiSlop responds like a tutor—asking guiding questions and providing conceptual hints rather than answers.

To support larger assignments, users can also provide **project-level context**, allowing AntiSlop to tailor its feedback to specific requirements and constraints.

---

### How We Built It

We built AntiSlop **from scratch** as a VS Code extension. This involved:
- Integrating static code analysis to detect issues across multiple severity levels
- Designing a lightweight UI using the VS Code status bar and inline diagnostics
- Building a context-aware interaction layer that considers the current file and related project files
- Carefully constraining LLM responses so they encourage reasoning instead of solution dumping

The core design constraint was intentional:  
```
Guidance ≠ Generated Code
```

Every feature was evaluated against one question: *Does this help the developer think?*

---

### Challenges

One of the biggest challenges was resisting the temptation to make the tool "smarter" by simply giving answers. It's easy to build an AI that solves problems—but much harder to build one that **teaches**.

We also had to balance usefulness with restraint. Too little information frustrates users; too much turns into a solution. Finding that middle ground—where users feel supported but still responsible for the fix—was a key technical and design challenge.

---

### What We Learned

This project taught us that better developer tools aren't always about speed. Sometimes, they're about slowing down the right parts of the process so learning can happen.

With AntiSlop, we aim to put **critical thinking back into the developer's workflow**, helping create stronger, more confident engineers—not just faster ones.

---

## Setup Instructions

### Prerequisites

- **Visual Studio Code** (version 1.109.0 or higher)
- **Node.js** (version 14.x or higher)
- **npm** (comes with Node.js)
- **GitHub Copilot** subscription (required for LLM access)

### Installation for Development

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd antislop
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Compile the extension:**
   ```bash
   npm run compile
   ```

4. **Run the extension:**
   - Press `F5` in VS Code to open a new Extension Development Host window
   - The extension will be loaded and running in the new window

5. **Watch mode (optional):**
   ```bash
   npm run watch
   ```
   This will automatically recompile the extension when you make changes to the source files.

### Using the Extension

1. Open a code file in the Extension Development Host window
2. Use the command palette (`Cmd+Shift+P` on macOS, `Ctrl+Shift+P` on Windows/Linux)
3. Look for AntiSlop commands to activate code analysis
4. View annotations in your code with severity-based color coding
5. Click on annotations to get guided feedback in the chat panel

---

## Requirements

- GitHub Copilot subscription for language model access
- Active internet connection for LLM requests

---

## Known Issues

- The extension requires GitHub Copilot to be enabled and configured
- Large files may take longer to analyze
- Context loading for multi-file projects may require a moment

---

## Release Notes

### 1.0.0

Initial release of AntiSlop with:
- Severity-based code analysis (Red, Yellow, Green)
- Interactive chat participant for guided learning
- Project context support for tailored feedback
- Status bar integration for easy access

---

**Enjoy learning to code better!**
