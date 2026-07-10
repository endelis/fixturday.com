-- Double round-robin support: number of circles for plain round-robin age groups.
-- 1 = every team plays every other team once (default)
-- 2 = every team plays every other team twice (home/away reversed second pass)
ALTER TABLE age_groups ADD COLUMN IF NOT EXISTS rr_circles integer DEFAULT 1;
