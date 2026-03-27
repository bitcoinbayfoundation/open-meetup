import { Resend } from "resend";

export const isResendConfigured = !!process.env.RESEND_API_KEY;
export const resend = isResendConfigured
  ? new Resend(process.env.RESEND_API_KEY)
  : (null as unknown as Resend);
