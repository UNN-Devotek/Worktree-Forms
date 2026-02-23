'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSheet } from '../../providers/SheetProvider';
import { Plus } from 'lucide-react';
import { t } from '@/lib/i18n';

export function ColumnManagerDialog() {
  const { addColumn } = useSheet();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('TEXT');

  const handleAdd = () => {
    if (!name.trim()) return;
    
    // Finding #4 (R8): use crypto.randomUUID to prevent collisions.
    // Two columns named "Due Date" no longer overwrite each other.
    addColumn({
      id: `col_${crypto.randomUUID().slice(0, 8)}`,
      label: name.trim(),
      type: type,
      width: 150,
    });
    
    setName('');
    setType('TEXT');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1">
          <Plus className="h-4 w-4" />
          <span>{t('column.add', 'Add Column')}</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('column.dialog_title', 'Add New Column')}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">{t('column.name_label', 'Column Name')}</Label>
            <Input 
              id="name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder={t('column.name_placeholder', 'e.g. Estimated Cost')}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="type">{t('column.type_label', 'Column Type')}</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TEXT">{t('column.type_text', 'Text')}</SelectItem>
                <SelectItem value="NUMBER">{t('column.type_number', 'Number')}</SelectItem>
                <SelectItem value="STATUS">{t('column.type_status', 'Status (Badge)')}</SelectItem>
                <SelectItem value="CONTACT">{t('column.type_contact', 'Contact (User)')}</SelectItem>
                <SelectItem value="DATE">{t('column.type_date', 'Date Picker')}</SelectItem>
                <SelectItem value="CHECKBOX">{t('column.type_checkbox', 'Checkbox')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>{t('common.cancel', 'Cancel')}</Button>
          <Button onClick={handleAdd}>{t('column.add', 'Add Column')}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
