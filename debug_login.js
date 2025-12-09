const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function debugLogin() {
    console.log('=== DEBUG LOGIN CREDENTIALS ===\n');

    // Get all users
    const users = await prisma.user.findMany({
        select: {
            email: true,
            password: true,
        }
    });

    console.log(`Found ${users.length} users in database:\n`);

    // For each user, let's try to understand their password
    for (const user of users) {
        console.log(`Email: ${user.email}`);
        console.log(`Has password: ${!!user.password}`);
        if (user.password) {
            console.log(`Password hash: ${user.password.substring(0, 30)}...`);
            console.log(`Hash length: ${user.password.length}`);
            console.log(`Hash algorithm: ${user.password.startsWith('$2b$') ? 'bcrypt' : user.password.startsWith('$2a$') ? 'bcrypt' : 'unknown'}`);
        }
        console.log('---\n');
    }

    // Now let's test a specific email/password combination
    console.log('=== TEST SPECIFIC LOGIN ===\n');

    // Prompt: What email and password are you trying to use?
    // For now, let's test with the first user
    const testEmail = users[0]?.email;

    if (testEmail) {
        console.log(`Testing login for: ${testEmail}`);
        console.log('\nTrying common passwords:');

        const commonPasswords = [
            'password',
            'Password123',
            'test123',
            '123456',
            'password123',
            'Password',
            'test',
            'admin',
            'admin123',
        ];

        const user = await prisma.user.findUnique({
            where: { email: testEmail }
        });

        for (const pwd of commonPasswords) {
            try {
                const isValid = await bcrypt.compare(pwd, user.password);
                if (isValid) {
                    console.log(`✅ MATCH FOUND: "${pwd}"`);
                } else {
                    console.log(`❌ "${pwd}" - no match`);
                }
            } catch (err) {
                console.log(`❌ "${pwd}" - error: ${err.message}`);
            }
        }
    }
}

debugLogin()
    .catch((e) => {
        console.error('Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
