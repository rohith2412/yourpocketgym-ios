/** Response shape from the backend voice-parse endpoint. */
export type ParsedExercise = {
  name: string;
  muscleGroup: string;
  sets: { reps: number; weight: number }[];
};

export type VoiceParseResponse = {
  transcript: string;
  exercises: ParsedExercise[];
};
