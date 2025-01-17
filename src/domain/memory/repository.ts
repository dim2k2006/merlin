import { Memory } from './model';

export interface Repository {
  saveMemory(memory: Memory): Promise<Memory>;
  findMemoriesByUserId(userId: string): Promise<Memory[]>;
  findRelevantMemories(userId: string, queryEmbedding: number[], k: number): Promise<Memory[]>;
  deleteMemory(memoryId: string): Promise<void>;
}
