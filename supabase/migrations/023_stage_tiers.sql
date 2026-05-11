alter table stages add column if not exists parent_stage_id uuid
  references stages(id) on delete set null;
alter table stages add column if not exists bracket_label text;
alter table stages add column if not exists tier int default 0;
