import { db } from '../src/lib/db';
import { AdNetworkType, AdFormat } from '../generated/prisma';

/**
 * Seed ad networks with default configurations
 */
async function seedAdNetworks() {
    console.log('Seeding ad networks...');

    const networks = [
        {
            name: 'Google AdSense',
            type: AdNetworkType.GOOGLE_ADSENSE,
            description: 'Google\'s advertising platform for publishers',
            isActive: true,
            priority: 10,
            averageEcpm: 3.50,
            fillRate: 95,
            config: {
                publisherId: 'pub-PLACEHOLDER',
                apiKey: 'PLACEHOLDER_KEY',
                isConfigured: false,
            },
        },
        {
            name: 'PropellerAds',
            type: AdNetworkType.PROPELLERADS,
            description: 'Push notifications and native ad network',
            isActive: true,
            priority: 8,
            averageEcpm: 2.80,
            fillRate: 90,
            config: {
                apiKey: 'PLACEHOLDER_KEY',
                zoneId: 'PLACEHOLDER_ZONE',
                isConfigured: false,
            },
        },
        {
            name: 'Adsterra',
            type: AdNetworkType.ADSTERRA,
            description: 'Pop-unders and native advertising',
            isActive: true,
            priority: 9,
            averageEcpm: 3.20,
            fillRate: 92,
            config: {
                publisherId: 'PLACEHOLDER_PUB',
                apiSecret: 'PLACEHOLDER_SECRET',
                isConfigured: false,
            },
        },
        {
            name: 'Media.net',
            type: AdNetworkType.MEDIANET,
            description: 'Yahoo Bing Network contextual ads',
            isActive: true,
            priority: 7,
            averageEcpm: 2.60,
            fillRate: 88,
            config: {
                customerId: 'PLACEHOLDER_CUSTOMER',
                siteId: 'PLACEHOLDER_SITE',
                isConfigured: false,
            },
        },
        {
            name: 'RevContent',
            type: AdNetworkType.REVCONTENT,
            description: 'Native advertising and content discovery',
            isActive: true,
            priority: 6,
            averageEcpm: 2.40,
            fillRate: 85,
            config: {
                apiKey: 'PLACEHOLDER_KEY',
                publisherId: 'PLACEHOLDER_PUB',
                isConfigured: false,
            },
        },
        {
            name: 'AdGem',
            type: AdNetworkType.ADGEM,
            description: 'Offerwall for gamified earning',
            isActive: true,
            priority: 9,
            averageEcpm: 4.00,
            fillRate: 80,
            config: {
                apiKey: 'PLACEHOLDER_KEY',
                appId: 'PLACEHOLDER_APP',
                isConfigured: false,
            },
        },
        {
            name: 'OfferToro',
            type: AdNetworkType.OFFERTORO,
            description: 'Offerwall with surveys and tasks',
            isActive: true,
            priority: 8,
            averageEcpm: 3.80,
            fillRate: 82,
            config: {
                apiKey: 'PLACEHOLDER_KEY',
                appId: 'PLACEHOLDER_APP',
                isConfigured: false,
            },
        },
    ];

    for (const networkData of networks) {
        const { config, ...networkInfo } = networkData;

        const network = await db.adNetwork.upsert({
            where: { name: networkInfo.name },
            create: networkInfo,
            update: networkInfo,
        });

        await db.adNetworkConfig.upsert({
            where: { networkId: network.id },
            create: {
                networkId: network.id,
                ...config,
            },
            update: config,
        });

        console.log(`✓ Seeded ${network.name}`);
    }

    console.log('✅ Ad networks seeded successfully!');
}

/**
 * Create sample ad campaigns
 */
async function seedSampleCampaigns() {
    console.log('Seeding sample campaigns...');

    const networks = await db.adNetwork.findMany();

    for (const network of networks.slice(0, 3)) {
        // Create 1 campaign per network
        await db.adCampaign.create({
            data: {
                networkId: network.id,
                name: `${network.name} Campaign`,
                adFormat: AdFormat.VIDEO,
                budget: 1000,
                isActive: true,
            },
        });

        console.log(`✓ Created campaign for ${network.name}`);
    }

    console.log('✅ Sample campaigns seeded!');
}

async function main() {
    try {
        await seedAdNetworks();
        await seedSampleCampaigns();
        console.log('\n🎉 Database seeding completed!');
    } catch (error) {
        console.error('Error seeding database:', error);
        throw error;
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
