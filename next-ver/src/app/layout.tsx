import { AuthProvider } from "@/features/auth/AuthContext";
import { THEME_SCRIPT, ThemeProvider } from "@/features/theme/ThemeContext";
import ServiceWorkerRegister from "@/features/pwa/ServiceWorkerRegister";
import AppControl from "@/features/pwa/AppControl";
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
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FinTracker",
  },
};

// viewport-fit=cover is required for env(safe-area-inset-*) to resolve on notched
// devices — the Modal's safe-area bottom padding depends on it. See specs/DESIGN_SYSTEM.md §6.
// interactiveWidget=resizes-content shrinks the layout viewport when the soft
// keyboard opens, so bottom-anchored sheets (and their CTA / AmountField operator
// bar) lift above the keyboard instead of hiding under it.
export const viewport: Viewport = {
  themeColor: "#0f172a",
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Set the theme class before paint to avoid a light→dark flash on load. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body
        className={`${bricolageGrotesque.variable} ${geist.variable} ${bricolageGrotesque.className} antialiased`}
      >
        <ThemeProvider>
          <AuthProvider>
            {children}
            <ServiceWorkerRegister />
            <AppControl />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
