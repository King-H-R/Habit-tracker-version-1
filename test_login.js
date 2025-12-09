const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function testLoginCredentials() {
    // Get the most recent user
    const user = await prisma.user.findFirst({
        orderBy: { createdAt: 'desc' }
    });

    if (!user) {
        console.log('❌ No users found in database');
        return;
    }

    console.log('=== TESTING LOGIN FOR LATEST USER ===');
    console.log('Email:', user.email);
    console.log('Name:', user.name);
    console.log('Has password:', !!user.password);
    console.log('Password hash:', user.password?.substring(0, 30) + '...');
    console.log('');

    // Prompt user to enter the password they think they used
    const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });

    readline.question('Enter the password you tried to login with: ', async (testPassword) => {
        console.log('');
        console.log('Testing password:', testPassword);

        const isValid = await bcrypt.compare(testPassword, user.password);

        if (isValid) {
            console.log('✅ SUCCESS! Password matches');
        } else {
            console.log('❌ FAILED! Password does not match');
            console.log('');
            console.log('This means either:');
            console.log('1. You are entering a different password than when you registered');
            console.log('2. There was an issue during registration that corrupted the password');
        }

        readline.close();
        await prisma.$disconnect();
    });
}

testLoginCredentials()
    .catch((e) => {
        console.error('Error:', e);
        process.exit(1);
    });
