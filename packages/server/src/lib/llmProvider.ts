import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

/**
 * LLM Provider
 *
 * Multi-provider support with automatic fallback:
 * 1. Primary: Claude 3.5 Sonnet (Anthropic)
 * 2. Fallback: GPT-4 Turbo (OpenAI)
 *
 * Phase 2.1: Basic structure with placeholder implementations
 * Phase 2.2: Full implementation with function calling, streaming, etc.
 */

// Types
export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatParams {
  messages: ChatMessage[];
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  tools?: ToolDefinition[];
}

export interface ChatResponse {
  content: string;
  toolCalls?: ToolCall[];
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}

export interface ToolDefinition {
  name: string;
  description: string;
  input_schema: {
    type: "object";
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, any>;
}

/**
 * LLM Provider Class
 */
export class LLMProvider {
  private anthropic: Anthropic;
  private openai: OpenAI;
  private useClaude: boolean;

  constructor() {
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    // Initialize Anthropic (Claude)
    if (anthropicKey && anthropicKey !== "sk-ant-api-placeholder-replace-me") {
      this.anthropic = new Anthropic({
        apiKey: anthropicKey,
      });
      this.useClaude = true;
    } else {
      this.useClaude = false;
      console.warn("[LLMProvider] Anthropic API key not configured, will use OpenAI fallback");
    }

    // Initialize OpenAI (GPT-4)
    if (openaiKey && openaiKey !== "sk-placeholder-replace-me") {
      this.openai = new OpenAI({
        apiKey: openaiKey,
      });
    } else if (!this.useClaude) {
      throw new Error(
        "[LLMProvider] No LLM provider configured! Set ANTHROPIC_API_KEY or OPENAI_API_KEY"
      );
    }
  }

  /**
   * Chat completion with automatic fallback
   *
   * TODO Phase 2.2: Implement full logic
   */
  async chatCompletion(params: ChatParams): Promise<ChatResponse> {
    try {
      if (this.useClaude) {
        return await this.claudeChatCompletion(params);
      } else {
        return await this.openaiChatCompletion(params);
      }
    } catch (error: any) {
      console.error("[LLMProvider] Primary provider failed:", error.message);

      // Fallback to alternative provider
      if (this.useClaude && this.openai) {
        console.log("[LLMProvider] Falling back to OpenAI...");
        return await this.openaiChatCompletion(params);
      } else if (!this.useClaude && this.anthropic) {
        console.log("[LLMProvider] Falling back to Claude...");
        return await this.claudeChatCompletion(params);
      }

      throw error;
    }
  }

  /**
   * Claude (Anthropic) chat completion with function calling
   */
  private async claudeChatCompletion(params: ChatParams): Promise<ChatResponse> {
    const { messages, systemPrompt, temperature = 0.7, maxTokens = 4096, tools } = params;

    // Convert messages to Claude format (exclude system messages)
    const claudeMessages = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

    // Call Claude API
    const response = await this.anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt || "You are a helpful AI assistant.",
      messages: claudeMessages,
      tools: tools || [],
    });

    // Extract content and tool calls
    let textContent = "";
    const toolCalls: ToolCall[] = [];

    for (const block of response.content) {
      if (block.type === "text") {
        textContent += block.text;
      } else if (block.type === "tool_use") {
        toolCalls.push({
          id: block.id,
          name: block.name,
          input: block.input as Record<string, any>,
        });
      }
    }

    return {
      content: textContent,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    };
  }

  /**
   * OpenAI (GPT-4) chat completion with function calling
   */
  private async openaiChatCompletion(params: ChatParams): Promise<ChatResponse> {
    const { messages, systemPrompt, temperature = 0.7, maxTokens = 4096, tools } = params;

    // Convert messages to OpenAI format
    const openaiMessages: any[] = [
      ...(systemPrompt ? [{ role: "system" as const, content: systemPrompt }] : []),
      ...messages,
    ];

    // Convert tools to OpenAI format
    const openaiTools = tools?.map((t) => ({
      type: "function" as const,
      function: {
        name: t.name,
        description: t.description,
        parameters: t.input_schema,
      },
    }));

    // Call OpenAI API
    const response = await this.openai.chat.completions.create({
      model: "gpt-4-turbo",
      max_tokens: maxTokens,
      temperature,
      messages: openaiMessages,
      tools: openaiTools,
    });

    const choice = response.choices[0];
    const message = choice.message;

    // Extract tool calls
    const toolCalls: ToolCall[] = [];
    if (message.tool_calls) {
      for (const tc of message.tool_calls) {
        toolCalls.push({
          id: tc.id,
          name: tc.function.name,
          input: JSON.parse(tc.function.arguments),
        });
      }
    }

    return {
      content: message.content || "",
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      usage: {
        inputTokens: response.usage?.prompt_tokens || 0,
        outputTokens: response.usage?.completion_tokens || 0,
      },
    };
  }

  /**
   * Streaming chat completion
   *
   * TODO Phase 2.3: Implement SSE streaming for real-time responses
   */
  async *streamCompletion(params: ChatParams): AsyncGenerator<string> {
    // TODO Phase 2.3: Implement streaming with SSE
    yield "TODO: Implement streaming in Phase 2.3";
  }
}

/**
 * Singleton instance
 */
let llmProvider: LLMProvider | null = null;

export function getLLMProvider(): LLMProvider {
  if (!llmProvider) {
    llmProvider = new LLMProvider();
  }
  return llmProvider;
}
