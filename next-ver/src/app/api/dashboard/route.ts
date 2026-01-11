import { NextResponse } from "next/server";
import { loadDashboardData } from "@/lib/api/dashboard";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");

  if (!month) {
    return NextResponse.json({ error: "Missing month." }, { status: 400 });
  }

  try {
    const data = await loadDashboardData(month);
    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load dashboard data.";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
