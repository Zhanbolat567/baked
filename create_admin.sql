INSERT INTO users (first_name, last_name, phone_number, password_hash, role, is_active, bonus_points, created_at) 
VALUES ('Admin', 'User', '+77771234567', '$2b$12$9emVNqdBvnOhTE2ds9W0zu3MHkJi031L8MPBtX2KjZ8ynZdhxbtjS', 'ADMIN', true, 0, NOW())
ON CONFLICT (phone_number) DO UPDATE SET password_hash = '$2b$12$9emVNqdBvnOhTE2ds9W0zu3MHkJi031L8MPBtX2KjZ8ynZdhxbtjS', role = 'ADMIN';
