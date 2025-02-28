import { RedditAuthService } from "./reddit-auth-service.js";
import { RedditError } from "@/types/reddit.js";
import {
  RedditPost,
  RedditPostParams,
  RedditPostResponse,
  RedditApiResponse,
  FetchPostsOptions,
  RedditComment,
  RedditCommentThread,
  RedditPostWithComments,
  RedditNotification,
  FetchNotificationsOptions,
} from "@/types/reddit.js";
import { RedditFetchService } from "./reddit-fetch-service.js";
import {
  transformPost,
  transformComment,
  transformNotification,
} from "../../utils/reddit-transformers.js";

export class RedditPostService extends RedditFetchService {
  constructor(baseUrl: string, authService: RedditAuthService, rateLimitDelay: number) {
    super(baseUrl, authService, rateLimitDelay);
  }

  public async fetchPosts(options: FetchPostsOptions = { sort: "hot" }): Promise<RedditPost[]> {
    const { sort = "hot", limit = 10, subreddits = [] } = options;

    if (subreddits.length > 0) {
      const promises = subreddits.map((subreddit) =>
        this.fetchSubredditPosts(subreddit, sort, limit),
      );
      return Promise.all(promises).then((results) => results.flat());
    }

    switch (sort) {
      case "hot":
        return this.getHotPosts(undefined, limit);
      case "new":
        return this.getNewPosts(undefined, limit);
      case "controversial":
        return this.getControversialPosts(undefined, limit);
      default:
        throw new RedditError(`Invalid sort option: ${sort}`, "VALIDATION_ERROR");
    }
  }

  private async fetchSubredditPosts(
    subreddit: string,
    sort: "hot" | "new" | "controversial",
    limit: number,
  ): Promise<RedditPost[]> {
    switch (sort) {
      case "hot":
        return this.getHotPosts(subreddit, limit);
      case "new":
        return this.getNewPosts(subreddit, limit);
      case "controversial":
        return this.getControversialPosts(subreddit, limit);
      default:
        throw new RedditError(`Invalid sort option: ${sort}`, "VALIDATION_ERROR");
    }
  }

