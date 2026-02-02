begin;

alter table public.profiles
  add column if not exists avatar_url text,
  add column if not exists age int check (age is null or (age >= 0 and age <= 130)),
  add column if not exists allergies text;

commit;

