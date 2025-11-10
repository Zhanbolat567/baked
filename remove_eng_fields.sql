-- Remove English language fields from all tables

-- Categories table
ALTER TABLE categories DROP COLUMN IF EXISTS name_eng;

-- Products table
ALTER TABLE products DROP COLUMN IF EXISTS name_eng;
ALTER TABLE products DROP COLUMN IF EXISTS description_eng;

-- Option groups table
ALTER TABLE option_groups DROP COLUMN IF EXISTS name_eng;

-- Options table
ALTER TABLE options DROP COLUMN IF EXISTS name_eng;
