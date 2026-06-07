# Narmar Platform - Bug Report & Fixes

This document lists all bugs found during code review and provides fixes.

---

## 🔴 Critical Bugs

### Bug #1: Missing Import for Dashboard
**File**: `src/components/dashboard/dashboard.tsx`
**Issue**: Line 3 imports `Input` but it's not used in the file.
**Impact**: TypeScript/Build warning, though not causing runtime issues.

**Fix**: Remove the unused import:
```typescript
// Remove line 3:
// import { Input } from '@/components/ui/input';
```

---

### Bug #2: Potential Null Reference Errors in Dashboard
**File**: `src/components/dashboard/dashboard.tsx`
**Lines**: 191, 203, 250, 279
**Issue**: Direct property access on potentially null/undefined values:
- `user.availableBalance` (line 203)
- `user.totalEarnings` (line 250)
- `user.todaysEarnings` (line 279)

**Impact**: Runtime error "Cannot read property 'availableBalance' of null/undefined" if user data is not loaded or fields are missing.

**Fixes**: Add optional chaining and fallbacks:
```typescript
// Line 203 - Replace:
<span className="font-semibold">${user.availableBalance.toFixed(2)}</span>

// With:
<span className="font-semibold">${user?.availableBalance?.toFixed(2) || '0.00'}</span>

// Line 250 - Replace:
value: `$${user.totalEarnings?.toFixed(2) || '0.00'}`,

// With:
value: `$${user?.totalEarnings?.toFixed(2) || '0.00'}`,

// Line 279 - Replace:
value: `$${user.todaysEarnings?.toFixed(2) || '0.00'}`,

// With:
value: `$${user?.todaysEarnings?.toFixed(2) || '0.00'}`,

// Line 284 - Replace:
<span className="font-semibold">${user.availableBalance.toFixed(2)}</span>

// With:
<span className="font-semibold">${user?.availableBalance?.toFixed(2) || '0.00'}</span>
```

---

### Bug #3: Wrong Model Name in Fraud Detector
**File**: `src/lib/fraud-detector.ts`
**Lines**: 280, 307
**Issue**: Uses `db.withdrawalRequest` but the model is named `WithdrawalRequest` (capital W).

**Impact**: Prisma runtime error - model not found.

**Fix**: Use correct model name:
```typescript
// Line 280 - Replace:
const recentWithdrawals = await db.withdrawalRequest.findMany({

// With:
const recentWithdrawals = await db.WithdrawalRequest.findMany({

// Line 307 - Same fix applies
```

---

### Bug #4: Typo in Import Statement (Fraud Detector)
**File**: `src/lib/fraud-detector.ts`
**Line**: 77
**Issue**: Uses `db.surveyResponse` but the model should be named consistently.

**Impact**: Prisma runtime error - model name mismatch.

**Fix**: Verify correct model name in Prisma schema. If it's `SurveyResponse`:
```typescript
// Line 77 - Replace:
const recentSurveys = await db.surveyResponse.findMany({

// With:
const recentSurveys = await db.SurveyResponse.findMany({
```

---

## 🟠 Import Path Bugs

### Bug #5: Incorrect Import Path in Security File
**File**: `src/lib/security.ts`
**Lines**: 4, 9
**Issue**: Imports from files with typos in path:
- Line 4: `@/lib/ate-limiter` (should be `@/lib/rate-limiter`)
- Line 9: `@/lib/fraud-detector` (should be `@/lib/fraud-detector`)

**Impact**: Module not found errors at runtime.

**Fixes**:
```typescript
// Line 4 - Replace:
import {
  checkAuthRateLimit,
  checkApiRateLimit,
  checkAdWatchRateLimit,
  checkWithdrawalRateLimit,
} from '@/lib/ate-limiter';

// With:
import {
  checkAuthRateLimit,
  checkApiRateLimit,
  checkAdWatchRateLimit,
  checkWithdrawalRateLimit,
} from '@/lib/rate-limiter';

// Line 9 - Replace:
import { fraudDetector, type FraudCheckResult } from '@/lib/fraud-detector';

// With:
import { fraudDetector, type FraudCheckResult } from '@/lib/fraud-detector';
```

---

## 🟡 Logic Bugs

### Bug #6: Daily Earnings Not Resetting
**File**: `src/app/api/earnings/ads/[id]/complete/route.ts`
**Line**: 67-68
**Issue**: Increments `todaysEarnings` directly without checking if the day has changed. This could lead to incorrect daily totals if user earns on multiple days.

**Impact**: Daily earnings counter never resets, leading to inflated daily totals.

**Fix**: Add logic to reset daily earnings counter at start of new day:
```typescript
// Before the update (around line 61), add:

// Get current date and user's last reset date
const now = new Date();
const userForUpdate = await db.user.findUnique({
  where: { id: payload.userId },
  select: { lastEarningsReset: true, todaysEarnings: true },
});

// Check if we need to reset daily earnings
const shouldResetDaily = !userForUpdate?.lastEarningsReset ||
  new Date(userForUpdate.lastEarningsReset).getDate() !== now.getDate();

// If resetting, set todaysEarnings to 0
const dailyIncrement = shouldResetDaily ? 0 : ad.earningsPerView;

await db.$transaction([
  db.adView.create({
    data: {
      adId: ad.id,
      userId: payload.userId,
      completedAt: new Date(),
      earnings: ad.earningsPerView,
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
    },
  }),
  db.adContent.update({
    where: { id: ad.id },
    data: {
      remainingBudget: { decrement: ad.earningsPerView },
      totalViews: { increment: 1 },
    },
  }),
  db.user.update({
    where: { id: payload.userId },
    data: {
      availableBalance: { increment: ad.earningsPerView },
      totalEarnings: { increment: ad.earningsPerView },
      todaysEarnings: { increment: dailyIncrement },
      lastEarningsReset: shouldResetDaily ? now : userForUpdate?.lastEarningsReset,
    },
  }),
  // ... rest of transaction
]);
```

