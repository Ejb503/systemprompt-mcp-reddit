import type { JSONSchema7 } from "json-schema";

export interface SystempromptBlockMetadata {
  title: string;
  description: string;
  tag: string[];
  created?: string;
  updated?: string;
  version?: number;
  status?: string;
}

export interface SystempromptBlockRequest {
  content: string;
  type: "block";
  prefix: string;
  metadata: SystempromptBlockMetadata;
}

export interface SystempromptAgentRequest {
  content: string;
  metadata: Partial<Metadata>;
}

export interface SystempromptBlockResponse {
  id: string;
  type: string;
  content: string;
  prefix: string;
  metadata: SystempromptBlockMetadata;
  _link?: string;
}

export interface SystempromptAgentResponse {
  id: string;
  content: string;
  prefix: string;
  metadata: Metadata;
  _link?: string;
}

export interface SystempromptPromptRequest {
  metadata: Partial<Metadata>;
  instruction: {
    static: string;
  };
}

export interface SystempromptUserStatusResponse {
  user: {
    id: string;
    uuid: string;
    name: string;
    email: string;
    roles: string[];
    paddle_id: string;
  };
  content: {
    prompt: number;
    artifact: number;
    block: number;
    conversation: number;
  };
  usage: {
    ai: {
      execution: number;
      token: number;
    };
    api: {
      generation: number;
    };
  };
  billing: {
    customer: {
      id: string;
      name: string | null;
      email: string;
      marketingConsent: boolean;
      status: string;
      customData: any;
      locale: string;
      createdAt: {
        date: string;
        timezone_type: number;
        timezone: string;
      };
      updatedAt: {
        date: string;
        timezone_type: number;
        timezone: string;
      };
      importMeta: any;
    };
    subscription: Array<{
      id: string;
      status: string;
      currency_code: string;
      billing_cycle: {
        frequency: number;
        interval: string;
      };
      current_billing_period: {
        starts_at: string;
        ends_at: string;
      };
      items: Array<{
        product: {
          name: string;
        };
        price: {
          unit_price: {
            amount: string;
            currency_code: string;
          };
        };
      }>;
    }>;
  };
  api_key: string;
}

export interface SystempromptPromptAPIRequest {
  metadata: Partial<Metadata>;
  instruction: {
    static: string;
    dynamic: string;
    state: string;
  };
  input: {
    type: string[];
    schema: JSONSchema7;
    name: string;
    description: string;
  };
  output: {
    type: string[];
    schema: JSONSchema7;
    name: string;
    description: string;
  };
}

export interface SystempromptPromptResponse {
  id: string;
  metadata: Metadata;
  instruction: {
    static: string;
    dynamic: string;
    state: string;
  };
  input: {
    name: string;
    description: string;
    type: string[];
    schema: JSONSchema7;
  };
  output: {
    name: string;
    description: string;
    type: string[];
    schema: JSONSchema7;
  };
  _link: string;
}

export interface Metadata {
  title: string;
  description: string | null;
  created: string;
  updated: string;
  version: number;
  status: string;
  author: string;
  log_message: string;
  tag: string[];
}

export interface SubredditRules {
  allowedPostTypes: string[];
  rules: Array<{
    title: string;
    description: string;
  }>;
  postRequirements?: {
    title?: {
      minLength?: number;
      maxLength?: number;
      allowedPrefixes?: string[];
      bannedPhrases?: string[];
    };
    body?: {
      required?: boolean;
      minLength?: number;
      maxLength?: number;
    };
    flairRequired?: boolean;
  };
}

export interface RedditConfigContent {
  subreddits: string[];
  preferences?: {
    defaultSort?: string;
    timeFilter?: string;
    contentFilter?: string;
    nsfwFilter?: boolean;
    minimumScore?: number;
    maxPostsPerRequest?: number;
  };
  subredditRules: Record<string, SubredditRules>;
}
