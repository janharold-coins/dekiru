"use client";
import { createAuthClient } from "better-auth/react";

/** Browser side of sign-in; talks to /api/auth on the same origin. */
export const authClient = createAuthClient();
