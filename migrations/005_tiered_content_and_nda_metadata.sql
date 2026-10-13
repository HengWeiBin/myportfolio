-- Migration 005: Tiered Content, NDA Case Studies, and Extended Metadata

-- 1. Extend projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS visual_type TEXT DEFAULT 'image',
ADD COLUMN IF NOT EXISTS is_confidential BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS repo_visibility TEXT DEFAULT 'public',
ADD COLUMN IF NOT EXISTS metrics JSONB DEFAULT '{}'::jsonb;

UPDATE projects SET tier = 'standard' WHERE tier IS NULL;
UPDATE projects SET sort_order = 0 WHERE sort_order IS NULL;
UPDATE projects SET visual_type = 'image' WHERE visual_type IS NULL;
UPDATE projects SET is_confidential = FALSE WHERE is_confidential IS NULL;
UPDATE projects SET repo_visibility = 'public' WHERE repo_visibility IS NULL;
UPDATE projects SET metrics = '{}'::jsonb WHERE metrics IS NULL;

-- 2. Extend certificates table
ALTER TABLE certificates 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Certificate',
ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

UPDATE certificates SET category = 'Certificate' WHERE category IS NULL;
UPDATE certificates SET tier = 'standard' WHERE tier IS NULL;
UPDATE certificates SET sort_order = 0 WHERE sort_order IS NULL;

-- 3. Extend experience table
ALTER TABLE experience 
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

UPDATE experience SET sort_order = 0 WHERE sort_order IS NULL;
