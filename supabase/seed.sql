-- Seed data (fictional). Safe to re-run.

insert into public.branches (name, lat, lng, open_time, close_time, phone) values
  ('BTS สยาม', 13.7456, 100.5341, '07:00', '22:00', '02-000-0001'),
  ('BTS อโศก / MRT สุขุมวิท', 13.7370, 100.5603, '07:00', '22:00', '02-000-0002'),
  ('BTS หมอชิต', 13.8026, 100.5538, '07:00', '22:00', '02-000-0003'),
  ('MRT หัวลำโพง', 13.7377, 100.5170, '07:00', '22:00', '02-000-0004'),
  ('สถานีกลางกรุงเทพอภิวัฒน์', 13.8040, 100.5397, '06:00', '23:00', '02-000-0005'),
  ('สนามบินสุวรรณภูมิ', 13.6984, 100.7519, '00:00', '24:00', '02-000-0006')
on conflict (name) do update set
  lat = excluded.lat,
  lng = excluded.lng,
  open_time = excluded.open_time,
  close_time = excluded.close_time,
  phone = excluded.phone;

insert into public.discount_codes (code, type, value, min_total, max_discount) values
  ('WELCOME10', 'percent', 10, 0, null),
  ('BAGFREE50', 'fixed', 50, 200, null),
  ('KMITL20', 'percent', 20, 0, 100)
on conflict (code) do update set
  type = excluded.type,
  value = excluded.value,
  min_total = excluded.min_total,
  max_discount = excluded.max_discount;
