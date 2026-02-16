/**
 * Supabase Storage Service
 * Handles image uploads for avatars and banners
 */

import { supabase } from './client';

const AVATAR_BUCKET = 'avatars';
const BANNER_BUCKET = 'banners';
const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_BANNER_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface UploadResult {
  url: string | null;
  error: string | null;
}

/**
 * Upload avatar image to Supabase Storage
 * Path: avatars/{userId}/avatar.jpg
 * Always overwrites existing file
 */
export async function uploadAvatar(userId: string, file: File): Promise<UploadResult> {
  try {
    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return {
        url: null,
        error: 'Invalid file type. Please use JPEG, PNG, or WebP.'
      };
    }

    // Validate file size
    if (file.size > MAX_AVATAR_SIZE) {
      return {
        url: null,
        error: 'File too large. Avatar must be less than 2MB.'
      };
    }

    // Upload path with upsert to overwrite
    const filePath = `${userId}/avatar.jpg`;

    console.log('📤 Uploading avatar:', filePath);

    const { data, error } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type
      });

    if (error) {
      console.error('❌ Avatar upload failed:', error);
      return {
        url: null,
        error: error.message
      };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(AVATAR_BUCKET)
      .getPublicUrl(filePath);

    console.log('✅ Avatar uploaded:', publicUrl);

    return {
      url: publicUrl,
      error: null
    };
  } catch (error: any) {
    console.error('❌ Avatar upload error:', error);
    return {
      url: null,
      error: error.message || 'Upload failed'
    };
  }
}

/**
 * Upload banner image to Supabase Storage
 * Path: banners/{userId}/banner.jpg
 * Always overwrites existing file
 */
export async function uploadBanner(userId: string, file: File): Promise<UploadResult> {
  try {
    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return {
        url: null,
        error: 'Invalid file type. Please use JPEG, PNG, or WebP.'
      };
    }

    // Validate file size
    if (file.size > MAX_BANNER_SIZE) {
      return {
        url: null,
        error: 'File too large. Banner must be less than 5MB.'
      };
    }

    // Upload path with upsert to overwrite
    const filePath = `${userId}/banner.jpg`;

    console.log('📤 Uploading banner:', filePath);

    const { data, error } = await supabase.storage
      .from(BANNER_BUCKET)
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type
      });

    if (error) {
      console.error('❌ Banner upload failed:', error);
      return {
        url: null,
        error: error.message
      };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(BANNER_BUCKET)
      .getPublicUrl(filePath);

    console.log('✅ Banner uploaded:', publicUrl);

    return {
      url: publicUrl,
      error: null
    };
  } catch (error: any) {
    console.error('❌ Banner upload error:', error);
    return {
      url: null,
      error: error.message || 'Upload failed'
    };
  }
}

/**
 * Delete avatar from storage (optional - for cleanup)
 */
export async function deleteAvatar(userId: string): Promise<{ error: string | null }> {
  const filePath = `${userId}/avatar.jpg`;
  
  const { error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .remove([filePath]);

  if (error) {
    console.error('❌ Failed to delete avatar:', error);
    return { error: error.message };
  }

  return { error: null };
}

/**
 * Delete banner from storage (optional - for cleanup)
 */
export async function deleteBanner(userId: string): Promise<{ error: string | null }> {
  const filePath = `${userId}/banner.jpg`;
  
  const { error } = await supabase.storage
    .from(BANNER_BUCKET)
    .remove([filePath]);

  if (error) {
    console.error('❌ Failed to delete banner:', error);
    return { error: error.message };
  }

  return { error: null };
}

/**
 * Upload prompt image to Supabase Storage
 * Path: prompt-images/{userId}/{uuid}.ext
 * Does NOT overwrite - uses unique UUID for each image
 */
export async function uploadPromptImage(userId: string, file: File): Promise<UploadResult> {
  const PROMPT_BUCKET = 'prompt-images';
  const MAX_SIZE = 3 * 1024 * 1024; // 3MB

  try {
    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return {
        url: null,
        error: 'Invalid file type. Please use JPEG, PNG, or WebP.'
      };
    }

    // Validate file size
    if (file.size > MAX_SIZE) {
      return {
        url: null,
        error: 'File too large. Image must be less than 3MB.'
      };
    }

    // Generate unique filename with UUID
    const fileExt = file.name.split('.').pop() || 'jpg';
    const uuid = crypto.randomUUID();
    const filePath = `${userId}/${uuid}.${fileExt}`;

    console.log('📤 Uploading prompt image:', filePath);

    const { data, error } = await supabase.storage
      .from(PROMPT_BUCKET)
      .upload(filePath, file, {
        upsert: false, // Do NOT overwrite
        contentType: file.type
      });

    if (error) {
      console.error('❌ Prompt image upload failed:', error);
      return {
        url: null,
        error: error.message
      };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(PROMPT_BUCKET)
      .getPublicUrl(filePath);

    console.log('✅ Prompt image uploaded:', publicUrl);

    return {
      url: publicUrl,
      error: null
    };
  } catch (error: any) {
    console.error('❌ Prompt image upload error:', error);
    return {
      url: null,
      error: error.message || 'Upload failed'
    };
  }
}

/**
 * Delete prompt image from storage (cleanup after failed DB insert)
 */
export async function deletePromptImage(imageUrl: string): Promise<{ error: string | null }> {
  const PROMPT_BUCKET = 'prompt-images';
  
  try {
    // Extract file path from public URL
    // URL format: https://.../storage/v1/object/public/prompt-images/{userId}/{uuid}.ext
    const urlParts = imageUrl.split('/prompt-images/');
    if (urlParts.length < 2) {
      return { error: 'Invalid image URL format' };
    }
    
    const filePath = urlParts[1];
    
    console.log('🗑️ Deleting prompt image:', filePath);
    
    const { error } = await supabase.storage
      .from(PROMPT_BUCKET)
      .remove([filePath]);

    if (error) {
      console.error('❌ Failed to delete prompt image:', error);
      return { error: error.message };
    }

    console.log('✅ Prompt image deleted');
    return { error: null };
  } catch (error: any) {
    console.error('❌ Delete prompt image error:', error);
    return { error: error.message || 'Delete failed' };
  }
}
