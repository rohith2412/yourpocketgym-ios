/**
 * In-App Purchase Configuration
 *
 * This file contains configuration for App Store In-App Purchases
 *
 * SETUP INSTRUCTIONS:
 *
 * 1. App Store Connect Configuration:
 *    - Go to App Store Connect (https://appstoreconnect.apple.com/)
 *    - Select your app
 *    - Go to Subscriptions
 *    - Create subscription with these IDs:
 *      * com.pocketgym.premium.monthly (recurring monthly)
 *      * com.pocketgym.premium.annual (recurring annual)
 *    - Set prices ($12/month, $99/year recommended)
 *    - Enable auto-renewal subscription
 *
 * 2. In React Native:
 *    - Install: npm install react-native-iap
 *    - Link: npx expo install react-native-iap
 *
 * 3. Backend Integration:
 *    - Implement POST /api/subscription/verify-receipt endpoint
 *    - Call Apple App Store Server API to validate receipts
 *    - Store subscription in MongoDB
 *
 * 4. Testing:
 *    - Use App Store Sandbox environment for testing
 *    - Add test user in App Store Connect
 *    - Use TestFlight for beta testing
 *
 * 5. User Data Storage:
 *    - transactionReceipt: Base64 encoded receipt from App Store
 *    - transactionId: Unique transaction ID from App Store
 *    - originalTransactionId: Original transaction (for renewal tracking)
 */

export const IAP_CONFIG = {
  // Product IDs match App Store Connect configuration
  products: {
    monthly: "com.pocketgym.premium.monthly",
    annual: "com.pocketgym.premium.annual",
  },

  // Bundle ID (must match your app's bundle ID)
  bundleId: "com.pocketgym.app",

  // Pricing (displayed to user)
  pricing: {
    monthly: {
      price: 12.99,
      currency: "USD",
      period: "month",
    },
    annual: {
      price: 99.99,
      currency: "USD",
      period: "year",
    },
  },

  // Trial configuration
  trial: {
    duration: 7,
    unit: "day",
  },

  // Backend URLs
  backend: {
    verifyReceipt: "https://yourpocketgym.com/api/subscription/verify-receipt",
    checkStatus: "https://yourpocketgym.com/api/subscription/status",
    restore: "https://yourpocketgym.com/api/subscription/restore",
  },

  // App Store API Configuration (for backend use)
  appStore: {
    // To get the key and issue ID, go to:
    // App Store Connect > Keys > In-App Purchase Key (not App Store Server API Key)
    keyId: "YOUR_APP_STORE_KEY_ID", // Will be provided by Apple
    issuerId: "YOUR_ISSUER_ID", // Will be provided by Apple
    bundleId: "com.pocketgym.app",
    environment: "production", // Use "sandbox" for testing
  },
};

/**
 * App Store Server API Setup (Backend):
 *
 * The backend needs to verify receipts using Apple's App Store Server API.
 *
 * Steps:
 * 1. In App Store Connect, create an API key (Subscriptions > App Store Server API keys)
 * 2. Download the .p8 file (keep it secure)
 * 3. In your backend, use this key to sign JWTs
 * 4. Implement receipt verification:
 *
 *    POST https://api.storekit.itunes.apple.com/inApps/v1/subscriptions/{originalTransactionId}
 *    Headers:
 *      Authorization: Bearer <JWT signed with your key>
 *
 * 5. The response will contain subscription status, renewal info, etc.
 *
 * Reference: https://developer.apple.com/documentation/appstoreserverapi
 */
