import { NextRequest, NextResponse } from "next/server";
import { getEmployeeByEmail } from "@/lib/employeeStore";
import { ALLOWED_EMAILS } from "@/lib/allowedEmails";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email")?.toLowerCase().trim();
  if (!email) return NextResponse.json({ exists: false });

  if (!ALLOWED_EMAILS.has(email)) {
    return NextResponse.json({ exists: false });
  }

  const emp = getEmployeeByEmail(email);

  if (!emp) {
    // E-mail autorizado mas ainda não tem registro — primeiro acesso
    return NextResponse.json({ exists: true, hasPassword: false, name: null, isNew: true });
  }

  return NextResponse.json({
    exists:      true,
    hasPassword: !!emp.passwordHash,
    name:        emp.name,
    isNew:       false,
  });
}
