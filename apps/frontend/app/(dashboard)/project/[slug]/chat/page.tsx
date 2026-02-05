'use client';

import { ChatPanel } from '@/features/sheets/components/ChatPanel';
import { useSession } from 'next-auth/react';
import { useSheetSync } from '@/features/sheets/useSheetSync';

// Reusing ChatPanel but making it full page for now
export default function ChatPage({ params }: { params: { slug: string } }) {
  const { data: session } = useSession();
  const projectId = params.slug; 
  
  // We can use a dedicated "chat" document ID or reuse the project ID if we had a project sync.
  // For now, let's use a "project-chat-{slug}" room
  const { doc } = useSheetSync(`project-chat-${projectId}`);

  const user = {
    name: session?.user?.name || 'Anonymous',
    id: session?.user?.id || 'dev-user-id', 
  };

  const mockUsers = [
      { id: user.id, name: user.name, color: '#3b82f6' },
      { id: 'user-2', name: 'Mike (Tech)', color: '#3b82f6' },
      { id: 'user-3', name: 'Sarah (PM)', color: '#10b981' }
  ];

  return (
    <div className="h-full flex flex-col bg-white dark:bg-zinc-900 rounded-lg border shadow-sm overflow-hidden">
        <div className="p-4 border-b">
            <h1 className="text-xl font-bold">Team Chat</h1>
            <p className="text-sm text-muted-foreground">Project communication channel</p>
        </div>
        <div className="flex-1 relative">
            {/* 
                ChatPanel was designed as a popup. We might need to adjust it to be inline.
                For now, let's hack it or wrap it.
                Actually, ChatPanel implementation has "isOpen" check.
                We should probably refactor ChatPanel to be more flexible OR render it always open.
            */}
             <InlineChat 
                doc={doc} 
                currentUser={user} 
                users={mockUsers} 
            />
        </div>
    </div>
  );
}

// Inline wrapper for ChatPanel logic (copy-paste of logic or import if refactored)
// Since ChatPanel is designed as a fixed popup, let's create a new InlineChat here or use ChatPanel and override styles?
// ChatPanel has specific "fixed bottom-4 right-4" classes.
// Let's copy the logic to a clean FullPageChat component here to be safe and clean.
import React, { useState, useEffect, useRef } from 'react';
import * as Y from 'yjs';

interface Message {
  id: string;
  text: string;
  senderName: string;
  senderId: string;
  timestamp: number;
}

interface InlineChatProps {
  doc: Y.Doc | null;
  currentUser: { id: string; name: string };
  users: { id: string; name: string; color: string }[];
}

const InlineChat: React.FC<InlineChatProps> = ({ doc, currentUser, users }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!doc) return;
    const messagesArray = doc.getArray<Message>('messages');
    const updateMessages = () => {
      setMessages(messagesArray.toArray());
    };
    messagesArray.observe(updateMessages);
    updateMessages();
    return () => messagesArray.unobserve(updateMessages);
  }, [doc]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || !doc) return;

    const messagesArray = doc.getArray<Message>('messages');
    const newMessage: Message = {
      id: Math.random().toString(36).substr(2, 9),
      text: inputText,
      senderName: currentUser.name,
      senderId: currentUser.id,
      timestamp: Date.now(),
    };

    doc.transact(() => {
        messagesArray.push([newMessage]);
    });
    setInputText('');
  };

  return (
    <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
             {messages.length === 0 && (
                <div className="text-center text-zinc-400 mt-20">No messages yet. Say hello!</div>
            )}
            {messages.map((msg) => {
                const isMe = msg.senderId === currentUser.id;
                return (
                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[70%] rounded-lg px-4 py-2 text-sm ${isMe ? 'bg-blue-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800'}`}>
                            {!isMe && <span className="text-xs font-bold opacity-70 block mb-1">{msg.senderName}</span>}
                            {msg.text}
                        </div>
                        <span className="text-[10px] text-zinc-400 mt-1">
                            {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                    </div>
                );
            })}
            <div ref={messagesEndRef} />
        </div>
        <div className="p-4 border-t bg-zinc-50 dark:bg-zinc-800/50">
             <form onSubmit={handleSend} className="flex gap-2">
                <input 
                    ref={inputRef}
                    className="flex-1 bg-white dark:bg-zinc-900 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Type a message..."
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                />
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white rounded-md px-4 py-2 text-sm font-medium">Send</button>
            </form>
        </div>
    </div>
  );
};
