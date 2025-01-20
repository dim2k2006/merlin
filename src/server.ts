import { config } from 'dotenv';
import fastify from 'fastify';
import { UserRepositorySupabase, UserServiceImpl, User } from './domain/user';
import { MemoryRepositoryPinecone, MemoryServiceImpl, Memory } from './domain/memory';
import EmbeddingProviderOpenAI from './providers/embedding/embedding.provider.openai';
import LlmProviderOpenai from './providers/llm/llm.provider.openai';

config({ path: `.env.${process.env.NODE_ENV || 'development'}.local` });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const pineconeApiKey = process.env.PINECONE_API_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY;

const embeddingProvider = new EmbeddingProviderOpenAI({ apiKey: openaiApiKey });
const llmProvider = new LlmProviderOpenai({ apiKey: openaiApiKey });

const userRepository = new UserRepositorySupabase({ supabaseUrl, supabaseKey });
const userService = new UserServiceImpl({ userRepository });

const memoryRepository = new MemoryRepositoryPinecone({
  apiKey: pineconeApiKey,
  namespace: 'ns1',
  indexName: 'merlin',
});
const memoryService = new MemoryServiceImpl({ memoryRepository, embeddingProvider, llmProvider });

const server = fastify();

type CreateUserBody = {
  externalId: string;
  firstName: string;
  lastName?: string;
};

server.post<{ Body: CreateUserBody; Reply: User | string }>(
  '/users',
  {
    schema: {
      body: {
        type: 'object',
        required: ['externalId', 'firstName'],
        properties: {
          externalId: { type: 'string' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
        },
        additionalProperties: false,
      },
    },
  },
  async (request, reply) => {
    try {
      const { externalId, firstName, lastName } = request.body;

      const isUserExist = await userService.isUserExist(externalId);

      if (isUserExist) {
        return reply.status(409).send('User already exists');
      }

      const user = await userService.createUser({ externalId, firstName, lastName });

      reply.send(user);
    } catch (error) {
      reply.status(500).send(error.message);
    }
  },
);

type CreateMemoryBody = {
  userId: string;
  content: string;
};

server.post<{ Body: CreateMemoryBody; Reply: Memory }>('/memories', async (request, reply) => {
  const { userId, content } = request.body;
  const memory = await memoryService.saveMemory({ userId, content });

  reply.send(memory);
});

server.post<{ Body: { userId: string; content: string }; Reply: string }>('/memories/query', async (request, reply) => {
  const { userId, content } = request.body;
  const response = await memoryService.findRelevantMemories({ userId, content, k: 10 });

  reply.send(response);
});

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
