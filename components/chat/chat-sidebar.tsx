'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Plus,
  MessageSquare,
  Star,
  Trash2,
  MoreHorizontal,
  Search,
  Settings,
  LogOut,
  Archive,
  Edit2,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ArgusConversation } from '@/lib/supabase/schema';
import {
  getConversations,
  getStarredConversations,
  toggleStar,
  archiveConversation,
  deleteConversation,
  updateTitle,
  searchConversations,
} from '@/lib/supabase/conversations';

interface ChatSidebarProps {
  currentConversationId?: string;
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
  userId: string;
}

export function ChatSidebar({
  currentConversationId,
  onNewChat,
  onSelectConversation,
  userId,
}: ChatSidebarProps) {
  const [conversations, setConversations] = useState<ArgusConversation[]>([]);
  const [starredConversations, setStarredConversations] = useState<ArgusConversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ArgusConversation[] | null>(null);
  const [showStarred, setShowStarred] = useState(true);
  const [showRecent, setShowRecent] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const router = useRouter();

  // Load conversations
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    const [all, starred] = await Promise.all([
      getConversations(),
      getStarredConversations(),
    ]);
    setConversations(all.filter(c => !c.starred));
    setStarredConversations(starred);
  };

  // Search handler
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      const results = await searchConversations(searchQuery);
      setSearchResults(results);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleStar = async (id: string, starred: boolean) => {
    await toggleStar(id, !starred);
    loadConversations();
    setMenuOpenId(null);
  };

  const handleArchive = async (id: string) => {
    await archiveConversation(id);
    loadConversations();
    setMenuOpenId(null);
    if (id === currentConversationId) {
      onNewChat();
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this conversation permanently?')) {
      await deleteConversation(id);
      loadConversations();
      setMenuOpenId(null);
      if (id === currentConversationId) {
        onNewChat();
      }
    }
  };

  const handleRename = async (id: string) => {
    if (editTitle.trim()) {
      await updateTitle(id, editTitle.trim());
      setEditingId(null);
      loadConversations();
    }
  };

  const startEditing = (conv: ArgusConversation) => {
    setEditingId(conv.id);
    setEditTitle(conv.title || '');
    setMenuOpenId(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderConversationItem = (conv: ArgusConversation) => {
    const isActive = conv.id === currentConversationId;
    const isEditing = editingId === conv.id;
    const isMenuOpen = menuOpenId === conv.id;

    return (
      <div
        key={conv.id}
        className={cn(
          'group relative flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors',
          isActive
            ? 'bg-orange-500/20 text-orange-400'
            : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
        )}
        onClick={() => !isEditing && onSelectConversation(conv.id)}
      >
        <MessageSquare className="w-4 h-4 flex-shrink-0" />

        {isEditing ? (
          <Input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename(conv.id);
              if (e.key === 'Escape') setEditingId(null);
            }}
            onBlur={() => handleRename(conv.id)}
            className="h-6 text-sm bg-zinc-800 border-zinc-700"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="flex-1 truncate text-sm">
            {conv.title || 'Untitled'}
          </span>
        )}

        {conv.starred && !isEditing && (
          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
        )}

        {!isEditing && (
          <div className="opacity-0 group-hover:opacity-100 flex items-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpenId(isMenuOpen ? null : conv.id);
              }}
              className="p-1 hover:bg-zinc-700 rounded"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Dropdown Menu */}
        {isMenuOpen && (
          <div
            className="absolute right-0 top-full mt-1 z-50 w-40 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg py-1"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => handleStar(conv.id, conv.starred)}
              className="w-full px-3 py-2 text-left text-sm hover:bg-zinc-700 flex items-center gap-2"
            >
              <Star className={cn('w-4 h-4', conv.starred && 'fill-yellow-500 text-yellow-500')} />
              {conv.starred ? 'Unstar' : 'Star'}
            </button>
            <button
              onClick={() => startEditing(conv)}
              className="w-full px-3 py-2 text-left text-sm hover:bg-zinc-700 flex items-center gap-2"
            >
              <Edit2 className="w-4 h-4" />
              Rename
            </button>
            <button
              onClick={() => handleArchive(conv.id)}
              className="w-full px-3 py-2 text-left text-sm hover:bg-zinc-700 flex items-center gap-2"
            >
              <Archive className="w-4 h-4" />
              Archive
            </button>
            <div className="border-t border-zinc-700 my-1" />
            <button
              onClick={() => handleDelete(conv.id)}
              className="w-full px-3 py-2 text-left text-sm hover:bg-zinc-700 flex items-center gap-2 text-red-400"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        )}
      </div>
    );
  };

  const displayConversations = searchResults !== null ? searchResults : conversations;

  return (
    <div className="w-64 h-full bg-zinc-900 border-r border-zinc-800 flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-zinc-800">
        <Link href="/chat" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <span className="font-semibold text-white">ARGUS</span>
        </Link>
      </div>

      {/* New Chat Button */}
      <div className="p-3">
        <Button
          onClick={onNewChat}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white gap-2"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </Button>
      </div>

      {/* Search */}
      <div className="px-3 pb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-zinc-800 border-zinc-700 text-sm"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto px-2">
        {searchResults !== null ? (
          // Search Results
          <div className="py-2">
            <div className="px-2 py-1 text-xs text-zinc-500 uppercase">
              Search Results ({searchResults.length})
            </div>
            {searchResults.length === 0 ? (
              <div className="px-3 py-4 text-sm text-zinc-500 text-center">
                No conversations found
              </div>
            ) : (
              searchResults.map(renderConversationItem)
            )}
          </div>
        ) : (
          <>
            {/* Starred Section */}
            {starredConversations.length > 0 && (
              <div className="py-2">
                <button
                  onClick={() => setShowStarred(!showStarred)}
                  className="w-full px-2 py-1 flex items-center gap-1 text-xs text-zinc-500 uppercase hover:text-zinc-400"
                >
                  {showStarred ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  <Star className="w-3 h-3" />
                  Starred ({starredConversations.length})
                </button>
                {showStarred && starredConversations.map(renderConversationItem)}
              </div>
            )}

            {/* Recent Section */}
            <div className="py-2">
              <button
                onClick={() => setShowRecent(!showRecent)}
                className="w-full px-2 py-1 flex items-center gap-1 text-xs text-zinc-500 uppercase hover:text-zinc-400"
              >
                {showRecent ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                Recent ({conversations.length})
              </button>
              {showRecent && (
                conversations.length === 0 ? (
                  <div className="px-3 py-4 text-sm text-zinc-500 text-center">
                    No conversations yet
                  </div>
                ) : (
                  conversations.map(renderConversationItem)
                )
              )}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-zinc-800 p-3 space-y-1">
        <Link
          href="/chat/settings"
          className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
        >
          <Settings className="w-4 h-4" />
          Settings
        </Link>
        <button
          onClick={() => router.push('/auth/login')}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </div>
  );
}
