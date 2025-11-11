'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

/**
 * SessionExpirationWarning Component
 * Displays a warning banner when the user's session is about to expire
 * Provides option to refresh the session
 */
export default function SessionExpirationWarning() {
  const { isSessionExpiring, refreshSession, logout } = useAuth()
  const [showWarning, setShowWarning] = useState(false)

  useEffect(() => {
    setShowWarning(isSessionExpiring)
  }, [isSessionExpiring])

  const handleRefresh = () => {
    const success = refreshSession()
    if (success) {
      setShowWarning(false)
    }
  }

  const handleDismiss = () => {
    setShowWarning(false)
  }

  if (!showWarning) {
    return null
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-white px-4 py-3 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div>
            <p className="font-semibold">Session Expiring Soon</p>
            <p className="text-sm">Your session will expire in less than 5 minutes.</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRefresh}
            className="bg-white text-yellow-600 px-4 py-2 rounded-md font-medium hover:bg-yellow-50 transition-colors"
          >
            Extend Session
          </button>
          <button
            onClick={handleDismiss}
            className="text-white hover:text-yellow-100 transition-colors"
            aria-label="Dismiss warning"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

