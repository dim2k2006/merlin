export interface LlmProvider {
  createChatCompletion(input: CreateChatCompletionInput): Promise<ChatCompletion>;
  identifyIntent(input: IdentifyIntentInput): Promise<Intent>;
  buildChatMessage(input: BuildChatMessageInput): ChatMessage;
}

export type CreateChatCompletionInput = {
  messages: ChatMessage[];
  functions?: FunctionMetadata[];
};

export type ChatMessage = {
  role: Role;
  content: string;
};

export type FunctionMetadata = {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
};

export type ChatCompletion = {
  content: string;
};

type Role = 'developer' | 'user';

export type BuildChatMessageInput = {
  role: Role;
  content: string;
};

export type IdentifyIntentInput = {
  message: string;
};

export type Intent = 'save' | 'retrieve' | 'unknown';
