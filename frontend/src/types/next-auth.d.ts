import 'next-auth';
import { JWT as NextAuthJWT } from 'next-auth/jwt';
import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    refreshToken?: string;
    scope?: string;
    user: {
      id: string;
      email: string;
      name: string;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends NextAuthJWT {
    accessToken?: string;
    refreshToken?: string;
    scope?: string;
  }
}