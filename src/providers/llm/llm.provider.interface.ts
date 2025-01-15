export interface LlmProviderInterface {
  createChatCompletion(input: CreateChatCompletionInput): Promise<ChatCompletion>;
}

export type CreateChatCompletionInput = {
  role: string;
  content: string | string[];
};

export type ChatCompletion = {
  content: string;
};
