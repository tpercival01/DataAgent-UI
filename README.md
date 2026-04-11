# DataAgent UI: Autonomous Data Analyst Client

**Live Application:** https://dataagent.thomaspercival.dev/

**Backend Repository:** https://github.com/tpercival01/DataAgent-Core

This Next.js application is a multi modal client built to handle complex payloads from the DataAgent execution engine. It renders raw terminal output, toggleable Python code blocks, and natively displays base64 encoded graphical charts within a continuous conversational interface.

This is the frontend client for the **DataAgent Core** backend architecture.

## 🚀 Engineering Features

**1. Multi-Modal State Management**
Unlike standard ChatGPT wrappers that map a simple array of strings, this interface manages complex nested state objects. It dynamically renders different UI components based on the presence of standard output, executable code snippets, or extracted binary chart data, keeping the chat timeline clean and readable.

**2. Silent Session Synchronization**
Cloud compute environments time out. When the DataAgent backend detects a dead sandbox and autonomously resurrects a new one, it returns a new session ID in the payload. This frontend intercepts that ID, silently updates the React state, and routes all future queries to the new container. The user never experiences a session timeout or sees an error screen.

**3. Optimized Context Payloads**
Sending base64 image strings back and forth in a chat history array will instantly blow up an LLM's token limit. The UI strips all heavy graphical payloads from the conversation history before transmitting it back to the server, ensuring the LLM maintains perfect text context without wasting bandwidth or tokens.

**4. B2B UX/UI Design**
Built with Tailwind CSS, the interface mirrors modern SaaS enterprise tools. It features automatic smooth-scrolling to new data payloads, disabled interaction states during asynchronous execution, and clear visual segregation between user prompts and system outputs.

## 🛠 Tech Stack

*   **Framework:** Next.js (App Router)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS
*   **State Management:** React Hooks (useState, useEffect, useRef)

## ⚙️ Local Development Setup

1. Ensure your [DataAgent Core](https://github.com/tpercival01/DataAgent-Core) backend is running locally on port 8000.
2. Clone this repository and navigate into the directory.
3. Install the dependencies:
```bash
npm install
```
4. Start the development server:
```bash
npm run dev
```
5. Open your browser and navigate to `http://localhost:3000`.


## ⚠️ Live Demo Warning: Backend Cold Starts

The DataAgent Core backend is hosted on Render's free tier. If the application has been idle for more than 15 minutes, the server will go to sleep. 

When you make your first query or upload your first file, the Next.js frontend may show a "Thinking..." or "Uploading..." state for up to 60 seconds while the backend container wakes up. Please be patient. Once the server is awake, execution and chat responses will process in real time.
