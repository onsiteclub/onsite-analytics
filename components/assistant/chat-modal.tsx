'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2, X, Bot, User, Minimize2, Maximize2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useHourglassTheme } from '@/lib/theme';
import { usePathname } from 'next/navigation';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatModalProps {
  onClose: () => void;
  position: { x: number; y: number };
}

const MESSAGES_KEY = 'argus-messages';
const MAX_STORED_MESSAGES = 50;

export function ChatModal({ onClose, position }: ChatModalProps) {
  const { theme, accentColor, labelPt } = useHourglassTheme();
  const pathname = usePathname();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load messages on mount
  useEffect(() => {
    const saved = localStorage.getItem(MESSAGES_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setMessages(parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
      } catch {
        // Start fresh
      }
    }

    if (messages.length === 0) {
      setMessages([{
        id: '1',
        role: 'assistant',
        content: `Olá! Sou o ARGUS, seu analista de dados. Estou vendo que você está na página de ${labelPt}. Como posso ajudar?`,
        timestamp: new Date(),
      }]);
    }
  }, []);

  // Save messages when they change
  useEffect(() => {
    if (messages.length > 1) {
      const toStore = messages.slice(-MAX_STORED_MESSAGES);
      localStorage.setItem(MESSAGES_KEY, JSON.stringify(toStore));
    }
  }, [messages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 100) + 'px';
    }
  }, [input]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          history: messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
          context: { page: pathname, theme },
        }),
      });

      const data = await response.json();

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message || 'Desculpe, não consegui processar sua solicitação.',
        timestamp: new Date(),
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Ops, ocorreu um erro. Tente novamente.',
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const copyMessage = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const modalWidth = isExpanded ? 480 : 360;
  const modalHeight = isExpanded ? 600 : 450;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      transition={{ duration: 0.2 }}
      className="fixed z-50 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      style={{
        right: -position.x + 60,
        bottom: -position.y + 60,
        width: modalWidth,
        height: modalHeight,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ backgroundColor: accentColor + '15' }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: accentColor + '30' }}
          >
            <Bot className="h-4 w-4" style={{ color: accentColor }} />
          </div>
          <div>
            <h3 className="text-sm font-semibold">ARGUS</h3>
            <p className="text-xs text-muted-foreground">Analytics Intelligence</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              'flex gap-2',
              message.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            {message.role === 'assistant' && (
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: accentColor + '30' }}
              >
                <Bot className="h-3 w-3" style={{ color: accentColor }} />
              </div>
            )}

            <div
              className={cn(
                'max-w-[85%] rounded-lg px-3 py-2 text-sm group relative',
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              )}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
              <span className="text-[10px] opacity-50 mt-1 block">
                {message.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>

              {message.role === 'assistant' && (
                <button
                  onClick={() => copyMessage(message.content, message.id)}
                  className="absolute -right-8 top-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted"
                >
                  {copied === message.id ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3 text-muted-foreground" />
                  )}
                </button>
              )}
            </div>

            {message.role === 'user' && (
              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <User className="h-3 w-3" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-2">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center"
              style={{ backgroundColor: accentColor + '30' }}
            >
              <Bot className="h-3 w-3" style={{ color: accentColor }} />
            </div>
            <div className="bg-muted rounded-lg px-3 py-2">
              <Loader2 className="h-4 w-4 animate-spin" style={{ color: accentColor }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-3">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pergunte algo..."
            className="flex-1 resize-none rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring max-h-24"
            rows={1}
            disabled={loading}
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            size="sm"
            className="h-auto px-3"
            style={{
              backgroundColor: input.trim() ? accentColor : undefined,
            }}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
          Contexto: {labelPt} | Enter para enviar
        </p>
      </div>
    </motion.div>
  );
}
