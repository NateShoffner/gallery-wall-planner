'use client'

import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEye, faEyeSlash, faCopy, faCheck } from '@fortawesome/free-solid-svg-icons'
import { useStore } from '@/store/useStore'
import toast from 'react-hot-toast'

export function APIKeySettings() {
  const openaiApiKey = useStore((s) => s.openaiApiKey)
  const setOpenAIApiKey = useStore((s) => s.setOpenAIApiKey)

  const [showKey, setShowKey] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [tempKey, setTempKey] = useState(openaiApiKey)

  const handleCopy = () => {
    navigator.clipboard.writeText(openaiApiKey)
    setCopied(true)
    toast.success('Copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSave = () => {
    setOpenAIApiKey(tempKey)
    setIsEditing(false)
    toast.success('API key saved')
  }

  const handleCancel = () => {
    setTempKey(openaiApiKey)
    setIsEditing(false)
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
          OpenAI API Key
        </label>
        <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
          Your API key is stored locally and only used to process images on your device. Never shared with anyone.
        </p>

        {isEditing ? (
          <div className="space-y-2">
            <input
              type={showKey ? 'text' : 'password'}
              value={tempKey}
              onChange={(e) => setTempKey(e.target.value)}
              placeholder="sk-..."
              className="w-full px-3 py-2 rounded text-sm font-mono"
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                outline: 'none',
              }}
            />
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="flex-1 px-3 py-2 rounded text-sm font-medium transition-colors"
                style={{
                  background: 'var(--accent-blue)',
                  color: 'white',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                Save
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 px-3 py-2 rounded text-sm font-medium transition-colors"
                style={{
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div
              className="flex-1 px-3 py-2 rounded text-sm font-mono"
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
              }}
            >
              {openaiApiKey ? (
                showKey ? (
                  openaiApiKey
                ) : (
                  '••••••••••••••' + openaiApiKey.slice(-4)
                )
              ) : (
                <span style={{ color: 'var(--text-muted)' }}>Not set</span>
              )}
            </div>
            <button
              onClick={() => setShowKey(!showKey)}
              className="w-10 h-10 flex items-center justify-center rounded"
              style={{
                background: 'var(--bg-elevated)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)',
              }}
              title={showKey ? 'Hide' : 'Show'}
            >
              <FontAwesomeIcon icon={showKey ? faEyeSlash : faEye} />
            </button>
            {openaiApiKey && (
              <button
                onClick={handleCopy}
                className="w-10 h-10 flex items-center justify-center rounded"
                style={{
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)',
                }}
                title="Copy key"
              >
                <FontAwesomeIcon icon={copied ? faCheck : faCopy} />
              </button>
            )}
            <button
              onClick={() => setIsEditing(true)}
              className="px-3 py-2 rounded text-sm font-medium transition-colors"
              style={{
                background: 'var(--bg-elevated)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--accent-blue)'
                e.currentTarget.style.color = 'white'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--bg-elevated)'
                e.currentTarget.style.color = 'var(--text-secondary)'
              }}
            >
              Edit
            </button>
          </div>
        )}

        <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
          Get your key at{' '}
          <a
            href="https://platform.openai.com/api-keys"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--accent-blue)', textDecoration: 'none' }}
            onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
            onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
          >
            platform.openai.com/api-keys
          </a>
        </p>
      </div>

      <div className="p-3 rounded" style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          💡 <strong>Tip:</strong> With an API key set, you can use AI-powered background removal to automatically process
          your images for cleaner gallery wall layouts.
        </p>
      </div>
    </div>
  )
}
