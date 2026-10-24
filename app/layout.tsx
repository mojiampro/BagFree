import type { Metadata, Viewport } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { AuthProvider } from "@/components/providers/auth-provider";
import { VIEW_INIT_SCRIPT, ViewToggle } from "@/components/view-toggle";
import "./globals.css";

const notoSansThai = Noto_Sans_Thai({
  variable: "--font-noto-thai",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Bag Free — ฝากและส่งกระเป๋าทั่วกรุงเทพฯ",
    template: "%s | Bag Free",
  },
  description:
    "บริการฝากและส่งกระเป๋าเดินทางระหว่างสถานีรถไฟฟ้า สาขา และโรงแรมในกรุงเทพฯ เที่ยวต่อได้ทันทีโดยไม่ต้องแบกสัมภาระ",
};

export const viewport: Viewport = {
  themeColor: "#1e3a5f",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="th" className={`${notoSansThai.variable} antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: VIEW_INIT_SCRIPT }} />
      </head>
      <body className="font-sans">
        <div className="app-viewport">
          <div className="app-frame">
            {/* Inside the frame so modals and toasts stay within the phone in Phone View. */}
            <AuthProvider>
              <div className="app-shell">
                <Navbar />
                <main className="flex flex-1 flex-col">{children}</main>
                <Footer />
              </div>
            </AuthProvider>
          </div>
        </div>
        <ViewToggle />
      </body>
    </html>
  );
}
