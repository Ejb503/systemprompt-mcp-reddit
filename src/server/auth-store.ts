import type { RedditAuthInfo } from '../types/request-context';
import { logger } from '@/utils/logger';

/**
 * Simple in-memory store for session auth info
 * This allows callbacks to access auth info by session ID
 */
class AuthStore {
  private static instance: AuthStore;
  private authMap = new Map<string, RedditAuthInfo>();

  static getInstance(): AuthStore {
    if (!AuthStore.instance) {
      AuthStore.instance = new AuthStore();
    }
    return AuthStore.instance;
  }

  /**
   * Store auth info for a session
   */
  setAuth(sessionId: string, authInfo: RedditAuthInfo): void {
    logger.debug('Storing auth info for session', { sessionId });
    this.authMap.set(sessionId, authInfo);
  }

  /**
   * Get auth info for a session
   */
  getAuth(sessionId: string): RedditAuthInfo | undefined {
    return this.authMap.get(sessionId);
  }

  /**
   * Remove auth info for a session
   */
  removeAuth(sessionId: string): void {
    logger.debug('Removing auth info for session', { sessionId });
    this.authMap.delete(sessionId);
  }

  /**
   * Clear all auth info
   */
  clear(): void {
    logger.debug('Clearing all auth info');
    this.authMap.clear();
  }
}

export const authStore = AuthStore.getInstance();