export interface LlmProviderInterface {
  createChatCompletion(input: CreateChatCompletionInput): Promise<ChatCompletion>;
  buildChatMessage(input: BuildChatMessageInput): ChatMessage;
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

export type BuildChatMessageInput = {
  role: Role;
  content: string;
};
