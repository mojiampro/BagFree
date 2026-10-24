@AGENTS.md

# Bag Free — Luggage Storage & Delivery App

Web App สำหรับนำเสนอโปรเจกต์ในรายวิชา: บริการฝากและส่งกระเป๋าเดินทางระหว่างสถานีรถไฟฟ้า สาขา และโรงแรมในกรุงเทพฯ สำหรับนักท่องเที่ยว เพื่อให้เที่ยวต่อได้ทันทีโดยไม่ต้องแบกสัมภาระ

## Tech Stack (ห้ามเปลี่ยน)
- Next.js (App Router, เวอร์ชันล่าสุด) + TypeScript + Tailwind CSS
- Supabase: Auth, Postgres, Realtime — ใช้ `@supabase/ssr` สำหรับ client/server
- Stripe Checkout (Test Mode)
- Leaflet + react-leaflet + OpenStreetMap, OSRM public server (เส้นทาง), Nominatim (ค้นหาพิกัดโรงแรม)
- qrcode.react สำหรับ QR Code
- Deploy บน Vercel
- ถ้าไม่แน่ใจ API ของ Next.js/Supabase/Stripe เวอร์ชันที่ติดตั้ง ให้ตรวจจาก `node_modules` หรือเอกสารทางการก่อนเขียน อย่าเดา

## Version Notes (ตรวจจาก node_modules แล้ว)
- Next.js 16.4: `middleware` เปลี่ยนชื่อเป็น `proxy.ts`; `params`/`searchParams`/`cookies()` เป็น async; ปิด `cacheComponents` ไว้ (Supabase อ่าน cookie ทุก request)
- Tailwind v4: theme อยู่ใน `@theme` ของ `app/globals.css` (ไม่มี tailwind.config)
- Stripe 23 (API `2026-09-30.endive`): Checkout ใช้ `allowed_payment_method_types` แทน `payment_method_types`
- `@supabase/ssr` 0.12: cookies ต้องใช้ `getAll` / `setAll`

## Conventions
- Responsive ใช้ container queries (`@md:`, `@2xl:`, `@4xl:`) ไม่ใช้ `md:`/`lg:` เพราะทุกหน้าอยู่ใน `.app-frame` (Phone View จำกัดความกว้าง 390px)
- ราคา/สถานะ/โค้ด เขียนผ่าน service role ใน API routes เท่านั้น (`lib/supabase/admin.ts`); client อ่านผ่าน RLS
- Demo timeline อยู่ที่ `lib/simulation.ts` ใช้ร่วมกันระหว่างแผนที่และ `/api/bookings/sync`

## Commands
- `npm run dev` — dev server
- `npm run build` — ต้องผ่านก่อนจบทุก Phase
- `npm run lint` — ต้องไม่มี error
- `stripe listen --events checkout.session.completed,checkout.session.async_payment_succeeded,checkout.session.async_payment_failed,checkout.session.expired --forward-to localhost:3000/api/webhook` — ทดสอบ webhook

## Phases
1. Foundation — theme, layout, Supabase clients, proxy, migrations + seed, pricing/codes lib, Auth (modal + หน้า login/register + Demo Login), Landing Page, Mobile Frame Toggle
2. Booking + Payment — /book wizard, Nominatim, OSRM, API สร้างการจอง, Stripe Checkout, webhook
3. Tracking + Retrieval — /track/[code], /driver, /retrieve
4. Dashboard + Review — /dashboard, Realtime toast + กระดิ่ง, ระบบรีวิว

