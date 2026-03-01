-- Add is_enabled column to profiles table
-- Allows admins to disable user accounts
ALTER TABLE profiles ADD COLUMN is_enabled BOOLEAN NOT NULL DEFAULT true;
