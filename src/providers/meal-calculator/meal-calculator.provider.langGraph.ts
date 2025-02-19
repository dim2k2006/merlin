import { MealCalculatorProvider, CalculateMealPfcResponse } from './meal-calculator.provider';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { ChatOpenAI } from '@langchain/openai';
import { MemorySaver } from '@langchain/langgraph';
import { z } from 'zod';

const MealCalculationOutputSchema = z.object({
  totalProtein: z.number().describe('Total protein in grams'),
  totalFat: z.number().describe('Total fat in grams'),
  totalCarbohydrate: z.number().describe('Total carbohydrates in grams'),
  calories: z.number().describe('Total calculated calories'),
  breakdown: z
    .array(
      z.object({
        ingredient: z.string(),
        protein: z.number(),
        fat: z.number(),
        carbohydrate: z.number(),
      }),
    )
    .describe("Breakdown of each ingredient's nutrition (optional)"),
});

type ConstructorInput = {
  apiKey: string;
};

class MealCalculatorProviderLangGraph implements MealCalculatorProvider {
  private agent: ReturnType<typeof createReactAgent>;

  constructor({ apiKey }: ConstructorInput) {
    const chatModel = new ChatOpenAI({ model: 'o1', temperature: 0, apiKey });
    const agentCheckpointer = new MemorySaver();

    this.agent = createReactAgent({
      llm: chatModel,
      tools: [],
      checkpointSaver: agentCheckpointer,
    });
  }

  async calculateMealPfc({ mealDescription }: { mealDescription: string }): Promise<CalculateMealPfcResponse> {
    const prompt = `
I had the following meal: "${mealDescription}".
Please extract the nutritional information from the description and calculate:
- Total proteins in grams,
- Total fats in grams,
- Total carbohydrates in grams,
- Total calories (using 4 kcal/g for proteins and carbohydrates, and 9 kcal/g for fats).

Return the result strictly in the following JSON format:

{
  "totalProtein": number,
  "totalFat": number,
  "totalCarbohydrate": number,
  "calories": number,
  "breakdown": [
    {
      "ingredient": string,
      "protein": number,
      "fat": number,
      "carbohydrate": number
    }
  ]
}

If ingredient-level details are not available, set "breakdown" to an empty array.
    `;

    // Invoke the agent with our prompt.
    const agentState = await this.agent.invoke({
      messages: [{ role: 'user', content: prompt }],
    });

    // Assume the final message is the agent's JSON output.
    const rawOutput = agentState.messages[agentState.messages.length - 1].content;

    // Parse and validate the output using the schema.
    try {
      const parsed = JSON.parse(rawOutput);
      const validatedOutput = MealCalculationOutputSchema.parse(parsed);
      return validatedOutput;
    } catch (error) {
      throw new Error('Failed to parse structured output from agent.' + error);
    }
  }
}

export default MealCalculatorProviderLangGraph;
