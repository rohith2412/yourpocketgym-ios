/**
 * Subscription & Purchase Types
 */

export enum SubscriptionStatus {
  ACTIVE = "active",
  CANCELED = "canceled",
  EXPIRED = "expired",
  TRIAL = "trial",
}

export interface Subscription {
  _id?: string;
  userId: string; // Auth0 user ID or similar
  status: SubscriptionStatus;
  plan: "premium"; // Can add more plans later
  price: number; // Price in cents (e.g., 1200 for $12)
  billingCycle: "monthly" | "annual";

  // Dates
  createdAt: Date;
  startDate: Date;
  endDate?: Date; // When subscription expires/renews
  trialEndsAt?: Date; // When free trial ends (if applicable)
  canceledAt?: Date;

  // Payment info
  paymentMethod: "iap" | "stripe"; // IAP for App Store, Stripe for web
  transactionId?: string; // App Store or Stripe transaction ID
  receiptData?: string; // App Store receipt (encrypted)

  // IAP specific
  originalTransactionId?: string; // For App Store subscription tracking
  bundleId?: string; // com.pocketgym.app or similar
  productId?: string; // com.pocketgym.premium.monthly

  // Metadata
  isTrialUsed: boolean; // Has the user used their free trial?
  renewalRetryCount: number;
  lastRenewalAttempt?: Date;
}

export interface VerifyReceiptRequest {
  receiptData: string; // Base64 encoded receipt
  packageName: string;
  bundleId?: string;
}

export interface VerifyReceiptResponse {
  valid: boolean;
  subscription?: Subscription;
  error?: string;
}

export interface UserSubscriptionStatus {
  userId: string;
  isPremium: boolean;
  subscription?: Subscription;
  daysUntilRenewal?: number;
  canAccessAITrainer: boolean;
  canAccessRecipes: boolean;
  canAccessMacroScanner: boolean;
}

// IAP response from App Store
export interface AppStoreReceiptVerification {
  receipt: {
    bundleId: string;
    inAppPurchases: Array<{
      transactionId: string;
      originalTransactionId: string;
      productId: string;
      purchaseDateMs: number;
      expiresDateMs?: number;
      isTrialPeriod?: boolean;
    }>;
  };
  pendingRenewalInfo?: Array<{
    autoRenewProductId: string;
    autoRenewStatus: string;
    expirationIntent?: string;
  }>;
}
