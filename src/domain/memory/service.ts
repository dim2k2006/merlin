import { Memory } from './model';

export interface Service {
  saveMemory(memory: CreateMemoryInput): Promise<Memory>;
  findMemoriesByUserId(userId: string): Promise<Memory[]>;
  findRelevantMemories(userId: string, queryEmbedding: number[], k: number): Promise<Memory[]>;
  deleteMemory(memoryId: string): Promise<void>;
}

export type CreateMemoryInput = {
  id?: string;
  userId: string;
  content: string;
  embeddingVector: number[];
  metadata?: Record<string, unknown>;
};
