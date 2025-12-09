
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        // We can't easily check the return type without a real query, but we can verify the model definition if exposed,
        // or insert a dummy user and see if we can read password?
        // Better: check the DMMF (Data Model Meta Format) which Prisma Client exposes.

        // Accessing internal _dmmf property if available
        if (prisma._dmmf && prisma._dmmf.datamodel) {
            const userModel = prisma._dmmf.datamodel.models.find(m => m.name === 'User');
            if (userModel) {
                console.log("Found User model in DMMF.");
                const passwordField = userModel.fields.find(f => f.name === 'password');
                if (passwordField) {
                    console.log("✅ 'password' field exists in DMMF.");
                } else {
                    console.log("❌ 'password' field MISSING in DMMF.");
                }
            } else {
                console.log("❌ User model not found in DMMF.");
            }
        } else {
            console.log("Could not access _dmmf.");

            // Fallback: Try to query and see if it throws or returns (if we have a user)
            // Or create a user with dummy data
            console.log("Testing query...");
            // This might fail if DB is empty or connection fails, but let's try strict findFirst
            const user = await prisma.user.findFirst();
            console.log("User found:", user ? "Yes" : "No");
            if (user) {
                console.log("Keys in user object:", Object.keys(user));
            }
        }

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
