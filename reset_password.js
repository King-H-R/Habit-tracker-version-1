const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function resetPassword() {
    // Configuration
    const userEmail = 'aizenvimal@gmail.com'; // Change this to your email
    const newPassword = 'Password123'; // Change this to your desired password

    console.log('=== PASSWORD RESET TOOL ===\n');
    console.log(`Email: ${userEmail}`);
    console.log(`New Password: ${newPassword}\n`);

    // Find the user
    const user = await prisma.user.findUnique({
        where: { email: userEmail }
    });

    if (!user) {
        console.log('❌ User not found!');
        console.log('\nAvailable users:');
        const allUsers = await prisma.user.findMany({
            select: { email: true }
        });
        allUsers.forEach(u => console.log(`  - ${u.email}`));
        return;
    }

    console.log('✓ User found');
    console.log(`Old password hash: ${user.password?.substring(0, 30)}...\n`);

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    console.log('✓ New password hashed');
    console.log(`New password hash: ${hashedPassword.substring(0, 30)}...\n`);

    // Update the user
    await prisma.user.update({
        where: { email: userEmail },
        data: { password: hashedPassword }
    });

    console.log('✓ Password updated successfully!\n');

    // Verify the update
    const isValid = await bcrypt.compare(newPassword, hashedPassword);
    console.log(`✓ Verification: ${isValid ? 'Password works!' : 'Error - password mismatch'}\n`);

    console.log('=== YOU CAN NOW LOGIN WITH ===');
    console.log(`Email: ${userEmail}`);
    console.log(`Password: ${newPassword}`);
}

resetPassword()
    .catch((e) => {
        console.error('Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
