'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bot } from 'lucide-react';
import { ChatInput, MessageList } from '@/components/chat';
import { createClient } from '@/lib/supabase/client';
import { createConversation, addMessage } from '@/lib/supabase/conversations';
import type { ArgusMessage } from '@/lib/supabase/schema';

export default function ChatPage() {
  const [messages, setMessages] = useState<ArgusMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    getUser();
  }, []);

  const handleSend = async (content: string) => {
    if (!userId) return;

    setIsLoading(true);

    // Add user message to local state
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

      // Create a new conversation with these messages
      const conversation = await createConversation(userId, content);
      if (conversation) {
        // Add the assistant response
        await addMessage(conversation.id, assistantMessage);
        // Navigate to the new conversation
        router.push(`/chat/${conversation.id}`);
      }
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

  return (
    <div className="flex-1 flex flex-col h-screen">
      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center">
            <Bot className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <h1 className="font-semibold text-white">ARGUS</h1>
            <p className="text-xs text-zinc-500">
              Analytics Intelligence System
            </p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <MessageList messages={messages} isTyping={isLoading} />

      {/* Input */}
      <div className="border-t border-zinc-800 p-4">
        <ChatInput onSend={handleSend} isLoading={isLoading} />
      </div>
    </div>
  );
}
