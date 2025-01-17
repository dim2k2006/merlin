export interface Provider {
  createEmbedding(input: CreateEmbeddingInput): Promise<Embedding>;
}

export type CreateEmbeddingInput = {
  input: string;
};

export type Embedding = {
  embedding: number[];
};
