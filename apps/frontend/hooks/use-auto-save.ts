import { useEffect, useRef } from 'react';
import { FormSchema } from '@/types/group-forms';

interface UseAutoSaveOptions {
  formId?: number;
  formSchema: FormSchema | null;
  isDirty: boolean;
  debounceMs?: number;
  onSave?: (schema: FormSchema) => Promise<void>;
}

/**
 * Auto-save hook for form builder.
 * Saves to localStorage as backup and optionally calls API.
 * 
 * @param formId - Form ID for storage key
 * @param formSchema - Current form schema
 * @param isDirty - Whether form has unsaved changes
 * @param debounceMs - Debounce delay in milliseconds (default: 3000)
 * @param onSave - Optional callback for API save
 */
export function useAutoSave({
  formId,
  formSchema,
  isDirty,
  debounceMs = 3000,
  onSave,
}: UseAutoSaveOptions) {
  const saveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const lastSavedRef = useRef<string | null>(null);

  useEffect(() => {
    // Clear any pending save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Don't save if not dirty or no schema
    if (!isDirty || !formSchema) {
      return;
    }

    // Debounce the save
    saveTimeoutRef.current = setTimeout(async () => {
      const schemaString = JSON.stringify(formSchema);
      
      // Skip if schema hasn't changed (prevents redundant saves)
      if (schemaString === lastSavedRef.current) {
        return;
      }

      try {
        // Save to localStorage as backup
        if (formId) {
          const storageKey = `form-draft-${formId}`;
          localStorage.setItem(storageKey, schemaString);
          localStorage.setItem(`${storageKey}-timestamp`, new Date().toISOString());
          console.log(`[AutoSave] Saved to localStorage: ${storageKey}`);
        }

        // Call optional API save callback
        if (onSave) {
          await onSave(formSchema);
          console.log('[AutoSave] API save complete');
        }

        lastSavedRef.current = schemaString;
      } catch (error) {
        console.error('[AutoSave] Failed to save:', error);
      }
    }, debounceMs);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [formSchema, isDirty, formId, debounceMs, onSave]);

  /**
   * Load draft from localStorage
   */
  const loadDraft = (): FormSchema | null => {
    if (!formId) return null;

    try {
      const storageKey = `form-draft-${formId}`;
      const draft = localStorage.getItem(storageKey);
      const timestamp = localStorage.getItem(`${storageKey}-timestamp`);

      if (draft && timestamp) {
        const savedAt = new Date(timestamp);
        const hoursSince = (Date.now() - savedAt.getTime()) / (1000 * 60 * 60);

        // Only load drafts less than 24 hours old
        if (hoursSince < 24) {
          console.log(`[AutoSave] Loaded draft from ${timestamp}`);
          return JSON.parse(draft);
        } else {
          // Clean up old draft
          localStorage.removeItem(storageKey);
          localStorage.removeItem(`${storageKey}-timestamp`);
        }
      }
    } catch (error) {
      console.error('[AutoSave] Failed to load draft:', error);
    }

    return null;
  };

  /**
   * Clear draft from localStorage
   */
  const clearDraft = () => {
    if (!formId) return;

    const storageKey = `form-draft-${formId}`;
    localStorage.removeItem(storageKey);
    localStorage.removeItem(`${storageKey}-timestamp`);
    console.log('[AutoSave] Draft cleared');
  };

  return {
    loadDraft,
    clearDraft,
  };
}
