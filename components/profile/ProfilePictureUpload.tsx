'use client'

import { useState, useRef } from 'react'
import { Camera, Trash2, Loader2, Edit2, X } from 'lucide-react'
import ProfilePictureService from '@/services/profilePictureService'

//this defines what the parent component must provide
interface ProfilePictureUploadProps {
  userId: string
  currentPictureUrl?: string | null
  userName: string
  onUpdate?: (newUrl: string | null) => void
  bgColor?: string
  iconColor?: string
}

export default function ProfilePictureUpload({
  userId,
  currentPictureUrl,
  userName,
  onUpdate,
  bgColor = 'bg-lira-blue-50k',
  iconColor = 'text-lira-text'
}: ProfilePictureUploadProps) {
  const [profilePicUrl, setProfilePicUrl] = useState(currentPictureUrl)
  const [previewUrl, setPreviewUrl] = useState(currentPictureUrl)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showImagePreview, setShowImagePreview] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Handle file selection
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    console.log('File selected:', file.name)

    // Show preview immediately
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload file
    await uploadFile(file)

    // Reset the input so you can upload the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Upload file
  const uploadFile = async (file: File) => {
    try {
      setUploading(true)
      setError(null)

      const result = await ProfilePictureService.uploadProfilePicture(userId, file)

      if (result.success && result.url) {
        setProfilePicUrl(result.url)
        setPreviewUrl(result.url)
        if (onUpdate) onUpdate(result.url)
        console.log('✅ Upload successful:', result.url)
      } else {
        setError(result.error || 'Upload failed')
        setPreviewUrl(profilePicUrl)
        console.error('❌ Upload failed:', result.error)
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
      setPreviewUrl(profilePicUrl)
      console.error('❌ Upload error:', err)
    } finally {
      setUploading(false)
    }
  }

  // Delete picture
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!profilePicUrl) return

    try {
      setUploading(true)
      setError(null)

      const result = await ProfilePictureService.deleteProfilePicture(userId)

      if (result.success) {
        setProfilePicUrl(null)
        setPreviewUrl(null)
        if (onUpdate) onUpdate(null)
        console.log('✅ Picture deleted successfully')
      } else {
        setError(result.error || 'Delete failed')
        console.error('❌ Delete failed:', result.error)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete profile picture')
      console.error('❌ Delete error:', err)
    } finally {
      setUploading(false)
    }
  }

  // Open file picker (for editing/uploading)
  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowImagePreview(false) // Close preview if open
    fileInputRef.current?.click()
  }

  // View image
  const handleViewImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (profilePicUrl && !uploading) {
      setShowImagePreview(true)
    }
  }

  // Get user initials for placeholder
  const getUserInitials = () => {
    return userName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <>
      <div className="relative group cursor-pointer">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
          aria-label="Upload profile picture"
        />

        {/* Profile Picture Display */}
        <div
          onClick={previewUrl ? handleViewImage : handleEditClick}
          className={`w-16 h-16 rounded-full ${bgColor} flex items-center justify-center ${iconColor} overflow-hidden relative`}
        >
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-2xl font-bold">
              {getUserInitials()}
            </span>
          )}

          {/* Hover Overlay */}
          {!uploading && (
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {previewUrl ? (
                <div className="flex flex-col items-center gap-1">
                  <Camera className="text-white" size={16} />
                  <span className="text-white text-[10px] font-medium">View</span>
                </div>
              ) : (
                <Camera className="text-white" size={20} />
              )}
            </div>
          )}

          {/* Loading Overlay */}
          {uploading && (
            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
              <Loader2 className="text-white animate-spin" size={20} />
            </div>
          )}
        </div>

        {/* Action Buttons - Show on hover if picture exists */}
        {profilePicUrl && !uploading && (
          <div className="absolute -bottom-1 -right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Edit Button */}
            <button
              onClick={handleEditClick}
              className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center hover:bg-blue-600 shadow-lg transition-colors"
              title="Change picture"
            >
              <Edit2 size={12} className="text-white" />
            </button>

            {/* Delete Button */}
            <button
              onClick={handleDelete}
              className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 shadow-lg transition-colors"
              title="Delete picture"
            >
              <Trash2 size={12} className="text-white" />
            </button>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 p-2 bg-red-100 text-red-700 text-xs rounded whitespace-nowrap z-50 shadow-lg">
            {error}
          </div>
        )}
      </div>

      {/* Square Image Preview Modal */}
      {showImagePreview && previewUrl && (
        <div
          className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4"
          onClick={() => setShowImagePreview(false)}
        >
          {/* Card container */}
          <div
            className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 flex items-center justify-between border-b">
              <div>
                <h3 className="font-bold text-lg text-gray-900">{userName}</h3>
                <p className="text-sm text-gray-500">Profile Picture</p>
              </div>
              <button
                onClick={() => setShowImagePreview(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-200 flex items-center justify-center transition-colors"
                title="Close"
              >
                <X className="text-gray-600" size={20} />
              </button>
            </div>

            {/* Square Image - Same aspect ratio */}
            <div className="p-6">
              <div className="w-full aspect-square rounded-xl overflow-hidden bg-gray-100">
                <img
                  src={previewUrl}
                  alt={`${userName}'s profile picture`}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={handleEditClick}
                className="flex-1 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center justify-center gap-2 transition-colors font-medium"
              >
                <Edit2 size={18} />
                Change
              </button>
              <button
                onClick={(e) => {
                  setShowImagePreview(false)
                  handleDelete(e)
                }}
                className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center justify-center gap-2 transition-colors font-medium"
              >
                <Trash2 size={18} />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}