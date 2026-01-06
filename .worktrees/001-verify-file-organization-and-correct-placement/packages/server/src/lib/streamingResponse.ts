/**
 * SSE Streaming Response Handler
 *
 * Enables Server-Sent Events (SSE) for real-time AI responses.
 * Phase 2.3 - Day 1
 */

import type { Response } from "express";
import type { LLMProvider, ChatParams } from "./llmProvider";

/**
 * Stream event types
 */
export type StreamEventType =
  | "start" // Stream started
  | "thinking" // AI is processing
  | "tool_call" // Tool is being called
  | "tool_result" // Tool execution completed
  | "chunk" // Text chunk from LLM
  | "complete" // Stream completed
  | "error"; // Error occurred

/**
 * Stream event
 */
export interface StreamEvent {
  type: StreamEventType;
  data?: any;
  timestamp: string;
}

/**
 * SSE Response Streamer
 *
 * Handles Server-Sent Events streaming for real-time AI responses
 */
export class SSEStreamer {
  private res: Response;
  private isOpen: boolean = false;

  constructor(res: Response) {
    this.res = res;
  }

  /**
   * Initialize SSE connection
   */
  start() {
    // Set SSE headers
    this.res.setHeader("Content-Type", "text/event-stream");
    this.res.setHeader("Cache-Control", "no-cache");
    this.res.setHeader("Connection", "keep-alive");
    this.res.setHeader("X-Accel-Buffering", "no"); // Disable nginx buffering

    // Send initial comment to establish connection
    this.res.write(": connected\n\n");
    this.res.flushHeaders();

    this.isOpen = true;

    // Send start event
    this.sendEvent({
      type: "start",
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Send an event to the client
   */
  sendEvent(event: StreamEvent) {
    if (!this.isOpen) return;

    // SSE format: "data: <json>\n\n"
    this.res.write(`data: ${JSON.stringify(event)}\n\n`);
  }

  /**
   * Send a text chunk
   */
  sendChunk(chunk: string) {
    this.sendEvent({
      type: "chunk",
      data: { text: chunk },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Send thinking indicator
   */
  sendThinking(message: string) {
    this.sendEvent({
      type: "thinking",
      data: { message },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Send tool call notification
   */
  sendToolCall(toolName: string, params: any) {
    this.sendEvent({
      type: "tool_call",
      data: { tool: toolName, params },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Send tool result notification
   */
  sendToolResult(toolName: string, result: any, duration: number) {
    this.sendEvent({
      type: "tool_result",
      data: { tool: toolName, result, duration },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Send completion notification
   */
  complete(metadata?: any) {
    this.sendEvent({
      type: "complete",
      data: metadata,
      timestamp: new Date().toISOString(),
    });

    this.close();
  }

  /**
   * Send error notification
   */
  error(error: Error) {
    this.sendEvent({
      type: "error",
      data: { message: error.message, stack: error.stack },
      timestamp: new Date().toISOString(),
    });

    this.close();
  }

  /**
   * Close the SSE connection
   */
  close() {
    if (this.isOpen) {
      this.res.end();
      this.isOpen = false;
    }
  }
}

/**
 * Stream LLM response with chunks
 *
 * Note: This is a placeholder for Phase 2.3 streaming implementation.
 * OpenAI and Anthropic both support streaming, but we need to handle it differently.
 */
export async function streamLLMResponse(
  llm: LLMProvider,
  params: ChatParams,
  streamer: SSEStreamer
): Promise<void> {
  try {
    streamer.sendThinking("Analyzing your question...");

    // TODO Phase 2.3: Implement real streaming with LLM provider
    // For now, we'll simulate streaming by calling the regular API and chunking the response

    const response = await llm.chatCompletion(params);

    // Simulate streaming by sending text in chunks
    const text = response.content;
    const chunkSize = 10; // words per chunk
    const words = text.split(" ");

    for (let i = 0; i < words.length; i += chunkSize) {
      const chunk = words.slice(i, i + chunkSize).join(" ");
      streamer.sendChunk(chunk + " ");

      // Add small delay to simulate streaming
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    streamer.complete({
      usage: response.usage,
      toolCalls: response.toolCalls?.length || 0,
    });
  } catch (error: any) {
    streamer.error(error);
  }
}
