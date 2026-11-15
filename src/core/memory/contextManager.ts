/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER Graphify Context Manager
 *
 * Graphify inspiration credit:
 *   Graphify — Knowledge Graph for AI Engineering Context
 *   https://github.com/Graphify-Labs/graphify
 *
 * Manages conversation context within a Graphify-backed session.
 * Responsibilities:
 *   - Maintaining a rolling context window
 *   - Auto-saving to Graphify after each generation
 *   - Restoring context on resume
 *   - Handling context window limits with compression
 */

import type { ContextNode } from '../graphify/schema';
import { GraphifyIntegration, type StoredContext, type GraphifyProjectConfig, type ResumeInfo } from '../graphify';
import { getMemoryPersistence, MemoryPersistence } from '../graphify/memory';

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface ContextMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  timestamp: string;
  tokens: number;
  metadata?: Record<string, unknown>;
}

export interface ContextManagerConfig {
  projectId: string;
  projectName: string;
  rootPath: string;
  /** Max tokens in the rolling context window */
  maxTokens: number;
  /** Auto-save after every N messages */
  autoSaveEvery: number;
}

export interface ContextWindowStatus {
  totalTokens: number;
  maxTokens: number;
  usedPercent: number;
  messageCount: number;
  oldestMessageAge: string | null;
}

// ──────────────────────────────────────────────
// Context Manager
// ──────────────────────────────────────────────

export class ContextManager {
  private graphify: GraphifyIntegration;
  private persistence: MemoryPersistence;
  private readonly maxTokens: number;
  private readonly autoSaveEvery: number;
  private messages: ContextMessage[] = [];
  private messageCounter = 0;
  private initialized = false;
  private interrupted = false;

  constructor(private readonly config: ContextManagerConfig) {
    this.graphify = new GraphifyIntegration({
      projectId: config.projectId,
      projectName: config.projectName,
      rootPath: config.rootPath,
      autoSaveInterval: config.autoSaveEvery,
    });
    this.persistence = getMemoryPersistence({ projectId: config.projectId });
    this.maxTokens = config.maxTokens;
    this.autoSaveEvery = config.autoSaveEvery;
  }

  // ─── Lifecycle ──────────────────────────────

  /**
   * Initialize the ContextManager: connect to Graphify, check for resume.
   */
  async initialize(): Promise<{ resumed: boolean; resumeInfo: ResumeInfo | null }> {
    await this.graphify.initialize();
    this.initialized = true;

    // Check for resumable session
    const resumeInfo = await this.graphify.findResumeInfo();
    if (resumeInfo?.interrupted) {
      this.interrupted = true;
      await this.restoreContext(resumeInfo);
    }

    return { resumed: resumeInfo !== null, resumeInfo };
  }

  /**
   * Gracefully shut down, persisting any pending data.
   */
  async shutdown(): Promise<void> {
    if (!this.initialized) return;

    if (this.interrupted) {
      const lastTimestamp = this.messages.length > 0
        ? this.messages[this.messages.length - 1].timestamp
        : new Date().toISOString();
      await this.graphify.markInterrupted(lastTimestamp);
    }

    await this.graphify.close();
    this.initialized = false;
  }

  // ─── Context Operations ────────────────────

  /**
   * Append a message to the rolling context window.
   * Triggers auto-save after every N messages and checks token limits.
   */
  appendMessage(message: Omit<ContextMessage, 'timestamp'>): void {
    if (!this.initialized) {
      throw new Error('ContextManager is not initialized. Call initialize() first.');
    }

    const fullMessage: ContextMessage = {
      ...message,
      timestamp: new Date().toISOString(),
    };

    this.messages.push(fullMessage);
    this.messageCounter++;

    // Check token budget
    this.enforceTokenLimit();

    // Auto-save
    if (this.messageCounter >= this.autoSaveEvery) {
      this.messageCounter = 0;
      this.autoSaveSync();
    }
  }

  /**
   * Get the current rolling context window.
   */
  getWindow(): ContextMessage[] {
    return [...this.messages];
  }

