'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSpinner, faXmark, faRotate, faCrop } from '@fortawesome/free-solid-svg-icons'
import { processImageWithAI } from '@/lib/aiImageProcessor'
import { compressImageForAI, transformImage, createPreviewUrl } from '@/lib/imageTransform'
import type { AIProcessingData } from '@/types'

interface ImageProcessModalProps {
  file: File
  onCancel: () => void
  onConfirm: (processedFile: File, aiData?: AIProcessingData) => void
  mode?: 'upload' | 'reprocess'
  existingAIData?: AIProcessingData
}

interface AIResult {
  rotation: number
  bounds: { x: number; y: number; w: number; h: number }
  confidence: number
}

export function ImageProcessModal({ 
  file, 
  onCancel, 
  onConfirm,
  mode = 'upload',
  existingAIData,
}: ImageProcessModalProps) {
  // State
  const [aiEnabled, setAiEnabled] = useState(() => {
    // Load user preference from localStorage (checked by default = opt-out)
    const saved = localStorage.getItem('aiProcessingEnabled')
    return saved === null ? true : saved === 'true'
  })
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [processedFile, setProcessedFile] = useState<File | null>(null)
  const [aiResult, setAiResult] = useState<AIResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Preview URLs
  const [originalPreviewUrl, setOriginalPreviewUrl] = useState<string>('')
  const [processedPreviewUrl, setProcessedPreviewUrl] = useState<string>('')
  
  // Manual adjustment controls
  const [manualRotation, setManualRotation] = useState(0)
  const [manualBounds, setManualBounds] = useState({ x: 0, y: 0, w: 1, h: 1 })
  const [showManualControls, setShowManualControls] = useState(false)
  
  // Create original preview
  useEffect(() => {
    createPreviewUrl(file)
      .then(setOriginalPreviewUrl)
      .catch((err) => console.error('Failed to create preview:', err))
    
    return () => {
      if (originalPreviewUrl) URL.revokeObjectURL(originalPreviewUrl)
    }
  }, [file])
  
  // Save AI preference
  useEffect(() => {
    localStorage.setItem('aiProcessingEnabled', aiEnabled.toString())
  }, [aiEnabled])
  
  // Clean up processed preview URL
  useEffect(() => {
    return () => {
      if (processedPreviewUrl) URL.revokeObjectURL(processedPreviewUrl)
    }
  }, [processedPreviewUrl])
  
  // If reprocessing, pre-fill with existing AI data
  useEffect(() => {
    if (mode === 'reprocess' && existingAIData) {
      setManualRotation(existingAIData.rotation)
      setManualBounds(existingAIData.bounds)
    }
  }, [mode, existingAIData])
  
  async function handleProcess() {
    if (!aiEnabled) {
      // Skip AI processing, use original
      onConfirm(file)
      return
    }
    
    setIsProcessing(true)
    setError(null)
    
    try {
      // 1. Compress for API
      toast.loading('Compressing image...', { id: 'ai-process' })
      const compressed = await compressImageForAI(file)
      
      // 2. Call AI API
      toast.loading('Analyzing image with AI...', { id: 'ai-process' })
      const result = await processImageWithAI(compressed)
      
      setAiResult(result)
      setManualRotation(result.rotation)
      setManualBounds(result.bounds)
      
      // 3. Check confidence threshold (30%)
      if (result.confidence < 0.3) {
        toast.error('AI confidence too low. Using original image.', { id: 'ai-process' })
        setTimeout(() => onConfirm(file), 1500)
        return
      }
      
      // 4. Transform original image
      toast.loading('Applying transformations...', { id: 'ai-process' })
      const transformed = await transformImage(file, result.rotation, result.bounds)
      setProcessedFile(transformed)
      
      // 5. Create preview
      const previewUrl = await createPreviewUrl(transformed)
      setProcessedPreviewUrl(previewUrl)
      
      toast.success(
        `Image processed! Rotation: ${result.rotation.toFixed(1)}°, Confidence: ${(result.confidence * 100).toFixed(0)}%`,
        { id: 'ai-process', duration: 4000 }
      )
      
    } catch (err) {
      console.error('AI processing error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      toast.error('AI processing failed. You can still upload the original.', { id: 'ai-process' })
    } finally {
      setIsProcessing(false)
    }
  }
  
  async function handleManualAdjustment() {
    if (!aiResult) return
    
    setIsProcessing(true)
    toast.loading('Applying manual adjustments...', { id: 'manual-adjust' })
    
    try {
      const transformed = await transformImage(file, manualRotation, manualBounds)
      setProcessedFile(transformed)
      
      const previewUrl = await createPreviewUrl(transformed)
      setProcessedPreviewUrl(previewUrl)
      
      toast.success('Manual adjustments applied!', { id: 'manual-adjust' })
    } catch (err) {
      toast.error('Failed to apply adjustments', { id: 'manual-adjust' })
    } finally {
      setIsProcessing(false)
    }
  }
  
  function handleAccept() {
    const aiData: AIProcessingData | undefined = aiResult ? {
      rotation: manualRotation,
      bounds: manualBounds,
      confidence: aiResult.confidence,
      processedAt: Date.now(),
    } : undefined
    
    if (processedFile) {
      onConfirm(processedFile, aiData)
    } else {
      onConfirm(file, undefined)
    }
  }
  
  const title = mode === 'reprocess' ? 'Reprocess Image with AI' : 'Process Image'
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={onCancel}
    >
      <div 
        className="relative max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-lg"
        style={{ 
          background: 'var(--bg-elevated)', 
          border: '1px solid var(--border-normal)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div 
          className="sticky top-0 flex items-center justify-between px-6 py-4 border-b"
          style={{ 
            background: 'var(--bg-elevated)', 
            borderColor: 'var(--border-normal)',
            zIndex: 10,
          }}
        >
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded flex items-center justify-center transition-colors hover:bg-gray-500/20"
            style={{ color: 'var(--text-muted)' }}
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Original Preview */}
          <div>
            <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Original Image
            </h3>
            <div 
              className="relative w-full aspect-video rounded overflow-hidden"
              style={{ background: 'var(--bg-canvas)' }}
            >
              {originalPreviewUrl && (
                <img 
                  src={originalPreviewUrl} 
                  alt="Original" 
                  className="w-full h-full object-contain"
                />
              )}
            </div>
          </div>
          
          {/* AI Processing Checkbox */}
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="ai-enabled"
              checked={aiEnabled}
              onChange={(e) => setAiEnabled(e.target.checked)}
              disabled={isProcessing}
              className="mt-1"
              style={{ accentColor: 'var(--accent-blue)' }}
            />
            <div className="flex-1">
              <label 
                htmlFor="ai-enabled" 
                className="text-sm font-medium cursor-pointer"
                style={{ color: 'var(--text-primary)' }}
              >
                Auto-straighten and crop with AI
              </label>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Automatically detects artwork boundaries and corrects tilt using GPT-4 Vision
              </p>
            </div>
          </div>
          
          {/* Privacy Disclaimer */}
          {aiEnabled && (
            <div 
              className="px-4 py-3 rounded text-xs"
              style={{ 
                background: 'rgba(59, 130, 246, 0.1)', 
                border: '1px solid rgba(59, 130, 246, 0.3)',
                color: 'var(--text-secondary)'
              }}
            >
              <strong style={{ color: 'var(--text-primary)' }}>Privacy Notice:</strong> When AI processing is enabled, 
              your image will be sent to OpenAI&apos;s servers for analysis. The image is compressed to ~1024px before 
              transmission. OpenAI may retain data according to their{' '}
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
          
          {/* Processing State */}
          {isProcessing && (
            <div className="flex items-center justify-center py-8 gap-3">
              <FontAwesomeIcon icon={faSpinner} spin className="text-2xl" style={{ color: 'var(--accent-blue)' }} />
              <span style={{ color: 'var(--text-secondary)' }}>Processing image...</span>
            </div>
          )}
          
          {/* Error State */}
          {error && (
            <div 
              className="px-4 py-3 rounded text-sm"
              style={{ 
                background: 'rgba(249, 115, 22, 0.1)', 
                border: '1px solid rgba(249, 115, 22, 0.3)',
                color: 'var(--accent-orange)'
              }}
            >
              <strong>Error:</strong> {error}
            </div>
          )}
          
          {/* AI Result & Processed Preview */}
          {aiResult && processedFile && !isProcessing && (
            <>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Processed Image
                  </h3>
                  <button
                    onClick={() => setShowManualControls(!showManualControls)}
                    className="text-xs px-3 py-1.5 rounded transition-colors"
                    style={{ 
                      background: 'var(--bg-input)', 
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    {showManualControls ? 'Hide' : 'Show'} Manual Controls
                  </button>
                </div>
                
                <div 
                  className="relative w-full aspect-video rounded overflow-hidden"
                  style={{ background: 'var(--bg-canvas)' }}
                >
                  {processedPreviewUrl && (
                    <img 
                      src={processedPreviewUrl} 
                      alt="Processed" 
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>
                
                {/* AI Result Info */}
                <div className="mt-2 flex items-center gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <span className="flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faRotate} />
                    Rotation: {aiResult.rotation.toFixed(1)}°
                  </span>
                  <span className="flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faCrop} />
                    Crop: {(aiResult.bounds.w * 100).toFixed(0)}% × {(aiResult.bounds.h * 100).toFixed(0)}%
                  </span>
                  <span>
                    Confidence: {(aiResult.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
              
              {/* Manual Adjustment Controls */}
              {showManualControls && (
                <div 
                  className="p-4 rounded space-y-4"
                  style={{ 
                    background: 'var(--bg-input)', 
                    border: '1px solid var(--border-subtle)' 
                  }}
                >
                  <h4 className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Manual Adjustments
                  </h4>
                  
                  {/* Rotation Slider */}
                  <div>
                    <label className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      Rotation: {manualRotation.toFixed(1)}°
                    </label>
                    <input
                      type="range"
                      min={-45}
                      max={45}
                      step={0.1}
                      value={manualRotation}
                      onChange={(e) => setManualRotation(parseFloat(e.target.value))}
                      className="w-full mt-1"
                      style={{ accentColor: 'var(--accent-blue)' }}
                    />
                  </div>
                  
                  {/* Crop Bounds */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        Left: {(manualBounds.x * 100).toFixed(0)}%
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.01}
                        value={manualBounds.x}
                        onChange={(e) => setManualBounds({ ...manualBounds, x: parseFloat(e.target.value) })}
                        className="w-full mt-1"
                        style={{ accentColor: 'var(--accent-blue)' }}
                      />
                    </div>
                    <div>
                      <label className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        Top: {(manualBounds.y * 100).toFixed(0)}%
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.01}
                        value={manualBounds.y}
                        onChange={(e) => setManualBounds({ ...manualBounds, y: parseFloat(e.target.value) })}
                        className="w-full mt-1"
                        style={{ accentColor: 'var(--accent-blue)' }}
                      />
                    </div>
                    <div>
                      <label className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        Width: {(manualBounds.w * 100).toFixed(0)}%
                      </label>
                      <input
                        type="range"
                        min={0.1}
                        max={1}
                        step={0.01}
                        value={manualBounds.w}
                        onChange={(e) => setManualBounds({ ...manualBounds, w: parseFloat(e.target.value) })}
                        className="w-full mt-1"
                        style={{ accentColor: 'var(--accent-blue)' }}
                      />
                    </div>
                    <div>
                      <label className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        Height: {(manualBounds.h * 100).toFixed(0)}%
                      </label>
                      <input
                        type="range"
                        min={0.1}
                        max={1}
                        step={0.01}
                        value={manualBounds.h}
                        onChange={(e) => setManualBounds({ ...manualBounds, h: parseFloat(e.target.value) })}
                        className="w-full mt-1"
                        style={{ accentColor: 'var(--accent-blue)' }}
                      />
                    </div>
                  </div>
                  
                  <button
                    onClick={handleManualAdjustment}
                    disabled={isProcessing}
                    className="w-full px-4 py-2 rounded text-sm font-medium transition-colors disabled:opacity-50"
                    style={{ 
                      background: 'var(--accent-blue)', 
                      color: 'white' 
                    }}
                  >
                    Apply Manual Adjustments
                  </button>
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Footer Actions */}
        <div 
          className="sticky bottom-0 flex items-center justify-end gap-3 px-6 py-4 border-t"
          style={{ 
            background: 'var(--bg-elevated)', 
            borderColor: 'var(--border-normal)' 
          }}
        >
          <button
            onClick={onCancel}
            disabled={isProcessing}
            className="px-4 py-2 rounded text-sm transition-colors disabled:opacity-50"
            style={{ 
              background: 'var(--bg-input)', 
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            Cancel
          </button>
          
          {!aiEnabled && (
            <button
              onClick={() => onConfirm(file)}
              className="px-4 py-2 rounded text-sm font-medium transition-colors"
              style={{ 
                background: 'var(--accent-blue)', 
                color: 'white' 
              }}
            >
              Upload Original
            </button>
          )}
          
          {aiEnabled && !processedFile && !isProcessing && (
            <button
              onClick={handleProcess}
              className="px-4 py-2 rounded text-sm font-medium transition-colors"
              style={{ 
                background: 'var(--accent-blue)', 
                color: 'white' 
              }}
            >
              Process with AI
            </button>
          )}
          
          {processedFile && !isProcessing && (
            <>
              <button
                onClick={() => onConfirm(file)}
                className="px-4 py-2 rounded text-sm transition-colors"
                style={{ 
                  background: 'var(--bg-input)', 
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                Use Original Instead
              </button>
              <button
                onClick={handleAccept}
                className="px-4 py-2 rounded text-sm font-medium transition-colors"
                style={{ 
                  background: 'var(--accent-blue)', 
                  color: 'white' 
                }}
              >
                Accept Processed
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
