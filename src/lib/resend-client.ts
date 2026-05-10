import { Resend } from "resend";

export function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

export const RESEND_FROM =
  process.env.RESEND_FROM ?? "LitienGuard <litienguard@resend.dev>";
