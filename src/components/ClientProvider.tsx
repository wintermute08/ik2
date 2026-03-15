'use client'

import { Toaster } from "react-hot-toast"
import { useEffect } from 'react'
import { useDrag } from '@use-gesture/react'

export default function ClientProvider({ children }: { children: React.ReactNode }) {
  const bind = useDrag(
    ({ swipe: [swipeX, swipeY] }: { swipe: [number, number] }) => {
      if (swipeY === 1) { // swipe up
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    },
    { filterTaps: true }
  ) as unknown as (target?: any) => void

  useEffect(() => {
    const target = document.body
    bind(target)

    return () => bind()
  }, [bind])

  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#fff',
            color: '#6b7280',
            borderRadius: '9999px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e5e7eb',
            padding: '12px 20px',
          },
          success: {
            style: {
              background: '#f0fdf4',
              color: '#166534',
              border: '1px solid #bbf7d0',
            },
          },
          error: {
            style: {
              background: '#fef2f2',
              color: '#991b1b',
              border: '1px solid #fecaca',
            },
          },
        }}
      />
      {children}
    </>
  )
}
