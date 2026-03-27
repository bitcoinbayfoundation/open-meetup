import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { admin, twoFactor } from "better-auth/plugins";
import { apiKey } from "@better-auth/api-key";
import { nextCookies } from "better-auth/next-js";
import { pool } from "./db";
import { resend, isResendConfigured } from "./resend";
import { getBaseUrl } from "./get-host";
import config from "@/site.config";

const ALLOWED_EMAILS = config.auth.allowedEmails.map((e) => e.toLowerCase());
const FROM_EMAIL = `${config.email.fromName} <${config.email.fromAddress}>`;

const baseURL = getBaseUrl();

export const auth = betterAuth({
  appName: config.auth.appName,
  baseURL,
  trustedOrigins: [
    config.url,
    "https://www." + config.contact.domain,
    ...(baseURL.includes("vercel.app") ? [baseURL] : []),
  ],
  database: pool,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    ...(isResendConfigured
      ? {
          sendResetPassword: async ({ user, url }) => {
            const accent = config.theme.colors.accent;
            const dark = config.theme.colors.dark;
            const surface = config.theme.colors.surface;
            void resend.emails.send({
              from: FROM_EMAIL,
              to: user.email,
              subject: "Reset your password",
              html: `
                <div style="font-family: monospace; background: ${dark}; color: ${surface}; padding: 40px; max-width: 500px;">
                  <h1 style="color: ${accent}; font-size: 24px; margin-bottom: 16px;">password reset.</h1>
                  <p style="color: ${surface}; opacity: 0.7; line-height: 1.7; margin-bottom: 24px;">
                    Click the link below to reset your password. This link expires in 1 hour.
                  </p>
                  <a href="${url}" style="display: inline-block; background: ${accent}; color: ${surface}; padding: 12px 32px; text-decoration: none; font-family: monospace; font-size: 14px;">
                    reset password
                  </a>
                  <p style="color: ${surface}; opacity: 0.3; font-size: 12px; margin-top: 32px;">
                    If you didn't request this, ignore this email.
                  </p>
                </div>
              `,
            });
          },
        }
      : {}),
  },
  databaseHooks: {
    user: {
      create: {
        async before(user) {
          const email = user.email.toLowerCase();
          if (!ALLOWED_EMAILS.includes(email)) {
            throw new APIError("BAD_REQUEST", {
              message: "Sign-up is restricted to approved emails. Add your email to site.config.ts → auth.allowedEmails.",
            });
          }
          return { data: user };
        },
      },
    },
  },
  plugins: [admin(), twoFactor(), apiKey(), nextCookies()],
});
