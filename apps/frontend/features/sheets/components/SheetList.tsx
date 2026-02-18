'use client';

import React from 'react';
import { useSheets } from '../hooks/useSheets';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Plus, Table as TableIcon, MoreHorizontal, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { t } from '@/lib/i18n';

interface SheetListProps {
  projectSlug: string;
}

export function SheetList({ projectSlug }: SheetListProps) {
  const { sheets, isLoading, createNewSheet } = useSheets(projectSlug);

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

  // Finding #11 (R4): placeholder handler for delete — shows coming soon toast
  const handleDelete = (_sheetId: string, title: string) => {
    toast.info(
      t('sheets.delete_coming_soon',
        `Deleting "${title}" is not yet implemented. This feature is coming soon.`)
    );
  };

  return (
    <div className="space-y-4 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t('sheets.title', 'Project Spreadsheets')}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t('sheets.subtitle', 'Manage your project data, schedules, and trackers.')}
          </p>
        </div>
        <Button onClick={() => createNewSheet()} className="gap-2">
          <Plus className="h-4 w-4" />
          <span>{t('sheets.new_sheet', 'New Sheet')}</span>
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
                    <p>{t('sheets.empty', 'No sheets found. Create your first one to get started.')}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              sheets.map((sheet) => (
                <TableRow key={sheet.id} className="group cursor-pointer">
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
                    <span className="text-xs text-muted-foreground">
                      {t('sheets.system_admin', 'System Admin')}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {format(new Date(sheet.createdAt), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {format(new Date(sheet.updatedAt), 'MMM d, yyyy HH:mm')}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/project/${projectSlug}/sheets/${sheet.id}`}>
                            {t('sheets.action_open', 'Open Sheet')}
                          </Link>
                        </DropdownMenuItem>
                        {/* Finding #11 (R4): wired up delete with placeholder handler */}
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDelete(sheet.id, sheet.title)}
                        >
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
    </div>
  );
}
