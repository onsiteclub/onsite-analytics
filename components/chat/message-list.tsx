'use client';

import { useRef, useEffect } from 'react';
import { Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ResponseCard } from './response-card';
import type { ArgusMessage } from '@/lib/supabase/schema';

interface MessageListProps {
  messages: ArgusMessage[];
  isTyping?: boolean;
  onExportPDF?: (messageIndex: number) => void;
  onExportExcel?: (messageIndex: number) => void;
}

export function MessageList({
  messages,
  isTyping,
  onExportPDF,
  onExportExcel,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
        <div className="w-16 h-16 bg-orange-500/20 rounded-2xl flex items-center justify-center mb-4">
          <Bot className="w-8 h-8 text-orange-500" />
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">
          Welcome to ARGUS
        </h2>
        <p className="text-zinc-400 max-w-md mb-6">
          I'm your analytics intelligence system. Ask me anything about your
          data - users, revenue, churn, errors, and more.
        </p>
        <div className="grid grid-cols-2 gap-2 max-w-md">
          {[
            'How many paying users do we have?',
            'Show me users at risk of churning',
            'What are the most common errors?',
            'Generate a weekly report',
          ].map((suggestion) => (
            <button
              key={suggestion}
              className="px-4 py-2 text-sm text-left bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-zinc-300 transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6">
      {messages.map((message, index) => (
        <div
          key={index}
          className={cn(
            'flex gap-3',
            message.role === 'user' ? 'justify-end' : 'justify-start'
          )}
        >
          {message.role === 'assistant' && (
            <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-orange-500" />
            </div>
          )}

          <div
            className={cn(
              'max-w-[80%]',
              message.role === 'user' ? 'order-first' : ''
            )}
          >
            {/* Message Content */}
            <div
              className={cn(
                'rounded-2xl px-4 py-3',
                message.role === 'user'
                  ? 'bg-orange-500 text-white'
                  : 'bg-zinc-800 text-zinc-100'
              )}
            >
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {formatMessageContent(message.content)}
              </div>
            </div>

            {/* Visualization Card */}
            {message.visualization && message.role === 'assistant' && (
              <div className="mt-3">
                <ResponseCard
                  visualization={message.visualization}
                  sql={message.sql || undefined}
                  onExportPDF={
                    onExportPDF ? () => onExportPDF(index) : undefined
                  }
                  onExportExcel={
                    onExportExcel ? () => onExportExcel(index) : undefined
                  }
                />
              </div>
            )}

            {/* Timestamp */}
            <div
              className={cn(
                'text-xs text-zinc-500 mt-1',
                message.role === 'user' ? 'text-right' : 'text-left'
              )}
            >
              {formatTime(message.timestamp)}
            </div>
          </div>

          {message.role === 'user' && (
            <div className="w-8 h-8 bg-zinc-700 rounded-lg flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-zinc-300" />
            </div>
          )}
        </div>
      ))}

      {/* Typing Indicator */}
      {isTyping && (
        <div className="flex gap-3">
          <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <Bot className="w-4 h-4 text-orange-500" />
          </div>
          <div className="bg-zinc-800 rounded-2xl px-4 py-3">
            <div className="flex gap-1">
              <span
                className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce"
                style={{ animationDelay: '0ms' }}
              />
              <span
                className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce"
                style={{ animationDelay: '150ms' }}
              />
              <span
                className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce"
                style={{ animationDelay: '300ms' }}
              />
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}

/**
 * Format message content with basic markdown-like formatting
 */
function formatMessageContent(content: string): string {
  // For now, just return the content as-is
  // Could add markdown parsing later
  return content;
}
