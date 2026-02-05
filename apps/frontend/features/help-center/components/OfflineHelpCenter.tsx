'use client';

import React, { useState, useEffect } from 'react';
import { useHelpSync } from '@/hooks/useHelpSync';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Wifi, WifiOff, RefreshCw, BookOpen, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { OfflineArticle } from '@/lib/help-storage';
// Basic Read-Only Plugins for Viewer
// Note: We are using a simplified read-only setup here.
// In a real app, you'd reuse the same plugins definition as the editor but with readOnly={true}

export function OfflineHelpCenter() {
  const { isSyncing, syncError, status, isOfflineMode, syncArticles, getLocalArticles } = useHelpSync();
  const [searchQuery, setSearchQuery] = useState('');
  const [articles, setArticles] = useState<OfflineArticle[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<OfflineArticle | null>(null);

  useEffect(() => {
    setArticles(getLocalArticles(searchQuery));
  }, [searchQuery, status.lastSync]); // Refresh when sync happens or search changes

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] gap-4">
      {/* Header / Status Bar */}
      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border">
        <div className="flex items-center gap-3">
          {isOfflineMode ? (
            <Badge variant="destructive" className="gap-1">
              <WifiOff className="h-3 w-3" /> Offline
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1">
              <Wifi className="h-3 w-3" /> Online
            </Badge>
          )}
          
          <div className="text-sm text-muted-foreground hidden sm:block">
            {status.lastSync 
              ? `Synced ${formatDistanceToNow(status.lastSync)} ago (${status.articleCount} articles)` 
              : 'Never synced'}
          </div>
        </div>

        <Button 
          variant="outline" 
          size="sm" 
          onClick={syncArticles} 
          disabled={isSyncing || isOfflineMode}
          className="gap-2"
        >
          {isSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {isSyncing ? 'Syncing...' : 'Sync Now'}
        </Button>
      </div>

      {syncError && (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
          {syncError}
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* Article List (Left Sidebar on Desktop, Full on Mobile if no selection) */}
        <div className={`flex-1 flex flex-col gap-4 min-w-[300px] max-w-md ${selectedArticle ? 'hidden md:flex' : 'flex'}`}>
          <div className="relative">
            <Input 
              placeholder="Search offline articles..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-3">
              {articles.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  No articles found offline.
                  <br />
                  <span className="text-xs">Try syncing when online.</span>
                </div>
              ) : (
                articles.map(article => (
                  <Card 
                    key={article.id} 
                    className={`cursor-pointer transition-colors hover:bg-accent ${selectedArticle?.id === article.id ? 'border-primary bg-accent/50' : ''}`}
                    onClick={() => setSelectedArticle(article)}
                  >
                    <CardHeader className="p-4">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-base">{article.title}</CardTitle>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs font-normal">
                          {article.category}
                        </Badge>
                      </div>
                    </CardHeader>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Article Reader (Right Side / Full Screen on Mobile) */}
        {selectedArticle ? (
          <div className="flex-1 flex flex-col bg-card border rounded-lg overflow-hidden shadow-sm h-full">
            <div className="p-4 border-b flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                className="md:hidden" 
                onClick={() => setSelectedArticle(null)}
              >
                <ChevronRight className="h-5 w-5 rotate-180" />
              </Button>
              <div>
                <h2 className="text-xl font-bold">{selectedArticle.title}</h2>
                <div className="text-xs text-muted-foreground">
                  {selectedArticle.category} • Updated {new Date(selectedArticle.updatedAt).toLocaleDateString()}
                </div>
              </div>
            </div>
            
            <ScrollArea className="flex-1 p-6">
               {/* 
                 In a real app, this would use the Plate editor in readOnly mode.
                 Since we don't have the full plugin setup shared easily here, 
                 we'll just render a placeholder or basic JSON dump if complexity is high,
                 but ideally we use Plate.
               */}
               <div className="prose dark:prose-invert max-w-none">
                 {/* 
                   Fallback: Simple text checks or render JSON if structure is known.
                   Since we are using Plate's value structure:
                 */}
                  <ArticleContent content={selectedArticle.content} />
               </div>
            </ScrollArea>
          </div>
        ) : (
          <div className="flex-1 hidden md:flex items-center justify-center bg-muted/10 rounded-lg border border-dashed">
            <div className="text-center text-muted-foreground">
              <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p>Select an article to read</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Simple renderer for Plate content structure (recursive)
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import Image from 'next/image';

// ... (other imports)

// ... (OfflineHelpCenter component code remains same until ArticleContent)

function ArticleContent({ content }: { content: any[] }) {
  if (!Array.isArray(content)) return <p className="text-red-500">Invalid content format</p>;

  return (
    <>
      {content.map((node, index) => {
        if (!node.type) {
           return <span key={index}>{node.text}</span>;
        }

        switch (node.type) {
          case 'h1': return <h1 key={index} className="text-3xl font-bold mb-4">{node.children?.map((c: any, i: number) => <span key={i}>{c.text}</span>)}</h1>;
          case 'h2': return <h2 key={index} className="text-2xl font-semibold mb-3 mt-6">{node.children?.map((c: any, i: number) => <span key={i}>{c.text}</span>)}</h2>;
          case 'h3': return <h3 key={index} className="text-xl font-medium mb-2 mt-4">{node.children?.map((c: any, i: number) => <span key={i}>{c.text}</span>)}</h3>;
          case 'p': return <p key={index} className="mb-4 leading-relaxed">{node.children?.map((c: any, i: number) => <span key={i} className={c.bold ? 'font-bold' : ''}>{c.text}</span>)}</p>;
          case 'ul': return <ul key={index} className="list-disc pl-6 mb-4">{node.children?.map((li: any, i: number) => <li key={i}>{li.children?.[0]?.children?.[0]?.text || li.children?.[0]?.text}</li>)}</ul>;
          case 'ol': return <ol key={index} className="list-decimal pl-6 mb-4">{node.children?.map((li: any, i: number) => <li key={i}>{li.children?.[0]?.children?.[0]?.text || li.children?.[0]?.text}</li>)}</ol>;
          case 'img':
          case 'image':
            return (
              <Dialog key={index}>
                <DialogTrigger asChild>
                  <div className="relative w-full h-64 md:h-80 my-4 cursor-zoom-in rounded-lg overflow-hidden border bg-muted">
                    <Image 
                        src={node.url} 
                        alt={node.caption || 'Article Image'} 
                        fill 
                        className="object-contain" 
                    />
                  </div>
                </DialogTrigger>
                <DialogContent className="max-w-4xl w-full h-[80vh] p-0 bg-transparent border-none shadow-none">
                   <div className="relative w-full h-full">
                     <Image 
                        src={node.url} 
                        alt={node.caption || 'Zoomed Image'} 
                        fill 
                        className="object-contain" 
                     />
                   </div>
                </DialogContent>
              </Dialog>
            );
          default: return <p key={index} className="text-xs text-muted-foreground">{JSON.stringify(node)}</p>;
        }
      })}
    </>
  );
}
