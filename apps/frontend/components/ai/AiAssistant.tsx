
'use client';

// Removed ai/react dependency to fix build error
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, X, Send, Bot, User } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface Message {
    id: string | number;
    role: 'user' | 'assistant';
    content: string;
}

export function AiAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
        const response = await fetch('/api/ai/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                messages: [...messages, userMsg],
                projectId: 'rag-test-project' // MVP hardcoded or from context
            })
        });

        if (!response.body) throw new Error("No response body");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        
        const aiMsg: Message = { id: Date.now() + 1, role: 'assistant', content: '' };
        setMessages(prev => [...prev, aiMsg]);

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const text = decoder.decode(value, { stream: true });
            
            setMessages(prev => prev.map(m => {
                if (m.id === aiMsg.id) {
                    return { ...m, content: m.content + text };
                }
                return m;
            }));
        }

    } catch (error) {
        console.error("Chat Failed", error);
        setMessages(prev => [...prev, { id: Date.now(), role: 'assistant', content: "Sorry, I encountered an error." }]);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <>
      {/* FAB */}
      <Button
        className={cn(
          "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl transition-transform hover:scale-105 z-50",
          isOpen && "rotate-90 scale-0"
        )}
        onClick={() => setIsOpen(true)}
      >
        <MessageSquare className="h-6 w-6" />
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-[350px] sm:w-[400px] h-[500px] shadow-2xl z-50 flex flex-col animate-in slide-in-from-bottom-10 fade-in duration-200 overflow-hidden pb-2">
          <CardHeader className="p-4 border-b flex flex-row items-center justify-between bg-primary/5">
            <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Worktree AI</CardTitle>
            </div>
            <Button variant="neutral" size="icon" className="h-8 w-8" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          
          <CardContent className="flex-1 p-0 overflow-hidden relative">
            <ScrollArea className="h-full p-4" viewportRef={scrollRef}>
                {messages.length === 0 && (
                    <div className="text-center text-muted-foreground mt-20 text-sm">
                        <p>Ask me anything about your project.</p>
                        <p className="mt-2 text-xs opacity-70">"What are the recent failures?"</p>
                    </div>
                )}
                
                <div className="space-y-4">
                    {messages.map((m) => (
                        <div key={m.id} className={cn("flex gap-3 text-sm", m.role === 'user' ? "flex-row-reverse" : "")}>
                            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", 
                                m.role === 'user' ? "bg-primary text-primary-foreground" : "bg-muted")}>
                                {m.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                            </div>
                            <div className={cn("rounded-lg p-3 max-w-[80%] whitespace-pre-wrap", 
                                m.role === 'user' ? "bg-primary text-primary-foreground" : "bg-muted")}>
                                {m.content}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                         <div className="flex gap-3 text-sm">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-muted">
                                <Bot className="h-4 w-4 animate-pulse" />
                            </div>
                            <div className="bg-muted rounded-lg p-3 text-xs italic opacity-70">
                                Thinking...
                            </div>
                         </div>
                    )}
                </div>
            </ScrollArea>
          </CardContent>

          <CardFooter className="p-4 border-t bg-background">
            <form onSubmit={handleSubmit} className="flex w-full gap-2">
                <Input 
                    value={input} 
                    onChange={(e) => setInput(e.target.value)} 
                    placeholder="Ask a question..." 
                    className="flex-1"
                />
                <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                    <Send className="h-4 w-4" />
                </Button>
            </form>
          </CardFooter>
        </Card>
      )}
    </>
  );
}
