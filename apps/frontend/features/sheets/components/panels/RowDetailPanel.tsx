'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as Y from 'yjs';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSheet } from '../../providers/SheetProvider';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MessageSquare, Paperclip, History, LayoutGrid, Send, Upload, FileIcon, Clock,
  Type, Hash, Calendar, CheckSquare, User, Link2, Mail, AlignLeft, ToggleLeft,
  Star, Tag, Phone, DollarSign, Percent, List, Gauge,
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useYjsStore } from '../../stores/useYjsStore';
import { toast } from 'sonner';
import { t } from '@/lib/i18n';

// ─── Constants ────────────────────────────────────────────────────────────────

// Finding #7: client-side file upload limits
const MAX_FILE_SIZE_MB = 50;
const MAX_FILE_COUNT = 10;
const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'application/pdf',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain', 'text/csv',
  'application/zip', 'application/x-zip-compressed',
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  text: string;
  senderName: string;
  senderId: string;
  timestamp: number;
}

interface AttachedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string | null;  // null until upload completes
  uploadedBy: string;
  timestamp: number;
}

interface HistoryEntry {
  id: string;
  columnId: string;
  columnLabel: string;
  oldValue: any;
  newValue: any;
  changedBy: string;
  timestamp: number;
}

// ─── Column type → icon mapping ───────────────────────────────────────────────

