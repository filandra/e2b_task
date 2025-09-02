# Helpers Hands

AI-powered coding assistant that can execute commands in a secure sandbox environment to help you with programming tasks, debugging, and technical problem-solving.

Available at https://e2b-task.vercel.app/

## Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI components
- **AI/ML**: LangChain, OpenAI GPT models
- **Sandbox**: E2B for secure code execution
- **Deployment**: Vercel

## Prerequisites

- Node.js 20.9.0 or higher
- OpenAI API key
- E2B API key

## Run Locally

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd e2b_task
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   E2B_API_KEY=your_e2b_api_key_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Design

1. **Sessions and Persistence**: Simple session management - when you refresh, you get a new session. Sandboxes are created per session and auto-pause when inactive with eventual deletion. The solution uses the Auto-pause beta feature to handle sandbox persistence.
1. **Serverless**: Each user request creates a new agent workflow instance, only sandboxes persist across requests.
2. **Agent**: Planning and reasoning agent leaning heavily on the command execution option. Streaming it's chain-of-thought, command outputs and results as it goes.
2. **Memory creation**: Each run is summarized and stored alongside user messages so that the agent has context across tasks.
7. **Memory Storage**: Memory is saved in the sandbox itself to handle continuity between requests.

## Usage Examples

7. **Model selection**: You can choose between gpt-4o-mini and gpt-4o.
1. **Git**: Try message: Clone this repository and tell me more information about it: https://github.com/rtyley/small-test-repo
2. **File handling**: Try message: List files, create a new unique file, write "Hello" into it and then list files again
3. **Install packages**: Try message: Use npm to install express
3. **Coding**: Try message: Find a bug in script.py and fix it / Write a simple python hello-world script that also tells current time and execute it.
