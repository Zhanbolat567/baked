-- Migration: Add delivery information fields to orders table
-- Date: 2024-11-08

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS delivery_type VARCHAR(50) DEFAULT 'pickup',
ADD COLUMN IF NOT EXISTS delivery_address TEXT,
ADD COLUMN IF NOT EXISTS delivery_apartment VARCHAR(20),
ADD COLUMN IF NOT EXISTS delivery_entrance VARCHAR(20),
ADD COLUMN IF NOT EXISTS delivery_floor VARCHAR(20),
ADD COLUMN IF NOT EXISTS delivery_latitude FLOAT,
ADD COLUMN IF NOT EXISTS delivery_longitude FLOAT;

-- Add comment to table
COMMENT ON COLUMN orders.delivery_type IS 'Type of delivery: delivery, pickup, or dine_in';
COMMENT ON COLUMN orders.delivery_address IS 'Full delivery address';
COMMENT ON COLUMN orders.delivery_apartment IS 'Apartment/flat number';
COMMENT ON COLUMN orders.delivery_entrance IS 'Building entrance number';
COMMENT ON COLUMN orders.delivery_floor IS 'Floor number';
COMMENT ON COLUMN orders.delivery_latitude IS 'GPS latitude coordinate';
COMMENT ON COLUMN orders.delivery_longitude IS 'GPS longitude coordinate';
