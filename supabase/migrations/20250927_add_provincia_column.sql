-- Add provincia column to properties table
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS provincia TEXT;