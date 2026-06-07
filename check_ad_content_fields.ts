import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function checkAdContentFields() {
    const ad = await db.adContent.findFirst();

    if (ad) {
        console.log('AdContent fields:', Object.keys(ad));
        console.log('Sample ad:', JSON.stringify(ad, null, 2));
    } else {
        console.log('No ads found');
    }
}

checkAdContentFields()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await db.$disconnect();
    });
