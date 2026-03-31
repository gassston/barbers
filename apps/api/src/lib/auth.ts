import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma.js";
import { config } from "../config.js";

export const auth = betterAuth({
  secret: config.BETTER_AUTH_SECRET,
  baseURL: config.BETTER_AUTH_URL,

  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24,     // refresh if 1 day old
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 min client-side cache
    },
  },

  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "CLIENT",
        input: false, // not settable via sign-up form
      },
      phone: {
        type: "string",
        required: false,
      },
    },
  },

  trustedOrigins: config.NODE_ENV === "development"
    ? ["http://localhost:3000", "http://localhost:4000"]
    : [],
});

export type Auth = typeof auth;
export type Session = typeof auth.$Infer.Session;
