import { Memory } from './model';
import { CreateMemoryInput } from './repository';

export interface Service {
  saveMemory(memory: CreateMemoryInput): Promise<Memory>;
  findMemoriesByUserId(userId: string): Promise<Memory[]>;
  findRelevantMemories(userId: string, queryEmbedding: number[], k: number): Promise<Memory[]>;
  deleteMemory(memoryId: string): Promise<void>;
}
