/**
 * Barcode → product nutrition lookup.
 *
 * Uses Open Food Facts (free, no auth). The public endpoint returns per-100g
 * nutrition; we don't hit our own backend for this.
 *
 *   GET https://world.openfoodfacts.org/api/v2/product/{barcode}.json
 */

export type BarcodeProduct = {
  barcode: string;
  name: string;
  brand?: string;
  imageUrl?: string;
  servingSize?: string;
  perServing?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  } | null;
  per100g: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
};

const num = (v: unknown): number => {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? ""));
  return Number.isFinite(n) ? n : 0;
};

export async function lookupBarcode(barcode: string): Promise<BarcodeProduct | null> {
  const res = await fetch(
    `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`,
  );
  if (!res.ok) throw new Error(`lookup failed (${res.status})`);
  const data = await res.json();
  if (data.status !== 1 || !data.product) return null;

  const p = data.product;
  const n = p.nutriments ?? {};

  const per100g = {
    calories: Math.round(num(n["energy-kcal_100g"])),
    protein: Math.round(num(n["proteins_100g"])),
    carbs: Math.round(num(n["carbohydrates_100g"])),
    fat: Math.round(num(n["fat_100g"])),
  };

  const hasServing =
    n["energy-kcal_serving"] !== undefined ||
    n["proteins_serving"] !== undefined;

  return {
    barcode,
    name: p.product_name || p.generic_name || "Product",
    brand: p.brands || undefined,
    imageUrl: p.image_front_small_url || p.image_url || undefined,
    servingSize: p.serving_size || undefined,
    perServing: hasServing
      ? {
          calories: Math.round(num(n["energy-kcal_serving"])),
          protein: Math.round(num(n["proteins_serving"])),
          carbs: Math.round(num(n["carbohydrates_serving"])),
          fat: Math.round(num(n["fat_serving"])),
        }
      : null,
    per100g,
  };
}
