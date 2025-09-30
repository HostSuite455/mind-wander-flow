-- Add photo fields to cleaning_tasks table
ALTER TABLE public.cleaning_tasks 
ADD COLUMN IF NOT EXISTS completion_photo_url text,
ADD COLUMN IF NOT EXISTS completion_photo_uploaded_at timestamptz;

-- Add comments for documentation
COMMENT ON COLUMN public.cleaning_tasks.completion_photo_url IS 'URL of the completion photo uploaded by the cleaner';
COMMENT ON COLUMN public.cleaning_tasks.completion_photo_uploaded_at IS 'Timestamp when the completion photo was uploaded';

-- Create index for faster queries on photo upload timestamp
CREATE INDEX IF NOT EXISTS idx_cleaning_tasks_photo_uploaded_at 
ON public.cleaning_tasks(completion_photo_uploaded_at);