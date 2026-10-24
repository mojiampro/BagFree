# Bag Free — Luggage Storage & Delivery

Web app โปรเจกต์รายวิชา: ฝากและส่งกระเป๋าเดินทางระหว่างสถานีรถไฟฟ้า สาขา และโรงแรมในกรุงเทพฯ

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Supabase (Auth, Postgres, Realtime) · Stripe Checkout · Leaflet + OpenStreetMap · OSRM · Nominatim

## ติดตั้ง

```bash
npm install
cp .env.example .env.local   # ใส่คีย์ Supabase และ Stripe
npm run dev
```

### Supabase

1. สร้างโปรเจกต์ที่ [supabase.com](https://supabase.com)
2. เปิด SQL Editor แล้วรันไฟล์ตามลำดับ
   - `supabase/migrations/20261024000000_init.sql` (ตาราง, RLS, Realtime)
   - `supabase/seed.sql` (สาขา 6 แห่ง + โค้ดส่วนลด)
   หรือใช้ Supabase CLI: `supabase db push` แล้วรัน seed
3. Authentication → Providers → Email: ปิด **Confirm email** ถ้าต้องการให้สมัครแล้วเข้าใช้ได้ทันที
   (ถ้าเปิดไว้ ให้เพิ่ม `http://localhost:3000/auth/callback` ใน Redirect URLs)
4. คัดลอก Project URL, anon key และ service_role key ไปใส่ `.env.local`

ปุ่ม **Demo Login** สร้างบัญชี `demo@bagfree.test / demo1234` ให้อัตโนมัติ (ต้องมี `SUPABASE_SERVICE_ROLE_KEY`)

### Stripe (Test Mode)

1. ใส่ `STRIPE_SECRET_KEY` (sk_test_...) ใน `.env.local`
2. เปิด Payment methods → PromptPay ใน Dashboard (PromptPay ใช้ได้กับบัญชี Stripe ประเทศไทย)
3. รัน webhook ระหว่างพัฒนา แล้วนำ `whsec_...` ที่ได้ไปใส่ `STRIPE_WEBHOOK_SECRET`

```bash
stripe listen --forward-to localhost:3000/api/webhook
```

บัตรทดสอบ: `4242 4242 4242 4242` วันหมดอายุอนาคตใดก็ได้ CVC 3 หลักใดก็ได้

### Deploy บน Vercel

ตั้ง Environment Variables เดียวกับ `.env.local` (`NEXT_PUBLIC_SITE_URL` = โดเมนจริง) และสร้าง webhook endpoint
`https://<domain>/api/webhook` ใน Stripe Dashboard พร้อม events:
`checkout.session.completed`, `checkout.session.async_payment_succeeded`,
`checkout.session.async_payment_failed`, `checkout.session.expired`

## การสาธิต (Demo flow)

1. กด **Demo Login** → **ส่งเลย** → เลือกสาขา → โรงแรม → กระเป๋า → สรุปราคา (ลองโค้ด `KMITL20`)
2. ชำระด้วยบัตรทดสอบ หรือเลือกเงินสด → ได้ Tracking Code + Seal Code
3. หน้าติดตาม: รถจำลองวิ่งตามเส้นทาง OSRM (~1–4 นาที) สถานะเปลี่ยนอัตโนมัติ มีแจ้งเตือน toast + กระดิ่ง
4. เปิด `/driver` บนมือถือ (ล็อกอินบัญชีเดียวกัน) → แชร์ตำแหน่ง → หน้าติดตามแสดงตำแหน่งจริงแบบ Live
5. ส่งถึงแล้ว → popup รีวิว (ครึ่งดาวได้) → รีวิวขึ้นหน้าแรก
6. ฝากกระเป๋า → `/retrieve` แสดง QR Code → ปุ่มยืนยันรับคืน (จำลองเจ้าหน้าที่)
7. สวิตช์มุมขวาล่างสลับ Phone View / Full Screen

## โครงสร้างหลัก

| Path | หน้าที่ |
|---|---|
| `lib/pricing.ts` | logic ราคาเดียว ใช้ทั้งหน้าเว็บและ API |
| `lib/simulation.ts` | timeline จำลองการจัดส่ง (ใช้ทั้งแผนที่และ server sync) |
| `app/api/bookings` | สร้างการจอง: validate, OSRM, คำนวณราคา, สร้างโค้ด (server only) |
| `app/api/webhook` | Stripe webhook (ตรวจ signature) — ที่เดียวที่เปลี่ยนเป็น `paid` |
| `proxy.ts` | refresh session + กันหน้าที่ต้องล็อกอิน |
| `supabase/migrations` | schema + RLS ทุกตาราง |

## Scripts

- `npm run dev` — dev server
- `npm run build` — production build
- `npm run lint` — ESLint
