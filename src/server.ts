import { config } from 'dotenv';
import fastify from 'fastify';
import { webhookCallback } from 'grammy';
import { buildConfig, buildContainer } from './container';
import buildBot from './bot';

config({ path: `.env.${process.env.NODE_ENV || 'development'}.local` });

const appConfig = buildConfig();

const container = buildContainer(appConfig);

const bot = buildBot(container);

const server = fastify();

server.get('/alive', async () => {
  const date = new Date().toISOString();

  return `It is alive 🔥🔥🔥 Now: ${date} UTC`;
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

const envPort = process.env.PORT;

const port = Number(envPort) || 8080;

server.listen({ port }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }

  console.log(`Server listening at ${address}`);
});

//////////////////////////////////////////

// type QueryMemoryBody = {
//   userId: string;
//   content: string;
// };
//
// const QueryMemoryBodySchema = {
//   type: 'object',
//   required: ['userId', 'content'],
//   properties: {
//     userId: { type: 'string' },
//     content: { type: 'string' },
//   },
//   additionalProperties: false,
// };
//
// server.post<{ Body: QueryMemoryBody; Reply: string }>(
//   '/memories/query',
//   { schema: { body: QueryMemoryBodySchema } },
//   async (request, reply) => {
//     try {
//       const { userId, content } = request.body;
//
//       const user = await userService.getUserByIdOrExternalId(userId);
//
//       const response = await memoryService.findRelevantMemories({ userId: user.id, content, k: 10 });
//
//       reply.send(response);
//     } catch (error) {
//       reply.status(500).send(error.message);
//     }
//   },
// );

//////////////////////////////////////////

// type CreateMemoryBody = {
//   userId: string;
//   content: string;
// };
//
// const CreateMemoryBodySchema = {
//   type: 'object',
//   required: ['userId', 'content'],
//   properties: {
//     userId: { type: 'string' },
//     content: { type: 'string' },
//   },
//   additionalProperties: false,
// };
//
// server.post<{ Body: CreateMemoryBody; Reply: Memory | string }>(
//   '/memories',
//   { schema: { body: CreateMemoryBodySchema } },
//   async (request, reply) => {
//     try {
//       const { userId, content } = request.body;
//
//       const user = await userService.getUserByIdOrExternalId(userId);
//
//       const memory = await memoryService.saveMemory({ userId: user.id, content });
//
//       reply.send(memory);
//     } catch (error) {
//       reply.status(500).send(error.message);
//     }
//   },
// );

//////////////////////////////////////////

// type CreateUserBody = {
//   externalId: string;
//   firstName: string;
//   lastName?: string;
// };
//
// const CreateUserBodySchema = {
//   type: 'object',
//   required: ['externalId', 'firstName'],
//   properties: {
//     externalId: { type: 'string' },
//     firstName: { type: 'string' },
//     lastName: { type: 'string' },
//   },
//   additionalProperties: false,
// };
//
// server.post<{ Body: CreateUserBody; Reply: User | string }>(
//   '/users',
//   { schema: { body: CreateUserBodySchema } },
//   async (request, reply) => {
//     try {
//       const { externalId, firstName, lastName } = request.body;
//
//       const isUserExist = await userService.isUserExist(externalId);
//
//       if (isUserExist) {
//         return reply.status(409).send('User already exists');
//       }
//
//       const user = await userService.createUser({ externalId, firstName, lastName });
//
//       reply.send(user);
//     } catch (error) {
//       reply.status(500).send(error.message);
//     }
//   },
// );
