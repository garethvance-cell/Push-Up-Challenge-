import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { findUserByName, verifyPin } from "@/lib/auth";
import { createSession } from "@/lib/session";

const schema = z.object({
  name: z.string().min(1),
  pin: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { name, pin } = parsed.data;
  const user = await findUserByName(name);
  if (!user || !(await verifyPin(pin, user.pinHash))) {
    return NextResponse.json({ error: "Incorrect name or PIN." }, { status: 401 });
  }

  await createSession(user.id);
  return NextResponse.json({ id: user.id, name: user.name });
}
