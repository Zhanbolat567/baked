-- Migration: create pickup_locations table
-- Usage: Get-Content add_pickup_locations.sql | docker exec -i social_db psql -U social_user -d social_db

CREATE TABLE IF NOT EXISTS pickup_locations (
    id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    address TEXT NOT NULL,
    working_hours VARCHAR(100) NOT NULL,
    phone VARCHAR(30),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pickup_locations_is_active
    ON pickup_locations (is_active);

CREATE INDEX IF NOT EXISTS idx_pickup_locations_display_order
    ON pickup_locations (display_order);
