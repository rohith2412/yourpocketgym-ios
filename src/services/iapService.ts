import {
  initConnection,
  endConnection,
  getProducts,
  requestSubscription,
  requestPurchase,
  getAvailablePurchases,
  Product,
  ProductPurchase,
  PurchaseError,
} from "react-native-iap";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * IAP Service for App Store In-App Purchases
 * Handles subscription and product purchases for PocketGym premium features
 */

// Product IDs for App Store
// Make sure these match your App Store Connect configuration
const PRODUCT_IDS = {
  PREMIUM_MONTHLY: "com.rohith.com.yourpocketgym.premium.monthly",
  PREMIUM_ANNUAL:  "com.rohith.com.yourpocketgym.premium.annual",
};

const SKUS = Object.values(PRODUCT_IDS);

class IAPService {
  private isInitialized = false;
  private isAvailable = false;
  private products: Product[] = [];

  /**
   * Initialize the IAP connection
   * In Expo Go or without native modules, gracefully falls back to mock mode
   */
  async init() {
    try {
      if (this.isInitialized) return;

      await initConnection();
      console.log("✅ IAP Connection initialized");
      this.isAvailable = true;
      this.isInitialized = true;

      // Fetch available products
      await this.fetchProducts();

      // Restore purchases on app start
      await this.restorePurchases();
    } catch (error) {
      // IAP not available in Expo Go, development builds, or without native modules
      console.warn(
        "⚠️ IAP not available - using mock mode for development.\n" +
          "Install development build or use TestFlight for real purchases.\n" +
          "Error:",
        error
      );
      this.isAvailable = false;
      this.isInitialized = true; // Mark as initialized even in mock mode
      return; // Don't throw - let app work in demo mode
    }
  }

  /**
   * Shutdown the IAP connection
   */
  async shutdown() {
    try {
      if (!this.isInitialized || !this.isAvailable) return;
      await endConnection();
      this.isInitialized = false;
    } catch (error) {
      console.error("Failed to shutdown IAP:", error);
    }
  }

  /**
   * Fetch available products from App Store
   */
  private async fetchProducts() {
    try {
      const products = await getProducts({ skus: SKUS });
      this.products = products;
      console.log("Fetched products:", products);
      return products;
    } catch (error) {
      console.error("Error fetching products:", error);
      return [];
    }
  }

  /**
   * Get product details
   */
  getProduct(sku: string): Product | undefined {
    return this.products.find((p) => p.productId === sku);
  }

  /**
   * Get all available products
   */
  getProducts(): Product[] {
    return this.products;
  }

  /**
   * Request a subscription purchase
   * @param sku - Product SKU (e.g., com.pocketgym.premium.monthly)
   * @param userId - User ID for server-side verification
   */
  async requestSubscription(sku: string, userId: string): Promise<ProductPurchase> {
    try {
      if (!this.isInitialized) {
        await this.init();
      }

      // If IAP is not available (Expo Go, no native modules), return mock purchase
      if (!this.isAvailable) {
        console.log("📱 Simulating purchase in development mode...");
        return {
          productId: sku,
          transactionId: `mock_${Date.now()}`,
          transactionReceipt: "mock_receipt_base64_encoded_data",
          purchaseTime: Date.now(),
          originalTransactionId: `mock_original_${Date.now()}`,
          packageNameAndroid: "",
          orderId: "",
          type: "inapp",
          signatureAndroid: "",
          purchaseStateAndroid: 0,
        } as ProductPurchase;
      }

      const product = this.getProduct(sku);
      if (!product) {
        throw new Error(`Product not found: ${sku}`);
      }

      // Request purchase from App Store
      const purchase = await requestSubscription({
        sku,
      });

      // Save purchase locally for tracking
      if (purchase) {
        await AsyncStorage.setItem(
          "lastPurchaseData",
          JSON.stringify({
            sku,
            receipt: purchase.transactionReceipt,
            transactionId: purchase.transactionId,
            timestamp: new Date().toISOString(),
          })
        );
      }

      return purchase;
    } catch (error) {
      if (error instanceof PurchaseError) {
        if (error.code === "E_ALREADY_OWNED") {
          console.log("Product already owned");
          throw new Error("You already have an active subscription");
        } else if (error.code === "E_USER_CANCELLED") {
          throw new Error("Purchase cancelled");
        }
      }
      console.error("Purchase error:", error);
      throw error;
    }
  }

  /**
   * Restore previous purchases
   * Call this when user reinstalls app or logs in
   */
  async restorePurchases(): Promise<ProductPurchase[]> {
    try {
      const purchases = await getAvailablePurchases();
      console.log("Restored purchases:", purchases);
      return purchases;
    } catch (error) {
      console.error("Error restoring purchases:", error);
      return [];
    }
  }

  /**
   * Check if product is owned
   */
  async isProductOwned(sku: string): Promise<boolean> {
    try {
      const purchases = await getAvailablePurchases();
      return purchases.some((p) => p.productId === sku);
    } catch (error) {
      console.error("Error checking product ownership:", error);
      return false;
    }
  }
}

// Export singleton instance
export const iapService = new IAPService();
export { PRODUCT_IDS, SKUS };
