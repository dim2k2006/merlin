export interface LlmProviderInterface {
  createChatCompletion(input: CreateChatCompletionInput): Promise<ChatCompletion>;
}

export type CreateChatCompletionInput = {
  messages: ChatMessage[];
};

export type ChatMessage = {
  role: string;
  content: string;
};

export type ChatCompletion = {
  content: string;
};
