import { NextRequest, NextResponse } from "next/server";
import { decodeSession } from "@/lib/session";
import { getFilePath, fileExists } from "@/lib/fileUpload";
import fs from "fs";
import path from "path";

type Ctx = { params: Promise<{ filename: string }> };

function isAdmin(req: NextRequest) {
  const c = req.cookies.get("tb_admin");
  return c && c.value === process.env.ADMIN_SECRET;
}

export async function GET(req: NextRequest, { params }: Ctx) {
  const userCookie = req.cookies.get("tb_user");
  const user = userCookie ? decodeSession(userCookie.value) : null;
  const admin = isAdmin(req);

  if (!admin && !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { filename } = await params;
  // Prevent path traversal
  const safe = path.basename(filename);
  const filePath = getFilePath(safe);

  if (!fileExists(safe)) {
    return NextResponse.json({ error: "Arquivo não encontrado" }, { status: 404 });
  }

  const buffer = fs.readFileSync(filePath);
  const ext = safe.split(".").pop()?.toLowerCase() ?? "bin";

  const mimeMap: Record<string, string> = {
    pdf:  "application/pdf",
    png:  "image/png",
    jpg:  "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp",
    xml:  "application/xml",
  };
  const contentType = mimeMap[ext] ?? "application/octet-stream";

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `inline; filename="${safe}"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
