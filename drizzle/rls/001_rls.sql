-- =====================================================================
-- RLS + trigger + RPC + indeks performa tinggi untuk Zefflow / Laneflow.
-- Jalankan SETELAH `npm run db:migrate` (Supabase SQL editor / psql).
-- Idempotent: aman dijalankan ulang untuk skala ribuan pengguna.
-- =====================================================================

-- ---------- Indeks Performa Skala Besar ----------
create index if not exists profiles_email_lower_idx
  on public.profiles (lower(email));

create index if not exists memberships_ws_created_idx
  on public.memberships (workspace_id, created_at desc);

create index if not exists flows_ws_active_updated_idx
  on public.flows (workspace_id, updated_at desc)
  where status <> 'archived';

-- ---------- Helper (SECURITY DEFINER + InitPlan `(select auth.uid())`) ----------
create or replace function public.is_workspace_member(ws uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from memberships m
    where m.workspace_id = ws and m.user_id = (select auth.uid())
  );
$$;

create or replace function public.has_workspace_role(ws uuid, roles member_role[])
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from memberships m
    where m.workspace_id = ws and m.user_id = (select auth.uid()) and m.role = any(roles)
  );
$$;

-- Non-recursive rekan satu workspace (mencegah evaluasi RLS bersarang pada tabel memberships)
create or replace function public.shares_workspace_with(target_user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from memberships a
    inner join memberships b on a.workspace_id = b.workspace_id
    where a.user_id = (select auth.uid()) and b.user_id = target_user
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
    id = (select auth.uid())
    or shares_workspace_with(id)
  );
drop policy if exists profiles_update on profiles;
create policy profiles_update on profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- ---------- workspaces ----------
drop policy if exists ws_select on workspaces;
create policy ws_select on workspaces for select to authenticated
  using (is_workspace_member(id));
drop policy if exists ws_insert on workspaces;
create policy ws_insert on workspaces for insert to authenticated
  with check (created_by = (select auth.uid()));
drop policy if exists ws_update on workspaces;
create policy ws_update on workspaces for update to authenticated
  using (has_workspace_role(id, array['owner','admin']::member_role[]));
drop policy if exists ws_delete on workspaces;
create policy ws_delete on workspaces for delete to authenticated
  using (has_workspace_role(id, array['owner']::member_role[]));

-- ---------- memberships ----------
drop policy if exists mem_select on memberships;
create policy mem_select on memberships for select to authenticated
  using (is_workspace_member(workspace_id));
drop policy if exists mem_insert_owner on memberships;
create policy mem_insert_owner on memberships for insert to authenticated
  with check (user_id = (select auth.uid()) and role = 'owner'::member_role);
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
          new.raw_user_meta_data->>'avatar_url')
  on conflict (id) do nothing;

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

-- ---------- Undang anggota via email (1 round-trip aman & cepat) ----------
create or replace function public.invite_workspace_member_by_email(
  p_workspace_id uuid,
  p_email text,
  p_role member_role
)
returns table (target_user_id uuid, added boolean)
language plpgsql security definer set search_path = public as $$
declare
  v_target uuid;
begin
  if not public.has_workspace_role(p_workspace_id, array['owner','admin']::member_role[]) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  if p_role = 'owner'::member_role then
    raise exception 'INVALID_ROLE' using errcode = '22023';
  end if;

  select p.id into v_target
  from public.profiles p
  where lower(p.email) = lower(trim(p_email))
  limit 1;

  if v_target is null then
    return query select null::uuid, false;
    return;
  end if;

  insert into public.memberships (workspace_id, user_id, role)
  values (p_workspace_id, v_target, p_role)
  on conflict (workspace_id, user_id)
  do update set role = excluded.role
  where public.memberships.role <> 'owner'::member_role;

  return query select v_target, true;
end $$;
revoke all on function public.invite_workspace_member_by_email(uuid, text, member_role) from public;
grant execute on function public.invite_workspace_member_by_email(uuid, text, member_role) to authenticated;

-- ---------- Link view-only publik (anon) ----------
create or replace function public.get_shared_flow(p_token text)
returns table (id uuid, title text, description text, kind flow_kind, document jsonb, updated_at timestamptz)
language sql stable security definer set search_path = public as $$
  select f.id, f.title, f.description, f.kind, f.document, f.updated_at
  from flows f where f.share_token = p_token and f.share_enabled = true;
$$;
revoke all on function public.get_shared_flow(text) from public;
grant execute on function public.get_shared_flow(text) to anon, authenticated;

-- =====================================================================
-- SERVER-SIDE 1-ROUNDTRIP FAST RPCs (HANYA ROLE `postgres` BACKEND!)
-- Memangkas 4–8 round-trip transaksi `BEGIN / set_config / SQL / COMMIT`
-- menjadi 1 round-trip tunggal (~6x–12x lebih cepat) dengan tetap
-- memvalidasi keanggotaan & peran RBAC langsung di dalam PostgreSQL!
-- =====================================================================

