alter table age_groups
  add column if not exists consolation_bracket boolean not null default false;
