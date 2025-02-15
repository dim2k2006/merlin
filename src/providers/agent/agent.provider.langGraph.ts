import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { ChatOpenAI } from '@langchain/openai';
import { MemorySaver } from '@langchain/langgraph';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { MemoryService } from '../../domain/memory';
import { ParameterProvider } from '../../shared/parameter.types';
import {
  AgentProvider,
  AgentInvokeInput,
  AgentInvokeOptions,
  AgentResponse,
  BuildChatMessageInput,
  ChatMessage,
} from './agent.provider';

type ConstructorInput = {
  apiKey: string;
  memoryService: MemoryService;
  parameterProvider: ParameterProvider;
};

class AgentProviderLangGraph implements AgentProvider {
  private agent: ReturnType<typeof createReactAgent>;

  private memoryService: MemoryService;

  private parameterProvider: ParameterProvider;

  constructor({ apiKey, memoryService, parameterProvider }: ConstructorInput) {
    this.memoryService = memoryService;

    this.parameterProvider = parameterProvider;

    const agentTools = this.buildTools();
    const agentModel = new ChatOpenAI({ model: 'gpt-4o-mini', temperature: 0, apiKey });
    const agentCheckpointer = new MemorySaver();

    this.agent = createReactAgent({
      llm: agentModel,
      tools: agentTools,
      checkpointSaver: agentCheckpointer,
    });
  }

  async invoke(input: AgentInvokeInput, options?: AgentInvokeOptions): Promise<AgentResponse> {
    const agentState = await this.agent.invoke(
      { messages: input.messages },
      { configurable: { thread_id: options?.threadId } },
    );

    return {
      messages: agentState.messages,
    };
  }

  buildChatMessage(input: BuildChatMessageInput): ChatMessage {
    return {
      role: input.role,
      content: input.content,
    };
  }

  private buildTools() {
    const saveMemoryTool = new DynamicStructuredTool({
      name: 'saveMemory',
      description: "Saves a user's memory. Expects a JSON input with 'userId' and 'content'.",
      schema: z.object({
        userId: z.string().describe('The unique identifier for the user.'),
        content: z.string().describe('The content of the memory to save.'),
      }),
      func: async ({ userId, content }: { userId: string; content: string }) => {
        try {
          await this.memoryService.saveMemory({ userId, content });
          return 'Memory saved successfully!';
        } catch (error) {
          return `Error saving memory: ${error}`;
        }
      },
    });

    const retrieveMemoriesTool = new DynamicStructuredTool({
      name: 'retrieveMemories',
      description:
        'Retrieves relevant memories based on a query. ' +
        "Expects a JSON input with 'userId', 'content' (the query text), and 'k' (the number of memories to retrieve).",
      schema: z.object({
        userId: z.string().describe('The unique identifier for the user.'),
        content: z.string().describe('The query text to search for relevant memories.'),
        k: z.number().describe('The number of memories to retrieve.'),
      }),
      func: async ({ userId, content, k }: { userId: string; content: string; k: number }) => {
        try {
          const result = await this.memoryService.findRelevantMemories({ userId, content, k });

          return result;
        } catch (error) {
          return `Error retrieving memories: ${error}`;
        }
      },
    });

    const getParameterUserTool = new DynamicStructuredTool({
      name: 'getParameterServiceUser',
      description:
        'Retrieves a user from the parameter service. ' +
        'Use this tool only when you specifically need information from the parameter service, ' +
        'and not when you want information about your Telegram user profile. ' +
        "Expects a JSON input with 'userId'.",
      schema: z.object({
        userId: z.string().describe('The unique identifier for the user.'),
      }),
      func: async ({ userId }: { userId: string }) => {
        try {
          const user = await this.parameterProvider.getUserByExternalId(userId);
          // Format the response in a clear, concise way.
          return `User retrieved successfully:\nID: ${user.id}\nExternalID: ${user.externalId}\nFirstName: ${user.firstName}\nLastName: ${user.lastName}\nCreated At: ${user.createdAt}\nUpdated At: ${user.updatedAt}`;
        } catch (error) {
          console.log('error:', error);
          return `Error retrieving user: ${error}`;
        }
      },
    });

    const createParameterTool = new DynamicStructuredTool({
      name: 'createParameter',
      description:
        'Creates a new parameter in the parameter service. ' +
        'Use this tool when you want to register a new parameter. ' +
        "Expects a JSON input with 'userId', 'name', 'description', 'dataType', and 'unit'.",
      schema: z.object({
        userId: z.string().describe('The ID of the user for whom the parameter is created.'),
        name: z.string().describe('The name of the parameter.'),
        description: z.string().describe('A description for the parameter.'),
        dataType: z.enum(['float']).describe('The data type of the parameter (only "float" is supported).'),
        unit: z.string().describe('The unit of measurement for the parameter.'),
      }),
      func: async (input: { userId: string; name: string; description: string; dataType: 'float'; unit: string }) => {
        try {
          const parameterUser = await this.parameterProvider.getUserByExternalId(input.userId);

          const parameter = await this.parameterProvider.createParameter({
            userId: parameterUser.id,
            name: input.name,
            description: input.description,
            dataType: input.dataType,
            unit: input.unit,
          });

          return `Parameter created successfully:\nID: ${parameter.id}\nName: ${parameter.name}\nDataType: ${parameter.dataType}\nUnit: ${parameter.unit}`;
        } catch (error) {
          return `Error creating parameter: ${error}`;
        }
      },
    });

    return [saveMemoryTool, retrieveMemoriesTool, getParameterUserTool, createParameterTool];
  }
}

export default AgentProviderLangGraph;
