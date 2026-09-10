import { createPin, listPublicPins, parseCreateBody, parseDeviceId } from "@/lib/store";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const deviceId = parseDeviceId(url.searchParams.get("deviceId") ?? "");
  if (!deviceId) {
    return NextResponse.json({ error: "Missing device id." }, { status: 400 });
  }
  const pins = await listPublicPins(deviceId);
  return NextResponse.json({ pins, serverTime: Date.now() });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const parsed = parseCreateBody(body);
  if (typeof parsed === "string") {
    return NextResponse.json({ error: parsed }, { status: 400 });
  }
  const pin = await createPin(parsed);
  return NextResponse.json({ pin }, { status: 201 });
}
