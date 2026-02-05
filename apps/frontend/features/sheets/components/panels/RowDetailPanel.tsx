'use client';

import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSheet } from '../../providers/SheetProvider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Paperclip, History, LayoutGrid } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export function RowDetailPanel() {
  const { data, columns, selectedRowId, isDetailPanelOpen, closeDetailPanel, updateCell } = useSheet();

  const selectedRow = data.find(r => r.id === selectedRowId);

  return (
    <Sheet open={isDetailPanelOpen} onOpenChange={(open) => !open && closeDetailPanel()}>
      <SheetContent className="w-[400px] sm:w-[540px] p-0 flex flex-col">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5 text-primary" />
            <span>Row Detail</span>
            <span className="text-muted-foreground font-mono text-xs ml-2">
              {selectedRow?.id}
            </span>
          </SheetTitle>
        </SheetHeader>

        <Tabs defaultValue="fields" className="flex-1 flex flex-col">
          <div className="px-6 border-b bg-muted/20">
            <TabsList className="bg-transparent h-12 gap-4">
              <TabsTrigger 
                value="fields" 
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-0"
              >
                <LayoutGrid className="h-4 w-4 mr-2" />
                Fields
              </TabsTrigger>
              <TabsTrigger 
                value="chat" 
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-0"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Chat
              </TabsTrigger>
              <TabsTrigger 
                value="files" 
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-0"
              >
                <Paperclip className="h-4 w-4 mr-2" />
                Files
              </TabsTrigger>
              <TabsTrigger 
                value="history" 
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-0"
              >
                <History className="h-4 w-4 mr-2" />
                History
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1">
            <TabsContent value="fields" className="p-6 m-0 space-y-6">
              {columns.map(col => (
                <div key={col.id} className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {col.header}
                  </Label>
                  <Input 
                    defaultValue={selectedRow?.[col.id]} 
                    onBlur={(e) => updateCell(selectedRow.id, col.id, e.target.value)}
                    className="text-sm"
                  />
                </div>
              ))}
            </TabsContent>

            <TabsContent value="chat" className="p-6 m-0 h-full flex items-center justify-center text-muted-foreground text-sm">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No comments yet for this task.</p>
              </div>
            </TabsContent>

            <TabsContent value="files" className="p-6 m-0 h-full flex items-center justify-center text-muted-foreground text-sm">
              <div className="text-center">
                <Paperclip className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>Drag and drop files here to attach them to this row.</p>
              </div>
            </TabsContent>

            <TabsContent value="history" className="p-6 m-0 h-full flex items-center justify-center text-muted-foreground text-sm">
              <div className="text-center">
                <History className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>Audit trail will be available in Phase 3.</p>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
