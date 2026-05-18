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
      const offering = await getOfferings();
      if (!offering) throw new Error("No offerings available. Try again later.");

      const pkg: PurchasesPackage | null =
        type === "annual"
          ? (offering.annual ?? offering.availablePackages[0])
          : (offering.monthly ?? offering.availablePackages[0]);

      if (!pkg) throw new Error("Product not found.");

      const customerInfo = await purchasePackage(pkg);
      return { success: isPremium(customerInfo) };
    } catch (err: any) {
      if (err?.userCancelled) return { success: false };
      const msg = err?.message ?? "Purchase failed. Please try again.";
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  };

  const restore = async (): Promise<PurchaseResult> => {
    setIsLoading(true);
    setError(null);
    try {
      const customerInfo = await restorePurchases();
      if (!isPremium(customerInfo)) {
        return { success: false, error: "No active subscription found." };
      }
      return { success: true };
    } catch (err: any) {
      const msg = err?.message ?? "Restore failed. Please try again.";
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
