-- Migration: add avatar_url column to users
-- Usage: Get-Content add_user_avatar.sql | docker exec -i social_db psql -U social_user -d social_db

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS avatar_url TEXT;
