ALTER TABLE age_groups
ADD COLUMN IF NOT EXISTS auto_approve boolean NOT NULL DEFAULT false;
