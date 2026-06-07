// Simple test to verify the API works
async function testAdsAPI() {
    try {
        console.log('Testing /api/earn/ads endpoint...');

        const response = await fetch('http://localhost:3000/api/earn/ads', {
            headers: {
                'Cookie': 'auth-token=YOUR_AUTH_TOKEN_HERE' // Replace with actual token
            }
        });

        console.log('Status:', response.status);
        const data = await response.json();
        console.log('Response:', JSON.stringify(data, null, 2));

        if (response.ok && data.ads) {
            console.log(`\n✓ Success! Found ${data.ads.length} ads`);
            if (data.ads.length > 0) {
                console.log('\nFirst ad:');
                console.log('  ID:', data.ads[0].id);
                console.log('  Title:', data.ads[0].title);
                console.log('  Earnings:', data.ads[0].earningsPerView);
            }
        } else {
            console.log('\n✗ Error:', data.error || 'Unknown error');
        }
    } catch (error) {
        console.error('✗ Fetch error:', error);
    }
}

testAdsAPI();
