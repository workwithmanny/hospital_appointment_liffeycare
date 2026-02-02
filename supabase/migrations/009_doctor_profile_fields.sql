begin;

alter table public.profiles
  add column if not exists hospital text,
  add column if not exists certification text,
  add column if not exists gender text check (gender is null or gender in ('male','female','other','prefer_not_say'));

commit;

