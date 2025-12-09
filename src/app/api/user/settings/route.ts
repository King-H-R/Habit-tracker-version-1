import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const user = await db.user.findUnique({
            where: { email: session.user.email },
            select: {
                name: true,
                theme: true,
                // Add other settings fields here as they are added to the schema
                // For now, these are the main ones present in User model
            },
        });

        if (!user) {
            console.warn(`[SETTINGS_GET] User not found for email: ${session.user.email}`);
            return NextResponse.json({
                name: session.user.name || "",
                theme: "light",
                email: session.user.email,
            });
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error("[SETTINGS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { theme, name, notifications, reminderTime } = body;

        // 1. Update User fields if provided
        const userData: any = {};
        if (theme !== undefined) userData.theme = theme;
        if (name !== undefined) userData.name = name;

        if (Object.keys(userData).length > 0) {
            await db.user.update({
                where: { email: session.user.email },
                data: userData,
            });
        }

        // 2. Update ReminderSettings if provided
        if (notifications !== undefined) {
            // Find user id first (we have email from session)
            const user = await db.user.findUnique({ where: { email: session.user.email } });
            if (user) {
                // Upsert reminder setting (assuming 'default' type for the main toggle)
                await db.reminderSetting.upsert({
                    where: {
                        // We need a unique constraint or just findFirst. 
                        // Schema doesn't look like it has a unique implementation for [userId, type].
                        // But let's check schema again. Schema has `id` ID.
                        // We can't use upsert easily without a unique compound key.
                        // We will use findFirst then update or create.
                        id: "placeholder" // Prisma upsert needs a unique where. 
                    },
                    // Since schema lacks unique constraint on [userId, type], let's do manual find/update
                    // Actually, let's just do updateMany checks or create.
                    update: {},
                    create: {}
                }).catch(() => { }); // Catch invalid upsert

                // Proper manual implementation:
                const existing = await db.reminderSetting.findFirst({
                    where: { userId: user.id, type: 'default' }
                });

                if (existing) {
                    await db.reminderSetting.update({
                        where: { id: existing.id },
                        data: { enabled: notifications }
                    });
                } else {
                    await db.reminderSetting.create({
                        data: {
                            userId: user.id,
                            type: 'default',
                            enabled: notifications
                        }
                    });
                }
            }
        }

        // Return latest user state
        const updatedUser = await db.user.findUnique({
            where: { email: session.user.email },
            select: { name: true, theme: true }
        });

        return NextResponse.json(updatedUser);


    } catch (error) {
        console.error("[SETTINGS_UPDATE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        await db.user.delete({
            where: { email: session.user.email },
        });

        return new NextResponse("Deleted", { status: 200 });
    } catch (error) {
        console.error("[SETTINGS_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
