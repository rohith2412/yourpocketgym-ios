/**
 * Barcode → product nutrition lookup.
 *
 * Uses Open Food Facts (free, no auth). The public endpoint returns per-100g
 * nutrition; we don't hit our own backend for this.
 *
 *   GET https://world.openfoodfacts.org/api/v2/product/{barcode}.json
 *
 * OFF's `nutriments` map varies per product — packaged foods generally
 * declare fiber / sugar / sodium / saturated fat / cholesterol; vitamins
 * and minerals are declared inconsistently. We pull every field OFF gives
 * us and leave the rest at 0.
 */

export type BarcodeNutrients = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;   // mg
  satFat: number;
  cholesterol: number;
  vitaminA: number; // µg
  vitaminC: number; // mg
  vitaminD: number; // µg
  vitaminB12: number;
  folate: number;
  iron: number;
  calcium: number;
  potassium: number;
};

export type BarcodeProduct = {
  barcode: string;
  name: string;
  brand?: string;
  imageUrl?: string;
  servingSize?: string;
  perServing?: BarcodeNutrients | null;
  per100g: BarcodeNutrients;
};

const num = (v: unknown): number => {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? ""));
  return Number.isFinite(n) ? n : 0;
};

/**
 * Pull the full nutrient panel from an OFF `nutriments` map for a given
 * suffix (`_100g` or `_serving`). Handles OFF's inconsistent naming (some
 * products use `salt` instead of `sodium`, mg vs g units, etc.).
 */
function extractNutrients(
  n: Record<string, unknown>,
  sfx: "_100g" | "_serving",
): BarcodeNutrients {
  // OFF stores sodium in GRAMS; multiply by 1000 to get mg. Some products
  // only declare `salt` — convert 1g salt ≈ 400mg sodium.
  const sodiumG = num(n[`sodium${sfx}`]);
  const saltG = num(n[`salt${sfx}`]);
  const sodiumMg = sodiumG > 0 ? sodiumG * 1000 : saltG > 0 ? saltG * 400 : 0;

  // Vitamin/mineral fields — OFF stores in grams for macronutrients but the
  // vitamin/mineral columns are already in mg or µg per their spec.
  return {
    calories: Math.round(num(n[`energy-kcal${sfx}`])),
    protein: Math.round(num(n[`proteins${sfx}`])),
    carbs: Math.round(num(n[`carbohydrates${sfx}`])),
    fat: Math.round(num(n[`fat${sfx}`])),
    fiber: round1(num(n[`fiber${sfx}`])),
    sugar: round1(num(n[`sugars${sfx}`])),
    sodium: Math.round(sodiumMg),
    satFat: round1(num(n[`saturated-fat${sfx}`])),
    cholesterol: Math.round(num(n[`cholesterol${sfx}`]) * 1000), // OFF: g → mg
    vitaminA: Math.round(num(n[`vitamin-a${sfx}`]) * 1_000_000), // OFF: g → µg
    vitaminC: Math.round(num(n[`vitamin-c${sfx}`]) * 1000),      // OFF: g → mg
    vitaminD: round1(num(n[`vitamin-d${sfx}`]) * 1_000_000),
    vitaminB12: round1(num(n[`vitamin-b12${sfx}`]) * 1_000_000),
    folate: Math.round(num(n[`vitamin-b9${sfx}`]) * 1_000_000),
    iron: round1(num(n[`iron${sfx}`]) * 1000),
    calcium: Math.round(num(n[`calcium${sfx}`]) * 1000),
    potassium: Math.round(num(n[`potassium${sfx}`]) * 1000),
  };
}

function round1(v: number): number {
  return Math.round(v * 10) / 10;
}

export async function lookupBarcode(barcode: string): Promise<BarcodeProduct | null> {
  const res = await fetch(
    `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`,
  );
  if (!res.ok) throw new Error(`lookup failed (${res.status})`);
  const data = await res.json();
  if (data.status !== 1 || !data.product) return null;

  const p = data.product;
  const n = p.nutriments ?? {};

  const per100g = extractNutrients(n, "_100g");
  const hasServing =
    n["energy-kcal_serving"] !== undefined ||
    n["proteins_serving"] !== undefined;

  return {
    barcode,
    name: p.product_name || p.generic_name || "Product",
    brand: p.brands || undefined,
    imageUrl: p.image_front_small_url || p.image_url || undefined,
    servingSize: p.serving_size || undefined,
    perServing: hasServing ? extractNutrients(n, "_serving") : null,
    per100g,
  };
}
