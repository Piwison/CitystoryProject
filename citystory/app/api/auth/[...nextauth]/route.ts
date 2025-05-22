import NextAuth, { DefaultSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import type { NextAuthOptions } from "next-auth";

// 1. Extend NextAuth.js's built-in types
// IMPORTANT: This 'declare module' block should be at the TOP of your file
// and should be the ONLY one that extends "next-auth" in your entire project.
declare module "next-auth" {
  // Extend DefaultSession to include your custom properties on the user object in the session
  interface Session {
    accessToken?: string; // Custom property for Django JWT access token
    refreshToken?: string; // Custom property for Django JWT refresh token (optional, for client-side use)
    user?: { // Re-declare user to ensure correct type merging
      id?: string; // Custom ID property (from Django)
      name?: string | null; // Standard NextAuth.js property
      email?: string | null; // Standard NextAuth.js property
      image?: string | null; // Standard NextAuth.js property
      isModerator?: boolean; // Custom property (from Django)
      auth_type?: string; // Custom property (from Django)
    } & DefaultSession['user']; // Merge with DefaultSession's user properties
  }

  // Extend the JWT type to include custom user properties from Django
  interface JWT {
    accessToken?: string; // Django JWT Access Token
    refreshToken?: string; // Django JWT Refresh Token
    googleAccessToken?: string; // Google's own Access Token (if needed)

    // Define a specific type for the custom user object stored in the JWT
    // This makes it easier to refer to and ensures consistency.
    customUser?: {
      id: string; // Django User ID (as string)
      name: string; // User's full name
      email: string; // User's email
      isModerator: boolean; // User's moderator status
      auth_type?: string; // How the user authenticated
    };
  }
}

// 2. Define the type for the user object received from your Django backend
type DjangoBackendUser = {
  id: number; // Django usually uses numeric IDs
  email: string;
  first_name?: string;
  last_name?: string;
  is_staff?: boolean;
  auth_type?: string; // e.g., 'google', 'credentials'
  // Add any other fields you expect from your Django user model
};

// 3. Define the type for the full response from your Django backend's Google OAuth callback
type BackendGoogleAuthResponse = {
  access: string; // Your Django JWT access token
  refresh: string; // Your Django JWT refresh token
  user: DjangoBackendUser; // The Django user object
};

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials) {
          console.log("No credentials provided for Credentials Provider.");
          return null;
        }
        const { username, password } = credentials;
        console.log("Attempting credentials login with:", username);

        const base = process.env.BACKEND_URL || "http://localhost:8000";
        const loginUrl = base.endsWith('/api') ? `${base}/login/` : `${base}/api/login/`;

        try {
          const res = await fetch(loginUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
          });

          if (!res.ok) {
            const errorData = await res.json();
            console.error("Credentials login failed on backend:", errorData);
            throw new Error(errorData.detail || "Credentials login failed.");
          }

          const tokens: { access: string; refresh: string; user: DjangoBackendUser } = await res.json();
          console.log("Tokens received from Django credentials login:", tokens);

          if (!tokens.user) {
            console.error("No user data in Django credentials login response.");
            return null;
          }
          
          // Construct the 'user' object that NextAuth.js's 'authorize' expects.
          // This object will be passed to the 'jwt' callback.
          // Ensure 'id' is a string as NextAuth's User type expects it.
          const userForNextAuth: { id: string; name?: string | null; email?: string | null; image?: string | null; accessToken?: string; refreshToken?: string; isModerator?: boolean; auth_type?: string } = {
            id: tokens.user.id.toString(), // Convert number ID to string here
            email: tokens.user.email,
            name: `${tokens.user.first_name || ''} ${tokens.user.last_name || ''}`.trim() || tokens.user.email,
            accessToken: tokens.access,
            refreshToken: tokens.refresh,
            isModerator: tokens.user.is_staff || false,
            auth_type: tokens.user.auth_type || 'credentials',
          };
          
          return userForNextAuth;
        } catch (error) {
          console.error("Error during credentials login:", error);
          throw error;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('[NextAuth] signIn callback input:', { user, account, profile });

      if (account?.provider === "google") {
        const base = process.env.BACKEND_URL || "http://localhost:8000";
        const googleCallbackUrl = base.endsWith('/api') ? `${base}/auth/google/callback/` : `${base}/api/auth/google/callback/`;

        if (!account.code) {
          console.error('[NextAuth] Google signIn: No authorization code received from Google.');
          throw new Error("NoGoogleAuthCode");
        }

        try {
          console.log(`[NextAuth] Sending Google auth code to backend: ${googleCallbackUrl}`);
          const res = await fetch(googleCallbackUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              code: account.code,
            }),
          });

          if (!res.ok) {
            const errorData = await res.json();
            console.error("Backend Google OAuth callback failed:", errorData);
            throw new Error(errorData.detail || "Google SSO authentication failed on backend.");
          }

          const backendResponse: BackendGoogleAuthResponse = await res.json();
          console.log('[NextAuth] Backend Google OAuth callback successful:', backendResponse);

          // IMPORTANT: Augment the 'user' object received by signIn callback.
          // This 'user' object will then be passed to the 'jwt' callback.
          // We use type assertion to tell TypeScript that this 'user' object
          // will contain our custom properties for the JWT.
          const userForJwt = user as { id: string; name?: string | null; email?: string | null; image?: string | null; accessToken?: string; refreshToken?: string; isModerator?: boolean; auth_type?: string };

          userForJwt.id = backendResponse.user.id.toString(); // Convert number ID to string
          userForJwt.email = backendResponse.user.email;
          userForJwt.name = `${backendResponse.user.first_name || ''} ${backendResponse.user.last_name || ''}`.trim() || backendResponse.user.email;
          userForJwt.accessToken = backendResponse.access;
          userForJwt.refreshToken = backendResponse.refresh;
          userForJwt.isModerator = backendResponse.user.is_staff || false;
          userForJwt.auth_type = backendResponse.user.auth_type;

        } catch (error) {
          console.error("Error during Google OAuth callback to backend:", error);
          if (error instanceof Error) {
            throw new Error(`GoogleAuthError: ${error.message}`);
          }
          throw new Error("Unknown Google authentication error.");
        }
      }
      console.log('[NextAuth] signIn callback: authentication flow success');
      return true;
    },

    async jwt({ token, user, account, profile }) {
      console.log('[NextAuth] jwt callback input:', { token, user, account, profile });

      // 'user' is only populated on the first sign-in (after 'authorize' or 'signIn' returns a user).
      // This is where we transfer the Django user data and tokens into the JWT.
      if (user) {
        // 'user' here is the object returned by 'authorize' (Credentials) or augmented in 'signIn' (Google).
        // It should already have its 'id' as a string and augmented properties.
        const authUser = user as { id: string; email: string; name?: string | null; image?: string | null; accessToken?: string; refreshToken?: string; isModerator?: boolean; auth_type?: string };
        
        // Populate the customUser object within the token
        token.customUser = {
          id: authUser.id,
          name: authUser.name || authUser.email || '', // Ensure name is a string
          email: authUser.email,
          isModerator: authUser.isModerator || false,
          auth_type: authUser.auth_type,
        };
        
        // Assign tokens directly to the top-level token object as well
        token.accessToken = authUser.accessToken;
        token.refreshToken = authUser.refreshToken;
        
        if (account?.provider === 'google' && account.access_token) {
           token.googleAccessToken = account.access_token;
        }
      }

      // Token refresh logic here if needed
      // If token.accessToken is expired, use token.refreshToken to get new tokens from Django backend.
      // You'd need an `isJwtExpired` function and a `refreshDjangoTokens` function.

      console.log('[NextAuth] jwt callback output:', token);
      return token;
    },

    async session({ session, token, user }) {
      console.log('[NextAuth] session callback input:', { session, token, user });

      // Add custom user info from the JWT token to the session object
      // Access custom properties directly from token.customUser
      if (token?.customUser) { // Check if customUser exists on the token
        session.user = {
          ...session.user, // Preserve default NextAuth.js session user properties (like image from profile)
          id: token.customUser.id,
          name: token.customUser.name,
          email: token.customUser.email,
          isModerator: token.customUser.isModerator,
          auth_type: token.customUser.auth_type,
        };
      }
      
      // Expose your Django JWT access token on the session for client-side use
      if (token?.accessToken) {
        session.accessToken = token.accessToken;
      }
      
      // Optionally, expose Google's own access token if stored in JWT
      if (token?.googleAccessToken) {
        session.user = { // Ensure session.user is defined before adding properties
          ...session.user,
          image: (session.user as any)?.image, // Keep existing image if any
          // You might merge googleAccessToken into a specific part of session.user
          // or keep it as a top-level property if you extend Session again for it.
          // (session.user as any).googleAccessToken = token.googleAccessToken; // Example, requires Session.user to have googleAccessToken
        }
      }

      console.log('[NextAuth] session callback output:', session);
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };