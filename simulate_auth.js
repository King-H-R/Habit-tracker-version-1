const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function simulateAuth() {
    console.log('=== SIMULATING NEXTAUTH AUTHORIZATION ===\n');

    const credentials = {
        email: 'singh@gmail.com',
        password: 'Password123'
    };

    console.log('Step 1: Checking credentials...');
    console.log('Email:', credentials.email);
    console.log('Password:', credentials.password);
    console.log('');

    console.log('Step 2: Looking up user in database...');
    const user = await prisma.user.findUnique({
        where: {
            email: credentials.email,
        },
    });

    console.log('User lookup result:', user ? '✅ Found' : '❌ Not found');
    if (user) {
        console.log('User details:', {
            id: user.id,
            email: user.email,
            hasPassword: !!user.password,
            passwordLength: user.password?.length
        });
    }
    console.log('');

    if (!user || !user.password) {
        console.log('❌ User not found or no password');
        await prisma.$disconnect();
        return;
    }

    console.log('Step 3: Comparing passwords...');
    console.log('Input password:', credentials.password);
    console.log('Stored hash:', user.password.substring(0, 30) + '...');

    const isPasswordValid = await bcrypt.compare(
        credentials.password,
        user.password
    );

    console.log('Password comparison result:', isPasswordValid ? '✅ Valid' : '❌ Invalid');
    console.log('');

    if (!isPasswordValid) {
        console.log('❌ Password validation failed');
        await prisma.$disconnect();
        return;
    }

    console.log('✅ Authentication successful!');
    console.log('Returning user object:', {
        id: user.id,
        email: user.email,
        name: user.name || null,
    });

    await prisma.$disconnect();
}

simulateAuth();
