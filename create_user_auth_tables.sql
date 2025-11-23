-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default roles
INSERT INTO roles (role_name, description) VALUES
('admin', 'Can access admin menu except Dashboard'),
('owner', 'Can access all admin menus including Dashboard');

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_id INT,
    full_name VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- Insert default admin user (password: admin123)
INSERT INTO users (username, email, password_hash, role_id, full_name) VALUES
('admin', 'admin@sportarena.com', '$2b$10$fTHANeq8SFVDKY4P6cUomepp8ujoDIXXuEuAZYcYRd7FVdn3CsEDG', 1, 'Administrator Admin'),
('owner', 'owner@sportarena.com', '$2b$10$0D4mWpHoHJ.rlzV/yNYKceUnK5LklzXgrVVNcSY3zL8DiR415lk2S', 2, 'System Owner');