## Features
1. **Auth** — Supabase Email/Password (Register, Sign In, Sign Out) + ปุ่ม "Demo Login" (demo@bagfree.test / demo1234)
2. **Landing Page** — Navbar, Hero (CTA "ส่งเลย" / "ฝากกระเป๋าเลย"), Service Cards 3 ใบ (ส่ง / ฝาก / รับคืน), Branch Directory, รีวิวล่าสุด, Footer
3. **Booking (/book)** — Step-by-step: เลือกบริการ → รายละเอียด → สรุปราคา → ชำระเงิน → ยืนยัน
   - ส่งกระเป๋า 3 โหมด: สาขา→โรงแรม, โรงแรม→สาขา, สาขา→สาขา
   - ฝากกระเป๋า: สาขา, วัน-เวลาฝาก, วัน-เวลารับคืน (ต้องหลังเวลาฝากและอยู่ในเวลาเปิด)
   - ข้อมูลร่วม: ชื่อผู้ส่ง, ชื่อผู้รับ, เบอร์โทร (บังคับ, เบอร์ไทย 10 หลักขึ้นต้นด้วย 0), จำนวนกระเป๋า S/M/L, โค้ดส่วนลด, สรุปราคาแยกรายการ
   - โรงแรม: ค้นหาด้วย Nominatim (debounce 1 วินาที, จำกัดในกรุงเทพฯ), fallback เป็นโรงแรมตัวอย่าง 5 แห่ง
4. **Payment** — บัตรเครดิตและ PromptPay ผ่าน Stripe Checkout (THB), เงินสด = `payment_status = 'pay_at_counter'`
5. **Tracking (/track/[code])** — แผนที่ + เส้นทาง OSRM + รถจำลอง + Live Driver Mode (/driver)
6. **Retrieval (/retrieve)** — ค้นหาด้วย Tracking/Seal Code, แสดง QR Code, ปุ่มยืนยันรับคืน (จำลองฝั่งเจ้าหน้าที่)
7. **Dashboard (/dashboard)** — แท็บกำลังดำเนินการ / ประวัติ, แจ้งเตือน Realtime (toast + กระดิ่ง)
8. **Review** — 0.5–5 ดาว (ครึ่งดาวได้, เมาส์และทัช) + ข้อความ, 1 ครั้งต่อการจอง, เด้งอัตโนมัติเมื่อ delivered/retrieved
9. **Mobile Frame Toggle** — สวิตช์ลอยมุมขวาล่าง สลับ "Phone View" (กรอบ 390×844 กลางจอ เนื้อหาเลื่อนในกรอบ) กับ "Full Screen", จำค่าใน localStorage

