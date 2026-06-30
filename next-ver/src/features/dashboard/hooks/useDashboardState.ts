import { useMemo, useState } from "react";
import {
  formatMonthKey,
  parseMonthKey,
  shiftMonthKey,
} from "@/features/dashboard/utils/dates";

export const useDashboardState = () => {
  const [currentMonth, setCurrentMonth] = useState(() =>
    formatMonthKey(new Date())
  );
  const todayMonthKey = useMemo(() => formatMonthKey(new Date()), []);
  const selectedMonthDate = useMemo(
    () => parseMonthKey(currentMonth),
    [currentMonth]
  );
  const todayMonthDate = useMemo(
    () => parseMonthKey(todayMonthKey),
    [todayMonthKey]
  );
  const isViewingCurrentMonth = currentMonth === todayMonthKey;
  const canNavigateNextMonth = selectedMonthDate < todayMonthDate;
  const monthLabel = useMemo(
    () =>
      selectedMonthDate.toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric",
      }),
    [selectedMonthDate]
  );
  const canEditCurrentMonth = isViewingCurrentMonth;
  const handleChangeMonth = (direction: "prev" | "next") => {
    if (direction === "next" && !canNavigateNextMonth) {
      return;
    }
    const targetMonth =
      direction === "next"
        ? shiftMonthKey(currentMonth, 1)
        : shiftMonthKey(currentMonth, -1);
    const targetDate = parseMonthKey(targetMonth);
    if (targetDate > todayMonthDate) {
      setCurrentMonth(todayMonthKey);
      return;
    }
    setCurrentMonth(targetMonth);
  };

  return {
    currentMonth,
    monthLabel,
    canNavigateNextMonth,
    isViewingCurrentMonth,
    canEditCurrentMonth,
    handleChangeMonth,
  };
};
