
import { GET } from './src/app/api/earn/ads/route.ts';
import { signJWT } from './src/lib/utils/auth.ts';
import { db } from './src/lib/db.ts';
import { NextRequest } from 'next/server';

// Mock NextRequest since we can't easily import the real one in this environment if not available,
// but usually it is available in 'next/server'.
// If 'next/server' is not available in ts-node context easily without next build, we might have issues.
// But let's try.

async function main() {
  console.log('Testing Ads API Endpoint...');

  // 1. Get a user
  const user = await db.user.findFirst();
  if (!user) {
    console.error('No user found to test with.');
    return;
  }
  console.log('Using user:', user.email, user.id);

  // 2. Generate Token
  const token = await signJWT({
    userId: user.id,
    email: user.email,
    role: user.role
  });
  console.log('Generated token.');

  // 3. Mock Request
  // We need to mock cookies.
  const req = {
    cookies: {
      get: (name: string) => {
        if (name === 'auth-token') return { value: token };
        return undefined;
      }
    },
    nextUrl: {
        searchParams: new URLSearchParams()
    }
  } as unknown as NextRequest;

  // 4. Call API
  try {
    const response = await GET(req);
    console.log('Response Status:', response.status);
    
    if (response.status === 200) {
        const data = await response.json();
        console.log('Response Data Ads Count:', data.ads?.length);
        if (data.ads && data.ads.length > 0) {
            console.log('Success! Ads returned.');
        } else {
            console.log('Warning: No ads returned (but 200 OK).');
        }
    } else {
        const data = await response.json();
        console.log('Error Response:', data);
    }

  } catch (error) {
    console.error('API Call Failed:', error);
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await db.$disconnect();
  });
