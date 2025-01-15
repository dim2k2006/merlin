import { Memory } from './memory.model';
import { MemoryRepositoryInterface, CreateMemoryInput } from './memory.repository.interface';

type ConstructorInput = {
  memoryRepository: MemoryRepositoryInterface;
};

class MemoryService {
  private memoryRepository: MemoryRepositoryInterface;

  constructor({ memoryRepository }: ConstructorInput) {
    this.memoryRepository = memoryRepository;
  }

  async saveMemory(memory: CreateMemoryInput): Promise<Memory> {
    return this.memoryRepository.saveMemory(memory);
  }

  async findMemoriesByUserId(userId: string): Promise<Memory[]> {
    return this.memoryRepository.findMemoriesByUserId(userId);
  }

  async findRelevantMemories(userId: string, queryEmbedding: number[], k: number): Promise<Memory[]> {
    return this.memoryRepository.findRelevantMemories(userId, queryEmbedding, k);
  }

  async deleteMemory(memoryId: string): Promise<void> {
    return this.memoryRepository.deleteMemory(memoryId);
  }
}

export default MemoryService;
