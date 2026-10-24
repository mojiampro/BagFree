-- Bag Free schema: profiles, branches, discount codes, bookings, reviews, driver locations.
-- Every table has RLS enabled. Prices, codes and status changes are written by the server
-- (service role); users may only read their own bookings and edit a few contact fields.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text
);

alter table public.profiles enable row level security;

create policy "profiles: read own" on public.profiles
  for select to authenticated using (id = auth.uid());
create policy "profiles: insert own" on public.profiles
  for insert to authenticated with check (id = auth.uid());
create policy "profiles: update own" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'phone'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- branches (public read)
-- ---------------------------------------------------------------------------
create table public.branches (
  id serial primary key,
  name text not null unique,
  lat double precision not null,
  lng double precision not null,
  open_time time not null,
  close_time time not null,
  phone text not null
);

alter table public.branches enable row level security;

create policy "branches: public read" on public.branches
  for select to anon, authenticated using (true);

-- ---------------------------------------------------------------------------
-- discount_codes (server only: no policies, so only the service role can read)
-- ---------------------------------------------------------------------------
create table public.discount_codes (
  code text primary key,
  type text not null check (type in ('percent', 'fixed')),
  value numeric(10, 2) not null check (value > 0),
  min_total numeric(10, 2) not null default 0,
  max_discount numeric(10, 2)
);

alter table public.discount_codes enable row level security;

-- ---------------------------------------------------------------------------
-- bookings
-- ---------------------------------------------------------------------------
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  service_type text not null check (service_type in ('delivery', 'storage')),
  delivery_mode text check (delivery_mode in ('branch_to_hotel', 'hotel_to_branch', 'branch_to_branch')),
  origin_name text,
  origin_lat double precision,
  origin_lng double precision,
  destination_name text,
  destination_lat double precision,
  destination_lng double precision,
  branch_id integer references public.branches (id),
  sender_name text not null,
  receiver_name text not null,
  phone text not null check (phone ~ '^0[0-9]{9}$'),
  scheduled_at timestamptz,
  storage_start timestamptz,
  storage_end timestamptz,
  subtotal numeric(10, 2) not null check (subtotal >= 0),
  discount numeric(10, 2) not null default 0 check (discount >= 0),
  total numeric(10, 2) not null check (total >= 0),
  discount_code text references public.discount_codes (code),
  payment_method text check (payment_method in ('card', 'promptpay', 'cash')),
  payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid', 'paid', 'pay_at_counter', 'failed', 'expired')),
  status text not null default 'pending_payment'
    check (status in ('pending_payment', 'picked_up', 'in_transit', 'delivered', 'stored', 'ready_for_pickup', 'retrieved')),
  tracking_code text not null unique check (tracking_code ~ '^BF-[A-Z0-9]{6}$'),
  seal_code text not null check (seal_code ~ '^[0-9]{6}$'),
  storage_slot text,
  route_geojson jsonb,
  distance_km numeric(8, 2),
  started_at timestamptz,
  created_at timestamptz not null default now(),
  constraint bookings_delivery_fields check (
    service_type <> 'delivery'
    or (delivery_mode is not null and origin_lat is not null and destination_lat is not null)
  ),
  constraint bookings_storage_fields check (
    service_type <> 'storage'
    or (branch_id is not null and storage_start is not null and storage_end > storage_start)
  )
);

create index bookings_user_id_idx on public.bookings (user_id, created_at desc);
create index bookings_seal_code_idx on public.bookings (seal_code);

alter table public.bookings enable row level security;

create policy "bookings: read own" on public.bookings
  for select to authenticated using (user_id = auth.uid());
create policy "bookings: update own" on public.bookings
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Users may only change contact details; everything else goes through the server.
revoke insert, update, delete on public.bookings from anon, authenticated;
grant update (sender_name, receiver_name, phone) on public.bookings to authenticated;

-- ---------------------------------------------------------------------------
-- booking_items
-- ---------------------------------------------------------------------------
create table public.booking_items (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  size text not null check (size in ('S', 'M', 'L')),
  quantity integer not null check (quantity between 1 and 20),
  unit_price numeric(10, 2) not null check (unit_price >= 0),
  unique (booking_id, size)
);

alter table public.booking_items enable row level security;

create policy "booking_items: read own" on public.booking_items
  for select to authenticated using (
    exists (select 1 from public.bookings b where b.id = booking_id and b.user_id = auth.uid())
  );

revoke insert, update, delete on public.booking_items from anon, authenticated;

-- ---------------------------------------------------------------------------
-- reviews (public read, one per finished booking)
-- ---------------------------------------------------------------------------
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  rating numeric(2, 1) not null check (rating >= 0.5 and rating <= 5 and (rating * 2) = floor(rating * 2)),
  comment text check (char_length(comment) <= 500),
  created_at timestamptz not null default now()
);

alter table public.reviews enable row level security;

create policy "reviews: public read" on public.reviews
  for select to anon, authenticated using (true);
create policy "reviews: insert own finished booking" on public.reviews
  for insert to authenticated with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.bookings b
      where b.id = booking_id
        and b.user_id = auth.uid()
        and b.status in ('delivered', 'retrieved')
    )
  );

-- Latest reviews with a masked reviewer name, safe to show on the public landing page.
create function public.latest_reviews(max_rows integer default 6)
returns table (
  id uuid,
  rating numeric,
  comment text,
  created_at timestamptz,
  reviewer text,
  service_type text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    r.id,
    r.rating,
    r.comment,
    r.created_at,
    coalesce(left(nullif(p.full_name, ''), 1), 'ผ') || '***' as reviewer,
    b.service_type
  from public.reviews r
  join public.bookings b on b.id = r.booking_id
  left join public.profiles p on p.id = r.user_id
  order by r.created_at desc
  limit least(greatest(max_rows, 1), 20);
$$;

grant execute on function public.latest_reviews(integer) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- driver_locations (Live Driver Mode, realtime)
-- ---------------------------------------------------------------------------
create table public.driver_locations (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings (id) on delete cascade,
  lat double precision not null,
  lng double precision not null,
  updated_at timestamptz not null default now()
);

alter table public.driver_locations enable row level security;

create policy "driver_locations: read own booking" on public.driver_locations
  for select to authenticated using (
    exists (select 1 from public.bookings b where b.id = booking_id and b.user_id = auth.uid())
  );
create policy "driver_locations: insert own booking" on public.driver_locations
  for insert to authenticated with check (
    exists (select 1 from public.bookings b where b.id = booking_id and b.user_id = auth.uid())
  );
create policy "driver_locations: update own booking" on public.driver_locations
  for update to authenticated using (
    exists (select 1 from public.bookings b where b.id = booking_id and b.user_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- realtime
-- ---------------------------------------------------------------------------
alter table public.driver_locations replica identity full;
alter table public.bookings replica identity full;
alter publication supabase_realtime add table public.driver_locations;
alter publication supabase_realtime add table public.bookings;
