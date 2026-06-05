import { useState } from "react";
import { getOfferings, purchasePackage, restorePurchases, isPremium } from "../services/iapService";
import { PurchasesPackage } from "react-native-purchases";

interface PurchaseResult {
  success: boolean;
  error?: string;
}

export function usePurchase() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const purchase = async (type: "monthly" | "annual"): Promise<PurchaseResult> => {
    setIsLoading(true);
    setError(null);
    try {
      console.log("[usePurchase] Starting purchase flow, type:", type);

      const offering = await getOfferings();
      if (!offering) {
        const msg = "No offerings available. Make sure products are set up in RevenueCat and App Store Connect.";
        console.error("[usePurchase]", msg);
        setError(msg);
        return { success: false, error: msg };
      }

      console.log("[usePurchase] Offering found:", offering.identifier);
      console.log("[usePurchase] Available packages:", offering.availablePackages?.map(p => p.identifier));

      const pkg: PurchasesPackage | null =
        type === "annual"
          ? (offering.annual ?? offering.availablePackages[0])
          : (offering.monthly ?? offering.availablePackages[0]);

      if (!pkg) {
        const msg = `No ${type} package found in offering. Available: ${offering.availablePackages?.map(p => p.identifier).join(", ") || "none"}`;
        console.error("[usePurchase]", msg);
        setError(msg);
        return { success: false, error: msg };
      }

      console.log("[usePurchase] Purchasing package:", pkg.identifier, "product:", pkg.product?.identifier);

      const customerInfo = await purchasePackage(pkg);
      const premium = isPremium(customerInfo);
      console.log("[usePurchase] Purchase result - isPremium:", premium);
      return { success: premium };
    } catch (err: any) {
      if (err?.userCancelled) {
        console.log("[usePurchase] User cancelled purchase");
        return { success: false };
      }

      const msg = err?.message ?? "Purchase failed. Please try again.";
      console.error("[usePurchase] Purchase error:", msg);
      console.error("[usePurchase] Error code:", err?.code);
      console.error("[usePurchase] Full error:", JSON.stringify(err));

      // Provide user-friendly error messages
      let userMsg = msg;
      if (msg.includes("API Key") || msg.includes("credentials")) {
        userMsg = "Subscription service is being set up. Please try again later.";
      } else if (msg.includes("network") || msg.includes("Network")) {
        userMsg = "Network error. Please check your connection and try again.";
      }

      setError(userMsg);
      return { success: false, error: userMsg };
    } finally {
      setIsLoading(false);
    }
  };

  const restore = async (): Promise<PurchaseResult> => {
    setIsLoading(true);
    setError(null);
    try {
      console.log("[usePurchase] Restoring purchases...");
      const customerInfo = await restorePurchases();
      if (!isPremium(customerInfo)) {
        console.log("[usePurchase] Restore complete but no active subscription found");
        return { success: false, error: "No active subscription found." };
      }
      console.log("[usePurchase] Restore successful - user is premium");
      return { success: true };
    } catch (err: any) {
      const msg = err?.message ?? "Restore failed. Please try again.";
      console.error("[usePurchase] Restore error:", msg);
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    isProcessing: isLoading,
    error,
    purchaseMonthlySubscription: (_userId: string) => purchase("monthly"),
    purchaseAnnualSubscription:  (_userId: string) => purchase("annual"),
    restorePurchases:            (_userId: string) => restore(),
  };
}
