import { config } from 'dotenv';
import fastify from 'fastify';
import { webhookCallback, Bot } from 'grammy';
import { match } from 'ts-pattern';
import { UserRepositorySupabase, UserServiceImpl, User } from './domain/user';
import { MemoryRepositoryPinecone, MemoryServiceImpl, Memory } from './domain/memory';
import EmbeddingProviderOpenAI from './providers/embedding/embedding.provider.openai';
import LlmProviderOpenai from './providers/llm/llm.provider.openai';

config({ path: `.env.${process.env.NODE_ENV || 'development'}.local` });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const pineconeApiKey = process.env.PINECONE_API_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY;
const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;

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

const bot = new Bot(telegramBotToken);

bot.command('start', async (ctx) => {
  const externalId = ctx.from.id.toString();

  const isUserExist = await userService.isUserExist(externalId);

  if (!isUserExist) {
    await ctx.reply('Please register first using /register command');

    return;
  }

  const user = await userService.getUserByIdOrExternalId(externalId);

  await ctx.reply(`Hello, ${user.firstName}! Welcome to Merlin! 🧙‍♂️`);
});

bot.command('register', async (ctx) => {
  const externalId = ctx.from.id.toString();

  const isUserExist = await userService.isUserExist(externalId);

  if (isUserExist) {
    await ctx.reply('You are already registered!');

    return;
  }

  const firstName = ctx.from.first_name;
  const lastName = ctx.from.last_name;

  await userService.createUser({ externalId, firstName, lastName });

  await ctx.reply('You have been successfully registered!');
});

bot.on('message', async (ctx) => {
  const externalId = ctx.from.id.toString();

  const isUserExist = await userService.isUserExist(externalId);

  if (!isUserExist) {
    await ctx.reply('Please register first using /register command');

    return;
  }

  const user = await userService.getUserByIdOrExternalId(ctx.from.id.toString());

  const intent = await llmProvider.identifyIntent({ message: ctx.message.text });

  const action = match(intent)
    .with('save', () => async () => {
      await memoryService.saveMemory({ userId: user.id, content: ctx.message.text });

      await ctx.reply('Memory saved! 🧠');
    })
    .with('retrieve', () => async () => {
      const response = await memoryService.findRelevantMemories({ userId: user.id, content: ctx.message.text, k: 50 });

      await ctx.reply(response);
    })
    .with('unknown', () => async () => {
      await ctx.reply('I do not understand what you are saying. 😔');
    })
    .exhaustive();

  await action();
});

const server = fastify();

type CreateUserBody = {
  externalId: string;
  firstName: string;
  lastName?: string;
};

const CreateUserBodySchema = {
  type: 'object',
  required: ['externalId', 'firstName'],
  properties: {
    externalId: { type: 'string' },
    firstName: { type: 'string' },
    lastName: { type: 'string' },
  },
  additionalProperties: false,
};

server.post<{ Body: CreateUserBody; Reply: User | string }>(
  '/users',
  { schema: { body: CreateUserBodySchema } },
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

const CreateMemoryBodySchema = {
  type: 'object',
  required: ['userId', 'content'],
  properties: {
    userId: { type: 'string' },
    content: { type: 'string' },
  },
  additionalProperties: false,
};

server.post<{ Body: CreateMemoryBody; Reply: Memory | string }>(
  '/memories',
  { schema: { body: CreateMemoryBodySchema } },
  async (request, reply) => {
    try {
      const { userId, content } = request.body;

      const user = await userService.getUserByIdOrExternalId(userId);

      const memory = await memoryService.saveMemory({ userId: user.id, content });

      reply.send(memory);
    } catch (error) {
      reply.status(500).send(error.message);
    }
  },
);

type QueryMemoryBody = {
  userId: string;
  content: string;
};

const QueryMemoryBodySchema = {
  type: 'object',
  required: ['userId', 'content'],
  properties: {
    userId: { type: 'string' },
    content: { type: 'string' },
  },
  additionalProperties: false,
};

server.post<{ Body: QueryMemoryBody; Reply: string }>(
  '/memories/query',
  { schema: { body: QueryMemoryBodySchema } },
  async (request, reply) => {
    try {
      const { userId, content } = request.body;

      const user = await userService.getUserByIdOrExternalId(userId);

      const response = await memoryService.findRelevantMemories({ userId: user.id, content, k: 10 });

      reply.send(response);
    } catch (error) {
      reply.status(500).send(error.message);
    }
  },
);

server.get('/ping', async () => {
  return 'pong\n';
});

server.post('/webhook', async (request, reply) => {
  try {
    const handleUpdate = webhookCallback(bot, 'fastify');

    await handleUpdate(request, reply);
  } catch (error) {
    console.error(error);

    reply.status(500).send(error.message);
  }
});

server.listen({ port: 8080 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }

  console.log(`Server listening at ${address}`);
});
