-- Add sports table to the existing database
USE db_sports_venue_rental;

-- Create sports table
CREATE TABLE IF NOT EXISTS sports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sport_name VARCHAR(100) NOT NULL UNIQUE,
    sport_type VARCHAR(100) NOT NULL, -- futsal, badminton, basketball, etc.
    description TEXT,
    is_available TINYINT(1) DEFAULT 1, -- 1 for available, 0 for not available
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert sample sports data
INSERT INTO sports (sport_name, sport_type, description, is_available) VALUES
('Futsal', 'futsal', 'Indoor soccer with 5 players per team', 1),
('Mini Soccer', 'mini-soccer', 'Small-sided soccer game', 1),
('Basketball', 'basketball', 'Court game with hoops', 1),
('Badminton', 'badminton', 'Racket sport played with shuttlecocks', 1);

-- Create fields table that can reference the sports
CREATE TABLE IF NOT EXISTS fields (
    id INT AUTO_INCREMENT PRIMARY KEY,
    field_name VARCHAR(255) NOT NULL,
    field_code VARCHAR(50) NOT NULL UNIQUE, -- like 'futsal-a', 'badminton-1'
    sport_id INT NOT NULL,
    price_per_hour DECIMAL(10, 2) NOT NULL,
    description TEXT,
    is_available TINYINT(1) DEFAULT 1, -- 1 for available, 0 for not available
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (sport_id) REFERENCES sports(id) ON DELETE CASCADE
);

-- Insert sample fields data that match the existing booking page
INSERT INTO fields (field_name, field_code, sport_id, price_per_hour, description, is_available) VALUES
('Futsal Field A', 'futsal-a', 1, 150000.00, 'Futsal field for team A', 1),
('Futsal Field B', 'futsal-b', 1, 160000.00, 'Futsal field for team B', 1),
('Futsal Field C (Premium)', 'futsal-c', 1, 180000.00, 'Premium futsal field', 1),
('Mini Soccer Field AA', 'minisoccer-aa', 2, 200000.00, 'Mini soccer field AA', 1),
('Mini Soccer Field BB', 'minisoccer-bb', 2, 220000.00, 'Mini soccer field BB', 1),
('Mini Soccer Field CC (Premium)', 'minisoccer-cc', 2, 250000.00, 'Premium mini soccer field', 1),
('Basketball Court 1', 'basket-1', 3, 120000.00, 'Basketball court 1', 1),
('Basketball Court 2', 'basket-2', 3, 130000.00, 'Basketball court 2', 1),
('Basketball Court 3 (Indoor)', 'basket-3', 3, 150000.00, 'Premium indoor basketball court', 1),
('Badminton Court 1', 'badminton-1', 4, 80000.00, 'Badminton court 1', 1),
('Badminton Court 2', 'badminton-2', 4, 85000.00, 'Badminton court 2', 1),
('Badminton Court 3 (Premium)', 'badminton-3', 4, 100000.00, 'Premium badminton court', 1),
('Badminton Court 4 (Premium)', 'badminton-4', 4, 100000.00, 'Premium badminton court 4', 1);