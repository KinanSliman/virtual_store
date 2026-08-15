"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  createSessionToken,
  isAuthConfigured,
  verifyPassword,
} from "@/lib/auth";

export type LoginState = { error?: string };

/**
 * Only same-site dashboard paths are accepted, so a crafted `next` parameter
 * can't turn the login form into an open redirect.
 */
function safeDestination(value: FormDataEntryValue | null): string {
  const candidate = typeof value === "string" ? value : "";
  return candidate.startsWith("/dashboard") && !candidate.startsWith("//")
    ? candidate
    : "/dashboard";
}

export async function signIn(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  if (!isAuthConfigured()) {
    return {
      error:
        "No dashboard password is configured. Set DASHBOARD_PASSWORD on the server.",
    };
  }

  const submitted = String(formData.get("password") ?? "");
  if (!verifyPassword(submitted)) {
    return { error: "Incorrect password." };
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, createSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  redirect(safeDestination(formData.get("next")));
}

export async function signOut(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  redirect("/");
}