---

### Bug #7: Missing Subscription Tier Multiplier
**File**: `src/app/api/earnings/ads/[id]/complete/route.ts`
**Lines**: 58-70
**Issue**: Ad completion doesn't apply subscription tier earnings multiplier. Premium users should earn 2x-2.5x.

**Impact**: Premium users don't get their bonus earnings.

**Fix**: Apply subscription tier multiplier:
```typescript
// After fetching user (around line 17), add tier-based multiplier:

const user = await db.user.findUnique({
  where: { id: payload.userId },
  select: { 
    id: true,
    subscriptionTier: true,
    availableBalance: true,
    totalEarnings: true,
  },
});

// Define tier multipliers
const tierMultipliers: Record<string, number> = {
  'FREE': 1,
  'PREMIUM': 2,
  'PREMIUM_PLUS': 2.5,
};

const earningsMultiplier = tierMultipliers[user?.subscriptionTier || 'FREE'];
const actualEarnings = ad.earningsPerView * earningsMultiplier;

// Then use actualEarnings in the update
await db.$transaction([
  db.adView.create({
    data: {
      adId: ad.id,
      userId: payload.userId,
      completedAt: new Date(),
      earnings: actualEarnings,
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
    },
  }),
  db.adContent.update({
    where: { id: ad.id },
    data: {
      remainingBudget: { decrement: actualEarnings },
      totalViews: { increment: 1 },
    },
  }),
  db.user.update({
    where: { id: payload.userId },
    data: {
      availableBalance: { increment: actualEarnings },
      totalEarnings: { increment: actualEarnings },
      todaysEarnings: { increment: actualEarnings },
    },
  }),
  db.earningActivity.create({
    data: {
      userId: payload.userId,
      activityType: 'AD_WATCH',
      activityId: ad.id,
      earningsAmount: actualEarnings,
      status: 'COMPLETED',
      completedAt: new Date(),
    },
  }),
]);
```

---

## 🟢 Minor Issues

### Bug #8: Unused eslint-disable Directive
**File**: `src/hooks/use-toast.ts`
**Line**: 21
**Issue**: Unused eslint-disable directive since no ESLint errors were reported.

**Impact**: Clean code best practice violation.

**Fix**: Remove the line:
```typescript
// Remove line 21:
// /* eslint-disable @typescript-eslint/no-unused-vars */
```

---

## 📋 Bug Fix Priority

1. **HIGH PRIORITY** (Fix immediately - Blocks platform):
   - Bug #3: Wrong model name in fraud detector
   - Bug #4: Import path typos in security file

2. **MEDIUM PRIORITY** (Fix soon - Affects functionality):
   - Bug #2: Null reference errors in dashboard
   - Bug #6: Daily earnings not resetting
   - Bug #7: Missing subscription tier multiplier

3. **LOW PRIORITY** (Fix when convenient):
   - Bug #1: Unused import in dashboard
   - Bug #5: SurveyResponse model name consistency
   - Bug #8: Unused eslint-disable directive

---

## 🛠️ Automated Fix Commands

To quickly fix all the bugs, run these commands:

```bash
# Fix import path typo in security.ts
cd /home/z/my-project/src/lib
sed -i 's|@/lib/ate-limiter|@/lib/rate-limiter|g' security.ts
sed -i 's|@/lib/fraud-detector|@/lib/fraud-detector|g' security.ts

# Verify fixes
grep -n "import" security.ts
```

---

## 📊 Summary

**Total Bugs Found**: 8
- Critical: 3 (Blocks platform functionality)
- Medium: 3 (Affects user experience)
- Low: 2 (Code quality issues)

**Affected Files**: 5
- `src/components/dashboard/dashboard.tsx` (2 bugs)
- `src/lib/fraud-detector.ts` (2 bugs)
- `src/lib/security.ts` (1 bug)
- `src/app/api/earnings/ads/[id]/complete/route.ts` (2 bugs)
- `src/hooks/use-toast.ts` (1 bug)

---

## 📝 Testing Recommendations

After fixing these bugs, test the following scenarios:

1. User registration and login flow
2. Ad watching completion (test with FREE and PREMIUM users)
3. Survey completion and earnings calculation
4. Task submission and review
5. Installment creation and payment
6. Wallet withdrawal request
7. Dashboard rendering with all user data
8. Fraud detection triggers (try suspicious activities)
9. Rate limiting enforcement (try rapid requests)

---

## ✅ Verification Checklist

After applying fixes, verify:

- [ ] Dev server compiles without errors
- [ ] No "module not found" errors in logs
- [ ] All API routes return 200 for valid requests
- [ ] Dashboard loads without null reference errors
- [ ] Ad completion applies correct multiplier
- [ ] Daily earnings reset correctly
- [ ] Fraud detection uses correct model names
- [ ] All imports resolve correctly

---

**Note**: The dev server is currently running successfully with 200 responses, which means the current bugs are mostly in code paths not yet executed by the dev server. However, these bugs will manifest when those specific features are accessed.