  private formatSubreddit(subreddit?: string): string {
    if (!subreddit) return "";
    return subreddit.replace(/^r\//, "");
  }

  private async getHotPosts(subreddit?: string, limit: number = 10): Promise<RedditPost[]> {
    const formattedSubreddit = this.formatSubreddit(subreddit);
    const endpoint = formattedSubreddit
      ? `/r/${formattedSubreddit}/hot.json?limit=${limit}`
      : `/hot.json?limit=${limit}`;

    const data = await this.redditFetch<RedditApiResponse<RedditPost>>(endpoint);
    return data.data.children?.map((child) => transformPost(child.data)) ?? [];
  }

  private async getNewPosts(subreddit?: string, limit: number = 10): Promise<RedditPost[]> {
    const formattedSubreddit = this.formatSubreddit(subreddit);
    const endpoint = formattedSubreddit
      ? `/r/${formattedSubreddit}/new.json?limit=${limit}`
      : `/new.json?limit=${limit}`;

    const data = await this.redditFetch<RedditApiResponse<RedditPost>>(endpoint);
    return data.data.children?.map((child) => transformPost(child.data)) ?? [];
  }

  private async getControversialPosts(
    subreddit?: string,
    limit: number = 10,
  ): Promise<RedditPost[]> {
    const formattedSubreddit = this.formatSubreddit(subreddit);
    const endpoint = formattedSubreddit
      ? `/r/${formattedSubreddit}/controversial.json?limit=${limit}`
      : `/controversial.json?limit=${limit}`;

    const data = await this.redditFetch<RedditApiResponse<RedditPost>>(endpoint);
    return data.data.children?.map((child) => transformPost(child.data)) ?? [];
  }

  public async createPost(params: RedditPostParams): Promise<RedditPostResponse> {
    const { subreddit, title, kind, content, url } = params;

    if (kind === "link" && !url) {
      throw new RedditError("URL is required for link posts", "VALIDATION_ERROR");
    }

    if (kind === "text" && !content) {
      throw new RedditError("Content is required for text posts", "VALIDATION_ERROR");
    }

    const formData = new URLSearchParams();
    formData.append("sr", subreddit);
    formData.append("title", title);
    formData.append("kind", kind);
    if (kind === "link" && url) {
      formData.append("url", url);
    } else if (content) {
      formData.append("text", content);
    }

    const response = await this.redditFetch<RedditPostResponse>("/api/submit", {
      method: "POST",
      body: formData,
    });

    return response;
  }

  public async fetchPostById(postId: string): Promise<RedditPostWithComments> {
    try {
      // Reddit API requires the post ID to be prefixed with t3_
      const formattedId = postId.startsWith("t3_") ? postId : `t3_${postId}`;

      // First, fetch the post info
      const postEndpoint = `/api/info.json?id=${formattedId}`;
      const postData = await this.redditFetch<RedditApiResponse<RedditPost>>(postEndpoint);

      if (!postData.data.children || postData.data.children.length === 0) {
        throw new RedditError(`Post with ID ${postId} not found`, "API_ERROR");
      }

      const post = transformPost(postData.data.children[0].data);

      // Then fetch the comments
      const rawPostId = postId.replace("t3_", "");
      const commentsEndpoint = `/comments/${rawPostId}.json`;
      const commentsData = await this.redditFetch<any[]>(commentsEndpoint);

      // Reddit returns an array with 2 elements: [0] = post data, [1] = comments data
      if (!commentsData || commentsData.length < 2) {
        // Return post without comments if comments data is missing
        return {
          ...post,
          comments: [],
        };
      }

      // Process the comment tree
      const commentListing = commentsData[1].data.children;
      const comments = this.processCommentTree(commentListing);

      return {
        ...post,
        comments,
      };
    } catch (error) {
      throw new RedditError(
        `Failed to fetch post: ${error instanceof Error ? error.message : "Unknown error"}`,
        "API_ERROR",
        error,
      );
    }
  }

  private processCommentTree(commentListing: any[]): RedditCommentThread[] {
    if (!commentListing || !Array.isArray(commentListing)) {
      return [];
    }

    return commentListing
      .filter((item) => item.kind === "t1") // Filter out non-comment items
      .map((item) => {
        const comment = transformComment(item.data);

        // Process replies if they exist
        let replies: RedditCommentThread[] = [];
        if (
          item.data.replies &&
          typeof item.data.replies === "object" &&
          item.data.replies.data &&
          item.data.replies.data.children
        ) {
          replies = this.processCommentTree(item.data.replies.data.children);
        }

        return {
          comment,
          replies,
        };
      });
  }

  public async fetchNotifications(
    options: FetchNotificationsOptions = {},
  ): Promise<RedditNotification[]> {
    try {
      const filter = options.filter || "all";
      const limit = options.limit || 25;

      // Determine the endpoint based on the filter
      let endpoint = "";
      switch (filter) {
        case "unread":
          endpoint = "/message/unread.json";
          break;
        case "messages":
          endpoint = "/message/messages.json";
          break;
        case "comments":
          endpoint = "/message/comments.json";
          break;
        case "mentions":
          endpoint = "/message/mentions.json";
          break;
        case "all":
        default:
          endpoint = "/message/inbox.json";
          break;
      }

      // Add limit parameter
      endpoint += `?limit=${limit}`;

      const data = await this.redditFetch<RedditApiResponse<any>>(endpoint);

      if (!data.data.children) {
        return [];
      }

      const notifications = data.data.children.map((item) => transformNotification(item.data));

      if (options.markRead && notifications.length > 0 && filter !== "unread") {
        const ids = notifications.filter((n) => n.isNew).map((n) => n.id);
        if (ids.length > 0) {
          await this.markMessagesRead(ids);
        }
      }

      return notifications;
    } catch (error) {
      throw new RedditError(
        `Failed to fetch notifications: ${error instanceof Error ? error.message : "Unknown error"}`,
        "API_ERROR",
        error,
      );
    }
  }

  private async markMessagesRead(ids: string[]): Promise<void> {
    const formData = new URLSearchParams({
      id: ids.join(","),
    });

    await this.redditFetch("/api/read_message", {
      method: "POST",
      body: formData,
    });
  }
}
