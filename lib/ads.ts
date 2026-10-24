/** Sponsored "places near our stations" slides, shown in the home banner and the post-login popup. */

export type AdArtKind = "palace" | "arun" | "market" | "chinatown" | "mall" | "cafe" | "promo";
export type AdCategory = "temple" | "market" | "food" | "cafe" | "mall" | "promo";

export interface AdSlide {
  id: string;
  art: AdArtKind;
  category: AdCategory;
  /** Must match a branch name in supabase/seed.sql; null for promotion slides. */
  branchName: string | null;
  title: string;
  description: string;
  /** Discount code applied by the call-to-action of a promotion slide. */
  promoCode?: string;
}

export const AD_CATEGORY_LABELS: Record<AdCategory, string> = {
  temple: "วัด",
  market: "ตลาด",
  food: "อาหาร",
  cafe: "คาเฟ่",
  mall: "ช้อปปิ้ง",
  promo: "โปรโมชัน",
};

export const AD_SLIDES: AdSlide[] = [
  {
    id: "grand-palace",
    art: "palace",
    category: "temple",
    branchName: "MRT หัวลำโพง",
    title: "พระบรมมหาราชวัง และวัดพระแก้ว",
    description: "ไฮไลต์ของเกาะรัตนโกสินทร์ ต้องแต่งกายสุภาพ (ไม่ใส่ขาสั้น/แขนกุด) ก่อนเข้าชม",
  },
  {
    id: "wat-arun",
    art: "arun",
    category: "temple",
    branchName: "MRT หัวลำโพง",
    title: "วัดอรุณราชวราราม",
    description: "พระปรางค์ริมแม่น้ำเจ้าพระยา นั่งเรือข้ามฟากจากท่าเตียน ถ่ายรูปตอนเย็นสวยที่สุด",
  },
  {
    id: "chatuchak",
    art: "market",
    category: "market",
    branchName: "BTS หมอชิต",
    title: "ตลาดนัดจตุจักร",
    description: "ตลาดนัดสุดสัปดาห์ที่ใหญ่ที่สุดของกรุงเทพฯ ฝากกระเป๋าไว้ก่อน แล้วเดินช้อปตัวเปล่า",
  },
  {
    id: "yaowarat",
    art: "chinatown",
    category: "food",
    branchName: "MRT หัวลำโพง",
    title: "เยาวราช ถนนสายอาหาร",
    description: "ร้านริมทางชื่อดังเปิดตั้งแต่หัวค่ำ ทั้งก๋วยจั๊บ ขนมปังปิ้ง และอาหารทะเล เดินจากหัวลำโพงได้",
  },
  {
    id: "siam",
    art: "mall",
    category: "mall",
    branchName: "BTS สยาม",
    title: "ย่านสยาม ศูนย์รวมช้อปปิ้ง",
    description: "สยามพารากอน สยามสแควร์ และ MBK อยู่รอบสถานี ฝากกระเป๋าแล้วช้อปได้ทั้งวัน",
  },
  {
    id: "ari",
    art: "cafe",
    category: "cafe",
    branchName: "BTS หมอชิต",
    title: "ย่านคาเฟ่อารีย์",
    description: "ซอยร่มรื่นเต็มไปด้วยคาเฟ่ อยู่ห่าง BTS หมอชิตเพียง 2 สถานี",
  },
  {
    id: "promo-welcome10",
    art: "promo",
    category: "promo",
    branchName: null,
    title: "ลด 10% ทุกการส่งกระเป๋า",
    description: "ใช้โค้ด WELCOME10 ตอนจอง ส่งถึงโรงแรมหรือสาขาไหนก็ได้",
    promoCode: "WELCOME10",
  },
];

/** Booking URL for a slide's call-to-action. `branchId` is resolved from the branch name by the caller. */
export function adBookingHref(slide: AdSlide, branchId: number | null) {
  if (slide.promoCode) return `/book?service=delivery&promo=${encodeURIComponent(slide.promoCode)}`;
  return branchId ? `/book?service=storage&branch=${branchId}` : "/book?service=storage";
}