  /**
   * Get the current context window status.
   */
  getStatus(): ContextWindowStatus {
    const totalTokens = this.messages.reduce((sum, m) => sum + m.tokens, 0);
    const usedPercent = Math.min(100, Math.round((totalTokens / this.maxTokens) * 100));

    const oldest = this.messages[0];
    const oldestAge = oldest
      ? new Date(Date.now() - new Date(oldest.timestamp).getTime()).toISOString()
      : null;

    return {
      totalTokens,
      maxTokens: this.maxTokens,
      usedPercent,
      messageCount: this.messages.length,
      oldestMessageAge: oldestAge,
    };
  }

  /**
   * Clear the rolling context window.
   */
  clearWindow(): void {
    this.messages = [];
    this.messageCounter = 0;
  }

  /**
   * Mark the session as interrupted (e.g., user stopped generation).
   */
  markInterrupted(): void {
    this.interrupted = true;
  }

  /**
   * Check if the current session was interrupted and can be resumed.
   */
  isInterrupted(): boolean {
    return this.interrupted;
  }

  // ─── Restore ───────────────────────────────

  private async restoreContext(resumeInfo: ResumeInfo): Promise<void> {
    // Load contexts from Graphify
    const contexts = resumeInfo.availableContexts;
    if (contexts.length > 0) {
      for (const ctx of contexts) {
        this.messages.push({
          role: 'user',
          content: ctx.userPrompt,
          timestamp: ctx.timestamp,
          tokens: ctx.tokenCount,
          metadata: ctx.metadata,
        });
      }
    }
  }

  // ─── Token Management ──────────────────────

  private enforceTokenLimit(): void {
    const totalTokens = this.messages.reduce((sum, m) => sum + m.tokens, 0);

    if (totalTokens <= this.maxTokens) return;

    // Evict oldest messages until under 85% of budget
    const evictionTarget = Math.floor(this.maxTokens * 0.85);
    let currentTokens = totalTokens;
    let evicted = 0;

    while (currentTokens > evictionTarget && this.messages.length > 1) {
      const removed = this.messages.shift()!;
      currentTokens -= removed.tokens;
      evicted++;
    }

    // Insert a system summary of what was evicted
    if (evicted > 0) {
      const summary: ContextMessage = {
        role: 'system',
        content: `[Context compressed: ${evicted} earlier messages evicted to stay within token budget (${this.maxTokens} tokens). Current window: ${this.messages.length} messages.]`,
        timestamp: new Date().toISOString(),
        tokens: Math.min(100, evicted * 5),
      };
      this.messages.unshift(summary);
    }
  }

  // ─── Auto-Save ─────────────────────────────

  private autoSaveSync(): void {
    const status = this.getStatus();
    this.persistence.setProjectContext('lastContextStatus', status);
    this.persistence.setProjectContext('lastContextMessages', this.messages.slice(-20));
    this.persistence.setLastSession({
      lastContextId: this.messages.length > 0
        ? this.messages[this.messages.length - 1].timestamp
        : null,
      lastUserPrompt: this.getLastUserPrompt(),
      interrupted: this.interrupted,
      operationCount: this.messageCounter,
    });

    // Trigger Graphify save (fire-and-forget, never blocks)
    void this.saveToGraphify();
  }

  private async saveToGraphify(): Promise<void> {
    if (!this.initialized) return;

    const userMessages = this.messages.filter(m => m.role === 'user');
    if (userMessages.length === 0) return;

    const lastUserMsg = userMessages[userMessages.length - 1];
    try {
      await this.graphify.saveContext({
        userPrompt: lastUserMsg.content,
        generatedCodeHash: null,
        handledBy: 'context-manager',
        tags: ['auto-saved'],
        metadata: {
          tokenCount: this.getStatus().totalTokens,
          messageCount: this.messages.length,
        },
      });
    } catch {
      // Silently fail — auto-save should never block
    }
  }

  // ─── Helpers ───────────────────────────────

  private getLastUserPrompt(): string | null {
    const userMsgs = this.messages.filter(m => m.role === 'user');
    return userMsgs.length > 0 ? userMsgs[userMsgs.length - 1].content : null;
  }

  // ─── Accessors ─────────────────────────────

  getGraphifyIntegration(): GraphifyIntegration {
    return this.graphify;
  }

  getMessageCount(): number {
    return this.messages.length;
  }
}

// ──────────────────────────────────────────────
// Factory
// ──────────────────────────────────────────────

export function createContextManager(config: ContextManagerConfig): ContextManager {
  return new ContextManager(config);
}
