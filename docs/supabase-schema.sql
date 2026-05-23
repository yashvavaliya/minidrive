create table if not exists profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  display_name text,
  email text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists folders (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  parent_id uuid references folders(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamp with time zone default now() not null
);

create table if not exists videos (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  folder_id uuid references folders(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  bunny_video_id text,
  bunny_embed_url text,
  status text default 'uploading' not null check (status in ('uploading', 'processing', 'success', 'failed')),
  created_at timestamp with time zone default now() not null
);

alter table folders enable row level security;
alter table videos enable row level security;
alter table profiles enable row level security;

drop policy if exists "Users can CRUD own folders" on folders;
drop policy if exists "Users can CRUD own videos" on videos;
drop policy if exists "Profiles are readable" on profiles;
drop policy if exists "Users can update own profile" on profiles;

create policy "Users can CRUD own folders"
on folders
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can CRUD own videos"
on videos
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Profiles are readable"
on profiles
for select
using (true);

create policy "Users can update own profile"
on profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name'),
    new.email
  )
  on conflict (id) do update
  set
    display_name = excluded.display_name,
    email = excluded.email;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

insert into public.profiles (id, display_name, email)
select
  id,
  coalesce(raw_user_meta_data->>'display_name', raw_user_meta_data->>'full_name'),
  email
from auth.users
on conflict (id) do update
set
  display_name = excluded.display_name,
  email = excluded.email;

create index if not exists profiles_email_idx on profiles(email);
create index if not exists folders_user_parent_idx on folders(user_id, parent_id);
create index if not exists videos_user_folder_idx on videos(user_id, folder_id);
create index if not exists videos_bunny_video_id_idx on videos(bunny_video_id);
