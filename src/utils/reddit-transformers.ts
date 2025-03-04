import {
  RedditPost,
  RedditComment,
  RedditSubreddit,
  RedditNotification as ApiRedditNotification,
  SubscribedSubreddit,
} from "@/types/reddit.js";
import type {
  RedditNotification as ConfigRedditNotification,
  RedditMessage,
} from "@/types/config.js";

/**
 * Type guards and transformation utilities for Reddit API responses
 */

export const isRedditPostData = (
  data: unknown,
): data is {
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
} => {
  const post = data as Record<string, unknown>;
  return (
    typeof post?.id === "string" &&
    typeof post?.title === "string" &&
    typeof post?.author === "string" &&
    typeof post?.subreddit === "string" &&
    typeof post?.permalink === "string"
  );
};

export const transformPost = (data: unknown): RedditPost => {
  if (!isRedditPostData(data)) {
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
};

export const isRedditCommentData = (
  data: unknown,
): data is {
  id: string;
  author: string;
  body: string;
  score: number | string;
  created_utc: number | string;
  permalink: string;
} => {
  const comment = data as Record<string, unknown>;
  return (
    typeof comment?.id === "string" &&
    typeof comment?.author === "string" &&
    typeof comment?.body === "string" &&
    typeof comment?.permalink === "string"
  );
};

export const transformComment = (data: unknown): RedditComment => {
  if (!isRedditCommentData(data)) {
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
};

export const isRedditSubredditData = (
  data: unknown,
): data is {
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
} => {
  const subreddit = data as Record<string, unknown>;
  return (
    typeof subreddit?.display_name === "string" &&
    typeof subreddit?.title === "string" &&
    typeof subreddit?.public_description === "string"
  );
};

export const transformSubreddit = (data: unknown): RedditSubreddit => {
  if (!isRedditSubredditData(data)) {
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
    allowedPostTypes: extractAllowedPostTypes(data),
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
};

export const transformNotification = (data: Record<string, unknown>): ApiRedditNotification => {
  // Determine notification type and subject
  let type: ApiRedditNotification["type"] = "other";
  let subject = String(data.subject || "");

  // For comment replies, we need to check link_title to determine if it's a post or comment reply
  if (data.was_comment) {
    const id = String(data.parent_id || "");
    if (id.startsWith("t3_")) {
      type = "post_reply";
      // For post replies, use the post title as subject
      subject = String(data.link_title || "Comment on your post");
    } else {
      type = "comment_reply";
      // For comment replies, use a descriptive subject
      subject = "Reply to your comment";
    }
  } else if (data.subject === "username mention") {
    type = "username_mention";
    subject = "Username mention";
  } else if (data.subject && !data.was_comment) {
    type = "message";
    // For messages, use the original subject
    subject = String(data.subject);
  }

  return {
    id: String(data.name || ""), // name contains the full ID with prefix
    name: String(data.name || ""),
    type,
    subject,
    body: String(data.body || ""),
    createdUtc: Number(data.created_utc || 0),
    date: data.date instanceof Date ? data.date : new Date(),
    author: String(data.author || "[deleted]"),
    subreddit: typeof data.subreddit === "string" ? data.subreddit : undefined,
    context: typeof data.context === "string" ? data.context : undefined,
    parentId: typeof data.parent_id === "string" ? data.parent_id : undefined,
    isNew: Boolean(data.new),
    permalink:
      typeof data.permalink === "string" ? data.permalink : (data.context as string | undefined),
  };
};

export const transformMessage = (data: Record<string, unknown>): RedditMessage => {
  return {
    id: String(data.name || ""),
    type: "message",
    subject: String(data.subject || ""),
    parent_id: String(data.parent_id || data.name || ""),
    author: String(data.author || "[deleted]"),
    body: String(data.body || ""),
    created_utc: Number(data.created_utc || 0),
    unread: Boolean(data.new),
  };
};

export function transformToConfigNotification(
  notification: ApiRedditNotification,
): ConfigRedditNotification | RedditMessage {
  if (notification.type === "message") {
    return {
      id: notification.id,
      type: "message",
      subject: notification.subject,
      parent_id: notification.parentId || notification.id,
      author: notification.author,
      body: notification.body,
      created_utc: notification.createdUtc,
      unread: notification.isNew,
    };
  }

  return {
    id: notification.id,
    type: notification.type,
    subject: notification.subject,
    parent_id: notification.parentId || "",
    subreddit: notification.subreddit || "",
    author: notification.author,
    body: notification.body || "",
    created_utc: notification.createdUtc,
    permalink: notification.permalink || "",
    unread: notification.isNew,
  };
}

const extractAllowedPostTypes = (data: any): string[] => {
  const types: string[] = [];

  if (data.submission_type === "any" || data.submission_type === "self") {
    types.push("text");
  }
  if (data.submission_type === "any" || data.submission_type === "link") {
    types.push("link");
  }

  return types.length > 0 ? types : ["text", "link"];
};

export const isSubscribedSubredditData = (
  data: unknown,
): data is {
  id: string;
  name: string;
  display_name: string;
  title: string;
  public_description: string;
  subscribers: number;
  over18: boolean;
  url: string;
  icon_img?: string;
  created_utc: number;
  subreddit_type: string;
} => {
  const subreddit = data as Record<string, unknown>;
  return (
    typeof subreddit?.id === "string" &&
    typeof subreddit?.name === "string" &&
    typeof subreddit?.display_name === "string" &&
    typeof subreddit?.title === "string" &&
    typeof subreddit?.public_description === "string" &&
    typeof subreddit?.subscribers === "number" &&
    typeof subreddit?.over18 === "boolean" &&
    typeof subreddit?.url === "string" &&
    typeof subreddit?.created_utc === "number" &&
    typeof subreddit?.subreddit_type === "string"
  );
};

export const transformSubscribedSubreddit = (data: unknown): SubscribedSubreddit => {
  if (!isSubscribedSubredditData(data)) {
    throw new Error("Invalid subscribed subreddit data received from Reddit API");
  }

  return {
    id: data.id,
    name: data.name,
    displayName: data.display_name,
    title: data.title,
    subscribers: data.subscribers,
    description: data.public_description,
    isNsfw: data.over18,
    url: data.url,
    icon: data.icon_img,
    createdUtc: data.created_utc,
    type: data.subreddit_type,
  };
};
