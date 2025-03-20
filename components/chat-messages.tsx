"use client";

import { useChat } from 'ai/react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { MessageSquare, Send, Loader2, Bot, UserIcon } from 'lucide-react';
import { Message } from 'ai';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatMessagesProps {
  messages: Message[];
  className?: string;
}

export function ChatMessages({ messages: initialMessages, className }: ChatMessagesProps) {
  const [streamingContent, setStreamingContent] = useState('');
  const chatViewRef = useRef<HTMLDivElement>(null);
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat/stream',
    initialMessages,
    onFinish: () => {
      setStreamingContent('');
    },
    onResponse: () => {
      setStreamingContent('');
    },
    onError: (error) => {
      console.error('Chat error:', error);
      setStreamingContent('');
    },
  });

  useEffect(() => {
    if (chatViewRef.current) {
      chatViewRef.current.scrollTop = chatViewRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  return (
    <Card className={cn('flex flex-col h-full', className)}>
      <div className="flex items-center gap-2 p-4 border-b">
        <MessageSquare className="w-5 h-5" />
        <h2 className="text-lg font-semibold">Chat</h2>
      </div>
      <ScrollArea ref={chatViewRef} className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex items-start gap-2 sm:gap-4',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.role === 'assistant' && (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[hsl(var(--primary))] text-white shadow-sm">
                  <Bot className="h-5 w-5" />
                </div>
              )}
              <div
                className={cn(
                  'rounded-2xl px-3 sm:px-5 py-3 shadow-sm max-w-[95%] sm:max-w-[85%]',
                  message.role === 'user'
                    ? 'bg-[hsl(var(--primary))] text-white ml-1 sm:ml-0'
                    : 'bg-white border border-[hsl(var(--border))] mr-1 sm:mr-0'
                )}
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ children }) => <p className="whitespace-pre-wrap">{children}</p>,
                    code: ({ className, children, ...props }) => (
                      <code className="bg-[hsl(var(--muted))] px-1 py-0.5 rounded text-sm" {...props}>
                        {children}
                      </code>
                    ),
                    pre: ({ children }) => (
                      <pre className="bg-[hsl(var(--muted))] p-2 rounded overflow-x-auto">
                        {children}
                      </pre>
                    ),
                    ul: ({ children }) => <ul className="list-disc list-inside my-2">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-inside my-2">{children}</ol>,
                    li: ({ children }) => <li className="my-1">{children}</li>,
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-[hsl(var(--primary-light))] bg-[hsl(var(--gray-50))] pl-4 py-1 italic my-4 text-gray-700">
                        {children}
                      </blockquote>
                    ),
                  }}
                >
                  {message.content}
                </ReactMarkdown>
                <div className="text-xs mt-2 opacity-80">
                  {message.createdAt && new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              {message.role === 'user' && (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[hsl(var(--gray-200))] shadow-sm">
                  <UserIcon className="h-5 w-5 text-gray-600" />
                </div>
              )}
            </div>
          ))}
          {streamingContent && (
            <div className="flex items-start gap-2 sm:gap-4 justify-start">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[hsl(var(--primary))] text-white shadow-sm">
                <Bot className="h-5 w-5" />
              </div>
              <div className="rounded-2xl px-3 sm:px-5 py-3 shadow-sm bg-white border border-[hsl(var(--border))] max-w-[95%] sm:max-w-[85%] mr-1 sm:mr-0">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ children }) => <p className="whitespace-pre-wrap">{children}</p>,
                    code: ({ className, children, ...props }) => (
                      <code className="bg-[hsl(var(--muted))] px-1 py-0.5 rounded text-sm" {...props}>
                        {children}
                      </code>
                    ),
                    pre: ({ children }) => (
                      <pre className="bg-[hsl(var(--muted))] p-2 rounded overflow-x-auto">
                        {children}
                      </pre>
                    ),
                    ul: ({ children }) => <ul className="list-disc list-inside my-2">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-inside my-2">{children}</ol>,
                    li: ({ children }) => <li className="my-1">{children}</li>,
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-[hsl(var(--primary-light))] bg-[hsl(var(--gray-50))] pl-4 py-1 italic my-4 text-gray-700">
                        {children}
                      </blockquote>
                    ),
                  }}
                >
                  {streamingContent}
                </ReactMarkdown>
                <span className="inline-flex items-center">
                  <span className="animate-bounce">.</span>
                  <span className="animate-bounce delay-100">.</span>
                  <span className="animate-bounce delay-200">.</span>
                </span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Type a message..."
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
} 