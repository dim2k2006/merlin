export interface MealCalculatorProvider {
  calculateMealPfc({ mealDescription }: { mealDescription: string }): Promise<CalculateMealPfcResponse>;
}

export type CalculateMealPfcResponse = {
  totalProtein: number;
  totalFat: number;
  totalCarbohydrate: number;
  calories: number;
  breakdown: {
    ingredient: string;
    protein: number;
    fat: number;
    carbohydrate: number;
  }[];
};
