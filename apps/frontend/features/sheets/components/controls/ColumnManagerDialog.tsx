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

export function ColumnManagerDialog() {
  const { addColumn } = useSheet();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('TEXT');

  const handleAdd = () => {
    if (!name) return;
    
    addColumn({
      id: name.toLowerCase().replace(/\s+/g, '_'),
      header: name,
      type: type,
      size: 150,
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
          <span>Add Column</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Column</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Column Name</Label>
            <Input 
              id="name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="e.g. Estimated Cost"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="type">Column Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TEXT">Text</SelectItem>
                <SelectItem value="NUMBER">Number</SelectItem>
                <SelectItem value="STATUS">Status (Badge)</SelectItem>
                <SelectItem value="CONTACT">Contact (User)</SelectItem>
                <SelectItem value="DATE">Date Picker</SelectItem>
                <SelectItem value="CHECKBOX">Checkbox</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleAdd}>Add Column</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
