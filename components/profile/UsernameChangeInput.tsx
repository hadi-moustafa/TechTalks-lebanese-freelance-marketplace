'use client'

import { useState, useEffect } from 'react'
import { Check, X, Loader2, AlertCircle } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import UsernameService from '@/services/usernameService'

interface UsernameChangeInputProps {
  userId: string
  currentUsername: string
  onUpdate?: (newUsername: string) => void
}

export default function UsernameChangeInput({
  userId,
  currentUsername,
  onUpdate
}: UsernameChangeInputProps) {
  const [username, setUsername] = useState(currentUsername)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Reset to current username when not editing
  useEffect(() => {
    if (!isEditing) {
      setUsername(currentUsername)
      setError(null)
      setSuccess(false)
    }
  }, [isEditing, currentUsername])

  const handleSave = async () => {
    // Don't save if unchanged
    if (username.trim() === currentUsername) {
      setIsEditing(false)
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(false)

    const result = await UsernameService.updateUsername(userId, username.trim())

    if (result.success && result.username) {
      setSuccess(true)
      setIsEditing(false)
      if (onUpdate) onUpdate(result.username)
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000)
    } else {
      setError(result.error || 'Failed to update username')
    }

    setIsLoading(false)
  }

  const handleCancel = () => {
    setUsername(currentUsername)
    setIsEditing(false)
    setError(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">Username</label>
      
      <div className="relative">
        <Input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onFocus={() => setIsEditing(true)}
          onKeyDown={handleKeyDown}
          placeholder="Enter username"
          disabled={isLoading}
          className={`pr-10 ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : ''} ${success ? 'border-green-300 focus:border-green-500 focus:ring-green-200' : ''}`}
        />
        
        {/* Status Icons */}
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="text-gray-400 animate-spin" size={18} />
          </div>
        )}
        
        {success && !isEditing && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Check className="text-green-500" size={18} />
          </div>
        )}
        
        {error && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <AlertCircle className="text-red-500" size={18} />
          </div>
        )}
      </div>

      {/* Action Buttons - Show when editing and changed */}
      {isEditing && username.trim() !== currentUsername && (
        <div className="flex gap-2 animate-in slide-in-from-top-1">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isLoading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 animate-spin" size={16} />
                Saving...
              </>
            ) : (
              <>
                <Check className="mr-2" size={16} />
                Save
              </>
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
            className="flex-1"
          >
            <X className="mr-2" size={16} />
            Cancel
          </Button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded-lg animate-in slide-in-from-top-1">
          <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={16} />
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && !isEditing && (
        <div className="flex items-start gap-2 p-2 bg-green-50 border border-green-200 rounded-lg animate-in slide-in-from-top-1">
          <Check className="text-green-500 flex-shrink-0 mt-0.5" size={16} />
          <p className="text-xs text-green-600">Username updated successfully!</p>
        </div>
      )}

      {/* Helper Text */}
      {!error && !success && (
        <p className="text-xs text-gray-500">
          3-30 characters, letters, numbers, underscores, and hyphens only
        </p>
      )}
    </div>
  )
}