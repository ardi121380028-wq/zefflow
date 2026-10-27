-- =====================================================================
-- RLS + trigger + RPC untuk Laneflow.
-- Jalankan SETELAH `npm run db:migrate` (Supabase SQL editor / psql).
-- Idempotent: aman dijalankan ulang.
-- =====================================================================

-- ---------- Helper (SECURITY DEFINER agar tidak rekursif di RLS) ----------
create or replace function public.is_workspace_member(ws uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from memberships m where m.workspace_id = ws and m.user_id = auth.uid());
$$;

create or replace function public.has_workspace_role(ws uuid, roles member_role[])
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from memberships m
    where m.workspace_id = ws and m.user_id = auth.uid() and m.role = any(roles)
  );
$$;

-- ---------- Aktifkan RLS ----------
alter table profiles    enable row level security;
alter table workspaces  enable row level security;
alter table memberships enable row level security;
alter table flows       enable row level security;

-- ---------- profiles ----------
drop policy if exists profiles_select on profiles;
create policy profiles_select on profiles for select to authenticated
  using (
    id = auth.uid()
    or exists (  -- boleh melihat rekan satu workspace
      select 1 from memberships a join memberships b on a.workspace_id = b.workspace_id
      where a.user_id = auth.uid() and b.user_id = profiles.id
    )
  );
drop policy if exists profiles_update on profiles;
create policy profiles_update on profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- ---------- workspaces ----------
drop policy if exists ws_select on workspaces;
create policy ws_select on workspaces for select to authenticated
  using (is_workspace_member(id));
drop policy if exists ws_update on workspaces;
create policy ws_update on workspaces for update to authenticated
  using (has_workspace_role(id, array['owner','admin']::member_role[]));
drop policy if exists ws_delete on workspaces;
create policy ws_delete on workspaces for delete to authenticated
  using (has_workspace_role(id, array['owner']::member_role[]));
-- INSERT sengaja tidak ada: workspace dibuat via trigger signup / fungsi create_workspace().

-- ---------- memberships ----------
drop policy if exists mem_select on memberships;
create policy mem_select on memberships for select to authenticated
  using (is_workspace_member(workspace_id));
drop policy if exists mem_manage on memberships;
create policy mem_manage on memberships for all to authenticated
  using (has_workspace_role(workspace_id, array['owner','admin']::member_role[]))
  with check (has_workspace_role(workspace_id, array['owner','admin']::member_role[]));

-- ---------- flows ----------
drop policy if exists flows_select on flows;
create policy flows_select on flows for select to authenticated
  using (is_workspace_member(workspace_id));
drop policy if exists flows_insert on flows;
create policy flows_insert on flows for insert to authenticated
  with check (has_workspace_role(workspace_id, array['owner','admin','editor']::member_role[]));
drop policy if exists flows_update on flows;
create policy flows_update on flows for update to authenticated
  using (has_workspace_role(workspace_id, array['owner','admin','editor']::member_role[]))
  with check (has_workspace_role(workspace_id, array['owner','admin','editor']::member_role[]));
drop policy if exists flows_delete on flows;
create policy flows_delete on flows for delete to authenticated
  using (has_workspace_role(workspace_id, array['owner','admin']::member_role[]));

-- ---------- Signup: profil + workspace pribadi otomatis ----------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare ws_id uuid;
begin
  insert into profiles (id, email, full_name, avatar_url)
  values (new.id, new.email,
          coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
          new.raw_user_meta_data->>'avatar_url');

  insert into workspaces (name, slug, created_by)
  values (coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)) || '''s Workspace',
          lower(regexp_replace(split_part(new.email, '@', 1), '[^a-z0-9]+', '-', 'gi')) || '-' || substr(gen_random_uuid()::text, 1, 6),
          new.id)
  returning id into ws_id;

  insert into memberships (workspace_id, user_id, role) values (ws_id, new.id, 'owner');
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- updated_at otomatis ----------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end $$;
drop trigger if exists flows_touch on flows;
create trigger flows_touch before update on flows for each row execute function public.touch_updated_at();

-- ---------- Link view-only publik (anon) ----------
-- Anon TIDAK punya akses SELECT ke tabel; hanya bisa memanggil fungsi ini
-- dan hanya mendapat baris yang token-nya valid & berbagi sedang aktif.
create or replace function public.get_shared_flow(p_token text)
returns table (id uuid, title text, description text, kind flow_kind, document jsonb, updated_at timestamptz)
language sql stable security definer set search_path = public as $$
  select f.id, f.title, f.description, f.kind, f.document, f.updated_at
  from flows f where f.share_token = p_token and f.share_enabled = true;
$$;
revoke all on function public.get_shared_flow(text) from public;
grant execute on function public.get_shared_flow(text) to anon, authenticated;

-- Grants dasar untuk role authenticated (RLS yang membatasi baris)
grant usage on schema public to authenticated, anon;
grant select, insert, update, delete on profiles, workspaces, memberships, flows to authenticated;
