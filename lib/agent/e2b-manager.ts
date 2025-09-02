import 'dotenv/config';
import { Sandbox } from 'e2b';
import { BaseMessage } from '@langchain/core/messages';

export class E2BManager {
  private sessionId: string;
  private sessionSandbox!: Sandbox;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  async init() {
    this.sessionSandbox = await this.getSandbox();
  }

  // Either create a new sandbox or return the existing one for the given sessionId
  async getSandbox(): Promise<Sandbox> {
    const paginator = Sandbox.list({
      query: {
        metadata: { sessionId: this.sessionId },
      },
    });

    const sandboxes = (await paginator.nextItems()) || [];
    if (sandboxes.length === 0) {
      const sandbox = await Sandbox.betaCreate({
        autoPause: true,
        metadata: { sessionId: this.sessionId },
      });
      return sandbox;
    }
    const sandboxId = sandboxes[0].sandboxId;
    return await Sandbox.connect(sandboxId);
  }

  async executeCommand(command: string) {
    const result = await this.sessionSandbox.commands.run(command);
    return result;
  }

  async uploadMemory(memory: BaseMessage[]) {
    // Save state as a json file in the sandbox
    await this.sessionSandbox.files.write(
      'agent_memory.json',
      JSON.stringify(memory)
    );
  }

  async downloadMemory(): Promise<BaseMessage[]> {
    // Get state from the json file in the sandbox - if not exists, create a new one
    let memory = null;
    try {
      memory = await this.sessionSandbox.files.read('agent_memory.json');
    } catch (error) {
      console.log('Error reading agent memory file:', error);
    }
    if (!memory) {
      return [] as BaseMessage[];
    }
    return JSON.parse(memory) as BaseMessage[];
  }
}
