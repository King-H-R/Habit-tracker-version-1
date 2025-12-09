const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function verify() {
    const user = await prisma.user.findUnique({
        where: { email: 'singh@gmail.com' }
    });

    console.log('=== VERIFICATION ===');
    console.log('Email:', user.email);
    console.log('Password hash:', user.password);
    console.log('');

    const testPassword = 'Password123';
    console.log('Testing password:', testPassword);

    const isValid = await bcrypt.compare(testPassword, user.password);
    console.log('Comparison result:', isValid ? '✅ VALID' : '❌ INVALID');

    await prisma.$disconnect();
}

verify();
