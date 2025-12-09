"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

export interface SessionProviderProps {
    children: React.ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
    return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