## Pricing
| ขนาด | ฝาก (ต่อวัน) | ส่ง (ราคาเริ่มต้น) |
|---|---|---|
| Small (≤ 20") | 50 ฿ | 150 ฿ |
| Medium (21–26") | 80 ฿ | 200 ฿ |
| Large (≥ 27") | 100 ฿ | 250 ฿ |
- ส่ง: + 10 ฿/กม. (ระยะทางจาก OSRM) ต่อการจอง
- ฝาก: คิดเป็นวัน ปัดเศษขึ้น (25 ชม. = 2 วัน)
- เก็บ logic ราคาไว้ที่ `lib/pricing.ts` ไฟล์เดียว ใช้ร่วมกันทั้ง client (แสดงผล) และ server (คำนวณจริง)

## Discount Codes
- WELCOME10 = ลด 10%
- BAGFREE50 = ลด 50 ฿ (ขั้นต่ำ 200 ฿)
- KMITL20 = ลด 20% (สูงสุด 100 ฿)

## Branches (seed, ข้อมูลสมมติ)
| สาขา | lat, lng | เวลาเปิด | เบอร์ |
|---|---|---|---|
| BTS สยาม | 13.7456, 100.5341 | 07:00–22:00 | 02-000-0001 |
| BTS อโศก / MRT สุขุมวิท | 13.7370, 100.5603 | 07:00–22:00 | 02-000-0002 |
| BTS หมอชิต | 13.8026, 100.5538 | 07:00–22:00 | 02-000-0003 |
| MRT หัวลำโพง | 13.7377, 100.5170 | 07:00–22:00 | 02-000-0004 |
| สถานีกลางกรุงเทพอภิวัฒน์ | 13.8040, 100.5397 | 06:00–23:00 | 02-000-0005 |
| สนามบินสุวรรณภูมิ | 13.6984, 100.7519 | 24 ชั่วโมง | 02-000-0006 |

## Codes & Status
- Tracking Code: `BF-` + A-Z/0-9 6 ตัว (เช่น BF-7K2M9Q), unique
- Seal Code: ตัวเลข 6 หลัก
- Storage slot: เช่น A-12
- Delivery: pending_payment → picked_up → in_transit → delivered
- Storage: pending_payment → stored → ready_for_pickup → retrieved

## Database (Supabase, เปิด RLS ทุกตาราง)
- `profiles`: id, full_name, phone
- `branches`: id, name, lat, lng, open_time, close_time, phone — อ่านได้ทุกคน
- `discount_codes`: code, type (percent/fixed), value, min_total, max_discount
- `bookings`: id, user_id, service_type, delivery_mode, origin_name, origin_lat, origin_lng, destination_name, destination_lat, destination_lng, branch_id, sender_name, receiver_name, phone, scheduled_at, storage_start, storage_end, subtotal, discount, total, discount_code, payment_method, payment_status, status, tracking_code, seal_code, storage_slot, route_geojson, distance_km, started_at, created_at
- `booking_items`: id, booking_id, size, quantity, unit_price
- `reviews`: id, booking_id (unique), user_id, rating (numeric 0.5–5), comment, created_at — อ่านได้ทุกคน
- `driver_locations`: id, booking_id, lat, lng, updated_at — เปิด Realtime
- ผู้ใช้อ่าน/เขียน bookings และ booking_items ได้เฉพาะของตัวเอง
- เก็บ schema เป็นไฟล์ migration ใน `supabase/migrations/` และ seed ใน `supabase/seed.sql`

## Design System
- ฟอนต์: Noto Sans Thai (next/font/google), UI ภาษาไทย
- สีหลัก (Navbar, หัวข้อ, Footer): #1E3A5F
- ปุ่ม CTA หลัก: #EA580C, hover #C2410C, ตัวหนังสือขาวตัวหนา — ใช้เฉพาะปุ่มหลัก
- ปุ่มรอง: กรอบ #1E3A5F พื้นขาว
- พื้นหลัง #F8FAFC, การ์ด #FFFFFF, section สลับ #F1F5F9, ไฮไลต์ #FFF7ED
- ตัวหนังสือ #0F172A, ตัวหนังสือรอง #64748B, สำเร็จ #16A34A, error #DC2626
- กำหนดสีเป็น theme ใน Tailwind config (เช่น `navy`, `cta`) ห้าม hardcode hex กระจายในคอมโพเนนต์
- Smooth scroll, hover effects, scroll animation (fade/slide-in ด้วย IntersectionObserver)
- Mobile-first, responsive ทุกขนาด, ทุกหน้ามี loading / error / empty state

## Rules (สำคัญ)
- ห้ามจอง/ส่งกระเป๋าถ้ายังไม่ล็อกอิน: กดปุ่ม CTA หรือการ์ดบริการแล้วเด้ง Modal เข้าสู่ระบบ, หลังล็อกอินพากลับไปหน้าที่ตั้งใจ, ป้องกันฝั่ง server ด้วย (middleware/proxy ตามเวอร์ชัน Next.js + RLS)
- ราคา, ส่วนลด, Tracking Code, Seal Code สร้างฝั่ง server เท่านั้น ห้ามเชื่อค่าจาก client
- `STRIPE_SECRET_KEY` และ `SUPABASE_SERVICE_ROLE_KEY` ใช้ได้เฉพาะโค้ดฝั่ง server ห้าม import เข้า client component
- Stripe ใช้หน่วยสตางค์ (250 ฿ = 25000), อัปเดตสถานะชำระเงินผ่าน webhook ที่ตรวจ signature เท่านั้น (อ่าน raw body ด้วย `await req.text()`)
- Leaflet ต้องโหลดแบบ client-only (`dynamic(..., { ssr: false })`) และใช้ไอคอน custom (`L.divIcon`)
- เรียก OSRM ครั้งเดียวตอนสร้างการจอง แล้วเก็บ `route_geojson` + `distance_km` ลง booking; ถ้า OSRM ล้มเหลวให้ใช้เส้นตรง
- ห้ามทิ้ง TODO หรือโค้ดครึ่งๆ กลางๆ; จบแต่ละ Phase ต้อง `npm run build` และ `npm run lint` ผ่าน
- commit git หลังจบแต่ละ Phase ด้วยข้อความที่อธิบายสิ่งที่ทำ
