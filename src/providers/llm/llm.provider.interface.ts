export interface LlmProviderInterface {
  createChatCompletion(input: CreateChatCompletionInput): Promise<ChatCompletion>;
}

export type CreateChatCompletionInput = {
  messages: ChatMessage[];
};

export type ChatMessage = {
  role: Role;
  content: string;
};

export type ChatCompletion = {
  content: string;
};

type Role = 'developer' | 'user';
