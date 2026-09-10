import { parseDeviceId, toggleGoing } from "@/lib/store";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const deviceId = parseDeviceId(
    body && typeof body === "object" ? (body as { deviceId?: unknown }).deviceId : null
  );
  if (!deviceId) {
    return NextResponse.json({ error: "Missing device id." }, { status: 400 });
  }
  const pin = await toggleGoing(id, deviceId);
  if (!pin) {
    return NextResponse.json({ error: "Pin is gone." }, { status: 404 });
  }
  return NextResponse.json({ pin });
}
