import { RedditPost, RedditComment, RedditSubreddit } from "../../types/reddit.js";

/**
 * Service responsible for transforming Reddit API responses into our domain models
 */
export class RedditTransformService {
  public transformPost(data: unknown): RedditPost {
    if (!this.isRedditPostData(data)) {
      throw new Error("Invalid post data received from Reddit API");
    }

    return {
      id: data.id,
      title: data.title,
      author: data.author,
      subreddit: data.subreddit,
      selftext: data.selftext || undefined,
      url: data.url || undefined,
      score: Number(data.score),
      createdUtc: Number(data.created_utc),
      numComments: Number(data.num_comments),
      permalink: data.permalink,
    };
  }

  public transformComment(data: unknown): RedditComment {
    if (!this.isRedditCommentData(data)) {
      throw new Error("Invalid comment data received from Reddit API");
    }

    return {
      id: data.id,
      author: data.author,
      body: data.body,
      score: Number(data.score),
      createdUtc: Number(data.created_utc),
      permalink: data.permalink,
    };
  }

  public transformSubreddit(data: unknown): RedditSubreddit {
    if (!this.isRedditSubredditData(data)) {
      throw new Error("Invalid subreddit data received from Reddit API");
    }

    const rules = Array.isArray(data.rules) ? data.rules : [];

    return {
      displayName: data.display_name,
      title: data.title,
      publicDescription: data.public_description,
      subscribers: Number(data.subscribers),
      createdUtc: Number(data.created_utc),
      over18: Boolean(data.over18),
      allowedPostTypes: this.extractAllowedPostTypes(data),
      rules: rules.map((rule) => ({
        title: rule.short_name || rule.title,
        description: rule.description,
      })),
      postRequirements: {
        title: {
          minLength: typeof data.title_min_length === "number" ? data.title_min_length : undefined,
          maxLength: typeof data.title_max_length === "number" ? data.title_max_length : undefined,
          allowedPrefixes: Array.isArray(data.allowed_title_prefixes)
            ? data.allowed_title_prefixes
            : undefined,
          bannedPhrases: Array.isArray(data.banned_title_phrases)
            ? data.banned_title_phrases
            : undefined,
        },
        body: {
          required: typeof data.body_required === "boolean" ? data.body_required : undefined,
          minLength: typeof data.body_min_length === "number" ? data.body_min_length : undefined,
          maxLength: typeof data.body_max_length === "number" ? data.body_max_length : undefined,
        },
        flairRequired: typeof data.flair_required === "boolean" ? data.flair_required : undefined,
      },
    };
  }

  private extractAllowedPostTypes(data: any): string[] {
    const types: string[] = [];

    if (data.submission_type === "any" || data.submission_type === "self") {
      types.push("text");
    }
    if (data.submission_type === "any" || data.submission_type === "link") {
      types.push("link");
    }

    return types.length > 0 ? types : ["text", "link"];
  }

  private isRedditPostData(data: unknown): data is {
    id: string;
    title: string;
    author: string;
    subreddit: string;
    selftext?: string;
    url?: string;
    score: number | string;
    created_utc: number | string;
    num_comments: number | string;
    permalink: string;
  } {
    const post = data as Record<string, unknown>;
    return (
      typeof post?.id === "string" &&
      typeof post?.title === "string" &&
      typeof post?.author === "string" &&
      typeof post?.subreddit === "string" &&
      typeof post?.permalink === "string"
    );
  }

  private isRedditCommentData(data: unknown): data is {
    id: string;
    author: string;
    body: string;
    score: number | string;
    created_utc: number | string;
    permalink: string;
  } {
    const comment = data as Record<string, unknown>;
    return (
      typeof comment?.id === "string" &&
      typeof comment?.author === "string" &&
      typeof comment?.body === "string" &&
      typeof comment?.permalink === "string"
    );
  }

  private isRedditSubredditData(data: unknown): data is {
    display_name: string;
    title: string;
    public_description: string;
    subscribers: number | string;
    created_utc: number | string;
    over18: boolean;
    rules?: Array<{
      short_name?: string;
      title: string;
      description: string;
    }>;
    title_min_length?: number;
    title_max_length?: number;
    allowed_title_prefixes?: string[];
    banned_title_phrases?: string[];
    body_required?: boolean;
    body_min_length?: number;
    body_max_length?: number;
    flair_required?: boolean;
    [key: string]: unknown;
  } {
    const subreddit = data as Record<string, unknown>;
    return (
      typeof subreddit?.display_name === "string" &&
      typeof subreddit?.title === "string" &&
      typeof subreddit?.public_description === "string"
    );
  }
}
