// Updated auth configuration - v2
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { compare } from "bcryptjs";

export const authOptions: NextAuthOptions = {
    debug: true,
    secret: process.env.NEXTAUTH_SECRET || "fallback-secret-123",
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/login",
        error: "/login",
    },
    providers: [
        CredentialsProvider({
            name: "Sign in",
            credentials: {
                email: {
                    label: "Email",
                    type: "email",
                    placeholder: "hello@example.com",
                },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email) {
                    return null;
                }

                try {
                    // "Name-based" login: Treat email as the unique identifier (or name)
                    // If user exists, return them. If not, create them.
                    const user = await db.user.upsert({
                        where: {
                            email: credentials.email,
                        },
                        update: {
                            // Update last login or comparable if needed, for now just retrieve
                        },
                        create: {
                            email: credentials.email,
                            name: credentials.email.split('@')[0], // Default name
                        },
                    });

                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                    };
                } catch (error) {
                    console.error("❌ Auth error:", error);
                    return null;
                }
            },


        }),
    ],
    callbacks: {
        async session({ session, token }) {
            return {
                ...session,
                user: {
                    ...session.user,
                    id: token.id,
                },
            };
        },
        async jwt({ token, user }) {
            if (user) {
                return {
                    ...token,
                    id: user.id,
                };
            }
            return token;
        },
    },
};
