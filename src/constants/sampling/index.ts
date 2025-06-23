import { ANALYSE_SUBREDDIT_PROMPT } from './analyse-subreddit';
import { CREATE_REDDIT_COMMENT_PROMPT } from './create-comment';
import { CREATE_REDDIT_MESSAGE_PROMPT } from './create-message';
import { CREATE_REDDIT_POST_PROMPT } from './create-post';
import { SUGGEST_ACTION_PROMPT } from './suggest-action';

export * from './analyse-subreddit';
export * from './create-post';
export * from './suggest-action';
export * from './create-comment';
export * from './create-message';

export const PROMPTS = [
  ANALYSE_SUBREDDIT_PROMPT,
  CREATE_REDDIT_POST_PROMPT,
  SUGGEST_ACTION_PROMPT,
  CREATE_REDDIT_COMMENT_PROMPT,
  CREATE_REDDIT_MESSAGE_PROMPT,
];
