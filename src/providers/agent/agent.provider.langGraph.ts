import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { ChatOpenAI } from '@langchain/openai';
import { MemorySaver } from '@langchain/langgraph';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { MemoryService } from '../../domain/memory';
import { AgentProvider, AgentInvokeInput, AgentInvokeOptions, AgentResponse } from './agent.provider';

type ConstructorInput = {
  apiKey: string;
  memoryService: MemoryService;
};

class AgentProviderLangGraph implements AgentProvider {
  private agent: ReturnType<typeof createReactAgent>;

  private memoryService: MemoryService;

  constructor({ apiKey, memoryService }: ConstructorInput) {
    this.memoryService = memoryService;

    const agentTools = this.buildTools();
    const agentModel = new ChatOpenAI({ temperature: 0, apiKey });
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

    return [saveMemoryTool, retrieveMemoriesTool];
  }
}

export default AgentProviderLangGraph;
