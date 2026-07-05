// Greeting identity — prefer the full name captured at signup (D-A); fall back to
// deriving from the email local-part for accounts created before full_name existed.
// The greeting shows the FIRST name only; the avatar shows up to two initials.
export function identityFrom(
  fullName: string | null | undefined,
  email: string | null | undefined
) {
  const words = (fullName ?? "").trim().split(/\s+/).filter(Boolean);

  if (words.length) {
    const first = words[0];
    const initials =
      words
        .map((w) => w.charAt(0).toUpperCase())
        .join("")
        .slice(0, 2) || "U";
    return { name: first, initials };
  }

  // Fallback: email local-part (e.g. arjun.kapoor@… → "Arjun", "AK").
  const local = (email ?? "").split("@")[0] ?? "";
  const parts = local.split(/[._-]+/).filter(Boolean);
  const name = parts.length
    ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1)
    : "there";
  const initials =
    parts
      .map((p) => p.charAt(0).toUpperCase())
      .join("")
      .slice(0, 2) || "U";
  return { name, initials };
}
