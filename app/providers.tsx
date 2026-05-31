'use client'

import { useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import { useStore } from '@/store/useStore'

export function Providers({ children }: { children: React.ReactNode }) {
  const theme = useStore((s) => s.theme)
  const initImages = useStore((s) => s.initImages)

  useEffect(() => {
    void initImages()
  }, [initImages])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return (
    <>
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-normal)',
            borderRadius: '6px',
            padding: '12px 16px',
            fontSize: '14px',
          },
          success: {
            style: {
              background: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              border: '1px solid var(--accent-blue)',
            },
          },
          error: {
            style: {
              background: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              border: '1px solid var(--accent-orange)',
            },
            iconTheme: {
              primary: 'var(--accent-orange)',
              secondary: 'var(--bg-elevated)',
            },
          },
        }}
      />
      {children}
    </>
  )
}
