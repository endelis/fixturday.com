-- game_duration_minutes was NOT NULL DEFAULT 20 (003_scheduler_fields.sql).
-- pitch_gap_minutes was added without NOT NULL so it is already nullable — no change needed.
ALTER TABLE age_groups ALTER COLUMN game_duration_minutes DROP NOT NULL;
