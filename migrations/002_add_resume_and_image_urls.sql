-- Migration 002: Add Resume and Image URLs

ALTER TABLE profile 
ADD COLUMN IF NOT EXISTS resume_link TEXT;

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS image_url TEXT;

ALTER TABLE certificates 
ADD COLUMN IF NOT EXISTS image_url TEXT;
