import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { saveRequest } from "@/lib/store";
import { buildGoogleFlightsUrl } from "@/lib/googleFlights";
import { sendNewRequestNotification } from "@/lib/email";
import type { TravelRequest } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const request: TravelRequest = {
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      status: "pending",
      requester: {
        name: body.name,
        email: body.email,
        phone: body.phone || undefined,
      },
      travel: {
        type: body.type,
        origin: body.origin || undefined,
        destination: body.destination,
        departureDate: body.departureDate || undefined,
        returnDate: body.returnDate || undefined,
        preferredTimes: body.preferredTimes || undefined,
        passengers: Number(body.passengers) || 1,
        eventName: body.eventName || undefined,
        notes: body.notes || undefined,
      },
    };

    if (body.type !== "event" && body.origin && body.destination && body.departureDate) {
      request.flightSearchUrl = buildGoogleFlightsUrl(
        body.origin,
        body.destination,
        body.departureDate,
        body.returnDate || undefined,
        request.travel.passengers
      );
    }

    saveRequest(request);

    // Email is best-effort — don't fail the request if not configured yet
    sendNewRequestNotification(request).catch((err) =>
      console.error("Email notification failed:", err)
    );

    return NextResponse.json({ success: true, id: request.id });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao processar solicitação" }, { status: 500 });
  }
}
