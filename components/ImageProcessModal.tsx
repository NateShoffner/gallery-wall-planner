'use client'

import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark, faSpinner } from '@fortawesome/free-solid-svg-icons'
import { useStore } from '@/store/useStore'
import toast from 'react-hot-toast'

interface ImageProcessModalProps {
  isOpen: boolean
  onClose: () => void
  pieceId: string | null
}

export function ImageProcessModal({ isOpen, onClose, pieceId }: ImageProcessModalProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const reprocessPieceWithAI = useStore((s) => s.reprocessPieceWithAI)
  const openaiApiKey = useStore((s) => s.openaiApiKey)

  if (!isOpen || !pieceId) return null

  const handleProcess = async () => {
    if (!openaiApiKey) {
      toast.error('Please set your OpenAI API key first')
      return
    }

    setIsProcessing(true)
    try {
      await reprocessPieceWithAI(pieceId)
      onClose()
    } catch (error) {
      console.error('Processing error:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
      style={{ background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-lg shadow-2xl"
        style={{
          background: 'var(--bg-panel)',
          border: '1px solid var(--border-normal)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Process Image with AI
          </h2>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="w-8 h-8 flex items-center justify-center rounded transition-colors disabled:opacity-50"
            style={{
              color: 'var(--text-muted)',
              background: 'transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-hover)'
              e.currentTarget.style.color = 'var(--text-primary)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'var(--text-muted)'
            }}
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          <p style={{ color: 'var(--text-secondary)' }}>
            This will use OpenAI's vision model to remove the background from your image, making it perfect for gallery wall
            display.
          </p>

          <div
            className="p-3 rounded"
            style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)' }}
          >
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              ⚠️ <strong>Note:</strong> This will use your OpenAI API credits. Make sure you have a valid API key set up.
            </p>
          </div>

          {isProcessing ? (
            <div className="flex items-center justify-center py-8 gap-3">
              <FontAwesomeIcon icon={faSpinner} className="animate-spin" style={{ color: 'var(--accent-blue)' }} />
              <span style={{ color: 'var(--text-secondary)' }}>Processing image...</span>
            </div>
          ) : (
            <>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Processing will:
              </p>
              <ul className="text-sm space-y-1 ml-4" style={{ color: 'var(--text-secondary)' }}>
                <li>✓ Remove background</li>
                <li>✓ Create transparent layer</li>
                <li>✓ Replace piece image</li>
              </ul>
            </>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4 flex justify-end gap-2"
          style={{
            borderTop: '1px solid var(--border-subtle)',
            background: 'var(--bg-elevated)',
          }}
        >
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 rounded text-sm font-medium transition-colors disabled:opacity-50"
            style={{
              background: 'var(--bg-elevated)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleProcess}
            disabled={isProcessing || !openaiApiKey}
            className="px-4 py-2 rounded text-sm font-medium transition-colors disabled:opacity-50"
            style={{
              background: 'var(--accent-blue)',
              color: 'white',
            }}
            onMouseEnter={(e) => !isProcessing && (e.currentTarget.style.opacity = '0.9')}
            onMouseLeave={(e) => !isProcessing && (e.currentTarget.style.opacity = '1')}
          >
            {isProcessing ? 'Processing...' : 'Process Image'}
          </button>
        </div>
      </div>
    </div>
  )
}
