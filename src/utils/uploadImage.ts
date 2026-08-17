import { supabase } from '../lib/supabase'; // Adjust to your Supabase client path

export async function uploadExperienceImage(file: File): Promise<string> {
  // Generate a unique file path to prevent overwriting existing files
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
  const filePath = `uploads/${fileName}`;

  // Upload file to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('experience-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  // Get and return the public URL
  const { data } = supabase.storage
    .from('experience-images')
    .getPublicUrl(filePath);

  return data.publicUrl;
}