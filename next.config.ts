import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// Supabase is called server-side only (no NEXT_PUBLIC_ url), so the browser never
// connects to it directly — but we still allowlist the origin in connect-src as
// defense-in-depth in case a client call is ever added.
const supabaseOrigin = (() => {
  try {
    return process.env.SUPABASE_URL
      ? new URL(process.env.SUPABASE_URL).origin
      : "https://*.supabase.co";
  } catch {
    return "https://*.supabase.co";
  }
})();

// Content-Security-Policy. Next's App Router injects inline bootstrap/hydration
// scripts and Tailwind emits inline styles, so 'unsafe-inline' is required for
// script/style until a nonce-based proxy is wired up. Dev additionally needs
// 'unsafe-eval' for HMR / React Refresh — never shipped to production.
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  `connect-src 'self' ${supabaseOrigin}${isDev ? " ws: wss:" : ""}`,
  "manifest-src 'self'",
  "worker-src 'self'",
  "upgrade-insecure-requests",
]
  .join("; ")
  .concat(";");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
