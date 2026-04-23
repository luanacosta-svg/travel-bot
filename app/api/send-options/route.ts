import { NextRequest, NextResponse } from "next/server";
import { getRequest, updateStatus } from "@/lib/store";
import { sendOptionsToRequester } from "@/lib/email";
import type { FlightOption } from "@/types";

export async function POST(req: NextRequest) {
  const adminKey = req.headers.get("x-admin-key");
  if (adminKey !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { requestId, selectedOptionIds, managerMessage } = await req.json();

    const travelRequest = getRequest(requestId);
    if (!travelRequest) {
      return NextResponse.json({ error: "Solicitação não encontrada" }, { status: 404 });
    }

    const selected: FlightOption[] = selectedOptionIds?.length
      ? (travelRequest.flightOptions ?? []).filter((f) =>
          selectedOptionIds.includes(f.id)
        )
      : [];

    await sendOptionsToRequester(travelRequest, selected, managerMessage ?? "");
    updateStatus(requestId, "options_sent");

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao enviar opções" }, { status: 500 });
  }
}
