create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    'user_' || left(replace(new.id::text, '-', ''), 12)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
