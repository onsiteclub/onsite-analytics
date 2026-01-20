'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ChatSidebar } from '@/components/chat';
import { createClient } from '@/lib/supabase/client';
import { createConversation } from '@/lib/supabase/conversations';

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Extract conversation ID from pathname
  const conversationId = pathname.startsWith('/chat/')
    ? pathname.split('/chat/')[1]
    : undefined;

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/auth/login');
        return;
      }

      setUserId(user.id);
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  const handleNewChat = async () => {
    if (!userId) return;

    // Create a new conversation and navigate to it
    const conversation = await createConversation(userId);
    if (conversation) {
      router.push(`/chat/${conversation.id}`);
    } else {
      // If creation fails, just go to main chat
      router.push('/chat');
    }
  };

  const handleSelectConversation = (id: string) => {
    router.push(`/chat/${id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-pulse flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-500 rounded-lg" />
          <span className="text-white font-semibold">Loading ARGUS...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex">
      <ChatSidebar
        currentConversationId={conversationId}
        onNewChat={handleNewChat}
        onSelectConversation={handleSelectConversation}
        userId={userId!}
      />
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}
