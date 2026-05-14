import { NextRequest, NextResponse } from "next/server";
import { decodeSession } from "@/lib/session";
import { getEmployeeByEmail, saveEmployee, calcCompletion } from "@/lib/employeeStore";
import { saveUploadedFile } from "@/lib/fileUpload";
import { randomUUID } from "crypto";
import type { Employee } from "@/types";

function getUser(req: NextRequest) {
  const cookie = req.cookies.get("tb_user");
  return cookie ? decodeSession(cookie.value) : null;
}

/** POST /api/employees/me/photo — multipart/form-data with field "photo" */
export async function POST(req: NextRequest) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("photo");

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: "Formato inválido. Use JPG, PNG ou WEBP." }, { status: 400 });
  }

  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json({ error: "Arquivo muito grande. Máximo 2 MB." }, { status: 400 });
  }

  const fileId = `photo-${randomUUID()}`;
  const filename = await saveUploadedFile(file, fileId);
  const photoUrl = `/api/notas-fiscais/file/${filename}`;

  const now = new Date().toISOString();
  const existing = getEmployeeByEmail(user.email);

  const emp: Employee = {
    ...existing,
    id: existing?.id ?? randomUUID(),
    email: user.email,
    name: existing?.name ?? user.name,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    photoUrl,
    completion: 0,
  };
  emp.completion = calcCompletion(emp);
  saveEmployee(emp);

  return NextResponse.json({ photoUrl });
}
