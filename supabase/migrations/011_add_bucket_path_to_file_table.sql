-- Add bucket column to store which Supabase storage bucket the file is in
ALTER TABLE file ADD COLUMN bucket VARCHAR(100);

-- Add path column to store the full path/key of the file within the bucket
ALTER TABLE file ADD COLUMN path TEXT;

-- Add original_name column to preserve the original filename
ALTER TABLE file ADD COLUMN original_name VARCHAR(255);

-- Add indexes for performance
CREATE INDEX idx_file_bucket ON file(bucket);
CREATE INDEX idx_file_path ON file(path);