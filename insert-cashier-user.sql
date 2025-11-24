-- Insert Cashier User
-- Assumes role 'cashier' has been created (usually has ID 3 if created sequentially after roles in setup-supabase.sql)
-- If you are unsure about the role_id, you can look it up: (SELECT id FROM roles WHERE role_name = 'cashier')

INSERT INTO users (username, email, password_hash, role_id, full_name, is_active)
VALUES (
    'kasir', 
    'kasir@sportarena.com', 
    '$2b$10$u6mtx7OCtTTF7p64rEVkpux8CKAugA3HBvD7RsywHFwV9y61fOLWK', 
    (SELECT id FROM roles WHERE role_name = 'cashier'), 
    'Staff Kasir', 
    1
);
