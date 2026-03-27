"use client";

import { createAuthClient } from "better-auth/react";
import { magicLinkClient } from "better-auth/client/plugins";
import { adminClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL ?? (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"),
  plugins: [
    magicLinkClient(),
    adminClient(),
  ],
  sessionOptions: {
    refetchOnWindowFocus: false,
  },
});

export const { signIn, signOut, useSession } = authClient;
