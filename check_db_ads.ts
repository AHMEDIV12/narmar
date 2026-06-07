
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  console.log('Checking ads in database...');
  
  const ads = await db.adContent.findMany();
  console.log(`Found ${ads.length} ads in total.`);
  
  if (ads.length > 0) {
    console.log('Sample ad:', ads[0]);
  }

  const activeAds = await db.adContent.findMany({
    where: {
      isActive: true,
      remainingBudget: { gt: 0 },
    }
  });
  console.log(`Found ${activeAds.length} active ads with budget.`);

  // Check if there are any users
  const users = await db.user.findMany({ take: 1 });
  if (users.length > 0) {
    const user = users[0];
    console.log('Testing with user:', user.email, 'Country:', user.country);
    
    const targetedAds = await db.adContent.findMany({
        where: {
          isActive: true,
          remainingBudget: { gt: 0 },
          OR: [
            { targetCountries: '' },
            { targetCountries: { contains: user.country || '' } },
          ],
        },
      });
      console.log(`Ads available for user ${user.email}: ${targetedAds.length}`);
  } else {
    console.log('No users found in database.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
