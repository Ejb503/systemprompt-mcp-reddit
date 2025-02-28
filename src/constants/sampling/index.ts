import { ANALYSE_SUBREDDIT_PROMPT } from "./analyse-subreddit.js";
import { CREATE_REDDIT_POST_PROMPT } from "./create-post.js";
import { CREATE_REDDIT_REPLY_PROMPT } from "./create-reply.js";
import { SUGGEST_ACTION_PROMPT } from "./suggest-action.js";

export * from "./analyse-subreddit.js";
export * from "./create-post.js";
export * from "./create-reply.js";
export * from "./suggest-action.js";

export const PROMPTS = [
  ANALYSE_SUBREDDIT_PROMPT,
  CREATE_REDDIT_POST_PROMPT,
  CREATE_REDDIT_REPLY_PROMPT,
  SUGGEST_ACTION_PROMPT,
];
