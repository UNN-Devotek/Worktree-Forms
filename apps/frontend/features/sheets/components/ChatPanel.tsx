
import React, { useState, useEffect, useRef } from 'react';
import * as Y from 'yjs';

interface Message {
  id: string;
  text: string;
  senderName: string;
  senderId: string;
  timestamp: number;
}

interface ChatPanelProps {
  doc: Y.Doc | null;
  currentUser: { id: string; name: string };
  users: { id: string; name: string; color: string }[];
  isOpen: boolean;
  onToggle: () => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ doc, currentUser, users, isOpen, onToggle }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync Messages
  useEffect(() => {
    if (!doc) return;

    const messagesArray = doc.getArray<Message>('messages');

    const updateMessages = () => {
      const msgs = messagesArray.toArray();
      const lastMsg = msgs[msgs.length - 1]; // Naive check for NEW messages

      // Check for mentions in the LATEST message only (simple trigger)
      if (lastMsg && lastMsg.timestamp > Date.now() - 1000) { // Only recent
          if (lastMsg.text.includes(`@${currentUser.name}`) && lastMsg.senderId !== currentUser.id) {
             const prefs = localStorage.getItem('user_notification_prefs');
             if (prefs) {
                 const { emailMentions } = JSON.parse(prefs);
                 if (emailMentions) {
                     console.log(`[Notification System] Email sent to ${currentUser.name} for mention.`);
                     // In real app: call backend API to send email
                 } else {
                     console.log(`[Notification System] Email suppressed for ${currentUser.name} (User Pref).`);
                 }
             }
          }
      }

      setMessages(msgs);
    };

    messagesArray.observe(updateMessages);
    updateMessages();

    return () => {
      messagesArray.unobserve(updateMessages);
    };
  }, [doc]);

  // Auto-scroll
  useEffect(() => {
    if (isOpen) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setInputText(val);

      // Simple mention detection: check if cursor is after an @
      const cursor = e.target.selectionStart || 0;
      const textUntilCursor = val.slice(0, cursor);
      const match = textUntilCursor.match(/@(\w*)$/);
      
      if (match) {
          setMentionQuery(match[1]);
      } else {
          setMentionQuery(null);
      }
  };

  const handleSelectUser = (user: { name: string }) => {
      if (mentionQuery === null) return;
      
      const cursor = inputRef.current?.selectionStart || 0;
      const textBefore = inputText.slice(0, cursor - mentionQuery.length - 1); // -1 for @
      const textAfter = inputText.slice(cursor);
      
      const newText = `${textBefore}@${user.name} ${textAfter}`;
      setInputText(newText);
      setMentionQuery(null);
      
      // Restore focus (timeout to allow render)
      setTimeout(() => {
          inputRef.current?.focus();
      }, 10);
  };

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
    setMentionQuery(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSend();
      }
  };

  const filteredUsers = mentionQuery !== null 
    ? users.filter(u => u.name.toLowerCase().includes(mentionQuery.toLowerCase()))
    : [];

  if (!isOpen) {
      return (
          <button 
            onClick={onToggle}
            className="fixed bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg z-50 transition-transform hover:scale-105"
          >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
          </button>
      )
  }

  return (
    <div className="fixed bottom-4 right-4 w-80 h-96 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl z-50 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
            <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">Team Chat</h3>
            <button onClick={onToggle} className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>

        {/* Message List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white dark:bg-zinc-900">
            {messages.length === 0 && (
                <div className="text-center text-xs text-zinc-400 mt-10">
                    No messages yet. Start the conversation!
                </div>
            )}
            {messages.map((msg) => {
                const isMe = msg.senderId === currentUser.id;
                return (
                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        <div className={`
                            max-w-[85%] rounded-lg px-3 py-2 text-sm
                            ${isMe 
                                ? 'bg-blue-600 text-white rounded-br-none' 
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-bl-none'}
                        `}>
                            {!isMe && <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 block mb-1">{msg.senderName}</span>}
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

        {/* Input */}
        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 relative">
            {/* Mentions Dropdown */}
            {mentionQuery !== null && filteredUsers.length > 0 && (
                <div className="absolute bottom-full left-0 w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg mb-1 overflow-hidden z-20">
                    {filteredUsers.map(user => (
                        <div 
                            key={user.id}
                            className="px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer flex items-center gap-2"
                            onClick={() => handleSelectUser(user)}
                        >
                            <div className="w-5 h-5 rounded-full" style={{ backgroundColor: user.color }}></div>
                            <span className="text-sm font-medium">{user.name}</span>
                        </div>
                    ))}
                </div>
            )}

            <form onSubmit={handleSend} className="flex gap-2">
                <input 
                    ref={inputRef}
                    className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-zinc-100"
                    placeholder="Type a message... (@ to mention)"
                    value={inputText}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                />
                <button 
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-md px-3 py-2 text-sm font-medium transition-colors"
                >
                    Send
                </button>
            </form>
        </div>
    </div>
  );
};
