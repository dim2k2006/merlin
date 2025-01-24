import { EmbeddingProvider, EmbeddingProviderOpenAI } from '../providers/embedding';
import { LlmProvider, LlmProviderOpenai } from '../providers/llm';
import { UserRepositorySupabase, UserService, UserServiceImpl } from '../domain/user';
import { MemoryRepositoryPinecone, MemoryService, MemoryServiceImpl } from '../domain/memory';

export function buildConfig(): Config {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;
  const pineconeApiKey = process.env.PINECONE_API_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY;
  const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
  const sentryDsn = process.env.SENTRY_DSN;

  return {
    supabaseUrl,
    supabaseKey,
    pineconeApiKey,
    pineconeNamespace: 'ns1',
    pineconeIndexName: 'merlin',
    openaiApiKey,
    telegramBotToken,
    allowedTelegramUserIds: [284307817, 263786736],
    sentryDsn,
  };
}

export type Config = {
  supabaseUrl: string;
  supabaseKey: string;
  pineconeApiKey: string;
  pineconeNamespace: string;
  pineconeIndexName: string;
  openaiApiKey: string;
  telegramBotToken: string;
  allowedTelegramUserIds: number[];
  sentryDsn: string;
};

export function buildContainer(config: Config): Container {
  const embeddingProvider = new EmbeddingProviderOpenAI({ apiKey: config.openaiApiKey });
  const llmProvider = new LlmProviderOpenai({ apiKey: config.openaiApiKey });

  const userRepository = new UserRepositorySupabase({
    supabaseUrl: config.supabaseUrl,
    supabaseKey: config.supabaseKey,
  });
  const userService = new UserServiceImpl({ userRepository });

  const memoryRepository = new MemoryRepositoryPinecone({
    apiKey: config.pineconeApiKey,
    namespace: config.pineconeNamespace,
    indexName: config.pineconeIndexName,
  });
  const memoryService = new MemoryServiceImpl({ memoryRepository, embeddingProvider, llmProvider });

  return {
    config,
    userService,
    memoryService,
    embeddingProvider,
    llmProvider,
  };
}

export type Container = {
  config: Config;
  userService: UserService;
  memoryService: MemoryService;
  embeddingProvider: EmbeddingProvider;
  llmProvider: LlmProvider;
};
