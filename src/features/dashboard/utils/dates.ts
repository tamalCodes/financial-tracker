export const formatMonthKey = (date: Date) => {
  const normalized = new Date(date.getFullYear(), date.getMonth(), 1);
  return `${normalized.getFullYear()}-${String(
    normalized.getMonth() + 1
  ).padStart(2, "0")}-01`;
};

export const parseMonthKey = (key: string) => {
  const [yearStr, monthStr] = key.split("-");
  const year = Number(yearStr);
  const monthIndex = Number(monthStr) - 1;
  return new Date(year, monthIndex, 1);
};

export const shiftMonthKey = (key: string, delta: number) => {
  const date = parseMonthKey(key);
  date.setMonth(date.getMonth() + delta);
  return formatMonthKey(date);
};

// Mobile handoff style: "Today" for today, else "25 Jun" (no ordinal suffix).
export const formatTxnDate = (isoDate: string) => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  if (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  ) {
    return "Today";
  }
  return `${date.getDate()} ${date.toLocaleDateString("en-IN", { month: "short" })}`;
};
