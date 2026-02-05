'use client';

import { useState, useEffect } from 'react';
import { getSheets, createSheet } from '../server/sheet-actions';
import { toast } from 'sonner';

export function useSheets(projectSlug: string) {
  const [sheets, setSheets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSheets = async () => {
    setIsLoading(true);
    try {
      const data = await getSheets(projectSlug);
      setSheets(data);
    } catch (error) {
      console.error('Failed to fetch sheets:', error);
      toast.error('Failed to load sheets');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSheets();
  }, [projectSlug]);

  const createNewSheet = async (title?: string) => {
    try {
      // We need project ID from slug or have the action handle it.
      // The current action handles it.
      const sheet = await createSheet(projectSlug, title);
      if (sheet) {
        toast.success('Sheet created');
        fetchSheets();
        return sheet;
      }
    } catch (error) {
      toast.error('Failed to create sheet');
    }
  };

  return {
    sheets,
    isLoading,
    fetchSheets,
    createNewSheet
  };
}
