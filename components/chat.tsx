'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function Chat() {
  const [messages, setMessages] = useState<
    { text: string; sender: 'user' | 'server' }[]
  >([]);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState('Disconnected');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [sessionId, setSessionId] = useState(Math.random().toString());
  const [usedModel, setUsedModel] = useState('gpt-4o-mini');

  useEffect(() => {
    // Only scroll within the chat container, not the whole page
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest', // Don't scroll the page, just the container
        inline: 'nearest',
      });
    }
  }, [messages]);

  useEffect(() => {
    window.scrollTo(0, 0);
    setStatus('Ready');
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || status === 'Processing') return;

    setMessages((prev) => [...prev, { text: input, sender: 'user' }]);
    const userMessage = input;
    setInput('');
    setStatus('Processing');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          sessionId: sessionId,
          model: usedModel,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete line in buffer

          for (const line of lines) {
            if (line.trim()) {
              try {
                const data = JSON.parse(line);

                if (data.type === 'step') {
                  setMessages((prev) => [
                    ...prev,
                    {
                      text: `🔄 ${data.step}`,
                      sender: 'server',
                    },
                  ]);
                } else if (data.type === 'final') {
                  setMessages((prev) => [
                    ...prev,
                    {
                      text: data.response,
                      sender: 'server',
                    },
                  ]);
                } else if (data.type === 'error') {
                  // Show error message
                  setMessages((prev) => [
                    ...prev,
                    {
                      text: data.text,
                      sender: 'server',
                    },
                  ]);
                }
              } catch (e) {
                console.error('Failed to parse chunk:', line);
              }
            }
          }
        }
      }

      setStatus('Ready');
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        { text: 'Error: Failed to send message', sender: 'server' },
      ]);
      setStatus('Ready');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
          Helpers <span className="text-cyan-400">Hands</span>
        </h1>
        <p className="text-gray-400 text-lg">
          A reasoning computer-use/coding agent. Refresh for new session.
        </p>
        <div className="mt-2">
          <span
            className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
              status === 'Ready'
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : status === 'Processing'
                  ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}
          >
            {status}
          </span>
        </div>
      </div>

      {/* Chat Container */}
      <Card className="bg-charcoal/50 border-cyan/20 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="h-[60vh] overflow-y-auto mb-4 space-y-6 scrollbar-thin scrollbar-thumb-cyan/30 scrollbar-track-transparent pr-2">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-lg ${
                    msg.sender === 'user'
                      ? 'bg-cyan-500/20 text-white border border-cyan-400'
                      : 'bg-gray-700/80 text-gray-100 border border-gray-600'
                  }`}
                >
                  <div className="whitespace-pre-wrap break-words leading-relaxed text-sm font-mono">
                    {msg.text}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex space-x-2">
            <Select value={usedModel} onValueChange={setUsedModel}>
              <SelectTrigger className="w-32 min-w-32 bg-navy/50 border-cyan/30 text-white focus:border-cyan-400 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-navy/90 border-cyan/30">
                <SelectItem
                  value="gpt-4o-mini"
                  className="text-white focus:bg-cyan-500/20 focus:text-cyan-400"
                >
                  gpt-4o-mini
                </SelectItem>
                <SelectItem
                  value="gpt-4o"
                  className="text-white focus:bg-cyan-500/20 focus:text-cyan-400"
                >
                  gpt-4o
                </SelectItem>
              </SelectContent>
            </Select>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type a message..."
              className="flex-1 bg-navy/50 border-cyan/30 text-white placeholder:text-gray-400 focus:border-cyan-400"
            />
            <Button
              onClick={sendMessage}
              disabled={status === 'Processing'}
              className="bg-blue-500 hover:bg-blue-600 text-white border border-blue-400 hover:border-blue-300 disabled:bg-gray-600 disabled:text-gray-400 disabled:border-gray-500"
            >
              Send
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
