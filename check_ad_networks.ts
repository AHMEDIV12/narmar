import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
    console.log('Checking ad networks in database...');

    const networks = await db.adNetwork.findMany();
    console.log(`Found ${networks.length} ad networks.`);

    if (networks.length > 0) {
        console.log('Networks:', networks);
    }

    const activeNetworks = await db.adNetwork.findMany({
        where: { isActive: true }
    });
    console.log(`Found ${activeNetworks.length} active ad networks.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await db.$disconnect();
    });
