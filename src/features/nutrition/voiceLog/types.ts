/** Response shape from the backend voice-nutrition endpoint. */
export type ParsedFood = {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type VoiceNutritionResponse = {
  transcript: string;
  foods: ParsedFood[];
  /** Total water heard, in millilitres. 0 when none was mentioned. */
  waterMl: number;
};
