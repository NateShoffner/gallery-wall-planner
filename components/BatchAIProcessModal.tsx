'use client'

import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark, faSpinner, faMicrochip } from '@fortawesome/free-solid-svg-icons'
import { useStore } from '@/store/useStore'
import toast from 'react-hot-toast'

interface BatchAIProcessModalProps {
  isOpen: boolean
  onClose: () => void
}

export function BatchAIProcessModal({ isOpen, onClose }: BatchAIProcessModalProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [processedCount, setProcessedCount] = useState(0)
  const getUnprocessedPieceCount = useStore((s) => s.getUnprocessedPieceCount)
  const pieces = useStore((s) => s.pieces)
  const reprocessPieceWithAI = useStore((s) => s.reprocessPieceWithAI)
  const openaiApiKey = useStore((s) => s.openaiApiKey)

  const unprocessedCount = getUnprocessedPieceCount()

  useEffect(() => {
    if (isOpen) {
      setProcessedCount(0)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleBatchProcess = async () => {
    if (!openaiApiKey) {
      toast.error('Please set your OpenAI API key first')
      return
    }

    if (unprocessedCount === 0) {
      toast.error('No unprocessed images to process')
      return
    }

    setIsProcessing(true)
    setProcessedCount(0)

    const unprocessedPieces = pieces.filter((p) => p.imageId && !p.aiProcessingData)

    for (const piece of unprocessedPieces) {
      try {
        await reprocessPieceWithAI(piece.id)
        setProcessedCount((prev) => prev + 1)
      } catch (error) {
        console.error(`Failed to process piece ${piece.id}:`, error)
        // Continue with next piece
      }
    }

    setIsProcessing(false)
    if (processedCount === unprocessedCount) {
      toast.success('All images processed successfully!')
      setTimeout(onClose, 1500)
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
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faMicrochip} style={{ color: 'var(--accent-blue)' }} />
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              Batch AI Processing
            </h2>
          </div>
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
          {isProcessing ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3">
                <FontAwesomeIcon icon={faSpinner} className="animate-spin" style={{ color: 'var(--accent-blue)' }} />
                <span style={{ color: 'var(--text-secondary)' }}>Processing images...</span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    Progress
                  </span>
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                    {processedCount} / {unprocessedCount}
                  </span>
                </div>

                <div
                  className="w-full h-2 rounded overflow-hidden"
                  style={{ background: 'var(--bg-input)' }}
                >
                  <div
                    className="h-full transition-all"
                    style={{
                      background: 'var(--accent-blue)',
                      width: `${(processedCount / unprocessedCount) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
                This may take a few moments depending on the number of images.
              </p>
            </div>
          ) : (
            <>
              <p style={{ color: 'var(--text-secondary)' }}>
                Process {unprocessedCount} image{unprocessedCount !== 1 ? 's' : ''} with AI to remove backgrounds automatically.
              </p>

              <div
                className="p-3 rounded"
                style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)' }}
              >
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  ⚠️ <strong>Note:</strong> Each image will use your OpenAI API credits. Estimated cost depends on your plan.
                </p>
              </div>

              {unprocessedCount === 0 && (
                <div
                  className="p-3 rounded"
                  style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)' }}
                >
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    ✓ All images have been processed!
                  </p>
                </div>
              )}
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
            {isProcessing ? 'Processing...' : 'Close'}
          </button>
          {!isProcessing && unprocessedCount > 0 && (
            <button
              onClick={handleBatchProcess}
              disabled={!openaiApiKey}
              className="px-4 py-2 rounded text-sm font-medium transition-colors disabled:opacity-50"
              style={{
                background: 'var(--accent-blue)',
                color: 'white',
              }}
              onMouseEnter={(e) => !openaiApiKey || (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={(e) => !openaiApiKey || (e.currentTarget.style.opacity = '1')}
            >
              Process All
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
