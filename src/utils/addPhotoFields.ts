import { supabase } from '@/integrations/supabase/client'

export async function addPhotoFieldsToCleaningTasks() {
  try {
    // This will be executed through the Supabase client
    // Note: This requires database admin privileges
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.cleaning_tasks 
        ADD COLUMN IF NOT EXISTS completion_photo_url text,
        ADD COLUMN IF NOT EXISTS completion_photo_uploaded_at timestamptz;
        
        COMMENT ON COLUMN public.cleaning_tasks.completion_photo_url IS 'URL of the completion photo uploaded by the cleaner';
        COMMENT ON COLUMN public.cleaning_tasks.completion_photo_uploaded_at IS 'Timestamp when the completion photo was uploaded';
        
        CREATE INDEX IF NOT EXISTS idx_cleaning_tasks_photo_uploaded_at 
        ON public.cleaning_tasks(completion_photo_uploaded_at);
      `
    })

    if (error) {
      console.error('Error adding photo fields:', error)
      return false
    }

    console.log('Photo fields added successfully')
    return true
  } catch (error) {
    console.error('Error:', error)
    return false
  }
}

// Run this function once to add the fields
// addPhotoFieldsToCleaningTasks()