import { sendJsonResultNotification } from "../handlers/notifications.js";
import type {
  SystempromptPromptResponse,
  SystempromptBlockResponse,
  SystempromptAgentResponse,
  SystempromptUserStatusResponse,
  SystempromptBlockRequest,
} from "../types/systemprompt.js";

export class SystemPromptService {
  private static instance: SystemPromptService | null = null;
  private baseUrl: string;

  private constructor() {
    this.baseUrl = "https://api.systemprompt.io/v1";
  }

  public static initialize(): void {
    if (!SystemPromptService.instance) {
      SystemPromptService.instance = new SystemPromptService();
    }
  }

  public static getInstance(): SystemPromptService {
    if (!SystemPromptService.instance) {
      throw new Error("SystemPromptService must be initialized first");
    }
    return SystemPromptService.instance;
  }

  public static cleanup(): void {
    SystemPromptService.instance = null;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    headers?: Record<string, string>,
  ): Promise<T> {
    try {
      const url = `${this.baseUrl}${path}`;
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "api-key": process.env.SYSTEMPROMPT_API_KEY as string,
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      const text = await response.text();
      let data;
      try {
        data = text ? JSON.parse(text) : undefined;
      } catch (error) {
        throw new Error("Failed to parse API response");
      }

      if (!response.ok) {
        switch (response.status) {
          case 403:
            throw new Error("Invalid API key");
          case 404:
            throw new Error("Resource not found - it may have been deleted");
          default:
            throw new Error(data?.message || "API request failed");
        }
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to make API request");
    }
  }

  public async getAllPrompts(): Promise<SystempromptPromptResponse[]> {
    return this.request<SystempromptPromptResponse[]>("GET", "/prompts");
  }

  public async listBlocks(
    options: {
      tags?: string[];
      status?: string;
      search?: string;
      page?: number;
      limit?: number;
      sortBy?: string;
      sortDirection?: "ASC" | "DESC";
    } = {},
  ): Promise<SystempromptBlockResponse[]> {
    const params = new URLSearchParams();

    if (options.tags?.length) {
      params.set("tag", options.tags.join(","));
    } else {
      params.set("tag", "mcp_systemprompt_reddit");
    }

    const queryString = params.toString();
    const url = `/block${queryString ? `?${queryString}` : ""}`;

    // Add notification to log the full URL
    const fullUrl = `${this.baseUrl}${url}`;
    await sendJsonResultNotification(`Requesting SystemPrompt URL: ${fullUrl}`);

    // Add cache-busting headers to the request
    return this.request<SystempromptBlockResponse[]>("GET", url, undefined, {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    });
  }

  public async getBlock<T = unknown>(blockId: string): Promise<SystempromptBlockResponse<T>> {
    const response = await this.request<SystempromptBlockResponse<T>>(
      "GET",
      `/block/${blockId}?t=${Date.now()}`,
    );
    return response;
  }

  public async fetchUserStatus(): Promise<SystempromptUserStatusResponse> {
    return this.request<SystempromptUserStatusResponse>("GET", "/user/me");
  }

  public async deletePrompt(id: string): Promise<void> {
    await this.request<void>("DELETE", `/prompts/${id}`);
  }

  public async getUser(): Promise<SystempromptUserStatusResponse> {
    return this.request<SystempromptUserStatusResponse>("GET", "/user/me");
  }

  public async createBlock(block: SystempromptBlockRequest): Promise<SystempromptBlockResponse> {
    return this.request<SystempromptBlockResponse>("POST", "/block", block);
  }

  public async updateBlock(
    id: string,
    block: Partial<SystempromptBlockRequest>,
  ): Promise<SystempromptBlockResponse> {
    return this.request<SystempromptBlockResponse>("PATCH", `/block/${id}`, block);
  }

  public async upsertBlock<T = unknown>(
    block: SystempromptBlockRequest<T>,
  ): Promise<SystempromptBlockResponse<T>> {
    try {
      // First try to find existing blocks with matching prefix and tag
      const existingBlocks = await this.listBlocks({
        tags: block.metadata.tag,
      });

      // Find the most recently updated block with matching prefix
      const existingBlock = existingBlocks
        .filter((b) => b.prefix === block.prefix)
        .sort((a, b) => {
          const dateA = new Date(a.metadata.updated || a.metadata.created || "");
          const dateB = new Date(b.metadata.updated || b.metadata.created || "");
          return dateB.getTime() - dateA.getTime();
        })[0];

      if (existingBlock) {
        try {
          // Update existing block
          return await this.request<SystempromptBlockResponse<T>>(
            "PUT",
            `/block/${existingBlock.id}`,
            block,
          );
        } catch (error) {
          console.error("Failed to update block, falling back to create:", error);
          return await this.request<SystempromptBlockResponse<T>>("POST", "/block", block);
        }
      }

      // If no existing block found, create new one
      return await this.request<SystempromptBlockResponse<T>>("POST", "/block", block);
    } catch (error) {
      console.error("Error in upsertBlock:", error);
      throw new Error(
        `Failed to upsert block: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  public async deleteBlock(id: string): Promise<void> {
    await this.request<void>("DELETE", `/block/${id}`);
  }
}
