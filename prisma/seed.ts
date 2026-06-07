import { PrismaClient, AdCategory } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing ads
  await prisma.adContent.deleteMany({});
  console.log('🧹 Cleared existing ads');

  // Create 10 sample ads
  const ads = [
    {
      title: 'Tech Product Launch - SmartWatch Pro',
      description: 'Experience the future of wearable technology with our latest smartwatch',
      videoUrl: 'https://example.com/videos/smartwatch.mp4',
      thumbnailUrl: 'https://example.com/thumbnails/smartwatch.jpg',
      durationSeconds: 45,
      category: AdCategory.TECH,
      targetCountries: 'US,CA,UK,AU,DE,FR',
      earningsPerView: 0.35,
      dailyViewLimit: 3,
      totalBudget: 1000,
      remainingBudget: 1000,
      isActive: true,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    },
    {
      title: 'Fashion Collection - Summer Essentials',
      description: 'Discover our new summer fashion line with exclusive discounts',
      videoUrl: 'https://example.com/videos/fashion.mp4',
      thumbnailUrl: 'https://example.com/thumbnails/fashion.jpg',
      durationSeconds: 60,
      category: AdCategory.FASHION,
      targetCountries: 'US,UK,FR,IT,ES,BR',
      earningsPerView: 0.40,
      dailyViewLimit: 2,
      totalBudget: 1500,
      remainingBudget: 1500,
      isActive: true,
      startDate: new Date(),
      endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'Automotive Showcase - Electric SUV',
      description: 'Test drive the all-electric SUV with 400-mile range',
      videoUrl: 'https://example.com/videos/automotive.mp4',
      thumbnailUrl: 'https://example.com/thumbnails/automotive.jpg',
      durationSeconds: 90,
      category: AdCategory.AUTOMOTIVE,
      targetCountries: 'US,CA,DE,UK,AU,JP',
      earningsPerView: 0.60,
      dailyViewLimit: 1,
      totalBudget: 5000,
      remainingBudget: 5000,
      isActive: true,
      startDate: new Date(),
      endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'Food Delivery Service - QuickBite',
      description: 'Get 50% off your first order with our food delivery app',
      videoUrl: 'https://example.com/videos/food.mp4',
      thumbnailUrl: 'https://example.com/thumbnails/food.jpg',
      durationSeconds: 30,
      category: AdCategory.FOOD,
      targetCountries: 'US,CA,UK,AU,NZ,IN',
      earningsPerView: 0.25,
      dailyViewLimit: 5,
      totalBudget: 800,
      remainingBudget: 800,
      isActive: true,
      startDate: new Date(),
      endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'Travel Adventure - Tropical Getaway',
      description: 'Book your dream vacation to exotic destinations',
      videoUrl: 'https://example.com/videos/travel.mp4',
      thumbnailUrl: 'https://example.com/thumbnails/travel.jpg',
      durationSeconds: 75,
      category: AdCategory.TRAVEL,
      targetCountries: 'US,CA,UK,AU,DE,FR',
      earningsPerView: 0.45,
      dailyViewLimit: 2,
      totalBudget: 2000,
      remainingBudget: 2000,
      isActive: true,
      startDate: new Date(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'Health & Wellness - Fitness Program',
      description: 'Transform your health with our 30-day fitness challenge',
      videoUrl: 'https://example.com/videos/health.mp4',
      thumbnailUrl: 'https://example.com/thumbnails/health.jpg',
      durationSeconds: 50,
      category: AdCategory.HEALTH,
      targetCountries: 'US,CA,UK,AU,DE,FR',
      earningsPerView: 0.30,
      dailyViewLimit: 4,
      totalBudget: 1200,
      remainingBudget: 1200,
      isActive: true,
      startDate: new Date(),
      endDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'Finance App - Budget Tracker Pro',
      description: 'Take control of your finances with our budgeting app',
      videoUrl: 'https://example.com/videos/finance.mp4',
      thumbnailUrl: 'https://example.com/thumbnails/finance.jpg',
      durationSeconds: 40,
      category: AdCategory.FINANCE,
      targetCountries: 'US,CA,UK,AU,DE,SG',
      earningsPerView: 0.35,
      dailyViewLimit: 3,
      totalBudget: 900,
      remainingBudget: 900,
      isActive: true,
      startDate: new Date(),
      endDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'Entertainment - Streaming Service',
      description: 'Watch exclusive content on our streaming platform',
      videoUrl: 'https://example.com/videos/entertainment.mp4',
      thumbnailUrl: 'https://example.com/thumbnails/entertainment.jpg',
      durationSeconds: 55,
      category: AdCategory.ENTERTAINMENT,
      targetCountries: 'US,CA,UK,AU,DE,FR',
      earningsPerView: 0.38,
      dailyViewLimit: 3,
      totalBudget: 1800,
      remainingBudget: 1800,
      isActive: true,
      startDate: new Date(),
      endDate: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'Gaming - Mobile RPG Adventure',
      description: 'Download and play our new mobile RPG game',
      videoUrl: 'https://example.com/videos/gaming.mp4',
      thumbnailUrl: 'https://example.com/thumbnails/gaming.jpg',
      durationSeconds: 65,
      category: AdCategory.GAMING,
      targetCountries: 'US,CA,UK,AU,DE,JP',
      earningsPerView: 0.42,
      dailyViewLimit: 2,
      totalBudget: 1600,
      remainingBudget: 1600,
      isActive: true,
      startDate: new Date(),
      endDate: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'Tech Gadgets - Wireless Earbuds',
      description: 'Experience crystal clear audio with our noise-cancelling earbuds',
      videoUrl: 'https://example.com/videos/earbuds.mp4',
      thumbnailUrl: 'https://example.com/thumbnails/earbuds.jpg',
      durationSeconds: 35,
      category: AdCategory.TECH,
      targetCountries: 'US,CA,UK,AU,DE,FR',
      earningsPerView: 0.28,
      dailyViewLimit: 5,
      totalBudget: 700,
      remainingBudget: 700,
      isActive: true,
      startDate: new Date(),
      endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    }
  ];

  for (const adData of ads) {
    const ad = await prisma.adContent.create({
      data: adData,
    });
    console.log(`✅ Created ad: ${ad.title}`);
  }

  console.log('🎉 Database seeding completed!');
  console.log(`📊 Created ${ads.length} ads with total budget of $${ads.reduce((sum, ad) => sum + ad.totalBudget, 0).toFixed(2)}`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });