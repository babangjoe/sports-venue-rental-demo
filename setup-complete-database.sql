-- Complete Database Setup for Sports Venue Rental System

-- Create sports table
CREATE TABLE IF NOT EXISTS sports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sport_name VARCHAR(100) NOT NULL,
    sport_type VARCHAR(50) NOT NULL,
    description TEXT,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create fields table
CREATE TABLE IF NOT EXISTS fields (
    id INT AUTO_INCREMENT PRIMARY KEY,
    field_name VARCHAR(100) NOT NULL,
    field_code VARCHAR(50) UNIQUE NOT NULL,
    sport_id INT NOT NULL,
    price_per_hour DECIMAL(10, 2) NOT NULL,
    description TEXT,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (sport_id) REFERENCES sports(id) ON DELETE CASCADE
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    field_id VARCHAR(50) NOT NULL,
    field_name VARCHAR(100) NOT NULL,
    booking_date DATE NOT NULL,
    time_slots JSON NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_email VARCHAR(100) NOT NULL,
    booking_status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert sample sports data
INSERT IGNORE INTO sports (sport_name, sport_type, description) VALUES
('Futsal', 'Indoor', 'Mini soccer game played on a hard court'),
('Badminton', 'Indoor', 'Racquet sport played using racquets to hit a shuttlecock'),
('Basketball', 'Indoor', 'Team sport played with a basketball'),
('Mini Soccer', 'Outdoor', 'Smaller version of soccer played on a smaller field'),
('Volleyball', 'Indoor', 'Team sport played with a volleyball');

-- Insert sample fields data
INSERT IGNORE INTO fields (field_name, field_code, sport_id, price_per_hour, description) VALUES
('Futsal Court A', 'FTA001', 1, 150000.00, 'Premium indoor futsal court with quality flooring'),
('Futsal Court B', 'FTB001', 1, 120000.00, 'Standard indoor futsal court'),
('Badminton Court 1', 'BD001', 2, 80000.00, 'Professional badminton court with proper lighting'),
('Badminton Court 2', 'BD002', 2, 80000.00, 'Professional badminton court with proper lighting'),
('Basketball Court', 'BB001', 3, 200000.00, 'Full-size basketball court with hoops'),
('Mini Soccer Field', 'MSF001', 4, 180000.00, 'Outdoor mini soccer field with grass'),
('Volleyball Court', 'VB001', 5, 100000.00, 'Indoor volleyball court with net');

-- Insert sample bookings data
INSERT IGNORE INTO bookings (field_id, field_name, booking_date, time_slots, total_price, customer_name, customer_phone, customer_email, booking_status) VALUES
('FTA001', 'Futsal Court A', '2024-01-15', JSON_ARRAY('18:00-19:00', '19:00-20:00'), 300000.00, 'John Doe', '08123456789', 'john@example.com', 'confirmed'),
('BD001', 'Badminton Court 1', '2024-01-16', JSON_ARRAY('10:00-11:00'), 80000.00, 'Jane Smith', '08234567890', 'jane@example.com', 'confirmed'),
('BB001', 'Basketball Court', '2024-01-17', JSON_ARRAY('16:00-18:00'), 400000.00, 'Mike Johnson', '08345678901', 'mike@example.com', 'pending'),
('MSF001', 'Mini Soccer Field', '2024-01-18', JSON_ARRAY('08:00-10:00'), 360000.00, 'Sarah Wilson', '08456789012', 'sarah@example.com', 'completed'),
('FTA001', 'Futsal Court A', '2024-01-19', JSON_ARRAY('20:00-22:00'), 300000.00, 'Tom Brown', '08567890123', 'tom@example.com', 'cancelled');