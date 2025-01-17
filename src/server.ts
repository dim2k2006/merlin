import { config } from 'dotenv';
import fastify from 'fastify';
import { UserRepositorySupabase, UserServiceImpl } from './domain/user';
import { MemoryRepositoryPinecone, MemoryServiceImpl } from './domain/memory';
import OpenAIEmbeddingProvider from './providers/embedding/embedding.provider.openai';

config({ path: `.env.${process.env.NODE_ENV || 'development'}.local` });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const pineconeApiKey = process.env.PINECONE_API_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY;

const embeddingProvider = new OpenAIEmbeddingProvider({ apiKey: openaiApiKey });

const userRepository = new UserRepositorySupabase({ supabaseUrl, supabaseKey });
const userService = new UserServiceImpl({ userRepository });

const memoryRepository = new MemoryRepositoryPinecone({
  apiKey: pineconeApiKey,
  namespace: 'ns1',
  indexName: 'merlin',
});
const memoryService = new MemoryServiceImpl({ memoryRepository, embeddingProvider });

const server = fastify();

server.get('/ping', async () => {
  return 'pong\n';
});

server.listen({ port: 8080 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }

  console.log(`Server listening at ${address}`);
});
