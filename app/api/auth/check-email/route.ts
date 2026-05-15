import { NextRequest, NextResponse } from "next/server";
import { getEmployeeByEmail } from "@/lib/employeeStore";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email")?.toLowerCase().trim();
  if (!email) return NextResponse.json({ exists: false });

  const emp = getEmployeeByEmail(email);
  if (!emp) return NextResponse.json({ exists: false });

  return NextResponse.json({
    exists:      true,
    hasPassword: !!emp.passwordHash,
    name:        emp.name,
  });
}
