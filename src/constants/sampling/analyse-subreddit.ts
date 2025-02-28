import { SamplingPrompt } from "@/types/sampling.js";
import { REDDIT_ANALYSE_SUBREDDIT_RESPONSE_SCHEMA } from "@/types/sampling-schemas.js";

export const ANALYSE_SUBREDDIT_PROMPT: SamplingPrompt = {
  name: "reddit_analyse_subreddit",
  description: "Analyzes a subreddit's current state based on recent posts",
  arguments: [
    {
      name: "subreddit",
      description: "Subreddit to analyze",
      required: true,
    },
    {
      name: "hotPosts",
      description: "JSON string of hot posts from the subreddit",
      required: true,
    },
    {
      name: "newPosts",
      description: "JSON string of new posts from the subreddit",
      required: true,
    },
    {
      name: "controversialPosts",
      description: "JSON string of controversial posts from the subreddit",
      required: true,
    },
  ],
  messages: [
    {
      role: "assistant",
      content: {
        type: "text",
        text: "You are an expert Reddit analyst who can identify patterns, trends, and sentiment in subreddits. You understand Reddit culture and can provide valuable insights about a community's current state.",
      },
    },
    {
      role: "assistant",
      content: {
        type: "text",
        text: "I understand the subreddit rules and guidelines:\n{{redditConfig}}",
      },
    },
    {
      role: "user",
      content: {
        type: "text",
        text: `Analyze the current state of r/{{subreddit}} based on the following posts:

Hot Posts:
{{hotPosts}}

New Posts:
{{newPosts}}

Controversial Posts:
{{controversialPosts}}

Provide a comprehensive analysis including:
1. Overall summary of the subreddit's current state
2. Trending topics and discussions
3. Overall sentiment (positive, negative, neutral, or mixed)
4. Recommended actions based on your analysis`,
      },
    },
  ],
  _meta: {
    callback: "analyse_subreddit_callback",
    responseSchema: REDDIT_ANALYSE_SUBREDDIT_RESPONSE_SCHEMA,
  },
};
