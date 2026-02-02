begin;

-- Convert allergies from text -> text[] for multi-allergy UI.
-- Existing values like "penicillin, peanuts" become {"penicillin","peanuts"}.
alter table public.profiles
  alter column allergies type text[]
  using (
    case
      when allergies is null then null
      when btrim(allergies) = '' then null
      else regexp_split_to_array(allergies, '\s*,\s*')
    end
  );

commit;

