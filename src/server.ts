import { config } from 'dotenv';
import fastify from 'fastify';
import crypto from 'crypto';
import { webhookCallback } from 'grammy';
import * as Sentry from '@sentry/node';
import cors from '@fastify/cors';
import { buildConfig, buildContainer } from './container';
import buildBot from './bot';

config({ path: `.env.${process.env.NODE_ENV || 'development'}.local` });

const appConfig = buildConfig();

const container = buildContainer(appConfig);

Sentry.init({
  dsn: appConfig.sentryDsn,
  enabled: process.env.NODE_ENV === 'production',
});

const bot = buildBot(container);

const server = fastify();

server.register(cors, {
  origin: '*',
});

Sentry.setupFastifyErrorHandler(server);

server.get('/alive', async () => {
  const date = new Date().toISOString();

  return `It is alive 🔥🔥🔥 Now: ${date} UTC`;
});

server.get('/debug-sentry', function mainHandler() {
  throw new Error('My first Sentry error!');
});

server.post('/webhook', async (request, reply) => {
  try {
    const handleUpdate = webhookCallback(bot, 'fastify');

    await handleUpdate(request, reply);
  } catch (error) {
    console.error(error);

    reply.status(200).send('ok');
  }
});

const ValidateTelegramBodySchema = {
  type: 'object',
  required: ['data'],
  properties: {
    data: {
      type: 'object',
      required: ['initData'],
      properties: {
        initData: { type: 'string' },
      },
    },
  },
  additionalProperties: false,
};

server.post<{
  Body: { data: { initData: string } };
  Reply:
    | {
        user?:
          | {
              id: string;
              first_name: string;
              last_name?: string;
              username?: string;
            }
          | string;
      }
    | string;
}>('/api/validate-telegram', { schema: { body: ValidateTelegramBodySchema } }, async (request, reply) => {
  const { data } = request.body;

  const initData = data.initData;

  console.log('request.body:', request.body);

  if (!initData) {
    reply.status(400).send('Bad request');
    return;
  }

  // Validate the initData using our helper function.
  const isValid = verifyTelegramInitData(initData, appConfig.telegramBotToken);
  if (!isValid) {
    reply.status(401).send('Unauthorized');
    return;
  }

  // Parse initData to extract user data.
  const params = new URLSearchParams(initData);
  const user = {
    id: params.get('id') ?? '',
    first_name: params.get('first_name') ?? '',
    last_name: params.get('last_name') ?? '',
    username: params.get('username') ?? '',
  };

  reply.send({ user });
});

export function verifyTelegramInitData(initData: string, botToken: string): boolean {
  const params = new URLSearchParams(initData);

  // Extract and remove the hash parameter.
  const receivedHash = params.get('hash');
  if (!receivedHash) {
    console.error('initData is missing the hash parameter.');
    return false;
  }
  params.delete('hash');

  // Build the data check string.
  const dataCheckArr: string[] = [];
  for (const [key, value] of params.entries()) {
    dataCheckArr.push(`${key}=${value}`);
  }
  dataCheckArr.sort();
  const dataCheckString = dataCheckArr.join('\n');

  // Create the secret key from the bot token.
  const secretKey = crypto.createHash('sha256').update(botToken).digest();

  // Compute HMAC-SHA256 and compare to received hash.
  const computedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
  return computedHash === receivedHash;
}

const envPort = process.env.PORT;

const port = Number(envPort) || 8080;

server.listen({ host: '0.0.0.0', port }, (err, address) => {
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
