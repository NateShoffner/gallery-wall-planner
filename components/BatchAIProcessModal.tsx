'use client'

import { useState, useEffect, useCallback } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSpinner, faCheck, faXmark } from '@fortawesome/free-solid-svg-icons'
import { useStore } from '@/store/useStore'
import { compressImageForAI, transformImage } from '@/lib/imageTransform'
import { processImageWithAI } from '@/lib/aiImageProcessor'

interface BatchAIProcessModalProps {
  pieceIds: string[]
  onComplete: () => void
  onCancel: () => void
}

interface ProcessResult {
  pieceId: string
  status: 'pending' | 'processing' | 'success' | 'failed'
  error?: string
}

export function BatchAIProcessModal({ 
  pieceIds, 
  onComplete, 
  onCancel 
}: BatchAIProcessModalProps) {
  const pieces = useStore(s => s.pieces)
  const setPieceImage = useStore(s => s.setPieceImage)
  const reprocessPieceWithAI = useStore(s => s.reprocessPieceWithAI)
  
  // Store the initial pieceIds to process - don't let them change during processing
  const [initialPieceIds] = useState(pieceIds)
  const [hasStarted, setHasStarted] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [results, setResults] = useState<ProcessResult[]>(
    initialPieceIds.map(id => ({ pieceId: id, status: 'pending' }))
  )
  
  const processPiece = useCallback(async (pieceId: string) => {
    setResults(prev => prev.map(r => 
      r.pieceId === pieceId ? { ...r, status: 'processing' } : r
    ))
    
    try {
      // Get API key from store
      const apiKey = useStore.getState().openaiApiKey
      
      // Load image for this piece
      const file = await reprocessPieceWithAI(pieceId)
      
      // Compress and call AI API with user's API key
      const compressed = await compressImageForAI(file)
      const aiResult = await processImageWithAI(compressed, 1024, apiKey)
      
      // Check confidence
      if (aiResult.confidence < 0.3) {
        setResults(prev => prev.map(r => 
          r.pieceId === pieceId 
            ? { ...r, status: 'failed', error: 'Low confidence' } 
            : r
        ))
        setCurrentIndex(prev => prev + 1)
        return
      }
      
      // Transform image
      const transformed = await transformImage(file, aiResult.rotation, aiResult.bounds)
      
      // Save with AI data
      await setPieceImage(pieceId, transformed, {
        rotation: aiResult.rotation,
        bounds: aiResult.bounds,
        confidence: aiResult.confidence,
        processedAt: Date.now(),
      })
      
      setResults(prev => prev.map(r => 
        r.pieceId === pieceId ? { ...r, status: 'success' } : r
      ))
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setResults(prev => prev.map(r => 
        r.pieceId === pieceId 
          ? { ...r, status: 'failed', error: errorMessage } 
          : r
      ))
    } finally {
      setCurrentIndex(prev => prev + 1)
    }
  }, [reprocessPieceWithAI, setPieceImage])
  
  // Process pieces sequentially (only after user confirms)
  useEffect(() => {
    if (!hasStarted) return
    if (currentIndex >= initialPieceIds.length) {
      // All done
      return
    }
    
    void processPiece(initialPieceIds[currentIndex])
  }, [currentIndex, hasStarted, initialPieceIds, processPiece])
  
  const successCount = results.filter(r => r.status === 'success').length
  const failedCount = results.filter(r => r.status === 'failed').length
  const processingCount = results.filter(r => r.status === 'processing').length
  const completedCount = successCount + failedCount
  const isComplete = hasStarted && currentIndex >= initialPieceIds.length
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.75)' }}
    >
      <div 
        className="relative max-w-lg w-full rounded-lg"
        style={{ 
          background: 'var(--bg-elevated)', 
          border: '1px solid var(--border-normal)',
        }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--border-normal)' }}>
          <h2 className="text-lg font-semibold">Batch AI Processing</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {hasStarted ? `Processing ${initialPieceIds.length} piece${initialPieceIds.length !== 1 ? 's' : ''}` : `Process ${initialPieceIds.length} piece${initialPieceIds.length !== 1 ? 's' : ''} with AI?`}
          </p>
        </div>
        
        {/* Privacy Notice - only show before starting */}
        {!hasStarted && (
          <div 
            className="mx-6 mt-4 px-4 py-3 rounded text-xs"
            style={{ 
              background: 'rgba(59, 130, 246, 0.1)', 
              border: '1px solid rgba(59, 130, 246, 0.3)',
              color: 'var(--text-secondary)'
            }}
          >
            <strong style={{ color: 'var(--text-primary)' }}>Privacy Notice:</strong> Your images will be sent to OpenAI&apos;s servers for analysis. Images are compressed to ~1024px before transmission. OpenAI may retain data according to their{' '}
            <a 
              href="https://openai.com/policies/privacy-policy" 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline"
              style={{ color: 'var(--accent-blue)' }}
            >
              privacy policy
            </a>.
          </div>
        )}
        
        {/* Content */}
        <div className="px-6 pb-6 pt-4">
          {!hasStarted ? (
            // Before starting: show piece list
            <>
              <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
                The following pieces will be processed:
              </p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {initialPieceIds.map((pieceId, i) => {
                  const piece = pieces.find(p => p.id === pieceId)
                  return (
                    <div 
                      key={pieceId}
                      className="flex items-center gap-2 px-3 py-2 rounded text-sm"
                      style={{ background: 'var(--bg-input)' }}
                    >
                      <span className="flex-1" style={{ color: 'var(--text-secondary)' }}>
                        {piece?.name || `Piece ${i + 1}`}
                      </span>
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            // After starting: show progress
            <>
              {/* Progress Bar */}
              <div className="relative h-2 rounded-full overflow-hidden mb-4" style={{ background: 'var(--bg-input)' }}>
                <div 
                  className="absolute inset-y-0 left-0 transition-all duration-300"
                  style={{ 
                    background: 'var(--accent-blue)',
                    width: `${(completedCount / initialPieceIds.length) * 100}%`,
                  }}
                />
              </div>
              
              <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                {isComplete ? (
                  <>
                    <FontAwesomeIcon icon={faCheck} className="text-green-500 mr-2" />
                    Complete! {successCount} successful, {failedCount} failed
                  </>
                ) : processingCount > 0 ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                    Processing {completedCount + 1} of {initialPieceIds.length}...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                    Starting...
                  </>
                )}
              </p>
              
              {/* Results List */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {results.map((result, i) => {
                  const piece = pieces.find(p => p.id === result.pieceId)
                  return (
                    <div 
                      key={result.pieceId}
                      className="flex items-center gap-2 px-3 py-2 rounded text-sm"
                      style={{ background: 'var(--bg-input)' }}
                    >
                      <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                        {result.status === 'pending' && <span style={{ color: 'var(--text-muted)' }}>•</span>}
                        {result.status === 'processing' && <FontAwesomeIcon icon={faSpinner} spin style={{ color: 'var(--accent-blue)' }} />}
                        {result.status === 'success' && <FontAwesomeIcon icon={faCheck} style={{ color: '#10b981' }} />}
                        {result.status === 'failed' && <FontAwesomeIcon icon={faXmark} style={{ color: 'var(--accent-orange)' }} />}
                      </span>
                      <span className="flex-1" style={{ color: 'var(--text-secondary)' }}>
                        {piece?.name || `Piece ${i + 1}`}
                      </span>
                      {result.error && (
                        <span className="text-xs" style={{ color: 'var(--accent-orange)' }}>
                          {result.error}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 border-t flex justify-end gap-3" style={{ borderColor: 'var(--border-normal)' }}>
          {!hasStarted ? (
            // Before starting: show cancel and start buttons
            <>
              <button
                onClick={onCancel}
                className="px-4 py-2 rounded text-sm transition-colors"
                style={{ 
                  background: 'var(--bg-input)', 
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => setHasStarted(true)}
                className="px-4 py-2 rounded text-sm font-medium transition-colors"
                style={{ 
                  background: 'var(--accent-blue)', 
                  color: 'white' 
                }}
              >
                Start Processing
              </button>
            </>
          ) : !isComplete ? (
            // During processing: show cancel button
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded text-sm transition-colors"
              style={{ 
                background: 'var(--bg-input)', 
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              Cancel
            </button>
          ) : (
            // After completion: show done button
            <button
              onClick={onComplete}
              className="px-4 py-2 rounded text-sm font-medium transition-colors"
              style={{ 
                background: 'var(--accent-blue)', 
                color: 'white' 
              }}
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
