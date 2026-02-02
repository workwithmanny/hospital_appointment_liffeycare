begin;

alter table public.profiles
  add column if not exists rating numeric(2,1) check (rating is null or (rating >= 0 and rating <= 5)),
  add column if not exists reviews_count int check (reviews_count is null or reviews_count >= 0);

commit;

