import "server-only";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const NAME_REGEX = /^[a-zA-Z0-9 _.'-]{2,30}$/;
export const PIN_REGEX = /^\d{4,6}$/;

export function normalizeName(name: string) {
  return name.trim();
}

export async function createUser(name: string, pin: string) {
  const pinHash = await bcrypt.hash(pin, 10);
  return prisma.user.create({
    data: { name: normalizeName(name), pinHash },
  });
}

export async function findUserByName(name: string) {
  return prisma.user.findFirst({
    where: { name: { equals: normalizeName(name), mode: "insensitive" } },
  });
}

export async function verifyPin(pin: string, pinHash: string) {
  return bcrypt.compare(pin, pinHash);
}
