'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Bot, Star, Share2, MoreHorizontal } from 'lucide-react';
import { ChatInput, MessageList } from '@/components/chat';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import {
  getConversation,
  addMessage,
  toggleStar,
} from '@/lib/supabase/conversations';
import type { ArgusConversation, ArgusMessage } from '@/lib/supabase/schema';
import { cn } from '@/lib/utils';
import { exportConversationToPDF, exportTableToExcel } from '@/lib/export';

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.id as string;

  const [conversation, setConversation] = useState<ArgusConversation | null>(null);
  const [messages, setMessages] = useState<ArgusMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingConversation, setLoadingConversation] = useState(true);

  // Load conversation
  useEffect(() => {
    const loadConversation = async () => {
      setLoadingConversation(true);
      const conv = await getConversation(conversationId);
      if (conv) {
        setConversation(conv);
        setMessages(conv.messages || []);
      } else {
        // Conversation not found, redirect to main chat
        router.push('/chat');
      }
      setLoadingConversation(false);
    };

    if (conversationId) {
      loadConversation();
    }
  }, [conversationId, router]);

  const handleSend = async (content: string) => {
    setIsLoading(true);

    // Add user message to local state immediately
    const userMessage: ArgusMessage = {
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      // Call AI API
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          history: messages,
          conversationId,
        }),
      });

      const data = await response.json();

      // Create assistant message
      const assistantMessage: ArgusMessage = {
        role: 'assistant',
        content: data.message,
        timestamp: new Date().toISOString(),
        visualization: data.visualization || null,
        sql: data.sql || null,
      };

      // Add to local state
      setMessages((prev) => [...prev, assistantMessage]);

      // Persist to database
      await addMessage(conversationId, userMessage);
      await addMessage(conversationId, assistantMessage);
    } catch (error) {
      console.error('Error sending message:', error);
      // Add error message
      const errorMessage: ArgusMessage = {
        role: 'assistant',
        content: 'Sorry, there was an error processing your request. Please try again.',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStar = async () => {
    if (!conversation) return;
    const newStarred = !conversation.starred;
    await toggleStar(conversationId, newStarred);
    setConversation((prev) =>
      prev ? { ...prev, starred: newStarred } : null
    );
  };

  const handleShare = async () => {
    // Copy conversation link to clipboard
    const url = `${window.location.origin}/chat/${conversationId}`;
    await navigator.clipboard.writeText(url);
    // Could show a toast here
  };

  const handleExportPDF = useCallback(
    async (messageIndex: number) => {
      const message = messages[messageIndex];
      if (message.visualization) {
        await exportConversationToPDF(
          conversation?.title || 'ARGUS Report',
          [message]
        );
      }
    },
    [messages, conversation]
  );

  const handleExportExcel = useCallback(
    async (messageIndex: number) => {
      const message = messages[messageIndex];
      if (
        message.visualization?.type === 'table' &&
        message.visualization.data
      ) {
        await exportTableToExcel(
          message.visualization.title || 'Data Export',
          message.visualization.data as Record<string, unknown>[]
        );
      }
    },
    [messages]
  );

  if (loadingConversation) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-pulse text-zinc-500">Loading conversation...</div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-zinc-500">Conversation not found</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-screen">
      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center">
              <Bot className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <h1 className="font-semibold text-white line-clamp-1">
                {conversation.title || 'Conversation'}
              </h1>
              <p className="text-xs text-zinc-500">
                {messages.length} messages
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleStar}
              className={cn(
                'h-9 w-9 p-0',
                conversation.starred
                  ? 'text-yellow-500'
                  : 'text-zinc-400 hover:text-white'
              )}
            >
              <Star
                className={cn(
                  'w-4 h-4',
                  conversation.starred && 'fill-yellow-500'
                )}
              />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="h-9 w-9 p-0 text-zinc-400 hover:text-white"
            >
              <Share2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0 text-zinc-400 hover:text-white"
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Messages */}
      <MessageList
        messages={messages}
        isTyping={isLoading}
        onExportPDF={handleExportPDF}
        onExportExcel={handleExportExcel}
      />

      {/* Input */}
      <div className="border-t border-zinc-800 p-4">
        <ChatInput onSend={handleSend} isLoading={isLoading} />
      </div>
    </div>
  );
}
