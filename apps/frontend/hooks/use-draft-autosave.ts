'use client'

import { useCallback, useEffect } from 'react'

const DRAFT_KEY_PREFIX = 'form_draft_'

export function useDraftAutosave(formId: number, enabled: boolean = false) {
  const draftKey = `${DRAFT_KEY_PREFIX}${formId}`

  const saveDraft = useCallback((data: any) => {
    if (!enabled) return

    try {
      localStorage.setItem(draftKey, JSON.stringify({
        data,
        savedAt: new Date().toISOString()
      }))
    } catch (err) {
      console.error('Failed to save draft:', err)
    }
  }, [draftKey, enabled])

  const loadDraft = useCallback(() => {
    if (!enabled) return null

    try {
      const draft = localStorage.getItem(draftKey)
      if (draft) {
        const parsed = JSON.parse(draft)
        return parsed.data
      }
    } catch (err) {
      console.error('Failed to load draft:', err)
    }
    return null
  }, [draftKey, enabled])

  const clearDraft = useCallback(() => {
    if (!enabled) return

    try {
      localStorage.removeItem(draftKey)
    } catch (err) {
      console.error('Failed to clear draft:', err)
    }
  }, [draftKey, enabled])

  const getDraftAge = useCallback(() => {
    if (!enabled) return null

    try {
      const draft = localStorage.getItem(draftKey)
      if (draft) {
        const parsed = JSON.parse(draft)
        const savedAt = new Date(parsed.savedAt)
        const now = new Date()
        return now.getTime() - savedAt.getTime()
      }
    } catch (err) {
      console.error('Failed to get draft age:', err)
    }
    return null
  }, [draftKey, enabled])

  // Auto-clear old drafts (7 days)
  useEffect(() => {
    if (!enabled) return

    const age = getDraftAge()
    if (age && age > 7 * 24 * 60 * 60 * 1000) {
      clearDraft()
    }
  }, [enabled, getDraftAge, clearDraft])

  return {
    saveDraft,
    loadDraft,
    clearDraft,
    getDraftAge
  }
}
