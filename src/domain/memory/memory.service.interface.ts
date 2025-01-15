import { Memory } from './memory.model';
import { CreateMemoryInput } from './memory.repository.interface';

export interface MemoryServiceInterface {
  saveMemory(memory: CreateMemoryInput): Promise<Memory>;
  findMemoriesByUserId(userId: string): Promise<Memory[]>;
  findRelevantMemories(userId: string, queryEmbedding: number[], k: number): Promise<Memory[]>;
  deleteMemory(memoryId: string): Promise<void>;
}
