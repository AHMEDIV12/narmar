import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function testAdFetch() {
    try {
        const userId = 'cm4cg0v420003jyosqo81n08f'; // Replace with actual user ID

        // Test the static ads query
        const user = await db.user.findFirst({
            select: {
                id: true,
                country: true,
                dateOfBirth: true,
                subscriptionTier: true,
            },
        });

        if (!user) {
            console.error('No users found in database');
            return;
        }

        console.log('Testing with user:', user.id);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const staticAds = await db.adContent.findMany({
            where: {
                isActive: true,
                remainingBudget: { gt: 0 },
                OR: [
                    { targetCountries: '' },
                    { targetCountries: undefined },
                    { targetCountries: { contains: user.country || '' } },
                ],
            },
            include: {
                network: true,
            },
            take: 10,
        });

        console.log(`Found ${staticAds.length} static ads`);

        if (staticAds.length > 0) {
            console.log('First ad:', staticAds[0]);
        }

        // Test view counts
        const adsWithViewCounts = await Promise.all(
            staticAds.map(async (ad) => {
                const viewCount = await db.adView.count({
                    where: {
                        adId: ad.id,
                        userId: user.id,
                        createdAt: { gte: today },
                    },
                });
                return { ad, viewCount };
            })
        );

        const availableAds = adsWithViewCounts.filter(
            ({ ad, viewCount }) => viewCount < ad.dailyViewLimit
        );

        console.log(`${availableAds.length} ads available for user after filtering`);
    } catch (error) {
        console.error('Error:', error);
    }
}

testAdFetch()
    .then(() => process.exit(0))
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await db.$disconnect();
    });
