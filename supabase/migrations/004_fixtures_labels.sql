-- Migration: 004_fixtures_labels
-- Project: fixturday.com
-- Created: 2026-04-01
-- Description: Add group_label and round_name columns to fixtures table

BEGIN;

ALTER TABLE fixtures ADD COLUMN IF NOT EXISTS group_label TEXT DEFAULT NULL;
ALTER TABLE fixtures ADD COLUMN IF NOT EXISTS round_name  TEXT DEFAULT NULL;

COMMIT;
