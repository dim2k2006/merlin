import OpenAI from 'openai';
import { LlmProviderInterface, CreateChatCompletionInput, ChatCompletion } from './llm.provider.interface';

type ConstructorInput = {
  apiKey: string;
};

class LlmProviderOpenai implements LlmProviderInterface {
  private openai: OpenAI;

  constructor({ apiKey }: ConstructorInput) {
    this.openai = new OpenAI({
      apiKey,
    });
  }

  async createChatCompletion(input: CreateChatCompletionInput): Promise<ChatCompletion> {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: input.messages,
    });

    return {
      content: response.choices[0].message.content,
    };
  }
}

export default LlmProviderOpenai;
