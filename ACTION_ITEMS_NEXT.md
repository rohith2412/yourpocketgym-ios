# Next Steps for PocketGym Subscription Launch

## Summary of Completed Work

✅ **Recipe image visibility fixed** - Removed clipped margins, image now displays properly
✅ **Full frontend IAP system implemented** - react-native-iap service, hooks, and UI
✅ **Beautiful paywall component** - Premium gate with blur effect, feature list, pricing
✅ **Backend subscription system** - MongoDB model and 3 API endpoints
✅ **Complete documentation** - Implementation guides and templates
✅ **All 3 premium features gated** - AI Trainer, Recipes, Macro Scanner

## Critical Action Items (Must Do Before App Store Launch)

### 1. ⚠️ Get App Store API Credentials (Week 1)
**Deadline:** Before any testing

```bash
# Step 1: Go to https://appstoreconnect.apple.com/
# Step 2: Navigate to Users and Access > API Keys
# Step 3: Click "Generate API Key"
# Step 4: Select "In-App Purchase"
# Step 5: Download the .p8 file - KEEP IT SAFE
# Step 6: Note your Key ID and Issuer ID
```

**Add to `.env.local`:**
```
APP_STORE_KEY_ID=<your key id>
APP_STORE_ISSUER_ID=<your issuer id>
APP_STORE_PRIVATE_KEY=<paste contents of .p8 file>
```

### 2. ⚠️ Create Products in App Store Connect (Week 1)

```
Go to App Store Connect > Your App > In-App Purchases

Create 2 subscriptions:

1) Premium Monthly
   - Product ID: com.pocketgym.premium.monthly
   - Price: $12.99/month
   - Currency: USD
   - Auto-renewal: YES
   - Trial: 7 days free

2) Premium Annual (Optional for now)
   - Product ID: com.pocketgym.premium.annual
   - Price: $99.99/year
   - Currency: USD
   - Auto-renewal: YES
   - Trial: 7 days free
```

### 3. ⚠️ Implement Real Apple Verification (Week 2)

**File:** `/Users/rohith/developer/gym_v1/lib/appStoreVerify.js`

Option A (Recommended): Install library
```bash
cd /Users/rohith/developer/gym_v1
npm install apple-app-store-api
```

Then create the file using the template at:
`/Users/rohith/developer/gym_v1/lib/appStoreVerify.template.js`

Option B (Manual): Implement JWT signing yourself

**Then update verify-receipt route:**
```javascript
// In /app/api/subscription/verify-receipt/route.js
import { verifyAppStoreReceipt } from "@/lib/appStoreVerify";

const result = await verifyAppStoreReceipt(transactionId);
```

### 4. ⚠️ Test with TestFlight (Week 2-3)

```bash
# 1. Build and upload to TestFlight
#    Xcode > Product > Archive > Upload to App Store

# 2. In App Store Connect:
#    - Add yourself as a Sandbox tester
#    - Get Sandbox tester account credentials

# 3. On device/simulator:
#    - Sign in with test user account
#    - Install from TestFlight
#    - Test purchase flow (should show App Store prompt)
#    - Verify receipt is sent to backend
#    - Check MongoDB - subscription should be created
#    - Close and reopen app - should show as premium

# 4. Test Restore Purchases
#    - Reinstall app
#    - Tap "Restore Purchases"
#    - Should show premium status
```

### 5. ⚠️ Add Cancellation UI (Week 3)

In `app/profile.jsx` or profile screen:
```jsx
// Show if user is premium
<Pressable onPress={() => cancelSubscription()}>
  <Text>Cancel Subscription</Text>
</Pressable>

// Implement by calling:
// POST /api/subscription/cancel (create this endpoint)
```

## Important Configuration

### Frontend Bundle ID Check
Make sure in `src/config/iapConfig.ts`:
```typescript
bundleId: "com.pocketgym.app"  // Matches your iOS app bundle ID
```

And in `app.json`:
```json
{
  "ios": {
    "bundleIdentifier": "com.pocketgym.app"
  }
}
```

### Backend Database
Verify MongoDB connection is working:
```bash
# Run test query
# The subscription model will auto-create indexes
```

## Timeline Recommendation

**Week 1:**
- [ ] Get App Store credentials
- [ ] Create 2 products in App Store Connect
- [ ] Update `.env.local` with credentials
- [ ] Test locally (mock purchases)

