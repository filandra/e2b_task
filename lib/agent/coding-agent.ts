import {
  BaseMessage,
  HumanMessage,
  AIMessage,
  SystemMessage,
} from '@langchain/core/messages';
import {
  StateGraph,
  Annotation,
} from '@langchain/langgraph';
import { ChatOpenAI } from '@langchain/openai';
import { E2BManager } from './e2b-manager';

const AgentStateAnnotation = Annotation.Root({
  memory: Annotation<BaseMessage[]>({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),
  reasonedAction: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => '',
  }),
});

type AgentState = typeof AgentStateAnnotation.State;

export class CodingAgent {
  private e2bManager: E2BManager;
  private model: ChatOpenAI;
  private systemPromptCoder: string;
  private systemPromptMemorizer: string;

  constructor(sessionId: string, model: string) {
    this.e2bManager = new E2BManager(sessionId);
    this.model = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: model,
    });
    this.systemPromptCoder = `You are a helpful coding assistant called "Helpers Hands" that can execute commands in a sandbox environment. You excel at:
    - Analyzing programming questions and technical problems
    - Breaking down complex tasks into manageable steps
    - Writing and executing appropriate commands to solve problems
    - Providing practical, actionable solutions
    - Explaining concepts clearly

    Commands:
    - You are able to execute terminal commands.
    - You will need to execute these commands in order to help the user.
    - This means using git, creating files, writing code, etc.

    Always focus on short and concise answers! When you need to execute commands, write them clearly and execute them in the sandbox.`;

    this.systemPromptMemorizer = `You are memory agent whose job is to summarize the execution and chain-of-thought of a coding assistant and the final response into a concise memory for the next time the coding agent is called. You excel at:
    - Summarizing the execution and chain-of-thought of a coding assistant and the final response into a concise memory
    - Identifying the key points of the conversation such as the problem, the solution, the commands executed, the output of the commands, the final response
    - Identifying key files, directories, libraries, git repositories and other context.

    You will be provided with a list of messages from the coding assistant and the final response.
    The last message will prompt you to create the summary.
    Always focus on short and concise answers!`;
  }

  async init() {
    await this.e2bManager.init();
  }

  // Download agent memory
  private async start(state: AgentState): Promise<Partial<AgentState>> {
    try {
      const savedMemory = await this.e2bManager.downloadMemory();

      return {
        // Append the user message to the memory
        memory: [...savedMemory, ...state.messages],
        // Prepare current context for the agent
        messages: [
          new SystemMessage(this.systemPromptCoder),
          ...savedMemory,
          ...state.messages,
        ],
      };
    } catch (error) {
      console.error('Error downloading agent memory:', error);
      return state;
    }
  }

  // Analyze user query
  private async analyzeQuery(state: AgentState): Promise<Partial<AgentState>> {
    const analysisPrompt =
      new HumanMessage(`Please analyze this user query and determine what kind of help they need. Be specific about:
      - What type of problem or question this is
      - What domain/technology it relates to
      - What the user is trying to achieve
      - Whether this requires executing commands in the sandbox
      - Whether there is any relevant information to the request in the execution memory

      Provide a clear, brief analysis. Maximum 100 words.`);

    console.log(state.memory);

    // Build messages with system prompt and full history
    const messages = [...state.messages, analysisPrompt];
    const response = await this.model.invoke(messages);

    return {
      // Discard the prompt, use only the response
      messages: [...state.messages, new AIMessage(response.content as string)],
    };
  }

  // Plan solution
  private async planSolution(state: AgentState): Promise<Partial<AgentState>> {
    const planingPrompt =
      new HumanMessage(`Now plan step by step about how to best help with this request. Consider:
      - What specific steps or approach would be most helpful
      - What commands need to be execute

      Provide a clear plan for your response. Number each point of the plan. Maximum 200 words.`);

    const messages = [...state.messages, planingPrompt];

    const response = await this.model.invoke(messages);

    return {
      // Discard the prompt, use only the response
      messages: [...state.messages, new AIMessage(response.content as string)],
    };
  }

  // Reasoning step
  private async reasonPlan(state: AgentState): Promise<Partial<AgentState>> {
    const reasoningPrompt = new HumanMessage(
    `Reflect on the plan and the current situation. Determine what the next step should be. 
    
    Provide answer only in a valid JSON format!
    Follow this format:
    "reason": "(string) At which point of the plan you are. What is the next step and why."
    "action": "(string) What action you need to take. Only allowed values are ["output", "command", "finalize"]. Option "output" means you need to output information to the user, "command" means you need to execute a command in the sandbox, "finalize" means the plan is complete and you are ready to provide a final response to the user. If you need to ask the user a question, use the action "finalize" and ask the question in the response."`
    );

    const messages = [...state.messages, reasoningPrompt];

    // Define expected schema
    const response = await this.model
      .withStructuredOutput({
        method: 'json_mode',
        schema: {
          type: 'object',
          properties: {
            reason: { type: 'string' },
            action: { type: 'string', enum: ['output', 'command', 'finalize'] },
          },
          required: ['reason', 'action'],
        },
      })
      .invoke(messages);

    // response is already JSON, not a string
    return {
      messages: [...state.messages, new AIMessage(response.reason)],
      reasonedAction: response.action,
    };
  }

  // Output
  private async generateOutput(
    state: AgentState
  ): Promise<Partial<AgentState>> {
    const outputPrompt = new HumanMessage(
      'Generate a response to the user. Maximum 50 words.'
    );

    const messages = [...state.messages, outputPrompt];

    const response = await this.model.invoke(messages);

    return {
      // Discard the prompt, use only the response
      messages: [...state.messages, new AIMessage(response.content as string)],
    };
  }

  // Implementation note: the command generation and execution could also be a tool call
  // This way however we have greater granularity - we can show the generated command before execution (if something goes wrong, at least we see the command)
  // Also we could add a human-in-the-loop step after the command is created to confirm execution
  // Generate command to execute
  private async generateCommand(
    state: AgentState
  ): Promise<Partial<AgentState>> {
    const commandPrompt =
      new HumanMessage(`Based on your analysis and planning above, write ONLY ONE specific command that needs to be executed in the sandbox to help solve this problem. 
      Write only the single command that should be executed, nothing else. You can ONLY write BASH commands! Do not escape it, write it exactly as if you are writing it in the terminal. Do not use markdown formatting, just write the raw command.`);

    const messages = [...state.messages, commandPrompt];

    const response = await this.model.invoke(messages);

    return {
      // Discard the prompt, use only the response
      messages: [...state.messages, new AIMessage(response.content as string)],
    };
  }

  // Execute command using E2B manager
  private async executeCommand(
    state: AgentState
  ): Promise<Partial<AgentState>> {
    // Get the last AI message which should contain the command
    const lastAIMessage = state.messages[state.messages.length - 1];

    let command = lastAIMessage.content as string;

    // Extract command from markdown code blocks if present
    const codeBlockRegex = /```(?:bash|shell|sh)?\s*\n?([\s\S]*?)\n?```/;
    const match = command.match(codeBlockRegex);
    if (match) {
      command = match[1].trim();
    }

    // If no code block, try to extract from inline code
    if (command === lastAIMessage.content) {
      const inlineCodeRegex = /`([^`]+)`/;
      const inlineMatch = command.match(inlineCodeRegex);
      if (inlineMatch) {
        command = inlineMatch[1].trim();
      }
    }

    // Take only the first line if multiple lines exist
    command = command.split('\n')[0].trim();

    try {
      const result = await this.e2bManager.executeCommand(command);

      const executionResult = `Command executed: ${command}\n\nOutput:\n${result.stdout}\n\nError (if any):\n${result.stderr || 'None'}`;

      return {
        messages: [...state.messages, new AIMessage(executionResult)],
      };
    } catch (error) {
      const errorMessage = `Error executing command "${command}": ${error instanceof Error ? error.message : String(error)}`;
      return {
        messages: [...state.messages, new AIMessage(errorMessage)],
      };
    }
  }

  // Generate final response
  private async generateResponse(
    state: AgentState
  ): Promise<Partial<AgentState>> {
    const responsePrompt = new HumanMessage(
      `Based on your analysis, planning, and the command execution results above, now provide a comprehensive, helpful response to the original user query. 

      Include:
      - What was accomplished
      - Any relevant output from the commands
      - Next steps or additional help if needed

      Be practical, actionable, and thorough. Maximum 100 words.`
    );

    const messages = [...state.messages, responsePrompt];

    const response = await this.model.invoke(messages);

    // Discard the prompt, use only the response
    return {
      messages: [...state.messages, new AIMessage(response.content as string)],
    };
  }

  // Finish - Upload agent memory
  private async finish(state: AgentState): Promise<Partial<AgentState>> {
    // Relatively simple memory management, we would like to also summarize the memory itself over time etc., but for now enough
    const memoryPrompt = new HumanMessage(
      'This is the end of the messages. Summarize the reasoning, actions and final response into a concise memory for the next time the agent is called. Maximum 100 words.'
    );
    try {
      const memoryMessages = [
        new SystemMessage(this.systemPromptMemorizer),
        // This slices the coder system prompt and the saved memory
        // Leaves the latest user message and the COT
        ...state.messages.slice(state.memory.length),
        memoryPrompt,
      ];
      const summary = await this.model.invoke(memoryMessages);

      // Append the summary to the memory
      await this.e2bManager.uploadMemory([
        ...state.memory,
        new AIMessage(('Execution memory: ' + summary.content) as string),
      ]);

      return state;
    } catch (error) {
      console.error('Error uploading agent memory:', error);
      // Return state even if upload fails
      return state;
    }
  }

  // Simple routing function
  private reasoningRoute(state: AgentState): string {
    return state.reasonedAction;
  }

  // Create the workflow
  private createWorkflow() {
    return new StateGraph(AgentStateAnnotation)
      .addNode('start', this.start.bind(this))
      .addNode('analyze', this.analyzeQuery.bind(this))
      .addNode('plan', this.planSolution.bind(this))
      .addNode('reason', this.reasonPlan.bind(this))
      .addNode('output', this.generateOutput.bind(this))
      .addNode('command', this.generateCommand.bind(this))
      .addNode('execute', this.executeCommand.bind(this))
      .addNode('respond', this.generateResponse.bind(this))
      .addNode('finish', this.finish.bind(this))
      .addEdge('__start__', 'start')
      .addEdge('start', 'analyze')
      .addEdge('analyze', 'plan')
      .addEdge('plan', 'reason')
      .addConditionalEdges('reason', this.reasoningRoute.bind(this), {
        output: 'output',
        command: 'command',
        finalize: 'respond',
      })
      .addEdge('command', 'execute')
      .addEdge('execute', 'reason')
      .addEdge('output', 'reason')
      .addEdge('respond', 'finish')
      .addEdge('finish', '__end__')
      .compile();
  }

  async streamAgent(userMessage: string) {
    const initialState: AgentState = {
      memory: [],
      messages: [new HumanMessage(userMessage)],
      reasonedAction: '',
    };

    const workflow = this.createWorkflow();

    // Stream the agent workflow
    return workflow.stream(initialState, { streamMode: 'updates' });
  }
}
