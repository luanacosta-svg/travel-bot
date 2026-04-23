import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.delete("tb_user");
  res.cookies.delete("tb_admin");
  return res;
}
