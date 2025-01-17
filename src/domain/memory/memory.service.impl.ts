import { v4 as uuidV4 } from 'uuid';
import { Memory } from './memory.model';
import { MemoryRepository } from './memory.repository';
import { MemoryService, CreateMemoryInput, FindRelevantMemoriesInput } from './memory.service';
import { EmbeddingProviderInterface } from '../../providers/embedding/embedding.provider.interface';

type ConstructorInput = {
  memoryRepository: MemoryRepository;
  embeddingProvider: EmbeddingProviderInterface;
};

class MemoryServiceImpl implements MemoryService {
  private memoryRepository: MemoryRepository;

  private embeddingProvider: EmbeddingProviderInterface;

  constructor({ memoryRepository, embeddingProvider }: ConstructorInput) {
    this.memoryRepository = memoryRepository;

    this.embeddingProvider = embeddingProvider;
  }

  async saveMemory(input: CreateMemoryInput): Promise<Memory> {
    const embeddingResponse = await this.embeddingProvider.createEmbedding({ input: input.content });

    const memory = {
      id: input.id ?? uuidV4(),
      userId: input.userId,
      content: input.content,
      embeddingVector: embeddingResponse.embedding,
      createdAt: new Date().toISOString(),
    };

    return this.memoryRepository.saveMemory(memory);
  }

  async findRelevantMemories(input: FindRelevantMemoriesInput): Promise<Memory[]> {
    const embeddingResponse = await this.embeddingProvider.createEmbedding({ input: input.content });

    return this.memoryRepository.findRelevantMemories(input.userId, embeddingResponse.embedding, input.k);
  }

  async deleteMemory(memoryId: string): Promise<void> {
    return this.memoryRepository.deleteMemory(memoryId);
  }
}

export default MemoryServiceImpl;
