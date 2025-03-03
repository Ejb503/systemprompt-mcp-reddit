import { ANALYSE_SUBREDDIT_PROMPT } from "./analyse-subreddit.js";
import { CREATE_REDDIT_POST_PROMPT } from "./create-post.js";
import { SUGGEST_ACTION_PROMPT } from "./suggest-action.js";
import { CREATE_REDDIT_COMMENT_PROMPT } from "./create-comment.js";

export * from "./analyse-subreddit.js";
export * from "./create-post.js";
export * from "./suggest-action.js";
export * from "./create-comment.js";

export const PROMPTS = [
  ANALYSE_SUBREDDIT_PROMPT,
  CREATE_REDDIT_POST_PROMPT,
  SUGGEST_ACTION_PROMPT,
  CREATE_REDDIT_COMMENT_PROMPT,
];
