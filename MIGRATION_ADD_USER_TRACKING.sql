-- =====================================================
-- Database Migration: Add User Tracking to Seats Table
-- =====================================================
-- Purpose: Enable the authenticated booking system to track which user booked each seat
-- Database: PostgreSQL
-- =====================================================

-- =====================================================
-- Step 1: Add user_id column
-- =====================================================
-- Stores the user ID (from users table) who booked the seat
-- NULL means seat is not booked

ALTER TABLE seats ADD COLUMN user_id INT;

-- =====================================================
-- Step 2: Add booked_at timestamp column
-- =====================================================
-- Stores when the seat was booked
-- NULL means seat is not booked

ALTER TABLE seats ADD COLUMN booked_at TIMESTAMP;

-- =====================================================
-- Step 3 (OPTIONAL): Add foreign key constraint
-- =====================================================
-- Creates a relationship to the users table
-- Ensures user_id always references a valid user
-- Set to ON DELETE SET NULL: if user is deleted, booking remains but user_id becomes NULL
-- Uncomment if you have a users table

-- ALTER TABLE seats ADD CONSTRAINT fk_seats_user_id 
--     FOREIGN KEY (user_id) REFERENCES users(id) 
--     ON DELETE SET NULL;

-- =====================================================
-- Step 4 (OPTIONAL): Create indexes for performance
-- =====================================================
-- Index on user_id for fast queries like "show me all seats booked by user X"

CREATE INDEX idx_seats_user_id ON seats(user_id);

-- Index on booked_at for time-range queries

CREATE INDEX idx_seats_booked_at ON seats(booked_at);

-- Composite index for fetching user's bookings with timestamps

CREATE INDEX idx_seats_user_booking ON seats(user_id, booked_at);

-- =====================================================
-- Migration Complete
-- =====================================================
-- The seats table now has:
-- - user_id: Tracks which user booked the seat
-- - booked_at: Tracks when the seat was booked
--
-- The authenticated booking endpoint will now:
-- 1. Accept requests from authenticated users
-- 2. Store the user_id when a seat is booked
-- 3. Record the timestamp of the booking
--
-- Queries you can now run:
-- - Find all seats booked by a specific user:
--   SELECT * FROM seats WHERE user_id = 42;
--
-- - Find all bookings made in the last 24 hours:
--   SELECT * FROM seats WHERE booked_at > NOW() - INTERVAL '1 day';
--
-- - Count bookings per user:
--   SELECT user_id, COUNT(*) as bookings FROM seats WHERE user_id IS NOT NULL GROUP BY user_id;
-- =====================================================
