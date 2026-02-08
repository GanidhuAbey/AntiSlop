## AntiSlop

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

### Inspiration  

Learning is built on trying, failing, and figuring things out, not on being handed answers. Large language models are increasingly becoming a central part of how people learn to program and are now widely used across the industry. As engineers, when we prompt an LLM with a bug or a problem, it often responds with several possible solutions. We scan through them, pick the one that looks best, copy and paste it, and more often than not it just works. What is actually happening is we trick our mind into thinking “Wow, we just found a very efficient way to solve a problem and have a perfect solution. I must be so smart and have learned this new technology that I can now continue to apply”. But in reality, much of the critical thinking has been offloaded from our own brains to the language model, and very little real learning or deep understanding has actually taken place.

Research supports this concern. Studies have shown that while AI tools can improve short-term productivity, heavy reliance on them can negatively impact long-term learning especially debugging and problem-solving skills. This motivated our solution, AntiSlop. 


---

### What We Built

  

AntiSlop is a Visual Studio Code extension designed from the ground up with learning-first principles. Instead of generating solutions or code, AntiSlop guides developers toward better understanding.

The extension analyzes a user’s code and categorizes issues by severity:

- **Red** — High severity issues (security risks, incorrect behavior, hidden bugs)

- **Yellow** — Medium severity issues (inefficiencies, poor structure, scalability concerns)

- **Green** — Low severity issues (naming, style, and best practices)


When a user requests it, the current file along with relevant context will be queried by an LLM, which then provides guiding questions and hints, while avoiding straight answers. Something that traditional LLMs fail to do.

To support larger assignments, users can also provide **project-level context**, allowing AntiSlop to tailor its feedback to specific requirements and constraints.

---

 
### How We Built It

 
We built AntiSlop **from scratch** as a VS Code extension. This involved:

- Parse user files to detect issues in user code and categorize them into different levels of severity.

- Designing a lightweight UI using the VS Code status bar and inline diagnostics

- Build an automatic context query algorithm that seeks out other relevant files to better understand user code.

- Carefully constraining LLM responses so they encourage reasoning instead of solution dumping

---

  

### Challenges

The biggest challenge we experienced when developing this extension was our overall lack of experience with creating VSCode extensions. Having never done it before, we had to sink a lot of our initial time into reading documentation and api references before we could actually start working.

Additionally, having never done an AI-centric application before, we learned that prompt engineering can be quite tricky in order to get the model to output exactly what we want.  

---

  

### What We Learned

This project improved our understanding of VS Code extensions significantly, and gave us a lot of valuable insight in LLMs, both of their work and what their potential is.
