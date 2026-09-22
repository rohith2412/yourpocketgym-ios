/**
 * Response shape from the backend voice-nutrition endpoint. Since v2.2.8
 * the parser returns a full USDA-style nutrient panel — the extended fields
 * are optional so older clients still typecheck.
 */
export type ParsedFood = {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  satFat?: number;
  cholesterol?: number;
  vitaminA?: number;
  vitaminC?: number;
  vitaminD?: number;
  vitaminB12?: number;
  folate?: number;
  iron?: number;
  calcium?: number;
  potassium?: number;
};

export type VoiceNutritionResponse = {
  transcript: string;
  foods: ParsedFood[];
  /** Total water heard, in millilitres. 0 when none was mentioned. */
  waterMl: number;
};
