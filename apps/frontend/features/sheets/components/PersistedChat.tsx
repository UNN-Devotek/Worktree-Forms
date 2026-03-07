'use client';

import React, { useState, useEffect, useRef, useTransition } from 'react';
import { sendMessage, getMessages } from '@/features/sheets/server/chat-actions';
import type { ChatMessage } from '@/features/sheets/server/chat-actions';

interface PersistedChatProps {
  projectId: string;
  currentUser: { id: string; name: string };
}

export const PersistedChat: React.FC<PersistedChatProps> = ({ projectId, currentUser }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isPending, startTransition] = useTransition();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadMessages = () => {
    startTransition(async () => {
      const result = await getMessages(projectId);
      setMessages(result);
    });
  };

  useEffect(() => {
    loadMessages();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim()) return;
    const text = inputText.trim();
    setInputText('');
    startTransition(async () => {
      await sendMessage(projectId, text);
      loadMessages();
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !isPending && (
          <div className="text-center text-zinc-400 mt-20">No messages yet. Say hello!</div>
        )}
        {messages.map((msg) => {
          const isMe = msg.userId === currentUser.id;
          return (
            <div key={msg.messageId} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[70%] rounded-lg px-4 py-2 text-sm ${isMe ? 'bg-blue-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800'}`}>
                {!isMe && (
                  <span className="text-xs font-bold opacity-70 block mb-1">{msg.senderName}</span>
                )}
                {msg.text}
              </div>
              <span className="text-[10px] text-zinc-400 mt-1">
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t bg-zinc-50 dark:bg-zinc-800/50">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            className="flex-1 bg-white dark:bg-zinc-900 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Type a message..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isPending}
          />
          <button
            type="submit"
            disabled={isPending || !inputText.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-md px-4 py-2 text-sm font-medium"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};
