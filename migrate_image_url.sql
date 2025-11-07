-- Migration: Change image_url column type from VARCHAR(255) to TEXT
-- This allows storing base64 encoded images which can be very long

ALTER TABLE products 
ALTER COLUMN image_url TYPE TEXT;

-- Verify the change
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'products' AND column_name = 'image_url';
