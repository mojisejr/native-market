"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  createSessionToken,
  getSessionMaxAge,
  isValidMarketPassword,
  SESSION_COOKIE_NAME,
} from "@/lib/auth";

export type LoginState = {
  error?: string;
};

export async function loginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const passwordValue = formData.get("password");
  const password = typeof passwordValue === "string" ? passwordValue : "";

  if (!isValidMarketPassword(password)) {
    return { error: "รหัสผ่านไม่ถูกต้อง" };
  }

  const token = await createSessionToken();
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: getSessionMaxAge(),
  });

  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  redirect("/login");
}
