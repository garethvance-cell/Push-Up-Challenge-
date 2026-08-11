import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createUser, findUserByName, NAME_REGEX, PIN_REGEX } from "@/lib/auth";
import { createSession } from "@/lib/session";

const schema = z.object({
  name: z.string().regex(NAME_REGEX, "Name must be 2-30 characters (letters, numbers, spaces)."),
  pin: z.string().regex(PIN_REGEX, "PIN must be 4-6 digits."),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { name, pin } = parsed.data;

  const existing = await findUserByName(name);
  if (existing) {
    return NextResponse.json(
      { error: "That name is already taken. Try logging in instead." },
      { status: 409 }
    );
  }

  const user = await createUser(name, pin);
  await createSession(user.id);

  return NextResponse.json({ id: user.id, name: user.name });
}
