import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/infrastructure/db";
import {
  accountsTable,
  sessionsTable,
  usersTable,
  verificationTokensTable,
} from "@/infrastructure/auth-schema";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable,
    accountsTable,
    sessionsTable,
    verificationTokensTable,
  }),
  providers: [
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: process.env.AUTH_RESEND_FROM,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      return user.email === process.env.HOST_EMAIL;
    },
  },
});
