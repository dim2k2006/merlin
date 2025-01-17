import { v4 as uuidV4 } from 'uuid';
import { Memory } from './model';
import { Repository } from './repository';
import { Service, CreateMemoryInput } from './service';

type ConstructorInput = {
  memoryRepository: Repository;
};

class ServiceImpl implements Service {
  private memoryRepository: Repository;

  constructor({ memoryRepository }: ConstructorInput) {
    this.memoryRepository = memoryRepository;
  }

  async saveMemory(input: CreateMemoryInput): Promise<Memory> {
    const memory = {
      id: input.id ?? uuidV4(),
      userId: input.userId,
      content: input.content,
      embeddingVector: input.embeddingVector,
      metadata: input.metadata,
      createdAt: new Date().toISOString(),
    };

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
