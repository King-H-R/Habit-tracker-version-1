const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function testLogin() {
    // Get a user from database
    const user = await prisma.user.findFirst();

    if (!user) {
        console.log('No users found');
        return;
    }

    console.log('Testing login for user:', user.email);
    console.log('Has password:', !!user.password);
    console.log('Password hash starts with:', user.password?.substring(0, 10));

    // Ask the user to input their password
    console.log('\n=== TEST PASSWORD COMPARISON ===');
    console.log('User email:', user.email);
    console.log('Try some test passwords:');

    // Test with some common passwords
    const testPasswords = ['password', 'Password123', 'test123', '123456'];

    for (const testPwd of testPasswords) {
        const isValid = await bcrypt.compare(testPwd, user.password);
        console.log(`Password "${testPwd}": ${isValid ? '✓ MATCH' : '✗ NO MATCH'}`);
    }

    console.log('\n=== HASH A NEW PASSWORD ===');
    const newPassword = 'TestPassword123';
    const newHash = await bcrypt.hash(newPassword, 10);
    console.log(`Original: "${newPassword}"`);
    console.log(`Hash: ${newHash}`);
    const testCompare = await bcrypt.compare(newPassword, newHash);
    console.log(`Comparison works: ${testCompare ? '✓ YES' : '✗ NO'}`);
}

testLogin()
    .catch((e) => {
        console.error('Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
