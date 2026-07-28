-- Run this once against your PostgreSQL database
-- to add the status column to existing users
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS status
  VARCHAR(20) NOT NULL DEFAULT 'approved';
