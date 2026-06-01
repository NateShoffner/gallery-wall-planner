'use client'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark } from '@fortawesome/free-solid-svg-icons'

interface PrivacyModalProps {
  onClose: () => void
}

export function PrivacyModal({ onClose }: PrivacyModalProps) {
  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
      style={{ background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-lg shadow-2xl"
        style={{
          background: 'var(--bg-panel)',
          border: '1px solid var(--border-normal)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="sticky top-0 px-6 py-4 flex items-center justify-between"
          style={{
            background: 'var(--bg-panel)',
            borderBottom: '1px solid var(--border-subtle)',
            zIndex: 1,
          }}
        >
          <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            Privacy Policy
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded transition-colors"
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
            title="Close"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4" style={{ color: 'var(--text-secondary)' }}>
          <p className="text-sm">
            <strong style={{ color: 'var(--text-primary)' }}>Last Updated:</strong> {new Date().toLocaleDateString()}
          </p>

          <section>
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              Overview
            </h3>
            <p className="text-sm leading-relaxed">
              Gallery Wall Planner is a client-side application that runs entirely in your web browser. 
              Your privacy is important to us, and we've designed this tool to keep your data under your control.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              AI Image Processing
            </h3>
            <p className="text-sm leading-relaxed mb-2">
              When you choose to use AI-powered background removal features, your images are sent to OpenAI's API for processing. 
              You must provide your own OpenAI API key to use this feature. OpenAI processes your images according to their privacy policy.
            </p>
            <p className="text-sm leading-relaxed">
              Processed images are stored locally on your device and are not retained by our servers or OpenAI beyond the processing moment.
            </p>
          </section>

           <section>
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              Data Storage
            </h3>
            <p className="text-sm leading-relaxed mb-2">
              All your gallery wall layouts, piece configurations, and uploaded images are stored locally in your browser using:
            </p>
            <ul className="text-sm list-disc list-inside space-y-1 ml-2">
              <li>localStorage for layout settings and piece data</li>
              <li>IndexedDB for uploaded images</li>
            </ul>
            <p className="text-sm leading-relaxed mt-2">
              This data never leaves your device unless you explicitly export or share it.
            </p>
          </section>

           <section>
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              Analytics & Cookies
            </h3>
            <p className="text-sm leading-relaxed">
              We do not use cookies, analytics, or any tracking mechanisms. We do not collect any personal information, 
              usage statistics, or behavioral data.
            </p>
          </section>

           <section>
             <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
               Third-Party Services
             </h3>
             <p className="text-sm leading-relaxed">
               This application does not connect to any third-party services. All functionality is client-side and runs entirely on your device.
             </p>
           </section>

          <section>
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              Data Control
            </h3>
            <p className="text-sm leading-relaxed">
              You have complete control over your data:
            </p>
            <ul className="text-sm list-disc list-inside space-y-1 ml-2 mt-2">
              <li>Export your layouts at any time</li>
              <li>Clear your data through your browser settings or the app's reset function</li>
              <li>Your data is automatically deleted when you clear your browser storage</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              Contact
            </h3>
            <p className="text-sm leading-relaxed">
              For questions or concerns about privacy, please visit{' '}
              <a
                href="https://nateshoffner.com"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--accent-blue)', textDecoration: 'none' }}
                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
              >
                nateshoffner.com
              </a>
            </p>
          </section>
        </div>

        {/* Footer */}
        <div
          className="sticky bottom-0 px-6 py-4 flex justify-end"
          style={{
            background: 'var(--bg-panel)',
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 rounded text-sm font-medium transition-colors"
            style={{
              background: 'var(--accent-blue)',
              color: 'white',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
