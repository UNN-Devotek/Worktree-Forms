
import React from 'react'
import { render } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Providers } from './providers'

// Mock the providers to avoid complex setup in unit tests
vi.mock('next-auth/react', () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => <div>SessionProvider {children}</div>,
}))
vi.mock('next-themes', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <div>ThemeProvider {children}</div>,
}))
vi.mock('@tanstack/react-query', () => ({
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => <div>QueryClientProvider {children}</div>,
  QueryClient: class {},
}))
vi.mock('sonner', () => ({
  Toaster: () => <div>Toaster</div>,
}))
vi.mock('../features/offline/context/offline-sync-provider', () => ({
  OfflineSyncProvider: ({ children }: { children: React.ReactNode }) => <div>OfflineSyncProvider {children}</div>,
}))

describe('Providers', () => {
  it('renders children wrapped in providers', () => {
    const { getByText } = render(
      <Providers>
        <div>Test Child</div>
      </Providers>
    )

    expect(getByText('Test Child')).toBeDefined()
    expect(getByText(/SessionProvider/)).toBeDefined()
    expect(getByText(/ThemeProvider/)).toBeDefined()
    expect(getByText(/QueryClientProvider/)).toBeDefined()
    expect(getByText(/OfflineSyncProvider/)).toBeDefined()
  })
})
