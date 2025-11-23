-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS db_sports_venue_rental;

-- Use the database
USE db_sports_venue_rental;

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    field_id VARCHAR(50) NOT NULL,
    field_name VARCHAR(255) NOT NULL,
    booking_date DATE NOT NULL,
    time_slots JSON NOT NULL, -- Store time slots as JSON array
    total_price DECIMAL(10, 2) NOT NULL,
    customer_name VARCHAR(255),
    customer_phone VARCHAR(20),
    customer_email VARCHAR(255),
    booking_status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Optional: Create an index on booking_date and field_id for faster queries
CREATE INDEX idx_booking_date_field ON bookings (booking_date, field_id);

-- Insert sample data (optional)
INSERT INTO bookings (field_id, field_name, booking_date, time_slots, total_price, customer_name, customer_phone, customer_email, booking_status) VALUES
('futsal-a', 'Futsal Field A', '2024-10-15', '["08:00", "09:00"]', 300000.00, 'John Doe', '081234567890', 'john@example.com', 'confirmed'),
('basketball-1', 'Basketball Court 1', '2024-10-16', '["10:00", "11:00", "12:00"]', 360000.00, 'Jane Smith', '082345678901', 'jane@example.com', 'confirmed');