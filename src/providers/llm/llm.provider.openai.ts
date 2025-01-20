import OpenAI from 'openai';
import {
  LlmProviderInterface,
  CreateChatCompletionInput,
  ChatCompletion,
  BuildChatMessageInput,
  ChatMessage,
  IdentifyIntentInput,
  Intent,
} from './llm.provider.interface';

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

  async identifyIntent(input: IdentifyIntentInput): Promise<Intent> {
    const messages = [
      this.buildChatMessage({
        role: 'developer',
        content:
          'You are a intent classifier. Classify the intent of user message. Respond with either "save" or "retrieve".',
      }),
      this.buildChatMessage({
        role: 'user',
        content: input.message,
      }),
    ];

    const completion = await this.createChatCompletion({ messages });

    const intent = completion.content.trim().toLowerCase();

    if (intent.includes('save')) return 'save';

    if (intent.includes('retrieve')) return 'retrieve';

    return 'unknown';
  }

  buildChatMessage(input: BuildChatMessageInput): ChatMessage {
    return {
      role: input.role,
      content: input.content,
    };
  }
}

export default LlmProviderOpenai;
