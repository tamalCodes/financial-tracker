"use client";

import { useToasts, dismissToast, type ToastVariant } from "./toast";
import { BODY } from "./data";

// Frosted, minimal toast stack. Fixed at the top of the viewport, centred on the
// 412-wide mobile column. Translucent glass — never opaque saturated fills (design
// system). Colour semantics: success=green, error=red, info=indigo (brand accent).

const VARIANT: Record<
  ToastVariant,
  { rgb: string; text: string; icon: string }
> = {
  // stroke icon paths on a 20×20 viewBox
  success: { rgb: "16,185,129", text: "#047857", icon: "M4 10.5 8.5 15 16 6" },
  error: { rgb: "239,68,68", text: "#b91c1c", icon: "M6 6l8 8 M14 6l-8 8" },
  info: { rgb: "79,70,229", text: "#4338ca", icon: "M10 9v5 M10 6h.01" },
};

export default function Toaster() {
  const toasts = useToasts();
  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        top: "calc(16px + env(safe-area-inset-top))",
        zIndex: 60,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        pointerEvents: "none",
        padding: "0 16px",
      }}
    >
      {toasts.map((t) => {
        const v = VARIANT[t.variant];
        return (
          <div
            key={t.id}
            onClick={() => dismissToast(t.id)}
            style={{
              pointerEvents: "auto",
              cursor: "pointer",
              width: 380,
              maxWidth: "100%",
              display: "flex",
              alignItems: "center",
              gap: 11,
              padding: "12px 16px",
              borderRadius: 16,
              background: `linear-gradient(135deg,rgba(${v.rgb},0.16),rgba(${v.rgb},0.08)),rgba(255,255,255,0.72)`,
              border: `1px solid rgba(${v.rgb},0.32)`,
              boxShadow: "0 10px 30px -10px rgba(15,23,42,0.35)",
              backdropFilter: "blur(14px) saturate(160%)",
              WebkitBackdropFilter: "blur(14px) saturate(160%)",
              animation: "toastIn 0.24s cubic-bezier(0.16,1,0.3,1)",
            }}
          >
            <span
              style={{
                flexShrink: 0,
                width: 26,
                height: 26,
                borderRadius: 999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: `rgba(${v.rgb},0.18)`,
              }}
            >
              <svg width={16} height={16} viewBox="0 0 20 20" fill="none">
                <path
                  d={v.icon}
                  stroke={v.text}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span
              style={{
                fontFamily: BODY,
                fontWeight: 500,
                fontSize: 14,
                lineHeight: 1.3,
                color: "#0f172a",
              }}
            >
              {t.message}
            </span>
          </div>
        );
      })}
      <style>{`@keyframes toastIn{from{opacity:0;transform:translateY(-10px) scale(0.98)}to{opacity:1;transform:translateY(0) scale(1)}}`}</style>
    </div>
  );
}
