import { cn } from '@/lib/utils'
import { describe, it, expect } from 'vitest'

describe('alias check', () => {
  it('imports cn', () => {
    expect(typeof cn).toBe('function')
  })
})
