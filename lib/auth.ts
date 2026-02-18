import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE_NAME = "native_market_session";

const SESSION_DURATION_SECONDS = 60 * 60 * 12;

type SessionPayload = {
  authenticated: true;
};

function getSessionSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;

  if (!secret || secret.length === 0) {
    throw new Error("SESSION_SECRET is required");
  }

  return new TextEncoder().encode(secret);
}

export function isValidMarketPassword(password: string): boolean {
  const expected = process.env.MARKET_APP_PASSWORD;

  if (!expected || expected.length === 0) {
    throw new Error("MARKET_APP_PASSWORD is required");
  }

  return password.trim() === expected.trim();
}

export async function createSessionToken(): Promise<string> {
  const payload: SessionPayload = { authenticated: true };

  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSessionSecret());
}

export async function verifySessionToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify<SessionPayload>(token, getSessionSecret());
    return payload.authenticated === true;
  } catch {
    return false;
  }
}

export function getSessionMaxAge(): number {
  return SESSION_DURATION_SECONDS;
}
