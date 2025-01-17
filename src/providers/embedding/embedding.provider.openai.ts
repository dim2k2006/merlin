import OpenAI from 'openai';
import { EmbeddingProviderInterface, CreateEmbeddingInput, Embedding } from './embedding.provider.interface';

type ConstructorInput = {
  apiKey: string;
};

class OpenAIEmbeddingProvider implements EmbeddingProviderInterface {
  private openai: OpenAI;

  constructor({ apiKey }: ConstructorInput) {
    this.openai = new OpenAI({
      apiKey,
    });
  }

  async createEmbedding(input: CreateEmbeddingInput): Promise<Embedding> {
    const response = await this.openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: input.input,
      encoding_format: 'float',
    });

    return {
      embedding: response.data[0].embedding,
    };
  }
}

export default OpenAIEmbeddingProvider;
