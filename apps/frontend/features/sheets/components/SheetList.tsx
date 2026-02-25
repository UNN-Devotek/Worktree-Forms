'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSheets } from '../hooks/useSheets';
import { renameSheet, transferSheetOwnership, getProjectMembers, deleteSheet } from '../server/sheet-actions';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, Table as TableIcon, MoreHorizontal, ExternalLink, Pencil, UserRoundCog, ArrowUpRight, Trash2, Check, Users, UserCheck } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { t } from '@/lib/i18n';

interface SheetListProps {
  projectSlug: string;
}

interface Member {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

export function SheetList({ projectSlug }: SheetListProps) {
  const router = useRouter();
  const { sheets, isLoading, fetchSheets, createNewSheet } = useSheets(projectSlug);
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    getProjectMembers(projectSlug).then(setMembers);
  }, [projectSlug]);

  // ---- create table modal ---------------------------------------------------
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createVisibility, setCreateVisibility] = useState<'all' | 'selected'>('all');
  const [createSelectedIds, setCreateSelectedIds] = useState<string[]>([]);
  const [createLoading, setCreateLoading] = useState(false);

  const openCreate = () => {
    setCreateName('');
    setCreateVisibility('all');
    setCreateSelectedIds([]);
    setCreateOpen(true);
  };

  const toggleMemberForCreate = (id: string) => {
    setCreateSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleCreate = async () => {
    setCreateLoading(true);
    try {
      const visibilityConfig = createVisibility === 'selected'
        ? { type: 'selected' as const, memberIds: createSelectedIds }
        : { type: 'all' as const };
      await createNewSheet(createName.trim() || undefined, visibilityConfig);
      setCreateOpen(false);
    } finally {
      setCreateLoading(false);
    }
  };

  // ---- rename ---------------------------------------------------------------
  const [renameSheet_, setRenameSheet] = useState<{ id: string; title: string } | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [renameLoading, setRenameLoading] = useState(false);

  const openRename = (sheet: { id: string; title: string }) => {
    setRenameSheet(sheet);
    setRenameValue(sheet.title);
  };

  const handleRename = async () => {
    if (!renameSheet_ || !renameValue.trim()) return;
    setRenameLoading(true);
    try {
      const ok = await renameSheet(renameSheet_.id, renameValue.trim());
      if (ok) {
        toast.success('Table renamed');
        fetchSheets();
        setRenameSheet(null);
      } else {
        toast.error('Failed to rename table');
      }
    } catch {
      toast.error('Failed to rename table');
    } finally {
      setRenameLoading(false);
    }
  };

  // ---- transfer ownership ---------------------------------------------------
  const [transferSheet_, setTransferSheet] = useState<{ id: string; title: string; ownerId: string | null } | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [transferLoading, setTransferLoading] = useState(false);

  const openTransfer = (sheet: { id: string; title: string; ownerId?: string | null }) => {
    setTransferSheet({ id: sheet.id, title: sheet.title, ownerId: sheet.ownerId ?? null });
    setSelectedMemberId(sheet.ownerId ?? null);
  };

  const handleTransfer = async () => {
    if (!transferSheet_ || !selectedMemberId) return;
    setTransferLoading(true);
    try {
      const ok = await transferSheetOwnership(transferSheet_.id, selectedMemberId);
      if (ok) {
        toast.success('Ownership transferred');
        fetchSheets();
        setTransferSheet(null);
      } else {
        toast.error('Failed to transfer ownership');
      }
    } catch {
      toast.error('Failed to transfer ownership');
    } finally {
      setTransferLoading(false);
    }
  };

  // ---- delete ---------------------------------------------------------------
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const ok = await deleteSheet(deleteTarget.id);
      if (ok) {
        toast.success(`"${deleteTarget.title}" deleted`);
        fetchSheets();
        setDeleteTarget(null);
      } else {
        toast.error('Failed to delete table');
      }
    } catch {
      toast.error('Failed to delete table');
    } finally {
      setDeleteLoading(false);
    }
  };

  // ---- loading skeleton -----------------------------------------------------
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="h-9 w-32 bg-muted animate-pulse rounded" />
        </div>
        <div className="border rounded-md h-64 bg-muted/10 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold tracking-tight">Project Tables</h2>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          <span>{t('sheets.new_table', 'New Table')}</span>
        </Button>
      </div>

      <div className="border rounded-md bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]"></TableHead>
              <TableHead>{t('sheets.col_name', 'Name')}</TableHead>
              <TableHead>{t('sheets.col_owner', 'Owner')}</TableHead>
              <TableHead>{t('sheets.col_created', 'Created')}</TableHead>
              <TableHead>{t('sheets.col_modified', 'Last Modified')}</TableHead>
              <TableHead className="text-right">{t('sheets.col_actions', 'Actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sheets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <TableIcon className="h-8 w-8 opacity-20" />
                    <p>{t('sheets.empty', 'No tables found. Create your first one to get started.')}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              sheets.map((sheet: any) => (
                <TableRow
                  key={sheet.id}
                  className="group cursor-pointer"
                  onClick={() => router.push(`/project/${projectSlug}/sheets/${sheet.id}`)}
                >
                  <TableCell>
                    <TableIcon className="h-4 w-4 text-primary/60" />
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link
                      href={`/project/${projectSlug}/sheets/${sheet.id}`}
                      className="hover:underline flex items-center gap-2"
                    >
                      {sheet.title}
                      <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </TableCell>
                  <TableCell>
                    {sheet.owner ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={sheet.owner.image ?? undefined} />
                          <AvatarFallback className="text-xs">
                            {(sheet.owner.name ?? sheet.owner.email).slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground">
                          {sheet.owner.name ?? sheet.owner.email}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {format(new Date(sheet.createdAt), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {format(new Date(sheet.updatedAt), 'MMM d, yyyy HH:mm')}
                  </TableCell>
                  <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/project/${projectSlug}/sheets/${sheet.id}`} className="flex items-center">
                            <ArrowUpRight className="h-4 w-4 mr-2" />
                            {t('sheets.action_open', 'Open Table')}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openRename(sheet)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openTransfer(sheet)}>
                          <UserRoundCog className="h-4 w-4 mr-2" />
                          Transfer Ownership
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => setDeleteTarget({ id: sheet.id, title: sheet.title })}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {t('sheets.action_delete', 'Delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create table dialog */}
      <Dialog open={createOpen} onOpenChange={open => { if (!open) setCreateOpen(false); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Table</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Table name</label>
              <Input
                value={createName}
                onChange={e => setCreateName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }}
                placeholder="Untitled Table"
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Share with</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCreateVisibility('all')}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors',
                    createVisibility === 'all'
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'hover:bg-muted border-input'
                  )}
                >
                  <Users className="h-4 w-4" />
                  All project members
                </button>
                <button
                  type="button"
                  onClick={() => setCreateVisibility('selected')}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors',
                    createVisibility === 'selected'
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'hover:bg-muted border-input'
                  )}
                >
                  <UserCheck className="h-4 w-4" />
                  Selected members
                </button>
              </div>
            </div>

            {createVisibility === 'selected' && (
              <div className="space-y-1 max-h-48 overflow-y-auto rounded-md border p-1">
                {members.length === 0 && (
                  <p className="text-sm text-muted-foreground py-2 text-center">No members found.</p>
                )}
                {members.map(member => (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => toggleMemberForCreate(member.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 rounded-md text-left text-sm transition-colors',
                      createSelectedIds.includes(member.id)
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-muted'
                    )}
                  >
                    <Avatar className="h-7 w-7 shrink-0">
                      <AvatarImage src={member.image ?? undefined} />
                      <AvatarFallback className="text-xs">
                        {(member.name ?? member.email).slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{member.name ?? member.email}</p>
                      {member.name && (
                        <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                      )}
                    </div>
                    {createSelectedIds.includes(member.id) && (
                      <Check className="h-4 w-4 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button
              onClick={handleCreate}
              disabled={createLoading || (createVisibility === 'selected' && createSelectedIds.length === 0)}
            >
              {createLoading ? 'Creating…' : 'Create Table'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename dialog */}
      <Dialog open={!!renameSheet_} onOpenChange={open => { if (!open) setRenameSheet(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Rename Table</DialogTitle>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={e => setRenameValue(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleRename(); }}
            placeholder="Table name"
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameSheet(null)}>Cancel</Button>
            <Button onClick={handleRename} disabled={!renameValue.trim() || renameLoading}>
              {renameLoading ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transfer ownership dialog */}
      <Dialog open={!!transferSheet_} onOpenChange={open => { if (!open) setTransferSheet(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Transfer Ownership</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Select a project member to become the owner of{' '}
            <span className="font-medium text-foreground">{transferSheet_?.title}</span>.
          </p>
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {members.length === 0 && (
              <p className="text-sm text-muted-foreground py-2 text-center">No members found.</p>
            )}
            {members.map(member => (
              <button
                key={member.id}
                type="button"
                onClick={() => setSelectedMemberId(member.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-md text-left text-sm transition-colors',
                  selectedMemberId === member.id
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-muted'
                )}
              >
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarImage src={member.image ?? undefined} />
                  <AvatarFallback className="text-xs">
                    {(member.name ?? member.email).slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{member.name ?? member.email}</p>
                  {member.name && (
                    <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                  )}
                </div>
                {selectedMemberId === member.id && (
                  <Check className="h-4 w-4 shrink-0" />
                )}
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransferSheet(null)}>Cancel</Button>
            <Button
              onClick={handleTransfer}
              disabled={!selectedMemberId || selectedMemberId === transferSheet_?.ownerId || transferLoading}
            >
              {transferLoading ? 'Transferring…' : 'Transfer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Table</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <span className="font-medium text-foreground">"{deleteTarget?.title}"</span>?
              This action cannot be undone and all data will be permanently lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteLoading ? 'Deleting…' : 'Delete Table'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
