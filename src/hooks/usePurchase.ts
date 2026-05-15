import { useState } from "react";
import { purchasePackage, restorePurchases, getOfferings, isPremiumCustomer } from "../services/iapService";
import { PurchasesPackage } from "react-native-purchases";

export function usePurchase() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const purchaseMonthlySubscription = async (_userId: string) => {
    return await _purchase("monthly");
  };

  const purchaseAnnualSubscription = async (_userId: string) => {
    return await _purchase("annual");
  };

  const _purchase = async (type: "monthly" | "annual") => {
    setIsLoading(true);
    setError(null);
    try {
      const offering = await getOfferings();
      if (!offering) throw new Error("No offerings available");

      const pkg: PurchasesPackage | null =
        type === "annual"
          ? offering.annual ?? offering.availablePackages[0]
          : offering.monthly ?? offering.availablePackages[0];

      if (!pkg) throw new Error("Product not found");

      const customerInfo = await purchasePackage(pkg);
      const success = isPremiumCustomer(customerInfo);
      return { success, subscription: customerInfo };
    } catch (err: any) {
      // User cancelled — don't show error
      if (err?.userCancelled) return { success: false, error: "cancelled" };
      const msg = err?.message || "Purchase failed";
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestorePurchases = async (_userId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const customerInfo = await restorePurchases();
      const success = isPremiumCustomer(customerInfo);
      if (!success) return { success: false, error: "No active subscription found" };
      return { success: true, subscription: customerInfo };
    } catch (err: any) {
      const msg = err?.message || "Restore failed";
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
    purchaseMonthlySubscription,
    purchaseAnnualSubscription,
    restorePurchases: handleRestorePurchases,
  };
}
