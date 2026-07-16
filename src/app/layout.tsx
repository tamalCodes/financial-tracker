import { AuthProvider } from "@/features/auth/AuthContext";
import { THEME_SCRIPT, ThemeProvider } from "@/features/theme/ThemeContext";
import ServiceWorkerRegister from "@/features/pwa/ServiceWorkerRegister";
import AppControl from "@/features/pwa/AppControl";
import type { Metadata, Viewport } from "next";
import { Fraunces, Manrope, Overpass_Mono } from "next/font/google";
import "./globals.css";

// Premium type system inspired by CRED's NeoPOP (Cirka serif + Gilroy sans + Overpass Mono),
// rebuilt with license-free equivalents. Display = elegant high-contrast serif for headlines
// and hero numbers; body/UI = geometric sans; mono = tabular numerals / detail labels.
const fraunces = Fraunces({
  variable: "--font-heading",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-geist",
  subsets: ["latin"],
});

const overpassMono = Overpass_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Kharcha",
  description: "A clearer view of your everyday money",
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: "/icon.svg",
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Kharcha",
  },
};

// viewport-fit=cover is required for env(safe-area-inset-*) to resolve on notched
// devices — the Modal's safe-area bottom padding depends on it. See specs/DESIGN_SYSTEM.md §6.
// interactiveWidget=resizes-content shrinks the layout viewport when the soft
// keyboard opens, so bottom-anchored sheets (and their CTA / AmountField operator
// bar) lift above the keyboard instead of hiding under it.
export const viewport: Viewport = {
  themeColor: "#191613",
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
        className={`${fraunces.variable} ${manrope.variable} ${overpassMono.variable} ${manrope.className} antialiased`}
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
