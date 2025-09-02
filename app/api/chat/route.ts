import { NextRequest } from 'next/server';
import { CodingAgent } from '@/lib/agent/coding-agent';
import { AIMessage } from '@langchain/core/messages';

export async function POST(request: NextRequest) {
  try {
    const { message, sessionId, model } = await request.json();

    if (!message) {
      return new Response('Message is required', { status: 400 });
    }

    const agent = new CodingAgent(sessionId, model);
    await agent.init();
    const agentStream = await agent.streamAgent(message);
    const encoder = new TextEncoder();

    const transformStream = new TransformStream({
      async transform(chunk, controller) {
        const nodeName = Object.keys(chunk)[0];

        if (nodeName === 'start' || nodeName === 'finish') {
          // We don't want to log the memory handling nodes
          return;
        }

        const nodeOutput = chunk[nodeName];
        const lastMessage = nodeOutput.messages[nodeOutput.messages.length - 1];

        let chunkContent;
        if (nodeName === 'respond' || nodeName === 'output') {
          if (lastMessage instanceof AIMessage) {
            chunkContent =
              JSON.stringify({
                type: 'final',
                response: lastMessage.content,
              }) + '\n';
          }
        } else {
          chunkContent =
            JSON.stringify({
              type: 'step',
              step: `🤖 Thinking: ${lastMessage.content}...`,
            }) + '\n';
        }

        if (chunkContent) {
          controller.enqueue(encoder.encode(chunkContent));
        }
      },
    });

    const readableStream = agentStream.pipeThrough(transformStream);

    return new Response(readableStream, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
