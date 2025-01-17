import { Memory } from './model';
import { Repository, CreateMemoryInput } from './repository';

type ConstructorInput = {
  memoryRepository: Repository;
};

class ServiceImpl {
  private memoryRepository: Repository;

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

export default ServiceImpl;
