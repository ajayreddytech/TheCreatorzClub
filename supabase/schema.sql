create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  log_date date not null,
  wake_up_time time not null,
  routine_completed boolean not null default false,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint daily_logs_user_date_unique unique (user_id, log_date)
);

create table if not exists public.routine_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  position integer not null default 0,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.daily_routine_checks (
  user_id uuid not null references auth.users on delete cascade,
  task_id uuid not null references public.routine_tasks on delete cascade,
  log_date date not null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  primary key (user_id, task_id, log_date)
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is not null then
    insert into public.profiles (id, email)
    values (new.id, new.email)
    on conflict (id) do update set email = excluded.email;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.daily_logs enable row level security;
alter table public.routine_tasks enable row level security;
alter table public.daily_routine_checks enable row level security;

drop policy if exists "Users can manage their own profile" on public.profiles;
create policy "Users can manage their own profile"
  on public.profiles
  for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Users can manage their own daily logs" on public.daily_logs;
create policy "Users can manage their own daily logs"
  on public.daily_logs
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can manage their own routine tasks" on public.routine_tasks;
create policy "Users can manage their own routine tasks"
  on public.routine_tasks
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can manage their own routine checks" on public.daily_routine_checks;
create policy "Users can manage their own routine checks"
  on public.daily_routine_checks
  for all
  using (
    auth.uid() = user_id
    and exists (
      select 1 from public.routine_tasks
      where routine_tasks.id = daily_routine_checks.task_id
        and routine_tasks.user_id = auth.uid()
    )
  )
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.routine_tasks
      where routine_tasks.id = daily_routine_checks.task_id
        and routine_tasks.user_id = auth.uid()
    )
  );
