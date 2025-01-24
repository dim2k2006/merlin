import { v4 as uuidV4 } from 'uuid';
import { Memory } from './memory.model';
import { MemoryRepository } from './memory.repository';
import { MemoryService, CreateMemoryInput, FindRelevantMemoriesInput } from './memory.service';
import { EmbeddingProviderInterface } from '../../providers/embedding/embedding.provider.interface';
import { LlmProviderInterface } from '../../providers/llm/llm.provider.interface';

type ConstructorInput = {
  memoryRepository: MemoryRepository;
  embeddingProvider: EmbeddingProviderInterface;
  llmProvider: LlmProviderInterface;
};

class MemoryServiceImpl implements MemoryService {
  private memoryRepository: MemoryRepository;

  private embeddingProvider: EmbeddingProviderInterface;

  private llmProvider: LlmProviderInterface;

  constructor({ memoryRepository, embeddingProvider, llmProvider }: ConstructorInput) {
    this.memoryRepository = memoryRepository;

    this.embeddingProvider = embeddingProvider;

    this.llmProvider = llmProvider;
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

  async findRelevantMemories(input: FindRelevantMemoriesInput): Promise<string> {
    const embeddingResponse = await this.embeddingProvider.createEmbedding({ input: input.content });

    const memories = await this.memoryRepository.findRelevantMemories(
      input.userId,
      embeddingResponse.embedding,
      input.k,
    );

    const messages = [
      this.llmProvider.buildChatMessage({
        role: 'developer',
        content: 'You are a helpful personal assistant. The user has stored the following facts:',
      }),
      ...memories.map((memory) =>
        this.llmProvider.buildChatMessage({
          role: 'developer',
          content: memory.content,
        }),
      ),
      this.llmProvider.buildChatMessage({
        role: 'developer',
        content: 'Use these facts to answer the user’s question accurately.',
      }),
      this.llmProvider.buildChatMessage({
        role: 'developer',
        content: 'If you do not know the answer come up with some funny short response.',
      }),
      this.llmProvider.buildChatMessage({
        role: 'developer',
        content:
          'Use the same language that user used in the prompt message. Translate matching fact to the required language if needed.',
      }),
      this.llmProvider.buildChatMessage({
        role: 'user',
        content: input.content,
      }),
    ];

    const llmResponse = await this.llmProvider.createChatCompletion({ messages });

    return llmResponse.content;
  }

  async deleteMemory(memoryId: string): Promise<void> {
    return this.memoryRepository.deleteMemory(memoryId);
  }
}

export default MemoryServiceImpl;
