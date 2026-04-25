/**
 * MongoDB Schema Definitions for Subscriptions
 * Add these to your Node.js/Express backend
 */

// ──────────────────────────────────────────────────────────────────────────────
// MONGODB MODELS (using Mongoose)
// ──────────────────────────────────────────────────────────────────────────────

/*
// subscription.model.js
const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  // User reference
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true,
    // This should match your auth provider (Auth0 sub, Firebase uid, etc)
  },

  // Subscription status
  status: {
    type: String,
    enum: ['active', 'canceled', 'expired', 'trial'],
    default: 'trial',
    index: true,
  },

  plan: {
    type: String,
    enum: ['premium'],
    default: 'premium',
  },

  price: {
    type: Number, // in cents, e.g., 1200 for $12
    default: 1200,
  },

  billingCycle: {
    type: String,
    enum: ['monthly', 'annual'],
    default: 'monthly',
  },

  // Dates
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },

  startDate: {
    type: Date,
    required: true,
  },

  endDate: {
    type: Date, // When subscription expires/renews
  },

  trialEndsAt: {
    type: Date, // 7 days from startDate for trial
  },

  canceledAt: {
    type: Date,
  },

  // Payment method
  paymentMethod: {
    type: String,
    enum: ['iap', 'stripe'],
    required: true,
  },

  // Transaction tracking
  transactionId: {
    type: String,
    // App Store: com.apple.receipt.original_transaction_id
    // Stripe: ch_xxxxx
  },

  originalTransactionId: {
    type: String,
    index: true,
    // For App Store subscription tracking across renewals
  },

  receiptData: {
    type: String,
    // Base64 encoded App Store receipt
    // Keep encrypted in production
  },

  bundleId: {
    type: String,
    // e.g., com.pocketgym.app
  },

  productId: {
    type: String,
    // e.g., com.pocketgym.premium.monthly
  },

  // IAP specific
  isTrialUsed: {
    type: Boolean,
    default: false,
  },

  renewalRetryCount: {
    type: Number,
    default: 0,
  },

  lastRenewalAttempt: {
    type: Date,
  },

  // Metadata
  notes: String,
  autoRenew: {
    type: Boolean,
    default: true,
  },
});

// Indexes for queries
subscriptionSchema.index({ userId: 1, status: 1 });
subscriptionSchema.index({ transactionId: 1 });
subscriptionSchema.index({ endDate: 1 });
subscriptionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Subscription', subscriptionSchema);
*/

// ──────────────────────────────────────────────────────────────────────────────
// API ENDPOINTS (Express.js)
// ──────────────────────────────────────────────────────────────────────────────

/*
// routes/subscription.js
const express = require('express');
const router = express.Router();
const Subscription = require('../models/subscription.model');
const { authenticateToken } = require('../middleware/auth');

// Get user's subscription status
// GET /api/subscription/status
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.sub; // From JWT token

    let subscription = await Subscription.findOne({ userId });

    // If no subscription, create trial subscription
    if (!subscription) {
      const now = new Date();
      const trialEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

      subscription = await Subscription.create({
        userId,
        status: 'trial',
        paymentMethod: 'iap',
        startDate: now,
        trialEndsAt: trialEnd,
      });
    }

    const isPremium =
      subscription.status === 'active' ||
      (subscription.status === 'trial' && new Date() < subscription.trialEndsAt);

    res.json({
      userId,
      isPremium,
      subscription: {
        status: subscription.status,
        plan: subscription.plan,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        trialEndsAt: subscription.trialEndsAt,
      },
      daysUntilRenewal: subscription.endDate
        ? Math.ceil((subscription.endDate - new Date()) / (24 * 60 * 60 * 1000))
        : null,
      canAccessAITrainer: isPremium,
      canAccessRecipes: isPremium,
      canAccessMacroScanner: isPremium,
    });
  } catch (error) {
    console.error('Subscription status error:', error);
    res.status(500).json({ error: 'Failed to fetch subscription status' });
  }
});

// Verify App Store receipt
// POST /api/subscription/verify-receipt
router.post('/verify-receipt', authenticateToken, async (req, res) => {
  try {
    const { receiptData } = req.body;
    const userId = req.user.sub;

    if (!receiptData) {
      return res.status(400).json({ error: 'Receipt data required' });
    }

    // Verify with Apple
    // This is a simplified version - implement full App Store verification
    const verifyWithApple = async (receipt) => {
      // Call App Store API here
      // https://developer.apple.com/documentation/appstoreserverapi
      // For now, just return mock response
      return {
        valid: true,
        transactionId: 'mock_transaction_id',
        productId: 'com.pocketgym.premium.monthly',
        expiresDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };
    };

    const result = await verifyWithApple(receiptData);

    if (!result.valid) {
      return res.status(400).json({ error: 'Invalid receipt' });
    }

    // Update or create subscription
    const subscription = await Subscription.findOneAndUpdate(
      { userId },
      {
        status: 'active',
        paymentMethod: 'iap',
        transactionId: result.transactionId,
        originalTransactionId: result.transactionId,
        productId: result.productId,
        receiptData,
        endDate: result.expiresDate,
        startDate: new Date(),
        isTrialUsed: true,
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      subscription: {
        status: subscription.status,
        endDate: subscription.endDate,
      },
    });
  } catch (error) {
    console.error('Receipt verification error:', error);
    res.status(500).json({ error: 'Failed to verify receipt' });
  }
});

// Restore purchases (when user reinstalls app)
// POST /api/subscription/restore
router.post('/restore', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.sub;

    // In a real app, you would verify the App Store receipt again
    // and restore any active subscriptions for this user

    const subscription = await Subscription.findOne({ userId });

    if (!subscription) {
      return res.status(404).json({ error: 'No subscription found' });
    }

    // Check if subscription is still valid with Apple
    // Update status if needed

    res.json({
      success: true,
      subscription,
    });
  } catch (error) {
    console.error('Restore purchases error:', error);
    res.status(500).json({ error: 'Failed to restore purchases' });
  }
});

module.exports = router;
*/

// ──────────────────────────────────────────────────────────────────────────────
// IMPLEMENTATION CHECKLIST
// ──────────────────────────────────────────────────────────────────────────────

/*
BACKEND TODO:
1. ✓ Create Subscription MongoDB schema above
2. [ ] Implement App Store receipt verification
   - Get App Store credentials from your Apple Developer account
   - Implement JWT token verification with Apple's API
   - https://developer.apple.com/documentation/appstoreserverapi
3. [ ] Create API endpoints:
   - GET /api/subscription/status
   - POST /api/subscription/verify-receipt
   - POST /api/subscription/restore
   - (optional) POST /api/subscription/cancel
4. [ ] Add authentication middleware to protect endpoints
5. [ ] Implement background job for subscription renewal/expiry
6. [ ] Add error logging and monitoring
7. [ ] Test with App Store Sandbox environment first

FRONTEND TODO:
1. ✓ Remove SQLite
2. ✓ Create PremiumGate component
3. ✓ Create useSubscription hook
4. [ ] Integrate Apple In-App Purchase SDK:
   - Use `react-native-iap` package:
     npm install react-native-iap
5. [ ] Implement purchase flow:
   - Request available products
   - Show purchase options
   - Handle purchase confirmation
   - Send receipt to backend for verification
6. [ ] Handle subscription renewal notifications
7. [ ] Test with App Store TestFlight before production

APP STORE GUIDELINES:
- Use App Store Server API for receipt verification
- Support restoring purchases
- Show clear pricing and subscription terms
- Implement cancellation flow
- Test thoroughly on TestFlight before submission
- Include clear renewal/cancellation information in the app
*/
