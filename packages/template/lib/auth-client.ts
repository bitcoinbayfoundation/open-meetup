"use client";

import { createAuthClient } from "better-auth/react";
import { adminClient, twoFactorClient } from "better-auth/client/plugins";
import { apiKeyClient } from "@better-auth/api-key/client";

export const authClient = createAuthClient({
  plugins: [
    adminClient(),
    apiKeyClient(),
    twoFactorClient({
      onTwoFactorRedirect() {
        window.location.href = "/admin/two-factor";
      },
    }),
  ],
});
