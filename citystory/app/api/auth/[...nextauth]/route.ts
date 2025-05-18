import NextAuth, { DefaultSession }  from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import type { NextAuthOptions } from "next-auth";


declare module "next-auth" {
  interface Session {
    accessToken?: string;
  }
}

// Helper to call Django backend for SSO registration
async function registerSSOUserInDjango(user: { email: string; given_name?: string; family_name?: string }) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/register/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: user.email,
        first_name: user.given_name || "",
        last_name: user.family_name || "",
        // No password for SSO
      }),
    });
    if (!res.ok) {
      const error = await res.json();
      console.error("Django SSO registration failed:", error);
    }
    return true;
  } catch (err) {
    console.error("Error registering SSO user in Django:", err);
    return false;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials) {
          console.log("No credentials provided");
          return null;
        }
        const { username, password } = credentials;
        console.log("Attempting login with:", username);

        // Fix API base URL to avoid double /api
        const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const loginUrl = base.endsWith('/api') ? `${base}/login/` : `${base}/api/login/`;
        const userProfileUrl = base.endsWith('/api') ? `${base}/user-profile/` : `${base}/api/user-profile/`;

        // 1. Login to get tokens
        const res = await fetch(loginUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });
        if (!res.ok) {
          console.log("Login failed:", await res.text());
          return null;
        }
        const tokens = await res.json();
        console.log("Tokens received:", tokens);

        // User object now comes directly from login response
        if (!tokens.user) {
          console.log("No user data in login response");
          return null;
        }
        
        // Add tokens to the user object
        const user = {
          ...tokens.user,
          accessToken: tokens.access,
          refreshToken: tokens.refresh,
        };
        
        return user;
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/login", // Redirect errors to login page
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('[NextAuth] signIn callback input:', { user, account, profile });
      if (account?.provider === "google" && user?.email) {
        const success = await registerSSOUserInDjango({
          email: user.email,
          given_name: (profile as any)?.given_name,
          family_name: (profile as any)?.family_name,
        });
        if (!success) {
          console.log('[NextAuth] signIn callback: SSO registration failed');
          throw new Error("SSOFailed");
        }
      }
      console.log('[NextAuth] signIn callback: success');
      return true;
    },
    async jwt({ token, user, account, profile, isNewUser }) {
      console.log('[NextAuth] jwt callback input:', { token, user, account, profile, isNewUser });
      // Add user info to token when first authenticating
      if (user) {
        // Get clean user data and convert is_staff to isModerator
        token.user = {
          id: user.id,
          name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
          email: user.email,
          isModerator: user.is_staff || false,
          accessToken: user.accessToken,
          refreshToken: user.refreshToken
        };
      }
      // Persist Google access_token to the token
      if (account && account.provider === 'google' && account.access_token) {
        token.accessToken = account.access_token;
      }
      console.log('[NextAuth] jwt callback output:', token);
      return token;
    },
    async session({ session, token, user }) {
      console.log('[NextAuth] session callback input:', { session, token, user });
      // Add token user info to session
      if (token?.user) {
        session.user = {
          name: token.user.name,
          email: token.user.email,
          image: session.user?.image, // Preserve image if present
          isModerator: token.user.isModerator
        };
      }
      // Expose accessToken on the session
      if (token?.user?.accessToken) {
        session.accessToken = token.user.accessToken;
      }
      console.log('[NextAuth] session callback output:', session);
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 