import { supabase } from '@/lib/supabase'

class ProfilePictureService {
  /**
   * Upload or update profile picture
   * @param userId - The user's ID
   * @param file - The image file to upload
   * @returns Object with success status and URL or error
   */
  async uploadProfilePicture(userId: string, file: File) {
    try {
      console.log('Starting upload for user:', userId)

      // Validate file
      if (!file.type.startsWith('image/')) {
        throw new Error('Please upload an image file (JPG, PNG, GIF)')
      }

      const maxSize = 2 * 1024 * 1024 // 2MB
      if (file.size > maxSize) {
        throw new Error('Image must be smaller than 2MB')
      }

      console.log('File validation passed')

      // Get current profile picture
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('profile_pic')
        .eq('id', userId)
        .single()

      if (userError) {
        console.error('Error fetching user:', userError)
        throw new Error('Could not fetch user data')
      }

      console.log('Current profile pic:', userData?.profile_pic)

      // Delete old picture if exists
      if (userData?.profile_pic) {
        console.log('Deleting old profile picture...')
        await this.deleteImageFromStorage(userData.profile_pic)
      }

      // Create unique filename: userId/timestamp.extension
      const fileExtension = file.name.split('.').pop()
      const fileName = `${userId}/${Date.now()}.${fileExtension}`

      console.log('Uploading file as:', fileName)

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        throw new Error('Failed to upload image: ' + uploadError.message)
      }

      console.log('Upload successful')

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(fileName)

      const publicUrl = urlData.publicUrl
      console.log('Public URL:', publicUrl)

      // Update database
      const { error: updateError } = await supabase
        .from('users')
        .update({ profile_pic: publicUrl })
        .eq('id', userId)

      if (updateError) {
        console.error('Database update error:', updateError)
        throw new Error('Failed to update profile picture in database')
      }

      console.log('Profile picture updated successfully')

      return {
        success: true,
        url: publicUrl,
        message: 'Profile picture uploaded successfully!'
      }
    } catch (error: any) {
      console.error('Upload error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Delete profile picture
   * @param userId - The user's ID
   * @returns Object with success status
   */
  async deleteProfilePicture(userId: string) {
    try {
      console.log('Deleting profile picture for user:', userId)

      // Get current profile picture URL
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('profile_pic')
        .eq('id', userId)
        .single()

      if (userError) {
        throw new Error('Could not fetch user data')
      }

      if (!userData?.profile_pic) {
        throw new Error('No profile picture to delete')
      }

      console.log('Current profile pic to delete:', userData.profile_pic)

      // Delete from storage
      await this.deleteImageFromStorage(userData.profile_pic)

      // Update database
      const { error: updateError } = await supabase
        .from('users')
        .update({ profile_pic: null })
        .eq('id', userId)

      if (updateError) {
        throw new Error('Failed to update database')
      }

      console.log('Profile picture deleted successfully')

      return {
        success: true,
        message: 'Profile picture deleted successfully!'
      }
    } catch (error: any) {
      console.error('Delete error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Helper function to delete image from storage
   * @param imageUrl - The full URL of the image
   */
  private async deleteImageFromStorage(imageUrl: string) {
    try {
      if (!imageUrl) return

      console.log('Extracting file path from URL:', imageUrl)

      // Extract file path from URL
      const urlParts = imageUrl.split('/profile-pictures/')
      if (urlParts.length < 2) {
        console.log('Could not extract file path from URL')
        return
      }

      const filePath = urlParts[1]
      console.log('Deleting file:', filePath)

      const { error } = await supabase.storage
        .from('profile-pictures')
        .remove([filePath])

      if (error) {
        console.error('Storage delete error:', error)
      } else {
        console.log('File deleted from storage successfully')
      }
    } catch (error) {
      console.error('Error in deleteImageFromStorage:', error)
    }
  }

  /**
   * Get user's profile picture URL
   * @param userId - The user's ID
   * @returns Object with URL or null
   */
  async getProfilePicture(userId: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('profile_pic')
        .eq('id', userId)
        .single()

      if (error) throw error

      return {
        success: true,
        url: data?.profile_pic || null
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }
}

export default new ProfilePictureService()