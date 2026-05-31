'use client'

import { useEffect, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { IconDefinition } from '@fortawesome/free-solid-svg-icons'

export interface ContextMenuItem {
  label: string
  icon?: IconDefinition
  onClick: () => void
  disabled?: boolean
  separator?: boolean
  danger?: boolean
}

interface ContextMenuProps {
  x: number
  y: number
  items: ContextMenuItem[]
  onClose: () => void
}

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    // Add small delay to prevent immediate close from the right-click event
    setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }, 0)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  // Adjust position to keep menu on screen
  useEffect(() => {
    if (!menuRef.current) return

    const menu = menuRef.current
    const rect = menu.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    let adjustedX = x
    let adjustedY = y

    // Adjust horizontal position if menu goes off right edge
    if (x + rect.width > viewportWidth) {
      adjustedX = viewportWidth - rect.width - 10
    }

    // Adjust vertical position if menu goes off bottom edge
    if (y + rect.height > viewportHeight) {
      adjustedY = viewportHeight - rect.height - 10
    }

    menu.style.left = `${adjustedX}px`
    menu.style.top = `${adjustedY}px`
  }, [x, y])

  return (
    <div
      ref={menuRef}
      className="fixed z-[9999] py-1 rounded-lg shadow-2xl min-w-[180px]"
      style={{
        left: x,
        top: y,
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      {items.map((item, index) => {
        if (item.separator) {
          return (
            <div
              key={index}
              className="my-1 mx-2"
              style={{ height: 1, background: 'var(--border-subtle)' }}
            />
          )
        }

        return (
          <button
            key={index}
            onClick={() => {
              if (!item.disabled) {
                item.onClick()
                onClose()
              }
            }}
            disabled={item.disabled}
            className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              color: item.danger ? '#ef4444' : 'var(--text-primary)',
              background: 'transparent',
            }}
            onMouseEnter={(e) => {
              if (!item.disabled) {
                e.currentTarget.style.background = item.danger
                  ? 'rgba(239, 68, 68, 0.1)'
                  : 'var(--bg-hover)'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
            }}
          >
            {item.icon && (
              <FontAwesomeIcon
                icon={item.icon}
                style={{ fontSize: 14, width: 16 }}
              />
            )}
            <span>{item.label}</span>
          </button>
        )
      })}
    </div>
  )
}
