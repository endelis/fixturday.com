-- 009_organizer_contact.sql
-- Add organizer contact fields to tournaments table

ALTER TABLE tournaments
  ADD COLUMN IF NOT EXISTS organizer_email text,
  ADD COLUMN IF NOT EXISTS organizer_phone text;