**Week 2:**
- [ ] Implement real Apple verification
- [ ] Build and upload to TestFlight
- [ ] Test purchase flow on device

**Week 3:**
- [ ] Fix any issues found in testing
- [ ] Test restore purchases
- [ ] Test on multiple devices
- [ ] Prepare for App Store submission

**Week 4:**
- [ ] Add cancellation UI
- [ ] Final security review
- [ ] Submit to App Store

## Files to Reference

### Documentation
- `SUBSCRIPTION_SYSTEM_COMPLETE.md` - Full overview
- `SUBSCRIPTION_IMPLEMENTATION.md` - Detailed guide with code examples
- `lib/appStoreVerify.template.js` - Template for real verification

### Frontend Code
- `components/PremiumGate.tsx` - Paywall UI
- `src/services/iapService.ts` - IAP service
- `src/hooks/usePurchase.ts` - Purchase hook
- `src/hooks/useSubscription.ts` - Status hook

### Backend Code
- `models/subscriptionModel.js` - MongoDB schema
- `app/api/subscription/status/route.js` - Status endpoint
- `app/api/subscription/verify-receipt/route.js` - Verification
- `app/api/subscription/restore/route.js` - Restore endpoint

## Testing Checklist

Before submitting to App Store:

**Purchase Flow:**
- [ ] User sees paywall on premium feature
- [ ] Tap "Subscribe Now" launches App Store
- [ ] Purchase goes through
- [ ] Receipt is sent to backend
- [ ] Subscription created in MongoDB
- [ ] Paywall closes
- [ ] User can access premium features

**Subscription Status:**
- [ ] Open app shows premium status
- [ ] Close and reopen app - still premium
- [ ] Check subscription status in profile
- [ ] Days until renewal shows correctly

**Restore Flow:**
- [ ] Delete app
- [ ] Reinstall
- [ ] Tap "Restore Purchases"
- [ ] Subscription restored from backup
- [ ] Premium access restored

**Error Cases:**
- [ ] User cancels purchase - shows error
- [ ] Network error during verification - shows error
- [ ] Invalid receipt - shows error
- [ ] Already purchased - shows appropriate message

## Security Checklist

Before going to production:

- [ ] `APP_STORE_PRIVATE_KEY` only in `.env.local` (never in code)
- [ ] `.env.local` in `.gitignore` ✅
- [ ] All API endpoints check JWT/NextAuth ✅
- [ ] Receipt data encrypted in database ❌ (TODO)
- [ ] HTTPS enforced for all API calls ✅
- [ ] Error messages don't leak sensitive data ✅

## Troubleshooting Reference

**"Product not found"**
- Verify product IDs match App Store Connect exactly
- Check bundle ID is correct
- Make sure products are set to "Active" status

**"Invalid receipt"**
- Verify App Store API credentials are correct
- Check JWT token is properly signed
- Ensure receipt data is base64 encoded

**"Subscription not showing"**
- Check JWT token is being sent correctly
- Verify MongoDB connection
- Check user ID matches between frontend and backend

## Post-Launch Monitoring

Once live:
- [ ] Monitor subscription creation rate
- [ ] Check for verification errors in logs
- [ ] Track user feedback on paywall
- [ ] Monitor App Store analytics
- [ ] Check refund/cancellation rates

## Next Steps If Blocked

If you need help at any point:

1. **For App Store credentials** - See apple.com/app-store-connect-help/
2. **For Apple API issues** - See developer.apple.com/documentation/appstoreserverapi/
3. **For react-native-iap** - See github.com/dooboolab-community/react-native-iap
4. **For our code** - Reference the implementation guide

## Important Reminders

⚠️ **DO NOT:**
- Use test/sandbox credentials in production
- Ship code with mock verification
- Store unencrypted receipts
- Trust client-side subscription checks

✅ **DO:**
- Always verify receipts with Apple
- Keep private key secure
- Test thoroughly on devices
- Monitor for suspicious activity
- Have a backup plan for verification failures

## Questions?

If you have any questions during implementation:
1. Check `SUBSCRIPTION_IMPLEMENTATION.md` troubleshooting
2. Review the template files for examples
3. Reference Apple's official documentation
4. Test on TestFlight before production

**You're ready to build! 🚀**
