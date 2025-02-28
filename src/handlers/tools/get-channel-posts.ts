import { ToolHandler, GetChannelPostsArgs } from "./types.js";

export const handleGetChannelPosts: ToolHandler<GetChannelPostsArgs> = async (
  args,
  { redditService },
) => {
  try {
    const posts = await redditService.fetchPosts({
      sort: args.sort,
      subreddits: [args.subreddit],
    });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            posts.map((post) => ({
              title: post.title,
              subreddit: post.subreddit,
              url: post.url,
              score: post.score,
              numComments: post.numComments,
              createdUtc: post.createdUtc,
              summary: post.selftext?.substring(0, 200),
            })),
            null,
            2,
          ),
        },
      ],
    };
  } catch (error) {
    console.error("Failed to fetch Reddit content:", error);
    return {
      content: [
        {
          type: "text",
          text: `Failed to fetch Reddit content: ${error instanceof Error ? error.message : "Unknown error"}`,
        },
      ],
    };
  }
};
