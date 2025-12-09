const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany();
    console.log('Total users:', users.length);
    console.log('');
    users.forEach(user => {
        console.log({
            id: user.id,
            email: user.email,
            name: user.name,
            hasPassword: !!user.password,
            passwordLength: user.password ? user.password.length : 0,
            passwordPreview: user.password ? user.password.substring(0, 20) + '...' : 'NULL'
        });
    });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