-- 1. Ambil profil + seluruh workspace user + daftar kartu flow workspace aktif dalam 1 RTT tunggal!
drop function if exists public.zf_get_workspace_context(uuid, text, text, text);
create or replace function public.zf_get_workspace_context(
  p_user_id uuid,
  p_preferred_ws_id uuid default null,
  p_email text default null,
  p_full_name text default null,
  p_avatar_url text default null
)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_profile jsonb;
  v_workspaces jsonb;
  v_flows jsonb;
  v_active_ws_id uuid;
  v_new_ws_id uuid;
  v_safe_email text;
  v_safe_name text;
begin
  select jsonb_agg(
    jsonb_build_object(
      'id', w.id,
      'name', w.name,
      'slug', w.slug,
      'plan', w.plan,
      'createdBy', w.created_by,
      'createdAt', w.created_at,
      'updatedAt', w.updated_at,
      'role', m.role
    ) order by w.created_at asc
  )
  into v_workspaces
  from public.memberships m
  inner join public.workspaces w on w.id = m.workspace_id
  where m.user_id = p_user_id;

  if v_workspaces is null or jsonb_array_length(v_workspaces) = 0 then
    v_safe_email := coalesce(nullif(trim(p_email), ''), 'user@zefflow.app');
    v_safe_name := coalesce(nullif(trim(p_full_name), ''), split_part(v_safe_email, '@', 1), 'User');

    insert into public.profiles (id, email, full_name, avatar_url)
    values (p_user_id, v_safe_email, v_safe_name, p_avatar_url)
    on conflict (id) do nothing;

    insert into public.workspaces (name, slug, created_by)
    values (
      v_safe_name || '''s Workspace',
      lower(regexp_replace(split_part(v_safe_email, '@', 1), '[^a-z0-9]+', '-', 'gi')) || '-' || substr(gen_random_uuid()::text, 1, 6),
      p_user_id
    )
    returning id into v_new_ws_id;

    insert into public.memberships (workspace_id, user_id, role)
    values (v_new_ws_id, p_user_id, 'owner');

    select jsonb_agg(
      jsonb_build_object(
        'id', w.id,
        'name', w.name,
        'slug', w.slug,
        'plan', w.plan,
        'createdBy', w.created_by,
        'createdAt', w.created_at,
        'updatedAt', w.updated_at,
        'role', m.role
      )
    )
    into v_workspaces
    from public.memberships m
    inner join public.workspaces w on w.id = m.workspace_id
    where m.user_id = p_user_id;
  end if;

  if p_preferred_ws_id is not null then
    select m.workspace_id into v_active_ws_id
    from public.memberships m
    where m.user_id = p_user_id and m.workspace_id = p_preferred_ws_id
    limit 1;
  end if;

  if v_active_ws_id is null then
    v_active_ws_id := (v_workspaces->0->>'id')::uuid;
  end if;

  if v_active_ws_id is not null then
    select jsonb_agg(
      jsonb_build_object(
        'id', s.id,
        'title', s.title,
        'description', s.description,
        'kind', s.kind,
        'status', s.status,
        'updatedAt', s.updated_at,
        'shareEnabled', s.share_enabled
      )
    )
    into v_flows
    from (
      select f.id, f.title, f.description, f.kind, f.status, f.updated_at, f.share_enabled
      from public.flows f
      where f.workspace_id = v_active_ws_id
        and f.status <> 'archived'::flow_status
      order by f.updated_at desc
      limit 200
    ) s;
  end if;

  select jsonb_build_object(
    'id', p.id,
    'email', p.email,
    'fullName', p.full_name,
    'avatarUrl', p.avatar_url,
    'createdAt', p.created_at,
    'updatedAt', p.updated_at
  )
  into v_profile
  from public.profiles p
  where p.id = p_user_id
  limit 1;

  return jsonb_build_object(
    'profile', v_profile,
    'workspaces', coalesce(v_workspaces, '[]'::jsonb),
    'flowsWorkspaceId', v_active_ws_id,
    'flows', coalesce(v_flows, '[]'::jsonb)
  );
end $$;
revoke all on function public.zf_get_workspace_context(uuid, uuid, text, text, text) from public, anon, authenticated;

-- 2. Ambil daftar kartu flow di workspace (1 RTT dengan cek keanggotaan)
create or replace function public.zf_list_workspace_flows(
  p_user_id uuid,
  p_workspace_id uuid,
  p_status flow_status default null,
  p_limit int default 200
)
returns table (
  id uuid,
  title text,
  description text,
  kind flow_kind,
  status flow_status,
  updated_at timestamptz,
  share_enabled boolean
)
language sql stable security definer set search_path = public as $$
  select f.id, f.title, f.description, f.kind, f.status, f.updated_at, f.share_enabled
  from public.flows f
  where f.workspace_id = p_workspace_id
    and exists (
      select 1 from public.memberships m
      where m.workspace_id = p_workspace_id and m.user_id = p_user_id
    )
    and (
      case
        when p_status is not null then f.status = p_status
        else f.status <> 'archived'::flow_status
      end
    )
  order by f.updated_at desc
  limit greatest(1, least(coalesce(p_limit, 200), 500));
$$;
revoke all on function public.zf_list_workspace_flows(uuid, uuid, flow_status, int) from public, anon, authenticated;

-- 3. Buat flow baru / duplikasi template dalam 1 RTT (tanpa query workspace terpisah!)
create or replace function public.zf_create_flow(
  p_user_id uuid,
  p_preferred_ws_id uuid,
  p_title text,
  p_description text,
  p_kind flow_kind,
  p_document jsonb
)
returns setof public.flows
language plpgsql security definer set search_path = public as $$
declare
  v_ws_id uuid;
begin
  if p_preferred_ws_id is not null then
    select m.workspace_id into v_ws_id
    from public.memberships m
    where m.user_id = p_user_id
      and m.workspace_id = p_preferred_ws_id
      and m.role = any(array['owner','admin','editor']::member_role[])
    limit 1;
  end if;

  if v_ws_id is null then
    select m.workspace_id into v_ws_id
    from public.memberships m
    inner join public.workspaces w on w.id = m.workspace_id
    where m.user_id = p_user_id
      and m.role = any(array['owner','admin','editor']::member_role[])
    order by w.created_at asc
    limit 1;
  end if;

  if v_ws_id is null then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  return query
  insert into public.flows (workspace_id, title, description, kind, document, created_by)
  values (v_ws_id, p_title, p_description, p_kind, p_document, p_user_id)
  returning *;
end $$;
revoke all on function public.zf_create_flow(uuid, uuid, text, text, flow_kind, jsonb) from public, anon, authenticated;

-- 4. Ambil satu flow penuh dalam 1 RTT (dengan cek keanggotaan workspace)
create or replace function public.zf_get_flow(
  p_user_id uuid,
  p_flow_id uuid
)
returns setof public.flows
language sql stable security definer set search_path = public as $$
  select f.*
  from public.flows f
  where f.id = p_flow_id
    and exists (
      select 1 from public.memberships m
      where m.workspace_id = f.workspace_id and m.user_id = p_user_id
    )
  limit 1;
$$;
revoke all on function public.zf_get_flow(uuid, uuid) from public, anon, authenticated;

-- 5. Simpan dokumen kanvas (autosave) dalam 1 RTT dengan optimistic locking
create or replace function public.zf_save_flow_document(
  p_user_id uuid,
  p_flow_id uuid,
  p_document jsonb,
  p_expected_version int
)
returns table (
  out_status text,
  out_version int,
  out_workspace_id uuid,
  out_share_token text,
  out_share_enabled boolean
)
language plpgsql security definer set search_path = public as $$
declare
  v_cur_version int;
  v_ws_id uuid;
  v_can_edit boolean;
  v_new_version int;
  v_share_token text;
  v_share_enabled boolean;
begin
  select f.version, f.workspace_id,
         exists (
           select 1 from public.memberships m
           where m.workspace_id = f.workspace_id
             and m.user_id = p_user_id
             and m.role = any(array['owner','admin','editor']::member_role[])
         )
  into v_cur_version, v_ws_id, v_can_edit
  from public.flows f
  where f.id = p_flow_id
  limit 1;

  if v_ws_id is null or not coalesce(v_can_edit, false) then
    return query select 'forbidden'::text, 0, null::uuid, null::text, false;
    return;
  end if;

  update public.flows f
  set document = p_document,
      version = f.version + 1
  where f.id = p_flow_id
    and f.version = p_expected_version
  returning f.version, f.share_token, f.share_enabled
  into v_new_version, v_share_token, v_share_enabled;

  if v_new_version is not null then
    return query select 'ok'::text, v_new_version, v_ws_id, v_share_token, v_share_enabled;
    return;
  end if;

  select f.version into v_cur_version from public.flows f where f.id = p_flow_id;
  return query select 'conflict'::text, coalesce(v_cur_version, 0), v_ws_id, null::text, false;
end $$;
revoke all on function public.zf_save_flow_document(uuid, uuid, jsonb, int) from public, anon, authenticated;

-- Grants dasar untuk role authenticated (RLS yang membatasi baris)
grant usage on schema public to authenticated, anon;
grant select, insert, update, delete on profiles, workspaces, memberships, flows to authenticated;

analyze public.profiles, public.workspaces, public.memberships, public.flows;
