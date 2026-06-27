"use client";

import { useAuth } from "@/features/auth/AuthContext";

// Greeting header (mobile handoff §4): greeting + name on the left; month pill + avatar
// on the right. Name/initials derived from the auth email until a profile name exists.
interface GreetingHeaderProps {
  monthLabel: string;
}

function greetingForHour(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function displayName(email?: string | null): string {
  if (!email) return "there";
  const local = email.split("@")[0] ?? "";
  const cleaned = local.replace(/[._-]+/g, " ").trim();
  if (!cleaned) return "there";
  return cleaned
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function initialsFor(name: string): string {
  const parts = name.split(" ").filter(Boolean);
  const letters = (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? parts[0]?.[1] ?? "");
  return letters.toUpperCase() || "U";
}

export default function GreetingHeader({ monthLabel }: GreetingHeaderProps) {
  const { user } = useAuth();
  const name = displayName(user?.email);
  const greeting = greetingForHour(new Date().getHours());

  return (
    <div className="flex items-center justify-between gap-3 px-1">
      <div className="flex flex-col gap-0.5">
        <span className="font-body text-[12.5px] font-medium text-slate-400">
          {greeting}
        </span>
        <span className="font-heading text-[19px] font-semibold -tracking-[0.01em] text-slate-900">
          {name}
        </span>
      </div>
      <div className="flex items-center gap-2.5">
        <span
          className="font-heading whitespace-nowrap rounded-full border border-indigo-500/40 px-[11px] py-1.5 text-xs font-semibold text-indigo-700"
          style={{
            background:
              "linear-gradient(135deg, rgba(99,102,241,0.20), rgba(99,102,241,0.10))",
          }}
        >
          {monthLabel}
        </span>
        <span
          className="font-heading flex h-10 w-10 items-center justify-center rounded-full border border-indigo-500/45 text-sm font-semibold text-indigo-700"
          style={{
            background:
              "linear-gradient(135deg, rgba(99,102,241,0.30), rgba(99,102,241,0.16))",
          }}
        >
          {initialsFor(name)}
        </span>
      </div>
    </div>
  );
}
