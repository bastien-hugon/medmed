"use server";

import { redirect } from "next/navigation";
import { timingSafeEqual } from "node:crypto";
import { clearSession, createSession } from "@/lib/auth";

export type LoginState = { error?: string } | null;

function safeEquals(a: string, b: string) {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const password = String(formData.get("password") ?? "");
  const expected = process.env.AUTH_PASSWORD;
  if (!expected) return { error: "AUTH_PASSWORD non configuré côté serveur." };
  if (!password) return { error: "Mot de passe requis." };
  if (!safeEquals(password, expected)) return { error: "Mot de passe incorrect." };

  await createSession();
  redirect("/dashboard");
}

export async function logout() {
  await clearSession();
  redirect("/login");
}
