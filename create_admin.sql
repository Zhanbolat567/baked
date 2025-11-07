INSERT INTO users (first_name, last_name, phone_number, password_hash, role, is_active, bonus_points, created_at) 
VALUES ('Admin', 'User', '+77771234567', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqNqLqKvzu', 'ADMIN', true, 0, NOW())
ON CONFLICT (phone_number) DO UPDATE SET role = 'ADMIN';
