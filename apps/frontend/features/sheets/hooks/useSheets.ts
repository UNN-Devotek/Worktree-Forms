'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getSheets, createSheet } from '../server/sheet-actions';
import { toast } from 'sonner';

export function useSheets(projectSlug: string) {
  const [sheets, setSheets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // Finding #5 (R8): track in-flight request to abort on slug change.
  const abortRef = useRef<AbortController>(undefined);

  const fetchSheets = useCallback(async () => {
    // Cancel any in-flight request
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    try {
      const data = await getSheets(projectSlug);
      // Only update if this request wasn't aborted
      if (!controller.signal.aborted) {
        setSheets(data);
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        console.error('Failed to fetch sheets:', error);
        toast.error('Failed to load sheets');
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [projectSlug]);

  useEffect(() => {
    fetchSheets();
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [fetchSheets]);

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
