import { AuthProvider } from "@/features/auth/AuthContext";
import ServiceWorkerRegister from "@/features/pwa/ServiceWorkerRegister";
import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Geist } from "next/font/google";
import "./globals.css";

const bricolageGrotesque = Bricolage_Grotesque({
  variable: "--font-heading",
  subsets: ["latin"],
});

// Body / secondary text per the mobile handoff (Geist). Display stays Bricolage.
const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Financial Tracker",
  description: "Track your expenses and investments",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
  },
};

// viewport-fit=cover is required for env(safe-area-inset-*) to resolve on notched
// devices — the Modal's safe-area bottom padding depends on it. See specs/DESIGN_SYSTEM.md §6.
export const viewport: Viewport = {
  themeColor: "#0f172a",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${bricolageGrotesque.variable} ${geist.variable} ${bricolageGrotesque.className} antialiased`}
      >
        <AuthProvider>
          {children}
          <ServiceWorkerRegister />
        </AuthProvider>
      </body>
    </html>
  );
}
