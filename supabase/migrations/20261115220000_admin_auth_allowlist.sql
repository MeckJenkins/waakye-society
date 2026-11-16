-- Authenticated administrators are explicitly allowlisted by Auth user ID.
-- Apply only after reviewing every existing policy in pg_policies and
-- migrating public order creation, payment updates, and order tracking to
-- trusted server-side flows. This migration intentionally blocks public
-- reads, updates, and deletes of order records.

-- Preflight:
-- SELECT * FROM pg_policies
-- WHERE (schemaname = 'public' AND tablename IN ('menu_items', 'orders', 'order_items', 'admin_credentials'))
--    OR (schemaname = 'storage' AND tablename = 'objects');
do $$
declare
  table_name text;
  rls_enabled boolean;
begin
  if not exists (
    select 1
    from auth.users
    where id = 'df07f9a5-32d5-47c1-93b8-1e661abe91fb'::uuid
  ) then
    raise exception 'The configured administrator Auth user does not exist.';
  end if;

  foreach table_name in array array[
    'public.menu_items',
    'public.orders',
    'public.order_items',
    'public.admin_credentials',
    'storage.objects'
  ]
  loop
    select relrowsecurity
    into rls_enabled
    from pg_class
    where oid = to_regclass(table_name);

    if not found or rls_enabled is distinct from true then
      raise exception 'RLS must already be enabled on %; review existing customer policies before applying this migration.', table_name;
    end if;
  end loop;
end
$$;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
revoke all on table public.admin_users from public, anon, authenticated;

insert into public.admin_users (user_id)
values ('df07f9a5-32d5-47c1-93b8-1e661abe91fb'::uuid)
on conflict (user_id) do nothing;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from public.admin_users
    where user_id = (select auth.uid())
  );
$function$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

drop policy if exists admin_menu_items_select on public.menu_items;
create policy admin_menu_items_select
  on public.menu_items
  for select
  to authenticated
  using (public.is_admin());

drop policy if exists admin_menu_items_update on public.menu_items;
create policy admin_menu_items_update
  on public.menu_items
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists restrict_menu_items_updates_to_admins on public.menu_items;
create policy restrict_menu_items_updates_to_admins
  on public.menu_items
  as restrictive
  for update
  to public
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists restrict_menu_items_inserts_to_admins on public.menu_items;
create policy restrict_menu_items_inserts_to_admins
  on public.menu_items
  as restrictive
  for insert
  to public
  with check (public.is_admin());

drop policy if exists restrict_menu_items_deletes_to_admins on public.menu_items;
create policy restrict_menu_items_deletes_to_admins
  on public.menu_items
  as restrictive
  for delete
  to public
  using (public.is_admin());

drop policy if exists admin_orders_select on public.orders;
create policy admin_orders_select
  on public.orders
  for select
  to authenticated
  using (public.is_admin());

drop policy if exists admin_orders_update on public.orders;
create policy admin_orders_update
  on public.orders
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists restrict_orders_reads_to_admins on public.orders;
create policy restrict_orders_reads_to_admins
  on public.orders
  as restrictive
  for select
  to public
  using (public.is_admin());

drop policy if exists restrict_orders_updates_to_admins on public.orders;
create policy restrict_orders_updates_to_admins
  on public.orders
  as restrictive
  for update
  to public
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists restrict_orders_deletes_to_admins on public.orders;
create policy restrict_orders_deletes_to_admins
  on public.orders
  as restrictive
  for delete
  to public
  using (public.is_admin());

drop policy if exists admin_order_items_select on public.order_items;
create policy admin_order_items_select
  on public.order_items
  for select
  to authenticated
  using (public.is_admin());

drop policy if exists restrict_order_items_reads_to_admins on public.order_items;
create policy restrict_order_items_reads_to_admins
  on public.order_items
  as restrictive
  for select
  to public
  using (public.is_admin());

drop policy if exists restrict_order_items_updates_to_admins on public.order_items;
create policy restrict_order_items_updates_to_admins
  on public.order_items
  as restrictive
  for update
  to public
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists restrict_order_items_deletes_to_admins on public.order_items;
create policy restrict_order_items_deletes_to_admins
  on public.order_items
  as restrictive
  for delete
  to public
  using (public.is_admin());

-- The legacy credential table is no longer used by the frontend. This
-- restrictive policy makes every existing permissive policy on it ineffective.
drop policy if exists deny_legacy_admin_credentials_access on public.admin_credentials;
create policy deny_legacy_admin_credentials_access
  on public.admin_credentials
  as restrictive
  for all
  to public
  using (false)
  with check (false);

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'menu-images',
  'menu-images',
  true,
  5242880,
  array['image/jpeg', 'image/png']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists admin_menu_images_insert on storage.objects;
create policy admin_menu_images_insert
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'menu-images'
    and public.is_admin()
  );

drop policy if exists restrict_menu_image_inserts_to_admins on storage.objects;
create policy restrict_menu_image_inserts_to_admins
  on storage.objects
  as restrictive
  for insert
  to public
  with check (
    bucket_id <> 'menu-images'
    or public.is_admin()
  );

drop policy if exists admin_menu_images_update on storage.objects;
create policy admin_menu_images_update
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'menu-images'
    and public.is_admin()
  )
  with check (
    bucket_id = 'menu-images'
    and public.is_admin()
  );

drop policy if exists restrict_menu_image_updates_to_admins on storage.objects;
create policy restrict_menu_image_updates_to_admins
  on storage.objects
  as restrictive
  for update
  to public
  using (
    bucket_id <> 'menu-images'
    or public.is_admin()
  )
  with check (
    bucket_id <> 'menu-images'
    or public.is_admin()
  );

drop policy if exists restrict_menu_image_deletes_to_admins on storage.objects;
create policy restrict_menu_image_deletes_to_admins
  on storage.objects
  as restrictive
  for delete
  to public
  using (
    bucket_id <> 'menu-images'
    or public.is_admin()
  );
