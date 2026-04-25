import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { iapService, PRODUCT_IDS } from "../services/iapService";

interface PurchaseState {
  isLoading: boolean;
  error: string | null;
  isProcessing: boolean;
}

/**
 * Hook to handle in-app purchases
 * Manages purchase flow and backend verification
 */
export function usePurchase() {
  const [state, setState] = useState<PurchaseState>({
    isLoading: false,
    error: null,
    isProcessing: false,
  });

  // Initialize IAP service on mount
  useEffect(() => {
    const initIAP = async () => {
      try {
        await iapService.init();
      } catch (error) {
        // IAP initialization errors are logged by iapService
        // App continues to work in mock/development mode
        console.log("IAP initialization completed (may be in mock mode)");
      }
    };

    initIAP();

    return () => {
      // Clean up connection when component unmounts
      iapService.shutdown().catch(() => {
        // Ignore shutdown errors
      });
    };
  }, []);

  /**
   * Handle subscription purchase
   * 1. Request purchase from App Store
   * 2. Get receipt from purchase
   * 3. Send receipt to backend for verification
   * 4. Update subscription status in app
   */
  const purchaseMonthlySubscription = async (userId: string) => {
    return await purchaseSubscription(PRODUCT_IDS.PREMIUM_MONTHLY, userId);
  };

  const purchaseAnnualSubscription = async (userId: string) => {
    return await purchaseSubscription(PRODUCT_IDS.PREMIUM_ANNUAL, userId);
  };

  const purchaseSubscription = async (sku: string, userId: string) => {
    setState({
      isLoading: true,
      error: null,
      isProcessing: true,
    });

    try {
      // Step 1: Request purchase from App Store
      const purchase = await iapService.requestSubscription(sku, userId);

      if (!purchase) {
        throw new Error("Purchase returned no receipt");
      }

      // Step 2: Verify receipt with backend
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const verifyResponse = await fetch(
        "https://yourpocketgym.com/api/subscription/verify-receipt",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            receiptData: purchase.transactionReceipt,
            bundleId: "com.pocketgym.app", // Match your app bundle ID
            transactionId: purchase.transactionId,
          }),
        }
      );

      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json();
        throw new Error(
          errorData.error || `Backend verification failed: ${verifyResponse.status}`
        );
      }

      const verifyData = await verifyResponse.json();

      if (!verifyData.success) {
        throw new Error(verifyData.error || "Backend verification failed");
      }

      setState({
        isLoading: false,
        error: null,
        isProcessing: false,
      });

      return {
        success: true,
        subscription: verifyData.subscription,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";

      setState({
        isLoading: false,
        error: errorMessage,
        isProcessing: false,
      });

      console.error("Purchase error:", error);

      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  /**
   * Restore previous purchases
   * Call when user reinstalls app or needs to restore access
   */
  const restorePurchases = async (userId: string) => {
    setState({
      isLoading: true,
      error: null,
      isProcessing: false,
    });

    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      // Call backend restore endpoint
      const response = await fetch("https://yourpocketgym.com/api/subscription/restore", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Restore failed: ${response.status}`);
      }

      const data = await response.json();

      setState({
        isLoading: false,
        error: null,
        isProcessing: false,
      });

      return {
        success: true,
        subscription: data.subscription,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Restore failed";

      setState({
        isLoading: false,
        error: errorMessage,
        isProcessing: false,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  return {
    ...state,
    purchaseMonthlySubscription,
    purchaseAnnualSubscription,
    purchaseSubscription,
    restorePurchases,
  };
}