function ColumnTypeIcon({ type, className }: { type?: string; className?: string }) {
  const cls = className ?? 'h-3.5 w-3.5 shrink-0';
  switch ((type ?? '').toUpperCase()) {
    case 'NUMBER':    return <Hash          className={cls} />;
    case 'DATE':      return <Calendar      className={cls} />;
    case 'CHECKBOX':  return <CheckSquare   className={cls} />;
    case 'CONTACT':
    case 'USER':      return <User          className={cls} />;
    case 'URL':       return <Link2         className={cls} />;
    case 'EMAIL':     return <Mail          className={cls} />;
    case 'LONGTEXT':
    case 'TEXTAREA':  return <AlignLeft     className={cls} />;
    case 'BOOLEAN':
    case 'TOGGLE':    return <ToggleLeft    className={cls} />;
    case 'RATING':    return <Star          className={cls} />;
    case 'STATUS':
    case 'SELECT':    return <Tag           className={cls} />;
    case 'PHONE':     return <Phone         className={cls} />;
    case 'CURRENCY':  return <DollarSign    className={cls} />;
    case 'PERCENT':   return <Percent       className={cls} />;
    case 'DROPDOWN':
    case 'MULTISELECT': return <List        className={cls} />;
    case 'PROGRESS':  return <Gauge         className={cls} />;
    case 'TEXT':
    default:          return <Type          className={cls} />;
  }
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

export function RowDetailPanel() {
  const { data, columns, selectedRowId, isDetailPanelOpen, detailPanelTab, closeDetailPanel, updateCell, user } = useSheet();

  const selectedRow = data.find(r => r.id === selectedRowId);

  // Track active tab for runtime-conditional styling (avoids aria-selected: Tailwind
  // variants which trigger a Turbopack CSS parser bug on button elements)
  const [activeRowTab, setActiveRowTab] = useState('fields');
  // Sync whenever the requested tab or selected row changes
  useEffect(() => { setActiveRowTab(detailPanelTab); }, [detailPanelTab, selectedRowId]);

  // Finding #12 (R3): sanitize rowId for use as a Yjs key component.
  // Yjs keys are arbitrary strings, but we use a convention of `row-{id}-{suffix}`.
  // If rowId ever contains the literal string "-messages" or "-history" as a suffix,
  // it could collide with another row's key. encodeURIComponent makes the id URL-safe
  // and eliminates any embedded hyphens that could cause false suffix matches.
  const safeRowId = selectedRowId ? encodeURIComponent(selectedRowId) : null;

  return (
    <Sheet open={isDetailPanelOpen} onOpenChange={(open) => !open && closeDetailPanel()}>
      <SheetContent className="w-[400px] sm:w-[540px] p-0 flex flex-col h-full overflow-hidden">
        <SheetHeader className="px-6 py-4 border-b shrink-0">
          <SheetTitle className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5 text-primary" />
            <span>{t('row_detail.title', 'Row Detail')}</span>
          </SheetTitle>
          {selectedRow?.id && (
            <p className="text-[11px] text-muted-foreground font-mono mt-0.5 leading-none">
              {selectedRow.id}
            </p>
          )}
        </SheetHeader>

        {/*
          Finding #4 (R2): key is on <Tabs> root, not just TabsContent.
          This remounts the entire tab tree (including Radix's internal state) when the
          selected row changes, resetting both the active tab and all uncontrolled inputs.
        */}
        <Tabs key={selectedRowId ?? 'none'} value={activeRowTab} onValueChange={setActiveRowTab} className="flex-1 flex flex-col min-h-0">
          {/* Centered tab bar */}
          <div className="border-b bg-muted/20 shrink-0 flex justify-center">
            <TabsList className="bg-transparent h-12 gap-6">
              <TabsTrigger value="fields" className={cn("rounded-none h-full px-0 shadow-none", activeRowTab === 'fields' && "bg-transparent border-b-2 border-primary")}>
                <LayoutGrid className="h-4 w-4 mr-2" />
                {t('row_detail.tab.fields', 'Fields')}
              </TabsTrigger>
              <TabsTrigger value="chat" className={cn("rounded-none h-full px-0 shadow-none", activeRowTab === 'chat' && "bg-transparent border-b-2 border-primary")}>
                <MessageSquare className="h-4 w-4 mr-2" />
                {t('row_detail.tab.chat', 'Chat')}
              </TabsTrigger>
              <TabsTrigger value="files" className={cn("rounded-none h-full px-0 shadow-none", activeRowTab === 'files' && "bg-transparent border-b-2 border-primary")}>
                <Paperclip className="h-4 w-4 mr-2" />
                {t('row_detail.tab.files', 'Files')}
              </TabsTrigger>
              <TabsTrigger value="history" className={cn("rounded-none h-full px-0 shadow-none", activeRowTab === 'history' && "bg-transparent border-b-2 border-primary")}>
                <History className="h-4 w-4 mr-2" />
                {t('row_detail.tab.history', 'History')}
              </TabsTrigger>
            </TabsList>
          </div>

          {/*
            Content area: relative container so each TabsContent can use absolute inset-0.
            This sidesteps the Radix flex-1 inheritance issue — each panel always fills
            exactly this container regardless of how many panels Radix keeps in the DOM.
          */}
          <div className="flex-1 min-h-0 relative">

            {/* Fields Tab */}
            <TabsContent value="fields" className="absolute inset-0 m-0 overflow-hidden">
              {/*
                Finding #6 (R3): guard against deleted-row case.
                If the row is deleted while the panel is open, selectedRow becomes undefined.
              */}
              {!selectedRow ? (
                <EmptyState
                  icon={<LayoutGrid className="h-12 w-12 opacity-20" />}
                  text={t('row_detail.fields.row_deleted', 'This row no longer exists.')}
                />
              ) : (
                <ScrollArea className="h-full">
                  <div className="p-6 space-y-5">
                    {columns.map(col => (
                      <div key={col.id} className="space-y-1.5">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                          {col.label}
                        </Label>
                        <div className="flex items-center gap-2">
                          <ColumnTypeIcon type={col.type} className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <Input
                            defaultValue={selectedRow[col.id]}
                            onBlur={(e) => updateCell(selectedRow.id, col.id, e.target.value)}
                            className="text-sm flex-1"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>

            {/* Chat Tab */}
            <TabsContent value="chat" className="absolute inset-0 m-0 flex flex-col overflow-hidden">
              {safeRowId ? (
                <RowChat rowId={safeRowId} user={user} />
              ) : (
                <EmptyState icon={<MessageSquare className="h-12 w-12 opacity-20" />} text={t('row_detail.chat.empty', 'Select a row to view its chat.')} />
              )}
            </TabsContent>

            {/* Files Tab */}
            <TabsContent value="files" className="absolute inset-0 m-0 flex flex-col overflow-hidden">
              {safeRowId ? (
                <RowFiles rowId={safeRowId} user={user} />
              ) : (
                <EmptyState icon={<Paperclip className="h-12 w-12 opacity-20" />} text={t('row_detail.files.empty', 'Select a row to attach files.')} />
              )}
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="absolute inset-0 m-0 overflow-hidden">
              {safeRowId ? (
                <RowHistory rowId={safeRowId} />
              ) : (
                <EmptyState icon={<History className="h-12 w-12 opacity-20" />} text={t('row_detail.history.empty', 'Select a row to view its history.')} />
              )}
            </TabsContent>

          </div>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

// ─── Row Chat ─────────────────────────────────────────────────────────────────

function RowChat({ rowId, user }: { rowId: string; user: { name: string; color: string; id?: string } }) {
  const { doc } = useSheet();
  const { users: awarenessUsers } = useYjsStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentUser = { id: user.id ?? user.name, name: user.name };

  // Finding #6: deduplicate by stable user ID, not display name
  const users = awarenessUsers
    .map((s: any) => s.user)
    .filter(Boolean)
    .filter((u: any, i: number, arr: any[]) => {
      // Prefer deduplication by id if available, fall back to name
      const key = u.id ?? u.name;
      return arr.findIndex(x => (x.id ?? x.name) === key) === i;
    });

  // Sync messages from Yjs — scoped to this row
  useEffect(() => {
    if (!doc) return;
    const arr = doc.getArray(`row-${rowId}-messages`) as Y.Array<ChatMessage>;
    const update = () => setMessages(arr.toArray());
    arr.observe(update);
    update();
    return () => arr.unobserve(update);
  }, [doc, rowId]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputText(val);
    const cursor = e.target.selectionStart || 0;
    const match = val.slice(0, cursor).match(/@(\w*)$/);
    setMentionQuery(match ? match[1] : null);
    if (match) setMentionIndex(0);
  };

  const handleSelectUser = (name: string) => {
    if (mentionQuery === null) return;
    const cursor = inputRef.current?.selectionStart || 0;
    const before = inputText.slice(0, cursor - mentionQuery.length - 1);
    const after = inputText.slice(cursor);
    setInputText(`${before}@${name} ${after}`);
    setMentionQuery(null);
    setTimeout(() => inputRef.current?.focus(), 10);
  };

  // Finding #7 (R3): useCallback deps use primitives, not the currentUser object.
  // currentUser is a new object literal on every render, so depending on it
  // causes handleSend to be recreated every render, defeating useCallback.
  const handleSend = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || !doc) return;
    // Finding #12 (R3): rowId is already sanitized (encodeURIComponent) by the parent.
    const arr = doc.getArray(`row-${rowId}-messages`) as Y.Array<ChatMessage>;
    doc.transact(() => {
      arr.push([{
        id: crypto.randomUUID(),
        text: inputText.trim(),
        senderName: currentUser.name,
        senderId: currentUser.id,
        timestamp: Date.now(),
      }]);
    });
    setInputText('');
    setMentionQuery(null);
  }, [doc, rowId, inputText, currentUser.id, currentUser.name]); // Finding #7: primitives, not object

  const filteredUsers = mentionQuery !== null
    ? users.filter((u: any) => u.name.toLowerCase().includes(mentionQuery.toLowerCase()))
    : [];

  return (
    <div className="flex flex-col h-full">
      {/* Message list — scrollable, fills all space above the input */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4 space-y-3">
          {messages.length === 0 && (
            <p className="text-center text-xs text-muted-foreground mt-8">
              {t('row_detail.chat.no_messages', 'No comments yet. Start the conversation!')}
            </p>
          )}
          {messages.map(msg => {
            const isMe = msg.senderId === currentUser.id;
            return (
              <div key={msg.id} className={cn('flex flex-col', isMe ? 'items-end' : 'items-start')}>
                <div className={cn(
                  'max-w-[85%] rounded-lg px-3 py-2 text-sm',
                  isMe
                    ? 'bg-primary text-primary-foreground rounded-br-none'
                    : 'bg-muted text-foreground rounded-bl-none'
                )}>
                  {!isMe && <span className="text-[10px] font-bold opacity-60 block mb-1">{msg.senderName}</span>}
                  {msg.text}
                </div>
                <span className="text-[10px] text-muted-foreground mt-1">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t relative shrink-0">
        {mentionQuery !== null && filteredUsers.length > 0 && (
          <div className="absolute bottom-full left-0 w-full bg-popover border rounded-lg shadow-lg mb-1 overflow-hidden z-20">
            {filteredUsers.map((u: any) => (
              <div
                key={u.id ?? u.name}
                className="px-3 py-2 hover:bg-muted cursor-pointer flex items-center gap-2 text-sm"
                onMouseDown={(e) => { e.preventDefault(); handleSelectUser(u.name); }}
              >
                <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: u.color || '#888' }} />
                {u.name}
              </div>
            ))}
          </div>
        )}
        <form onSubmit={handleSend} className="flex gap-2">
          <Input
            ref={inputRef}
            value={inputText}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              // Finding #11 (R5): keyboard navigation in mention dropdown
              if (mentionQuery !== null && filteredUsers.length > 0) {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setMentionIndex(i => Math.min(i + 1, filteredUsers.length - 1));
                  return;
                }
                if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setMentionIndex(i => Math.max(i - 1, 0));
                  return;
                }
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSelectUser(filteredUsers[mentionIndex]?.name);
                  return;
                }
                if (e.key === 'Escape') {
                  e.preventDefault();
                  setMentionQuery(null);
                  return;
                }
              }
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
            }}
            placeholder={t('row_detail.chat.placeholder', 'Comment... (@ to mention)')}
            className="flex-1 h-8 text-sm"
          />
          <Button type="submit" size="icon" className="h-8 w-8 shrink-0" disabled={!inputText.trim()} aria-label={t('row_detail.chat.send', 'Send message')}>
            <Send className="h-3.5 w-3.5" />
          </Button>
        </form>
      </div>
    </div>
  );
}

// ─── Row Files ────────────────────────────────────────────────────────────────

function RowFiles({ rowId, user }: { rowId: string; user: { name: string; color: string } }) {
  const { doc } = useSheet();
  const [files, setFiles] = useState<AttachedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!doc) return;
    const arr = doc.getArray(`row-${rowId}-files`) as Y.Array<AttachedFile>;
    const update = () => setFiles(arr.toArray());
    arr.observe(update);
    update();
    return () => arr.unobserve(update);
  }, [doc, rowId]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!doc || !e.target.files) return;
    const selectedFiles = Array.from(e.target.files);
    e.target.value = '';

    // Finding #7: client-side validation before attempting upload
    if (selectedFiles.length > MAX_FILE_COUNT) {
      toast.error(t('row_detail.files.too_many', `Maximum ${MAX_FILE_COUNT} files per upload.`));
      return;
    }

    const oversized = selectedFiles.filter(f => f.size > MAX_FILE_SIZE_MB * 1024 * 1024);
    if (oversized.length > 0) {
      toast.error(
        t('row_detail.files.too_large',
          `${oversized.map(f => f.name).join(', ')} exceed${oversized.length === 1 ? 's' : ''} the ${MAX_FILE_SIZE_MB}MB limit.`)
      );
      return;
    }

    // Finding #8 (R3): block files with empty f.type (e.g. .exe, .sh, .bat).
    // Previously `f.type && !ALLOWED_MIME_TYPES.includes(f.type)` short-circuited
    // on empty string, silently passing any unrecognized file type.
    const invalidType = selectedFiles.filter(f => !f.type || !ALLOWED_MIME_TYPES.includes(f.type));
    if (invalidType.length > 0) {
      toast.error(
        t('row_detail.files.invalid_type',
          `${invalidType.map(f => f.name).join(', ')} — unsupported file type.`)
      );
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      selectedFiles.forEach(f => formData.append('files', f));

      const res = await fetch('/api/files/upload', { method: 'POST', body: formData });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message ?? `Upload failed: ${res.status}`);
      }

      const { urls } = await res.json() as { urls: string[] };

      const arr = doc.getArray(`row-${rowId}-files`) as Y.Array<AttachedFile>;
      const newFiles: AttachedFile[] = selectedFiles.map((f, i) => ({
        id: crypto.randomUUID(),
        name: f.name,
        size: f.size,
        type: f.type,
        url: urls[i] ?? null,
        uploadedBy: user.name,
        timestamp: Date.now(),
      }));
      doc.transact(() => arr.push(newFiles));
      toast.success(t('row_detail.files.upload_success', `${newFiles.length} file(s) attached`));
    } catch (err: any) {
      toast.error(
        t('row_detail.files.upload_error',
          err?.message ?? 'File upload failed — backend not configured')
      );
    } finally {
      setIsUploading(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4 space-y-2">
          {files.length === 0 && (
            <div className="text-center py-8">
              <Paperclip className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="text-xs text-muted-foreground">{t('row_detail.files.empty_list', 'No files attached yet.')}</p>
            </div>
          )}
          {files.map(f => (
            <div key={f.id} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
              <FileIcon className="h-8 w-8 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{f.name}</p>
                <p className="text-xs text-muted-foreground">{formatSize(f.size)} · {f.uploadedBy}</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      <div className="p-3 border-t shrink-0">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileChange}
          aria-label={t('row_detail.files.input_label', 'Attach files to this row')}
        />
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          <Upload className="h-4 w-4" />
          {isUploading
            ? t('row_detail.files.uploading', 'Uploading...')
            : t('row_detail.files.attach', 'Attach Files')}
        </Button>
      </div>
    </div>
  );
}

// ─── Row History ──────────────────────────────────────────────────────────────

function RowHistory({ rowId }: { rowId: string }) {
  const { doc } = useSheet();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    if (!doc) return;
    const arr = doc.getArray(`row-${rowId}-history`) as Y.Array<HistoryEntry>;
    const update = () => setEntries(arr.toArray());
    arr.observe(update);
    update();
    return () => arr.unobserve(update);
  }, [doc, rowId]);

  // Newest first: arr is append-only so index 0 = oldest; .reverse() puts newest at top.
  const sorted = [...entries].reverse();

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="h-full">
        <div className="p-4 space-y-3">
          {sorted.length === 0 && (
            <div className="text-center py-8">
              <Clock className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="text-xs text-muted-foreground">{t('row_detail.history.empty_list', 'No changes recorded yet.')}</p>
              <p className="text-xs text-muted-foreground mt-1">{t('row_detail.history.empty_hint', 'Changes to fields will appear here.')}</p>
            </div>
          )}
          {sorted.map(entry => (
            <div key={entry.id} className="flex gap-3 text-xs pb-3 border-b border-border/50 last:border-0 last:pb-0">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground">
                  <span className="text-muted-foreground">{entry.changedBy}</span>
                  {' '}{t('row_detail.history.changed', 'changed')}{' '}
                  <span className="font-semibold">{entry.columnLabel}</span>
                </p>
                <p className="text-muted-foreground mt-0.5 break-words">
                  {entry.oldValue ? `"${entry.oldValue}" → ` : ''}
                  <span className="text-foreground">"{entry.newValue}"</span>
                </p>
                <p className="text-muted-foreground/60 mt-0.5">
                  {new Date(entry.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

// ─── Shared ───────────────────────────────────────────────────────────────────

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
      <div className="text-center">
        {icon}
        <p className="mt-4">{text}</p>
      </div>
    </div>
  );
}
