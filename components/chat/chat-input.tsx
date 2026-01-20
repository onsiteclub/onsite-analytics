'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Send, Loader2, Slash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  placeholder?: string;
}

const QUICK_COMMANDS = [
  { command: '/report weekly', description: 'Generate weekly report' },
  { command: '/report monthly', description: 'Generate monthly report' },
  { command: '/churn', description: 'Show users at risk of churning' },
  { command: '/revenue', description: 'Show MRR and revenue metrics' },
  { command: '/errors today', description: 'Show errors from last 24h' },
  { command: '/sql', description: 'Show last SQL query used' },
  { command: '/export pdf', description: 'Export conversation as PDF' },
];

export function ChatInput({ onSend, isLoading, placeholder }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [showCommands, setShowCommands] = useState(false);
  const [selectedCommand, setSelectedCommand] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [message]);

  // Show commands dropdown when typing /
  useEffect(() => {
    if (message.startsWith('/')) {
      setShowCommands(true);
      setSelectedCommand(0);
    } else {
      setShowCommands(false);
    }
  }, [message]);

  const filteredCommands = QUICK_COMMANDS.filter((cmd) =>
    cmd.command.toLowerCase().includes(message.toLowerCase())
  );

  const handleSubmit = () => {
    if (!message.trim() || isLoading) return;
    onSend(message.trim());
    setMessage('');
    setShowCommands(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (showCommands && filteredCommands.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedCommand((prev) =>
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedCommand((prev) =>
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        );
      } else if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault();
        setMessage(filteredCommands[selectedCommand].command + ' ');
        setShowCommands(false);
      } else if (e.key === 'Escape') {
        setShowCommands(false);
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const selectCommand = (command: string) => {
    setMessage(command + ' ');
    setShowCommands(false);
    textareaRef.current?.focus();
  };

  return (
    <div className="relative">
      {/* Commands Dropdown */}
      {showCommands && filteredCommands.length > 0 && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg overflow-hidden">
          <div className="px-3 py-2 border-b border-zinc-700 text-xs text-zinc-500 uppercase">
            Quick Commands
          </div>
          {filteredCommands.map((cmd, index) => (
            <button
              key={cmd.command}
              onClick={() => selectCommand(cmd.command)}
              className={cn(
                'w-full px-3 py-2 flex items-center justify-between text-left hover:bg-zinc-700 transition-colors',
                selectedCommand === index && 'bg-zinc-700'
              )}
            >
              <div className="flex items-center gap-2">
                <Slash className="w-4 h-4 text-orange-500" />
                <span className="text-sm text-zinc-200">{cmd.command}</span>
              </div>
              <span className="text-xs text-zinc-500">{cmd.description}</span>
            </button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-end gap-2 bg-zinc-800 border border-zinc-700 rounded-xl p-2">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || 'Ask ARGUS anything... (type / for commands)'}
          disabled={isLoading}
          rows={1}
          className="flex-1 bg-transparent border-0 resize-none text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-0 px-2 py-1.5 max-h-[200px] text-sm"
        />
        <Button
          onClick={handleSubmit}
          disabled={!message.trim() || isLoading}
          size="sm"
          className={cn(
            'h-9 w-9 p-0 rounded-lg transition-colors',
            message.trim()
              ? 'bg-orange-500 hover:bg-orange-600 text-white'
              : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
          )}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Hint */}
      <div className="flex items-center justify-between px-2 pt-1">
        <span className="text-xs text-zinc-600">
          Press Enter to send, Shift+Enter for new line
        </span>
        <span className="text-xs text-zinc-600">
          Type <code className="text-orange-500/70">/</code> for commands
        </span>
      </div>
    </div>
  );
}
